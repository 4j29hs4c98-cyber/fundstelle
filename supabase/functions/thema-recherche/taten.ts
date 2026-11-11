// taten.ts — Was die Parteien tun, nicht nur was sie versprechen. Drei Quellen neben den Wahlprogrammen:
//  1. Namentliche Abstimmungen im Bundestag (abgeordnetenwatch.de): wie jede Fraktion abgestimmt hat, ausgezaehlt aus
//     den Einzelstimmen. Die KI waehlt nur aus, welche Abstimmungen zum Thema passen; die Zahlen kommen aus den Daten.
//  2. Antraege und Gesetzentwuerfe der Fraktionen (DIP, Dokumentations- und Informationssystem des Bundestags). Titel,
//     Datum und einbringende Fraktion kommen unveraendert aus DIP, die KI waehlt nur aus.
//  3. Meldungen auf einer festen Liste etablierter Seiten (Websuche). Der Server laedt die Seite selbst und prueft das
//     Zitat und ob der Parteiname direkt daneben steht. Sonst wird verworfen.
// Nur Parteien mit eigener Fraktion im aktuellen Bundestag haben Abstimmungen und Antraege. Welche das nicht sind, meldet
// der Strom ausdruecklich (ohne_fraktion), damit die Luecke nicht als "tut nichts" gelesen wird.
import { frageClaude, jsonAus, type KiAntwort } from './ki.ts';
import { norm, kuerzen, zitatOk } from './text.ts';
import { REGELN, istDatum, awGet, dipGet, auswaehlen, WEB_SEITEN, erlaubteSeite, seiteLaden } from './personen.ts';

export type Partei = { id: string; name: string };
export type Tat = Record<string, unknown>;

// Fraktionen im Bundestag 2025 bis 2029. parteien: Anzeigenamen in der Tabelle parteien. muster: Erkennung in den Daten.
const FRAKTIONEN = [
  { name: 'AfD', parteien: ['AfD'], muster: /\bafd\b/ },
  { name: 'BÜNDNIS 90/DIE GRÜNEN', parteien: ['GRÜNE'], muster: /grünen|\bb90/ },
  { name: 'CDU/CSU', parteien: ['CDU', 'CSU'], muster: /cdu\/csu/ },
  { name: 'Die Linke', parteien: ['Die Linke'], muster: /\blinke\b/ },
  { name: 'SPD', parteien: ['SPD'], muster: /\bspd\b/ },
];
type Fraktion = typeof FRAKTIONEN[number];
const fraktionVon = (label: string) => FRAKTIONEN.find(f => f.muster.test(norm(label.replace(/­/g, ''))));
const idsVon = (f: Fraktion, parteien: Partei[]) => parteien.filter(p => f.parteien.includes(p.name)).map(p => p.id);
const alphabetisch = (a: Fraktion, b: Fraktion) => a.name.localeCompare(b.name, 'de');
const istFraktion = (titel: string) => /^Fraktion/.test(titel) ? fraktionVon(titel) : undefined;

export function ohneFraktion(parteien: Partei[]): string[] {
  const mit = new Set(FRAKTIONEN.flatMap(f => f.parteien));
  return parteien.filter(p => !mit.has(p.name)).map(p => p.id);
}

// ---------- 1. Namentliche Abstimmungen ----------
const BT_2025 = 161;
const MAX_ABSTIMMUNGEN = 4;
type Einzelstimme = { vote?: string; fraction?: { label?: string } };

// Aendert abgeordnetenwatch eine Bezeichnung, fiele die Fraktion still aus allen Abstimmungen. Deshalb unbekannte Labels loggen.
function unbekannteLabels(stimmen: Einzelstimme[], poll: string) {
  const fremd = new Set(stimmen.map(v => v.fraction?.label ?? '').filter(l => l && !/fraktionslos/i.test(l) && !fraktionVon(l)));
  if (fremd.size) console.error('Unbekannte Fraktion in Abstimmung', poll, [...fremd]);
}

function auszaehlen(stimmen: Einzelstimme[], f: Fraktion, parteien: Partei[]) {
  const z = { ja: 0, nein: 0, enthalten: 0, nicht_abgestimmt: 0 };
  for (const v of stimmen) {
    if (fraktionVon(v.fraction?.label ?? '') !== f) continue;
    if (v.vote === 'yes') z.ja++; else if (v.vote === 'no') z.nein++; else if (v.vote === 'abstain') z.enthalten++; else z.nicht_abgestimmt++;
  }
  // Echte Mehrheit: mehr als die Haelfte der abgegebenen Stimmen. Sonst keine Richtung behaupten.
  const abgegeben = z.ja + z.nein + z.enthalten;
  const groesste = (['ja', 'nein', 'enthalten'] as const).reduce((a, b) => (z[b] > z[a] ? b : a));
  const mehrheit = z[groesste] * 2 > abgegeben ? groesste : null;
  return { fraktion: f.name, parteien: idsVon(f, parteien), mehrheit, ...z };
}

export async function fraktionsAbstimmungen(frage: string, thema: string, parteien: Partei[], signal: AbortSignal): Promise<Tat[]> {
  const polls: { id?: number; label?: string }[] = await awGet(`polls?field_legislature=${BT_2025}&range_end=500`, signal) ?? [];
  const eintraege = polls.filter(p => p.id && p.label).map(p => ({ id: String(p.id), titel: String(p.label) }));
  const ids = await auswaehlen(thema, frage, eintraege, MAX_ABSTIMMUNGEN, signal);
  const taten = await Promise.all(ids.map(async id => {
    const d = await awGet(`polls/${Number(id)}?related_data=votes`, signal);
    const stimmen: Einzelstimme[] = d?.related_data?.votes ?? [];
    unbekannteLabels(stimmen, id);
    const fraktionen = FRAKTIONEN.map(f => auszaehlen(stimmen, f, parteien)).filter(f => f.ja + f.nein + f.enthalten > 0);
    if (!fraktionen.length) return null;
    return { quelle: 'fraktion_abstimmung', titel: String(d?.label ?? '').slice(0, 300), url: d?.abgeordnetenwatch_url ?? null,
      datum: istDatum(d?.field_poll_date), angenommen: typeof d?.field_accepted === 'boolean' ? d.field_accepted : null, fraktionen };
  }));
  return taten.filter((t): t is NonNullable<typeof t> => !!t);
}

// ---------- 2. Antraege und Gesetzentwuerfe ----------
const WAHLPERIODE = 21;
const MAX_ANTRAEGE = 6;
const ARTEN = ['Antrag', 'Gesetzentwurf'];
const BT_PDF = /^https:\/\/dserver\.bundestag\.de\//;
type Drucksache = { id?: string; titel?: string; datum?: string; dokumentnummer?: string; drucksachetyp?: string;
  urheber?: { titel?: string }[]; fundstelle?: { pdf_url?: string } };

export async function antraege(frage: string, thema: string, stichworte: string[], parteien: Partei[], signal: AbortSignal): Promise<Tat[]> {
  // Ohne Stichworte (KI ausgefallen) mit dem Thema suchen; ohne beides ist das ein Fehler, kein "nichts gefunden".
  const begriffe = stichworte.length ? stichworte.slice(0, 4) : thema.split(/\s+/).filter(w => w.length >= 4).slice(0, 3);
  if (!begriffe.length) throw new Error('Antraege: keine Suchbegriffe');
  // Einzelne Suchen duerfen scheitern; erst wenn alle scheitern, gilt die Quelle als ausgefallen.
  const ergebnisse = await Promise.allSettled(begriffe.flatMap(b => ARTEN.map(art =>
    dipGet(`drucksache?f.wahlperiode=${WAHLPERIODE}&f.zuordnung=BT&f.drucksachetyp=${encodeURIComponent(art)}&f.titel=${encodeURIComponent(b)}`, signal)
      .then(d => (d?.documents ?? []) as Drucksache[]))));
  if (signal.aborted) throw new Error('abgebrochen');
  if (ergebnisse.every(r => r.status === 'rejected')) throw (ergebnisse[0] as PromiseRejectedResult).reason;
  const listen = ergebnisse.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []));
  const gesehen = new Map<string, Drucksache>();
  for (const d of listen.flat()) {
    const vonFraktion = (d.urheber ?? []).some(u => istFraktion(u.titel ?? ''));
    if (d.id && d.titel && vonFraktion && BT_PDF.test(d.fundstelle?.pdf_url ?? '')) gesehen.set(String(d.id), d);
  }
  const eintraege = [...gesehen.values()].map(d => ({ id: String(d.id), titel: String(d.titel) }));
  const ids = await auswaehlen(thema, frage, eintraege, MAX_ANTRAEGE, signal);
  return ids.map(id => {
    const d = gesehen.get(id)!;
    const fr = [...new Set((d.urheber ?? []).map(u => istFraktion(u.titel ?? '')).filter((f): f is Fraktion => !!f))].sort(alphabetisch);
    return { quelle: 'antrag', titel: String(d.titel).slice(0, 300), art: d.drucksachetyp ?? null, nummer: d.dokumentnummer ?? null,
      url: d.fundstelle!.pdf_url!, datum: istDatum(d.datum), fraktionen: fr.map(f => ({ fraktion: f.name, parteien: idsVon(f, parteien) })) };
  });
}

// ---------- 3. Meldungen ----------
// Wie der Parteiname auf Nachrichtenseiten auftaucht.
const ALIAS: Record<string, string[]> = { 'GRÜNE': ['Grüne', 'Grünen'], 'Die Linke': ['Linke', 'Linken'], 'FREIE WÄHLER': ['Freie Wähler', 'Freien Wähler'] };
const MAX_MELDUNGEN = 4;
const MELDUNG_ABSTAND = 200;
const MAX_FORTSETZUNGEN = 2;

const namenVon = (p: Partei) => [p.name, ...(ALIAS[p.name] ?? [])];
const regexText = (t: string) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const ganzesWort = (name: string) => new RegExp(`(?<![\\p{L}\\p{N}])${regexText(norm(name))}(?![\\p{L}\\p{N}])`, 'u');

// Gehoert das Zitat zur Partei? Rund um das Zitat muss ihr Name als ganzes Wort stehen, und KEINE andere Partei darf dort
// genannt sein (sonst koennte die Aussage einer anderen Partei gelten, etwa "Die SPD kritisierte den Vorschlag der CDU").
// CDU und CSU gelten dabei nicht als fremd zueinander, weil sie eine gemeinsame Fraktion bilden.
export function gehoertZu(auszug: string, quelltext: string, p: Partei, alle: Partei[]): boolean {
  const t = norm(quelltext), z = norm(auszug);
  const eigene = namenVon(p).map(ganzesWort);
  const partner = new Set(FRAKTIONEN.find(f => f.parteien.includes(p.name))?.parteien ?? [p.name]);
  const fremde = alle.filter(q => !partner.has(q.name)).flatMap(namenVon).map(ganzesWort);
  for (let i = t.indexOf(z); i >= 0; i = t.indexOf(z, i + 1)) {
    const fenster = t.slice(Math.max(0, i - MELDUNG_ABSTAND), i + z.length + MELDUNG_ABSTAND);
    if (eigene.some(r => r.test(fenster)) && !fremde.some(r => r.test(fenster))) return true;
  }
  return false;
}

// Websuche mit Fortsetzung: die Schnittstelle kann mit pause_turn anhalten, dann wird die Antwort weitergefuehrt.
async function sucheMitFortsetzung(body: Record<string, unknown>, signal: AbortSignal): Promise<KiAntwort> {
  const messages = [...(body.messages as unknown[])];
  let a = await frageClaude({ ...body, messages }, 50_000, signal);
  for (let n = 0; a.stop === 'pause_turn' && n < MAX_FORTSETZUNGEN; n++) {
    messages.push({ role: 'assistant', content: a.inhalt });
    a = await frageClaude({ ...body, messages }, 50_000, signal);
  }
  return a;
}

export async function meldungen(frage: string, thema: string, parteien: Partei[], signal: AbortSignal): Promise<Tat[]> {
  const namen = parteien.map(p => p.name).sort((a, b) => a.localeCompare(b, 'de'));
  const a = await sucheMitFortsetzung({
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3, allowed_domains: WEB_SEITEN }],
    system: 'Du recherchierst fuer eine neutrale Schul-App, was deutsche Parteien in letzter Zeit zu einem Thema getan oder oeffentlich erklaert haben '
      + '(Beschluesse, Initiativen, Gesetzesvorhaben, Aussagen der Partei). Suche hoechstens dreimal. '
      + 'Antworte zum Schluss NUR mit JSON: {"meldungen":[{"partei":"Name aus der Liste","zusammenfassung":"zwei neutrale deutsche Saetze","auszug":"woertliches Zitat","url":"https://...","datum":"JJJJ-MM-TT"}]}. '
      + `Hoechstens ${MAX_MELDUNGEN} Meldungen, je Meldung genau eine Partei aus der Liste, nur was die Partei selbst getan oder erklaert hat, keine Meinungen anderer ueber sie. `
      + 'Bevorzuge keine Partei. Der auszug ist zeichengenau von der Seite kopiert, ein bis zwei Saetze, hoechstens 300 Zeichen, und nennt die Partei oder steht direkt bei ihrem Namen. '
      + 'datum ist das Datum des Artikels oder null. Findest du nichts Passendes, gib {"meldungen":[]} zurueck. ' + REGELN,
    messages: [{ role: 'user', content: `Parteien: ${namen.join(', ')}\nThema: ${thema}\nFrage: ${frage}` }],
  }, signal);
  const j = jsonAus<{ meldungen?: unknown }>(a);
  if (!j) throw new Error('Websuche ohne verwertbare Antwort');
  const roh = Array.isArray(j.meldungen) ? (j.meldungen as Record<string, unknown>[]).slice(0, MAX_MELDUNGEN) : [];
  const taten: Tat[] = [];
  for (const x of roh) {
    const p = parteien.find(q => q.name === x?.partei);
    const url = erlaubteSeite(String(x?.url ?? ''));
    if (!p || !url || typeof x.zusammenfassung !== 'string') continue;
    const seite = await seiteLaden(url, signal).catch(err => { if (signal.aborted) throw err; return null; });
    if (!seite || !zitatOk(x.auszug, seite.text)) continue;
    const auszug = x.auszug as string;
    if (!gehoertZu(auszug, seite.text, p, parteien)) { console.log(`Meldung verworfen ${p.name}: Partei nicht eindeutig am Zitat`); continue; }
    taten.push({ quelle: 'web', partei: p.id, titel: (seite.titel || url.hostname).slice(0, 300), zusammenfassung: kuerzen(x.zusammenfassung.trim(), 500),
      auszug, url: url.href, datum: istDatum(x.datum), seite_name: url.hostname.replace(/^www\./, '') });
  }
  return taten;
}
