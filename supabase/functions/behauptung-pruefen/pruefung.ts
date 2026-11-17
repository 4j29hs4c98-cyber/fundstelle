// pruefung.ts — reine Regeln fuer den Faktencheck, ohne Netz: Eingabe pruefen, Links absichern, Urteil festlegen.
// Getrennt von index.ts, damit sich alles mit `deno test --no-config` pruefen laesst.

// Feste Liste seriöser Seiten (Lennox, 17.11.2026): amtliche Stellen, ein oeffentlich-rechtlicher Sender, etablierte
// Redaktionen, Faktenchecker. ARD/tagesschau, Deutschlandfunk, Spiegel, Zeit, FAZ, SZ und Welt fehlen nicht aus
// Absicht: die Anthropic-Websuche lehnte sie am 11.11.2026 ab. Lehnt sie eine Seite hier ab, nimmt index.ts sie heraus.
export const QUELLEN = ['bundestag.de', 'bundesregierung.de', 'bund.de', 'bundesverfassungsgericht.de', 'destatis.de', 'bpb.de',
  'europa.eu', 'zdf.de', 'tagesspiegel.de', 'handelsblatt.com', 'correctiv.org', 'dpa-factchecking.com'];

export const URTEILE = ['stimmt', 'stimmt_nicht', 'teilweise', 'nicht_belegbar'] as const;
export type Urteil = typeof URTEILE[number];
export const RICHTUNGEN = ['stuetzt', 'widerlegt', 'ergaenzt'] as const;
export type Richtung = typeof RICHTUNGEN[number];
// seite: Anzeigename (Hostname). stamm: der passende Eintrag der Liste; zwei Unterseiten derselben Redaktion zaehlen einmal.
export type Befund = { aussage: string; auszug: string; url: string; seite: string; stamm: string; titel: string; richtung: Richtung };

export const TEXT_MAX = 3000, URL_MAX = 2000, MIN_MATERIAL = 20;

// Nur https auf Port 443, keine IP-Adressen und keine lokalen Namen: der Server soll nichts im eigenen Netz abrufen.
export function sichererLink(roh: string): URL | null {
  let u: URL;
  try { u = new URL(roh); } catch { return null; }
  if (u.protocol !== 'https:' || (u.port && u.port !== '443') || u.username || u.password) return null;
  const h = u.hostname.toLowerCase().replace(/\.+$/, '');
  if (!h.includes('.') || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return null;
  if (/^[\d.]+$/.test(h) || h.includes(':') || h.startsWith('[')) return null;
  return u;
}

export const stammVon = (u: URL, liste: string[]) => { const h = u.hostname.toLowerCase().replace(/\.+$/, ''); return liste.find(d => h === d || h.endsWith(`.${d}`)) ?? null; };
export const aufListe = (u: URL, liste: string[]) => stammVon(u, liste) !== null;

// Private, lokale und reservierte Adressen (fuer die Pruefung nach der DNS-Aufloesung).
export function privateAdresse(ip: string): boolean {
  const v4 = ip.match(/^(?:::ffff:)?(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  const x = ip.toLowerCase();
  return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith('::ffff:') || x.startsWith('64:ff9b:') || x.startsWith('2001:db8');
}

export function eingabe(body: unknown): { url: URL | null; text: string } | { fehler: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const rohUrl = typeof b.url === 'string' ? b.url.trim() : '';
  const text = (typeof b.text === 'string' ? b.text : '').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (rohUrl.length > URL_MAX || text.length > TEXT_MAX) return { fehler: 'zu_lang' };
  const url = rohUrl ? sichererLink(rohUrl) : null;
  if (rohUrl && !url) return { fehler: 'link_ungueltig' };
  if (!url && text.length < MIN_MATERIAL) return { fehler: 'zu_wenig' };
  return { url, text };
}

const RANG: Record<Urteil, number> = { nicht_belegbar: 0, teilweise: 1, stimmt: 2, stimmt_nicht: 2 };

// Feste Regel im Code (nicht der KI ueberlassen): "stimmt" oder "stimmt nicht" nur mit Belegen von mindestens zwei
// verschiedenen Seiten in diese Richtung und ohne Gegenbeleg. Danach gilt bei Uneinigkeit mit der Gegenprobe das
// vorsichtigere Urteil; widersprechen sich beide direkt, ist die Behauptung nicht belegbar.
export function urteilFestlegen(ki: Urteil, gegenprobe: Urteil | null, befunde: Befund[]): { urteil: Urteil; grund: string | null } {
  const seiten = (r: Richtung) => new Set(befunde.filter(b => b.richtung === r).map(b => b.stamm)).size;
  const dafuer = seiten('stuetzt'), dagegen = seiten('widerlegt');
  let urteil: Urteil = ki, grund: string | null = null;
  if (befunde.length === 0) { urteil = 'nicht_belegbar'; grund = ki === 'nicht_belegbar' ? null : 'keine_belege'; }
  else if (ki === 'stimmt' && (dafuer < 2 || dagegen > 0)) { urteil = dagegen > 0 && dafuer > 0 ? 'teilweise' : 'nicht_belegbar'; grund = 'zu_wenig_belege'; }
  else if (ki === 'stimmt_nicht' && (dagegen < 2 || dafuer > 0)) { urteil = dagegen > 0 && dafuer > 0 ? 'teilweise' : 'nicht_belegbar'; grund = 'zu_wenig_belege'; }
  else if (ki === 'teilweise' && dafuer + dagegen === 0) { urteil = 'nicht_belegbar'; grund = 'zu_wenig_belege'; }
  if (gegenprobe && gegenprobe !== urteil) {
    const vorsichtig: Urteil = RANG[gegenprobe] === RANG[urteil] ? 'nicht_belegbar' : RANG[gegenprobe] < RANG[urteil] ? gegenprobe : urteil;
    if (vorsichtig !== urteil) { urteil = vorsichtig; grund = 'gegenprobe'; }
  }
  return { urteil, grund };
}

export const istUrteil = (v: unknown): v is Urteil => typeof v === 'string' && (URTEILE as readonly string[]).includes(v);
export const istRichtung = (v: unknown): v is Richtung => typeof v === 'string' && (RICHTUNGEN as readonly string[]).includes(v);

// Bei einer Ablehnung (400) nennt die Websuche die gesperrte Seite. Welche aus der Liste kommt in der Meldung vor?
// Nennt die Meldung die ganze Liste (etwa als Echo), ist sie kein Hinweis auf eine einzelne Seite: dann nichts entfernen.
export function gesperrteSeiten(meldung: string, liste: string[]) {
  const treffer = liste.filter(d => new RegExp(`(^|[^a-z0-9.-])${d.replace(/\./g, '\\.')}($|[^a-z0-9-])`, 'i').test(meldung));
  return treffer.length > 2 ? [] : treffer;
}
