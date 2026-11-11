// ki.ts — ein Aufruf der Claude-Schnittstelle fuer den Recherche-Agenten. Haiku 5.5 ohne Denkschritt: Haiku denkt sonst
// standardmaessig mit, das kostet Ausgabe-Tokens und kann das JSON ueber max_tokens hinausschieben.
// Geheimnis (nur in Supabase): ANTHROPIC_API_KEY.
export const MODELL = 'claude-haiku-5-5';

// inhalt: die rohen Bloecke der Antwort, damit eine Websuche nach pause_turn fortgesetzt werden kann.
export type KiAntwort = { text: string; stop: string; inhalt: unknown[] };

// Zeitlimit plus Abbruch: bricht die App ab (weitergetippt), endet auch der Aufruf, damit keine Kosten weiterlaufen.
export const frist = (ms: number, signal?: AbortSignal) => (signal ? AbortSignal.any([AbortSignal.timeout(ms), signal]) : AbortSignal.timeout(ms));

export async function frageClaude(body: Record<string, unknown>, timeoutMs: number, signal?: AbortSignal): Promise<KiAntwort> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal: frist(timeoutMs, signal),
    headers: { 'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODELL, thinking: { type: 'disabled' }, ...body }),
  });
  // Bei Fehlern Typ und Meldung der Schnittstelle mitloggen (nie den Schluessel), sonst bleibt etwa "400" unerklaert.
  if (!res.ok) {
    const f = await res.json().catch(() => null);
    throw new Error(`KI-Schnittstelle ${res.status}: ${String(f?.error?.type ?? '')} ${String(f?.error?.message ?? '').slice(0, 300)}`);
  }
  const daten = await res.json();
  // Nur Textbloecke; bei der Websuche stehen dazwischen Such- und Ergebnisbloecke.
  const text = (daten.content ?? []).filter((c: { type?: string }) => c.type === 'text').map((c: { text?: string }) => c.text ?? '').join('');
  return { text, stop: String(daten.stop_reason ?? ''), inhalt: Array.isArray(daten.content) ? daten.content : [] };
}

// Abgelehnt (refusal) oder abgeschnitten (max_tokens): lieber nichts zeigen als ein halbes Ergebnis.
export function jsonAus<T>(a: KiAntwort): T | null {
  if (a.stop !== 'end_turn') { console.error('KI-Antwort unvollstaendig:', a.stop); return null; }
  const i = a.text.indexOf('{'), j = a.text.lastIndexOf('}');
  if (i < 0 || j < i) { console.error('KI-Antwort ohne JSON:', a.text.slice(0, 200)); return null; }
  try { return JSON.parse(a.text.slice(i, j + 1)) as T; } catch { console.error('KI-Antwort kein gueltiges JSON:', a.text.slice(0, 200)); return null; }
}
