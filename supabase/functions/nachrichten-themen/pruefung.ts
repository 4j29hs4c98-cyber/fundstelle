// pruefung.ts — prueft, was die KI zu einem Thema des Tages vorschlaegt, bevor es gespeichert wird. Reine Funktionen ohne
// Netz, damit sie sich einzeln testen lassen. Grundsatz wie bei den Programm-Zitaten: lieber nichts zeigen als etwas Falsches.
// Die Kurzfassung bleibt nur, wenn (1) jede Zahl in den Quelltexten steht, (2) nichts woertlich uebernommen wurde und
// (3) sie eine vernuenftige Laenge hat. Sonst steht das Thema ohne Kurzfassung da, nur mit den verlinkten Meldungen.
import { kommtVor, parteiNamen, parteienIn, pruefeZuordnung, type Partei } from '../nachrichten-holen/zuordnung.ts';
import type { Meldung } from '../nachrichten-holen/rss.ts';

export type Art = 'meldung' | 'kommentar' | 'interview' | 'video';
export const ARTEN: Art[] = ['meldung', 'kommentar', 'interview', 'video'];
export type Eintrag = { q: string; t: string; u: string; d: string; a: Art };
export type Thema = {
  titel: string; zusammenfassung: string | null; parteien: string[]; personen: string[];
  frage: string | null; frage_id: string | null; meldungen: Eintrag[]; anzahl_quellen: number; aktualisiert: string;
  bereich: string; rang: number | null;   // rang wird erst nach der Pruefung aus der Reihenfolge der KI vergeben
};
// Feste Liste: die KI darf keine eigenen Bereiche erfinden. Alles andere landet unter "Weitere Themen".
export const BEREICHE = ['Innenpolitik', 'Außenpolitik und Sicherheit', 'Wirtschaft und Finanzen', 'Klima und Energie', 'Soziales und Gesundheit', 'Bildung und Gesellschaft', 'Weitere Themen'];
export const bereichOk = (b: unknown): string => (typeof b === 'string' && BEREICHE.includes(b.trim()) ? b.trim() : 'Weitere Themen');
export type Vorbereitet = { id: string; frage: string };

const TITEL_MIN = 8, TITEL_MAX = 200;
const ZF_MIN = 40, ZF_MAX = 800, ZF_SAETZE_MAX = 4;
const INHALT_TITEL = 0.6, INHALT_ZF = 0.55;   // so viel der Inhaltswoerter muss in den Quellen vorkommen
const KOPIE_WORTE = 7;           // so viele Woerter in Folge darf eine Kurzfassung nicht aus einer Quelle uebernehmen
const FRAGE_MIN = 15, FRAGE_MAX = 150;
const MAX_MELDUNGEN_JE_THEMA = 20;
// Vorwuerfe, Ermittlungen und Strafverfahren gegen Personen: dort schreibt keine KI eine Kurzfassung. Eine falsche Zuordnung waere ein
// Rechtsrisiko; stattdessen stehen nur die verlinkten Meldungen der Redaktionen da.
const HEIKEL = /(Vorw(u|ü)rf|Ermittl|Anklage|Verdacht|Belästig|Missbrauch|Betrug|Korruption|Straftat|Verurteil|Festnahme|Haftbefehl|Spionage|Untreue|Beleidigung|Volksverhetzung)/i;

// Sendungen, Newsletter, Podcasts und Glossen sind keine Meldungen und werden gar nicht erst an die KI geschickt.
export const istKeineMeldung = (m: Pick<Meldung, 'titel'>) =>
  /(\bvom \d{1,2}\. [A-Za-zäöü]+ \d{4}\b|\bNewsletter\b|\bPodcast\b|\bGlosse\b|Streiflicht|SZ am Abend|Wochenr(ü|ue)ckblick)/i.test(m.titel);

const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/[\u00ad\u200b]/g, '');
const worte = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Jede Zahl muss als eigenstaendige Zahl in den Quelltexten stehen ("5" steht nicht in "2025" oder "5,3"), ebenso Zahlwoerter
// wie "drei" oder "Milliarden". Sonst koennte die KI eine Zahl erfinden, die zufaellig als Teilstueck irgendwo vorkommt.
const regexText = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function zahlenBelegt(text: string, quellen: string): boolean {
  const q = norm(quellen);
  const zahlenOk = (text.match(/\d+(?:[.,]\d+)*/g) ?? []).every(z => new RegExp(`(?<![\\p{N}.,])${regexText(z)}(?![\\p{N}]|[.,]\\p{N})`, 'u').test(q));
  const worteOk = (norm(text).match(/\b(?:zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|hundert\p{L}*|tausend\p{L}*|million\p{L}*|milliard\p{L}*|billion\p{L}*)\b/gu) ?? [])
    .every(w => q.includes(w.slice(0, Math.min(w.length, 6))));
  return zahlenOk && worteOk;
}

// Anteil der Inhaltswoerter (ab 5 Buchstaben, verglichen an den ersten 5 Buchstaben), die auch in den Quellen vorkommen.
// Faengt frei erfundene Zusaetze ab, die weder Zahl noch Kopie sind.
const stamm = (w: string) => w.slice(0, 5);
export function inhaltAnteil(text: string, quellen: string[]): number {
  const bekannt = new Set(quellen.flatMap(worte).map(stamm));
  const inhalt = worte(text).filter(w => w.length >= 5);
  return inhalt.length ? inhalt.filter(w => bekannt.has(stamm(w))).length / inhalt.length : 1;
}

// Parteien, die im Text stehen, muessen auch in den Quellen stehen.
export const parteienBelegt = (text: string, quellen: string[], parteien: Partei[]) => {
  const erlaubt = new Set(parteienIn(quellen.join(' \n '), parteien));
  return parteienIn(text, parteien).every(id => erlaubt.has(id));
};

// Die Art einer Meldung nicht allein der KI ueberlassen: Hinweise in Titel und Adresse gelten zuerst.
export function artVon(m: Pick<Meldung, 'titel' | 'url'>, ki: Art): Art {
  if (/\b(Kommentar|Meinung|Analyse|Gastbeitrag|Standpunkt|Glosse)\b/i.test(m.titel) || /\/(kommentar|meinung|standpunkt|analyse)/i.test(m.url)) return 'kommentar';
  if (/\bInterview\b/i.test(m.titel) || /\/interview/i.test(m.url)) return 'interview';
  if (/\/video|\/mediathek/i.test(m.url) || /^Video\b/i.test(m.titel)) return 'video';
  return ki;
}

// true, wenn mindestens KOPIE_WORTE Woerter in Folge auch in einer Quelle in dieser Folge stehen.
export function istKopie(text: string, quellen: string[]): boolean {
  const w = worte(text);
  if (w.length < KOPIE_WORTE) return false;
  const bekannt = new Set<string>();
  for (const q of quellen) {
    const qw = worte(q);
    for (let i = 0; i + KOPIE_WORTE <= qw.length; i++) bekannt.add(qw.slice(i, i + KOPIE_WORTE).join(' '));
  }
  for (let i = 0; i + KOPIE_WORTE <= w.length; i++) if (bekannt.has(w.slice(i, i + KOPIE_WORTE).join(' '))) return true;
  return false;
}

// tragend: Texte der Meldungen und Videos (nicht der Kommentare und Interviews), alle: Texte aller Meldungen des Themas.
export function kurzfassungOk(zf: unknown, tragend: string[], alle: string[], parteien: Partei[]): string | null {
  if (typeof zf !== 'string' || !tragend.length) return null;
  const t = zf.replace(/\s+/g, ' ').trim();
  if (t.length < ZF_MIN || t.length > ZF_MAX) return null;
  if (t.split(/(?<=[.!?])\s+/).length > ZF_SAETZE_MAX) return null;
  if (/https?:|www\.|@/i.test(t)) return null;
  if (HEIKEL.test(t)) return null;
  if (!zahlenBelegt(t, tragend.join(' '))) return null;
  if (!parteienBelegt(t, tragend, parteien)) return null;
  if (inhaltAnteil(t, tragend) < INHALT_ZF) return null;
  if (istKopie(t, alle)) return null;
  return t;
}

// Der Titel ist KI-Text wie die Kurzfassung und wird deshalb strenger gegen die Quellen geprueft: Zahlen, Parteien, Inhaltswoerter.
export function titelOk(titel: string, quellen: string[], parteien: Partei[]): boolean {
  return zahlenBelegt(titel, quellen.join(' ')) && parteienBelegt(titel, quellen, parteien) && inhaltAnteil(titel, quellen) >= INHALT_TITEL && !/https?:|www\./i.test(titel);
}

// Die Frage fuer die Recherche muss neutral sein: keine Partei- und keine Personennamen (sonst kippt die Recherche in
// den Personenmodus oder wirkt parteiisch), ein Fragezeichen, vernuenftige Laenge.
export function frageOk(f: unknown, parteien: Partei[], personen: string[]): string | null {
  if (typeof f !== 'string') return null;
  const t = f.replace(/\s+/g, ' ').trim();
  if (t.length < FRAGE_MIN || t.length > FRAGE_MAX || !t.endsWith('?')) return null;
  const namen = [...parteien.flatMap(parteiNamen), ...personen.flatMap(p => [p, p.split(' ').pop() ?? ''])].filter(n => n.length >= 3);
  return namen.some(n => kommtVor(n, t)) ? null : t;
}

type Roh = { titel?: unknown; zusammenfassung?: unknown; meldungen?: unknown; parteien?: unknown; personen?: unknown; frage?: unknown; vorbereitete_frage?: unknown; bereich?: unknown };

// Baut aus einem KI-Vorschlag ein gepruefes Thema, oder null. benutzt: Indizes, die schon einem Thema gehoeren (wird ergaenzt).
export function pruefeThema(roh: Roh, meldungen: Meldung[], parteien: Partei[], vorbereitet: Vorbereitet[], benutzt: Set<number>): Thema | null {
  const vorschlag = typeof roh.titel === 'string' ? roh.titel.replace(/\s+/g, ' ').trim() : '';
  if (!Array.isArray(roh.meldungen)) return null;

  const eintraege: { m: Meldung; art: Art }[] = [];
  for (const x of roh.meldungen as { i?: unknown; art?: unknown }[]) {
    const i = x?.i;
    if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= meldungen.length || benutzt.has(i)) continue;
    benutzt.add(i);
    eintraege.push({ m: meldungen[i], art: artVon(meldungen[i], ARTEN.includes(x.art as Art) ? x.art as Art : 'meldung') });
    if (eintraege.length >= MAX_MELDUNGEN_JE_THEMA) break;
  }
  if (!eintraege.length) return null;
  eintraege.sort((a, b) => b.m.datum.localeCompare(a.m.datum));

  // Nur Meldungen und Videos, keine Kommentare oder Interviews, tragen Titel und Kurzfassung. Auf Kopien wird gegen alle
  // Texte des Themas geprueft, damit auch eine Uebernahme aus einem Kommentar auffaellt.
  const text = (e: { m: Meldung }) => `${e.m.titel} ${e.m.anreisser}`;
  const tragend = eintraege.filter(e => e.art === 'meldung' || e.art === 'video').map(text);
  const alle = eintraege.map(text);
  const zf = kurzfassungOk(roh.zusammenfassung, tragend, alle, parteien);
  // Besteht der Titel der KI die Pruefung nicht, steht stattdessen die echte Schlagzeile der neuesten Meldung da.
  const echt = (eintraege.find(e => e.art === 'meldung' || e.art === 'video') ?? eintraege[0]).m.titel.slice(0, TITEL_MAX);
  const titel = vorschlag.length >= TITEL_MIN && vorschlag.length <= TITEL_MAX && titelOk(vorschlag, tragend.length ? tragend : alle, parteien) ? vorschlag : echt;
  if (titel.length < TITEL_MIN) return null;

  const z = pruefeZuordnung({ url: '', quelle: '', titel: eintraege.map(e => e.m.titel).join(' '), anreisser: eintraege.map(e => e.m.anreisser).join(' '), datum: '' },
    { parteien: roh.parteien, personen: roh.personen }, parteien);
  const vb = typeof roh.vorbereitete_frage === 'string' ? vorbereitet.find(v => v.id === roh.vorbereitete_frage) : undefined;

  return {
    titel, zusammenfassung: zf, parteien: z.parteien, personen: z.personen,
    frage: vb ? null : frageOk(roh.frage, parteien, z.personen), frage_id: vb?.id ?? null,
    meldungen: eintraege.map(e => ({ q: e.m.quelle, t: e.m.titel, u: e.m.url, d: e.m.datum, a: e.art })),
    anzahl_quellen: new Set(eintraege.map(e => e.m.quelle)).size,
    aktualisiert: eintraege[0].m.datum, bereich: bereichOk(roh.bereich), rang: null,
  };
}
