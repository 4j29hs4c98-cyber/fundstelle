// netz.ts — alles, was das Netz beruehrt: Claude aufrufen (Sonnet 5.5, Lennox' Wahl vom 17.11.2026) und Seiten laden.
// Geheimnis (nur in Supabase): ANTHROPIC_API_KEY. Jeder Aufruf hat ein Zeitlimit und endet, wenn die App abbricht.
import { htmlText } from './text.ts';
import { sichererLink, aufListe, privateAdresse } from './pruefung.ts';

export const MODELL = 'claude-sonnet-5-5';
export const frist = (ms: number, signal?: AbortSignal) => (signal ? AbortSignal.any([AbortSignal.timeout(ms), signal]) : AbortSignal.timeout(ms));
export type KiAntwort = { text: string; stop: string; inhalt: unknown[] };

export class KiFehler extends Error { constructor(readonly status: number, meldung: string) { super(meldung); } }

export async function frageClaude(body: Record<string, unknown>, timeoutMs: number, signal?: AbortSignal): Promise<KiAntwort> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: frist(timeoutMs, signal),
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELL, ...body }),
  });
  if (!res.ok) {
    const f = await res.json().catch(() => null);
    throw new KiFehler(res.status, `${String(f?.error?.type ?? '')} ${String(f?.error?.message ?? '').slice(0, 400)}`);
  }
  const daten = await res.json();
  const text = (daten.content ?? []).filter((c: { type?: string }) => c.type === 'text').map((c: { text?: string }) => c.text ?? '').join('');
  return { text, stop: String(daten.stop_reason ?? ''), inhalt: Array.isArray(daten.content) ? daten.content : [] };
}

// Abgelehnt oder abgeschnitten: lieber kein Ergebnis als ein halbes.
export function jsonAus<T>(a: KiAntwort): T | null {
  if (a.stop !== 'end_turn') { console.error('KI-Antwort unvollstaendig:', a.stop); return null; }
  const i = a.text.indexOf('{'), j = a.text.lastIndexOf('}');
  if (i < 0 || j < i) return null;
  try { return JSON.parse(a.text.slice(i, j + 1)) as T; } catch { return null; }
}

const SEITE_MAX_BYTES = 2_000_000, MAX_WEITERLEITUNGEN = 3, SEITE_TIMEOUT_MS = 10_000;
export type Seite = { text: string; titel: string; beschreibung: string; url: URL };

const meta = (html: string, name: string) => htmlText(
  html.match(new RegExp(`<meta[^>]+(?:property|name)="${name}"[^>]+content="([^"]*)"`, 'i'))?.[1]
  ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="${name}"`, 'i'))?.[1] ?? '');

// Der Name muss auf eine oeffentliche Adresse zeigen (A und AAAA). Fehlt die Aufloesung oder zeigt eine Adresse ins
// eigene Netz, wird nicht geladen (fail closed). Rest-Risiko: DNS-Rebinding zwischen Pruefung und Abruf; begrenzt
// dadurch, dass nur https auf Port 443 erlaubt ist und das Zertifikat zum Namen passen muss.
async function oeffentlich(u: URL): Promise<boolean> {
  const name = u.hostname.replace(/\.+$/, '');
  const ips: string[] = [];
  for (const typ of ['A', 'AAAA'] as const) {
    try { ips.push(...(await Deno.resolveDns(name, typ)).map(String)); } catch { /* kein Eintrag dieses Typs */ }
  }
  return ips.length > 0 && !ips.some(privateAdresse);
}

// Liest hoechstens max Bytes, auch ohne content-length (gestueckelte Antwort): danach Abbruch statt Speicher voll.
async function begrenztLesen(r: Response, max: number): Promise<string | null> {
  if (!r.body) return '';
  const reader = r.body.getReader(), teile: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { await reader.cancel(); return null; }
    teile.push(value);
  }
  const alles = new Uint8Array(n); let o = 0;
  for (const t of teile) { alles.set(t, o); o += t.byteLength; }
  return new TextDecoder().decode(alles);
}

// Skript- und Stilbloecke in einem Durchgang entfernen (linear). Ein nicht geschlossener Block nimmt den Rest weg,
// statt den regulaeren Ausdruck in htmlText quadratisch laufen zu lassen.
export function ohneBloecke(html: string): string {
  const klein = html.toLowerCase(), re = /<(script|style|noscript|template)\b/g;
  let out = '', i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(klein))) {
    out += html.slice(i, m.index);
    const ende = klein.indexOf(`</${m[1]}`, re.lastIndex);
    const zu = ende < 0 ? -1 : klein.indexOf('>', ende);
    if (zu < 0) return out;
    i = zu + 1; re.lastIndex = i;
  }
  return out + html.slice(i);
}

// Weiterleitungen von Hand, jede Station wird erneut geprueft. liste: nur diese Seiten (Belege); ohne liste jede
// sichere, oeffentliche https-Adresse (der eingefuegte Link). Gelesen wird nur Text, nie ausgefuehrt.
export async function seiteLaden(start: URL, signal?: AbortSignal, liste?: string[]): Promise<Seite | null> {
  const ok = (u: URL | null) => (u && (!liste || aufListe(u, liste)) ? u : null);
  let url = ok(start);
  for (let i = 0; url && i <= MAX_WEITERLEITUNGEN; i++) {
    if (!(await oeffentlich(url))) { console.log('Adresse nicht oeffentlich:', url.hostname); return null; }
    const r: Response = await fetch(url, { signal: frist(SEITE_TIMEOUT_MS, signal), redirect: 'manual',
      headers: { 'User-Agent': 'Fundstelle-Schulprojekt/1.0', Accept: 'text/html,application/xhtml+xml' } });
    if (r.status >= 300 && r.status < 400) {
      await r.body?.cancel();
      url = ok(sichererLink(new URL(r.headers.get('location') ?? '', url).href));
      continue;
    }
    const typ = r.headers.get('content-type') ?? '';
    if (!r.ok || !/html|xml|text/i.test(typ) || Number(r.headers.get('content-length') ?? 0) > SEITE_MAX_BYTES) { await r.body?.cancel(); return null; }
    const roh = await begrenztLesen(r, SEITE_MAX_BYTES);
    if (roh === null) return null;
    const html = ohneBloecke(roh);
    const titel = meta(html, 'og:title') || htmlText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
    const beschreibung = meta(html, 'og:description') || meta(html, 'description');
    return { text: htmlText(html).replace(/[<>]/g, ' '), titel: titel.slice(0, 300), beschreibung: beschreibung.slice(0, 1000), url };
  }
  return null;
}
