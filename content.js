// content.js — redaktioneller Inhalt: Wahlen, Parteien, Themen, Fragen, Positionen, Argumente, Abstimmungen.
//
// WICHTIG, Unterschied zu core.js: Das hier ist fuer alle Nutzer gleich und nur lesbar.
// Es gehoert NICHT in die Records des Nutzers. Die Records (core.js) halten nur, was dem
// einzelnen Nutzer gehoert, etwa gemerkte Fragen und Einstellungen.
//
// Herkunft: loadContent() holt beim Start alles Veroeffentlichte aus Supabase und merkt es sich auf dem
// Geraet. Ohne Verbindung (oder vor dem ersten Laden) gilt DEMO, damit die App offline vollstaendig laeuft.
// DEMO hat dieselben IDs wie die Beispielzeilen in Supabase; scripts/demo-sql.mjs erzeugt daraus
// supabase/migrations/003_demo_inhalte.sql, damit beide nie auseinanderlaufen.
//
// DEMO: Die Parteien heissen A bis F und alle Positionen, Auszuege und Abstimmungen sind erfunden. So wird
// keine erfundene Aussage je einer echten Partei zugeschrieben. Inhalte sind deutsch, die Bedienung zweisprachig.

import { PARTEIEN_DE } from './katalog.js';

const P = { A: '6675c29e-7733-4cdb-8738-25ebb4c5d516', B: '98f32a21-44b3-4220-81d6-c0631e34bbae', C: '67e4a12b-4b7b-4c63-9cae-1296ad67c676',
  D: '452265a3-d1fc-4cca-9133-775e79068925', E: '7096c8f1-785d-46d8-84f6-a6f3906d46e2', F: 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc' };
const T = { wohnen: '3a18c189-c9a4-49dc-8ad9-7e49ac440fe4', klima: '2a2cf39a-2cac-490e-bc3f-6557b9efb890', rente: 'd864065a-5d5c-4ad4-8149-645b4a1602eb' };
const F = { miete: 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8', co2: '584471ef-30b5-4334-a3d7-e51f20d929aa', rente: '95c54175-3b25-4055-a704-52ebec90696f' };
const WAHL = 'a0000000-0000-4000-8000-000000000001';
const QUELLE = 'Beispielquelle, erfunden';

// Gemerkte Themen aus Version 1 trugen Kurznamen statt IDs. Werden weiter gelesen (Datenregel: altes Format lesbar halten).
export const ALTE_THEMEN = { wohnen: T.wohnen, klima: T.klima, rente: T.rente };

// [frage, partei, haltung, Zusammenfassung, Seite, woertlicher Auszug, was die Partei selbst als Aenderung ankuendigt]
const POS = [
  [F.miete, 'A', 'dafuer', 'Will die Regelung unbefristet fortführen und auf weitere Landkreise ausweiten.', 34,
    'Wir werden die Mietpreisbremse unbefristet fortführen und auf alle Landkreise mit angespanntem Wohnungsmarkt ausweiten.',
    'Die Mietpreisbremse gilt dauerhaft und in mehr Landkreisen als heute.'],
  [F.miete, 'B', 'teilweise', 'Befürwortet eine Verlängerung um fünf Jahre, gekoppelt an eine Prüfung der Wirkung.', 12,
    'Wir verlängern die Mietpreisbremse um fünf Jahre und lassen ihre Wirkung bis dahin unabhängig prüfen.', null],
  [F.miete, 'C', 'dagegen', 'Hält die Regelung für wirkungslos und setzt stattdessen auf schnelleren Neubau.', 51,
    'Die Mietpreisbremse hat keine einzige neue Wohnung geschaffen. Wir setzen auf schnelleres Bauen.',
    'Baugenehmigungen sollen innerhalb von drei Monaten erteilt werden.'],
  [F.miete, 'D', 'dafuer', 'Verlängerung ja, zusätzlich eine Obergrenze bei Neuvermietung.', 8,
    'Neben der Verlängerung führen wir eine feste Obergrenze für Mieten bei Neuvermietung ein.',
    'Bei Neuvermietung gilt eine feste Obergrenze für die Miete.'],
  [F.miete, 'E', 'keine_angabe', 'Das Programm äußert sich nicht zur Mietpreisbremse.', null, null, null],
  [F.miete, 'F', 'teilweise', 'Nur in Gebieten mit nachgewiesener Wohnungsnot, sonst auslaufen lassen.', 27,
    'Die Mietpreisbremse soll nur dort gelten, wo Wohnungsnot nachgewiesen ist.', null],
  [F.co2, 'A', 'teilweise', 'Schnellerer Anstieg, aber nur mit vollständiger Rückzahlung an die Haushalte.', 41,
    'Ein schnellerer Anstieg des CO2-Preises kommt nur, wenn jeder Euro als Klimageld an die Haushalte zurückgeht.',
    'Einnahmen aus dem CO2-Preis gehen vollständig als Klimageld an die Haushalte.'],
  [F.co2, 'B', 'dafuer', 'Nennt einen festen Zielwert je Tonne bis 2030.', 19,
    'Bis 2030 soll der CO2-Preis einen festen Zielwert je Tonne erreichen.', null],
  [F.co2, 'C', 'dagegen', 'Lehnt eine Beschleunigung ab und verweist auf die Belastung der Industrie.', 63,
    'Eine Beschleunigung des CO2-Preises gefährdet Arbeitsplätze in der Industrie.', null],
  [F.co2, 'D', 'dafuer', 'Schnellerer Anstieg, verbunden mit einem Ausgleich für Pendler.', 15,
    'Wir beschleunigen den CO2-Preis und gleichen die Mehrkosten für Pendlerinnen und Pendler aus.',
    'Pendlerinnen und Pendler erhalten einen Ausgleich für höhere Spritkosten.'],
  [F.co2, 'E', 'dagegen', 'Will den Preis einfrieren, bis ein europäischer Rahmen steht.', 22,
    'Bis ein europäischer Rahmen steht, wird der CO2-Preis eingefroren.', null],
  [F.co2, 'F', 'keine_angabe', 'Das Programm nennt kein Tempo und keine Zahl.', null, null, null],
  [F.rente, 'A', 'dagegen', 'Schließt eine weitere Anhebung aus und will stattdessen die Beitragsbasis verbreitern.', 55,
    'Eine weitere Anhebung des Rentenalters schließen wir aus. Stattdessen sollen mehr Erwerbstätige einzahlen.',
    'Mehr Erwerbstätige zahlen in die Rentenversicherung ein.'],
  [F.rente, 'B', 'teilweise', 'Kopplung an die Lebenserwartung, mit Ausnahmen für körperlich schwere Berufe.', 31,
    'Das Rentenalter folgt der Lebenserwartung, mit Ausnahmen für körperlich schwere Berufe.', null],
  [F.rente, 'C', 'dafuer', 'Hält eine schrittweise Anhebung für unvermeidlich und nennt einen Zeitplan.', 48,
    'Eine schrittweise Anhebung des Renteneintrittsalters ist unvermeidlich.', null],
  [F.rente, 'D', 'keine_angabe', 'Das Programm legt sich nicht fest.', null, null, null],
  [F.rente, 'E', 'dagegen', 'Will das Eintrittsalter senken und die Finanzierung über Steuern lösen.', 9,
    'Wir senken das Renteneintrittsalter und finanzieren die Rente stärker aus Steuern.', null],
  [F.rente, 'F', 'keine_angabe', 'Nennt das Thema, ohne eine Position zu beziehen.', 60,
    'Die Zukunft der Rente ist eine der großen Fragen unserer Zeit.', null],
];

// Stimmen je Partei: [Stimme, Rolle zum Zeitpunkt der Abstimmung]
const koalition = (a, b, f) => ({ [P.A]: [a, 'koalition'], [P.B]: [b, 'koalition'], [P.F]: [f, 'koalition'] });

// Beispielparteien bekommen bewusst Grautoene: jede bunte Farbe erinnert an eine echte Partei.
const GRAU = { A: '#2E2F33', B: '#45474D', C: '#5C5E65', D: '#73757C', E: '#8A8C93', F: '#A1A3AA' };

// Aussagen von Politikerinnen und Politikern (MOCKUP). Spaeter sammelt ein Agent sie aus Nachrichtenagenturen und
// offiziellen Kanaelen, ein Mensch gibt frei. Personen, Zitate und Quellen hier sind erfunden.
const AUSSAGEN = [
  [P.A, F.miete, 'Beispielperson A1', 'Fraktionsvorsitz', '2026-11-04', 'Interview',
    'Eine befristete Mietpreisbremse reiche nicht, die Partei wolle sie dauerhaft und für mehr Landkreise.'],
  [P.C, F.miete, 'Beispielperson C1', 'Wohnungspolitische Sprecherin', '2026-11-03', 'Pressemitteilung',
    'Statt einer Verlängerung brauche es schnellere Baugenehmigungen, sonst entstehe keine neue Wohnung.'],
  [P.D, F.co2, 'Beispielperson D1', 'Landesvorsitz', '2026-11-02', 'Soziale Medien',
    'Ein höherer CO2-Preis sei nur mit einem Ausgleich für Pendlerinnen und Pendler zu machen.'],
  [P.E, F.rente, 'Beispielperson E1', 'Spitzenkandidat', '2026-10-30', 'Talkshow',
    'Das Renteneintrittsalter müsse sinken, die Finanzierung solle stärker aus Steuern kommen.'],
].map(([partei, frage, person, rolle, datum, kanal, text], i) =>
  ({ id: `aussage-${i + 1}`, partei, frage, person, rolle, datum, kanal, text, quelle: `${kanal}, erfunden`, url: null }));

export const DEMO = {
  ist_demo: true, ki: false, stand: '2026-11-06',
  wahlen: [{ id: WAHL, name: 'Beispielwahl zum Landtag', datum: '2027-05-09', parlament: 'Beispielparlament' }],
  parteien: Object.entries(P).map(([k, id]) => ({ id, kuerzel: k, name: `Partei ${k}`, farbe: GRAU[k] })),
  aussagen: AUSSAGEN,
  themen: [
    { id: T.wohnen, titel: 'Wohnen und Mieten', kurz: 'Die Mietpreisbremse läuft aus. Sechs Programme sagen dazu etwas, vier davon ausführlich.', sort: 1 },
    { id: T.klima, titel: 'Klima und Energie', kurz: 'Beim CO2-Preis gehen die Programme am weitesten auseinander.', sort: 2 },
    { id: T.rente, titel: 'Rente und Alterssicherung', kurz: 'Vier Programme äußern sich zum Renteneintrittsalter, zwei lassen die Frage offen.', sort: 3 },
  ],
  fragen: [
    { id: F.miete, thema: T.wohnen, kurz: 'Mietpreisbremse', frage: 'Soll die Mietpreisbremse über 2029 hinaus verlängert werden?', sort: 1 },
    { id: F.co2, thema: T.klima, kurz: 'CO2-Preis', frage: 'Soll der CO2-Preis schneller steigen als bisher geplant?', sort: 1 },
    { id: F.rente, thema: T.rente, kurz: 'Renteneintritt', frage: 'Soll das Renteneintrittsalter nach 2031 weiter steigen?', sort: 1 },
  ],
  programme: [['A', 152], ['B', 98], ['C', 211], ['D', 74], ['E', 133], ['F', 187]]
    .map(([k, seiten]) => ({ partei: P[k], wahl: WAHL, titel: 'Beispielprogramm 2026', url: null, seiten })),
  positionen: POS.map(([frage, k, haltung, text, seite, auszug, aenderung]) =>
    ({ frage, partei: P[k], haltung, text, seite, auszug, aenderung, quelle: seite ? 'Beispielprogramm 2026' : 'Keine Fundstelle im Programm 2026', agent: false })),
  argumente: [
    [F.miete, 'dafuer', 'Begrenzt den Anstieg der Mieten bei Neuvermietung in Städten mit knappem Wohnraum.'],
    [F.miete, 'dagegen', 'Kann dazu führen, dass weniger in neue Mietwohnungen investiert wird.'],
    [F.co2, 'dafuer', 'Macht klimaschädliche Energie teurer und lenkt Investitionen in Alternativen.'],
    [F.co2, 'dagegen', 'Belastet Haushalte mit niedrigem Einkommen und lange Pendelwege besonders.'],
    [F.rente, 'dafuer', 'Hält die Beiträge stabil, wenn Menschen länger leben und länger Rente beziehen.'],
    [F.rente, 'dagegen', 'Trifft Menschen in körperlich schweren Berufen, die oft nicht länger arbeiten können.'],
  ].map(([frage, richtung, text], i) => ({ id: `a0000000-0000-4000-8000-00000000002${i + 1}`, frage, richtung, text, quelle: QUELLE, url: null, agent: false })),
  abstimmungen: [
    { id: 'a0000000-0000-4000-8000-000000000011', parlament: 'Beispielparlament', datum: '2026-10-15',
      titel: 'Antrag: Mietpreisbremse um fünf Jahre verlängern', quelle: 'Beispielprotokoll, erfunden', url: null, fragen: [F.miete],
      stimmen: { ...koalition('ja', 'ja', 'ja'), [P.C]: ['nein', 'opposition'], [P.D]: ['ja', 'opposition'], [P.E]: ['enthaltung', 'opposition'] } },
    { id: 'a0000000-0000-4000-8000-000000000012', parlament: 'Beispielparlament', datum: '2026-09-24',
      titel: 'Gesetzentwurf: Ausgleich für Pendler beim CO2-Preis', quelle: 'Beispielprotokoll, erfunden', url: null, fragen: [F.co2],
      stimmen: { ...koalition('ja', 'ja', 'ja'), [P.C]: ['nein', 'opposition'], [P.D]: ['ja', 'opposition'], [P.E]: ['nein', 'opposition'] } },
  ],
};

// Der aktuell gueltige Inhalt. "export let" ist eine Live-Bindung: Ansichten sehen nach loadContent() den neuen Stand.
export let C = DEMO;
const CACHE_KEY = 'inhalt-v2';
const LISTEN = ['wahlen', 'parteien', 'themen', 'fragen', 'programme', 'positionen', 'argumente', 'abstimmungen'];
try { const c = JSON.parse(localStorage.getItem(CACHE_KEY)); if (c?.parteien?.length && LISTEN.every(k => Array.isArray(c[k]))) C = c; } catch {}

// Holt alles Veroeffentlichte (RLS liefert nur status = veroeffentlicht). Bei jedem Fehler bleibt der bisherige Stand.
export async function loadContent(client) {
  if (!client) return false;
  const q = (t, cols) => client.from(t).select(cols).then(({ data, error }) => { if (error) throw error; return data; });
  try {
    const [pa, th, fr, pr, po, wa, ar, ab, st, af] = await Promise.all([
      q('parteien', 'id,kuerzel,anzeigename,ist_demo'), q('themen', 'id,titel,kurzfassung,sortierung'),
      q('fragen', 'id,thema_id,frage,kurz,sortierung'), q('programme', 'partei_id,wahl_id,titel,quelle_url,seiten'),
      q('positionen', 'frage_id,partei_id,haltung,zusammenfassung,quelle_text,quelle_seite,auszug,aenderung,erstellt_von'),
      q('wahlen', 'id,name,datum,parlament'), q('argumente', 'id,frage_id,richtung,text,quelle_text,quelle_url,erstellt_von'),
      q('abstimmungen', 'id,parlament,datum,titel,quelle_text,quelle_url'), q('stimmverhalten', 'abstimmung_id,partei_id,stimme,rolle'),
      q('abstimmung_frage', 'abstimmung_id,frage_id'),
    ]);
    if (!pa.length) return false;
    const next = {
      ist_demo: pa.some(p => p.ist_demo), stand: new Date().toISOString().slice(0, 10),
      ki: po.some(p => p.erstellt_von === 'agent') || ar.some(a => a.erstellt_von === 'agent'),
      wahlen: wa, parteien: pa.map(p => ({ id: p.id, kuerzel: p.kuerzel, name: p.anzeigename, farbe: GRAU[p.kuerzel] })),
      // Aussagen gibt es noch nicht in der Datenbank (Mockup). Solange dort Beispieldaten liegen, gelten die eingebauten.
      aussagen: pa.some(p => p.ist_demo) ? AUSSAGEN : [],
      themen: th.map(t => ({ id: t.id, titel: t.titel, kurz: t.kurzfassung, sort: t.sortierung })),
      fragen: fr.map(f => ({ id: f.id, thema: f.thema_id, frage: f.frage, kurz: f.kurz || f.frage, sort: f.sortierung })),
      programme: pr.map(p => ({ partei: p.partei_id, wahl: p.wahl_id, titel: p.titel, url: p.quelle_url, seiten: p.seiten })),
      positionen: po.map(p => ({ frage: p.frage_id, partei: p.partei_id, haltung: p.haltung, text: p.zusammenfassung || '', seite: p.quelle_seite,
        auszug: p.auszug, aenderung: p.aenderung, quelle: p.quelle_text, agent: p.erstellt_von === 'agent' })),
      argumente: ar.map(a => ({ id: a.id, frage: a.frage_id, richtung: a.richtung, text: a.text, quelle: a.quelle_text, url: a.quelle_url, agent: a.erstellt_von === 'agent' })),
      abstimmungen: ab.map(a => ({ id: a.id, parlament: a.parlament, datum: a.datum, titel: a.titel, quelle: a.quelle_text, url: a.quelle_url,
        fragen: af.filter(x => x.abstimmung_id === a.id).map(x => x.frage_id),
        stimmen: Object.fromEntries(st.filter(s => s.abstimmung_id === a.id).map(s => [s.partei_id, [s.stimme, s.rolle]])) })),
    };
    C = next;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch {}
    return true;
  } catch (e) { console.warn('Inhalte nicht geladen, eingebauter Stand bleibt:', e.message); return false; }
}

const nachName = (a, b) => (partei(a.partei)?.name ?? '').localeCompare(partei(b.partei)?.name ?? '', 'de');
const nachSort = (a, b) => (a.sort ?? 0) - (b.sort ?? 0);

// Parteien mit Inhalten (C.parteien) und das Verzeichnis echter Parteien (katalog.js, noch ohne Positionen).
export const partei = id => C.parteien.find(p => p.id === id) || PARTEIEN_DE.find(p => p.id === id) || null;
export const parteienSortiert = () => [...C.parteien].sort((a, b) => a.name.localeCompare(b.name, 'de'));
export const aussagenVon = id => (C.aussagen ?? []).filter(a => a.partei === id).sort((a, b) => b.datum.localeCompare(a.datum));
export const aussagenZuFrage = id => (C.aussagen ?? []).filter(a => a.frage === id).sort((a, b) => b.datum.localeCompare(a.datum));
export const positionenAufSeite = (parteiId, n) => C.positionen.filter(p => p.partei === parteiId && p.seite === n);
export const fundstellenVon = id => C.positionen.filter(p => p.partei === id && p.seite).sort((a, b) => a.seite - b.seite);
export const thema = id => C.themen.find(t => t.id === id) || null;
export const themenSortiert = () => [...C.themen].sort(nachSort);
export const frage = id => C.fragen.find(f => f.id === id) || null;
export const fragenZuThema = id => C.fragen.filter(f => f.thema === id).sort(nachSort);
export const programmVon = id => C.programme.find(p => p.partei === id) || null;
// Alle Parteien in alphabetischer Reihenfolge, keine Rangfolge.
export const positionenZuFrage = id => C.positionen.filter(p => p.frage === id).sort(nachName);
export const positionVon = (parteiId, frageId) => C.positionen.find(p => p.partei === parteiId && p.frage === frageId) || null;
export const argumenteZuFrage = id => C.argumente.filter(a => a.frage === id);
export const abstimmungenZuFrage = id => C.abstimmungen.filter(a => a.fragen.includes(id)).sort((a, b) => b.datum.localeCompare(a.datum));
export const neueAbstimmungen = (n = 3) => [...C.abstimmungen].sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, n);

// Ortsdatum statt toISOString(): sonst springt der Countdown nach Mitternacht deutscher Zeit erst eine Stunde spaeter um.
const ortsdatum = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function naechsteWahl(heute = new Date()) {
  const tag = ortsdatum(heute);
  return [...C.wahlen].filter(w => w.datum >= tag).sort((a, b) => a.datum.localeCompare(b.datum))[0] || null;
}
export const tageBis = (datum, heute = new Date()) => Math.round((new Date(datum + 'T12:00:00') - new Date(ortsdatum(heute) + 'T12:00:00')) / 864e5);

// Nachpruefen: reine Wortsuche. Eine genannte Partei grenzt auf ihr Programm ein; danach muss jedes uebrige
// Wort ab drei Buchstaben vorkommen (Frage, Zusammenfassung, Auszug). Fuellwoerter wie "will" zaehlen nicht.
// Findet nur, was woertlich dasteht; ob eine bessere Suche noetig ist, zeigt erst der Test mit echten Programmen.
const norm = s => String(s ?? '').toLocaleLowerCase('de').normalize('NFKD').replace(/[̀-ͯ]/g, '');
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const FUELLWOERTER = new Set(['partei', 'parteien', 'will', 'wollen', 'soll', 'sollen', 'der', 'die', 'das', 'den', 'dem', 'und', 'oder',
  'ist', 'sind', 'mit', 'fur', 'von', 'zum', 'zur', 'ein', 'eine', 'einen', 'auch', 'nicht', 'wird', 'werden', 'hat', 'haben', 'dass']);
export function suche(text) {
  let rest = norm(text);
  const namen = p => [p.name, p.kuerzel?.length >= 2 ? p.kuerzel : null].filter(Boolean).map(norm);
  const gemeint = C.parteien.filter(p => namen(p).some(n => new RegExp(`(^|[^\\p{L}])${reEsc(n)}($|[^\\p{L}])`, 'u').test(rest)));
  gemeint.forEach(p => namen(p).forEach(n => { rest = rest.split(n).join(' '); }));
  const woerter = rest.split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3 && !FUELLWOERTER.has(w));
  if (!woerter.length && !gemeint.length) return null;
  const passt = s => { const h = norm(s); return woerter.every(w => h.includes(w)); };
  return {
    parteien: gemeint,
    positionen: C.positionen.filter(p => p.seite && (!gemeint.length || gemeint.some(g => g.id === p.partei))
      && passt([frage(p.frage)?.frage, p.text, p.auszug].join(' '))).sort(nachName),
    abstimmungen: woerter.length ? C.abstimmungen.filter(a => passt([a.titel, a.parlament].join(' '))) : [],
  };
}

// Freie Frage auf der Startseite ("Welche Partei unterstuetzt Obdachlose am besten?"). Anders als suche():
// es reicht, wenn EIN Begriff passt, und Alltagswoerter werden ueber eine kleine Begriffsliste auf die Fragen
// gelenkt. Ergebnis sind Fragen mit allen Positionen, nie eine Rangfolge der Parteien.
const FRAGEWOERTER = new Set([...FUELLWOERTER, 'welche', 'welcher', 'wer', 'wie', 'was', 'wo', 'warum', 'gibt', 'moment', 'gerade', 'aktuell',
  'besten', 'beste', 'besser', 'zukunft', 'machen', 'macht', 'unterstutzt', 'unterstutzen', 'projekte', 'politik', 'thema', 'dazu', 'denn',
  'meisten', 'mehr', 'sich', 'fur', 'gegen', 'einsetzen', 'setzt']);
const BEGRIFFE = { obdach: ['wohn', 'miet'], wohnungslos: ['wohn', 'miet'], wohnung: ['wohn', 'miet'], miet: ['miet'], bau: ['neubau', 'bau'],
  klima: ['klima', 'co2', 'energie'], umwelt: ['klima', 'co2'], energie: ['energie', 'co2'], benzin: ['co2', 'pendler'], sprit: ['co2', 'pendler'],
  pendl: ['pendler'], co2: ['co2'], rent: ['rente'], alter: ['rente'], senior: ['rente'] };
export const istWertend = text => /\b(am besten|beste|besser|schlechteste|am meisten)\b/i.test(String(text));
export function frageSuche(text) {
  const tokens = norm(text).split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3 && !FRAGEWOERTER.has(w));
  if (!tokens.length) return null;
  const staemme = tokens.map(w => [w, ...Object.entries(BEGRIFFE).filter(([k]) => w.startsWith(k)).flatMap(([, v]) => v)]);
  const fragen = C.fragen.map(f => {
    const heu = norm([thema(f.thema)?.titel, f.frage, f.kurz, ...C.positionen.filter(p => p.frage === f.id).flatMap(p => [p.text, p.auszug, p.aenderung]),
      ...argumenteZuFrage(f.id).map(a => a.text)].join(' '));
    return { f, treffer: staemme.filter(st => st.some(s => heu.includes(s))).length };
  }).filter(x => x.treffer).sort((a, b) => b.treffer - a.treffer || nachSort(a.f, b.f));
  return { fragen: fragen.map(x => x.f), wertend: istWertend(text) };
}
