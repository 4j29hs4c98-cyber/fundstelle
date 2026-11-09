// content.js — redaktioneller Inhalt: Wahlen, Parteien, Themen, Fragen, Positionen, Argumente, Abstimmungen.
//
// WICHTIG, Unterschied zu core.js: Das hier ist fuer alle Nutzer gleich und nur lesbar.
// Es gehoert NICHT in die Records des Nutzers. Die Records (core.js) halten nur, was dem
// einzelnen Nutzer gehoert, etwa gemerkte Fragen und Einstellungen.
//
// Herkunft: loadContent() holt beim Start alles Veroeffentlichte aus Supabase und merkt es sich auf dem
// Geraet. Ohne Verbindung (oder vor dem ersten Laden) gilt EINGEBAUT aus inhalt-2025.js, damit die App offline
// vollstaendig laeuft. Dort stehen echte Parteien mit woertlichen Zitaten aus den Programmen 2025, von KI
// zusammengestellt und noch ungeprueft. Inhalte sind deutsch, die Bedienung zweisprachig.

import { PARTEIEN_DE } from './katalog.js';
import { EINGEBAUT, T } from './inhalt-2025.js';

// Gemerkte Themen aus Version 1 trugen Kurznamen statt IDs. Werden weiter gelesen (Datenregel: altes Format lesbar halten).
export const ALTE_THEMEN = { wohnen: T.wohnen, klima: T.klima, rente: T.rente };

// Farbe, Website und voller Name kommen immer aus dem Katalog, auch wenn die Partei aus Supabase stammt.
const mitKatalog = p => ({ ...p, ...(PARTEIEN_DE.find(k => k.id === p.id) ?? { echt: false }) });

// Der aktuell gueltige Inhalt. "export let" ist eine Live-Bindung: Ansichten sehen nach loadContent() den neuen Stand.
export let C = EINGEBAUT;
const CACHE_KEY = 'inhalt-v4';
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
      q('positionen', 'frage_id,partei_id,haltung,zusammenfassung,quelle_text,quelle_seite,quelle_url,auszug,aenderung,erstellt_von,geprueft'),
      q('wahlen', 'id,name,datum,parlament'), q('argumente', 'id,frage_id,richtung,text,quelle_text,quelle_url,erstellt_von'),
      q('abstimmungen', 'id,parlament,datum,titel,quelle_text,quelle_url'), q('stimmverhalten', 'abstimmung_id,partei_id,stimme,rolle'),
      q('abstimmung_frage', 'abstimmung_id,frage_id'),
    ]);
    // Leer oder noch die alten erfundenen Parteien A bis F: dann gilt der eingebaute Stand.
    if (!pa.length || pa.some(p => p.ist_demo)) return false;
    const next = {
      ist_demo: false, stand: new Date().toISOString().slice(0, 10),
      ki: po.some(p => p.erstellt_von === 'agent') || ar.some(a => a.erstellt_von === 'agent'),
      ungeprueft: po.some(p => p.geprueft !== 'mensch'),
      maschinell: po.every(p => p.geprueft !== 'nein'),
      wahlen: wa, parteien: pa.map(p => mitKatalog({ id: p.id, kuerzel: p.kuerzel, name: p.anzeigename })),
      // Aktuelle Aussagen von Politikerinnen und Politikern gibt es noch nicht (offene Teamentscheidung).
      aussagen: [],
      themen: th.map(t => ({ id: t.id, titel: t.titel, kurz: t.kurzfassung, sort: t.sortierung })),
      fragen: fr.map(f => ({ id: f.id, thema: f.thema_id, frage: f.frage, kurz: f.kurz || f.frage, sort: f.sortierung })),
      programme: pr.map(p => ({ partei: p.partei_id, wahl: p.wahl_id, titel: p.titel, url: p.quelle_url, seiten: p.seiten })),
      positionen: po.map(p => ({ frage: p.frage_id, partei: p.partei_id, haltung: p.haltung, text: p.zusammenfassung || '', seite: p.quelle_seite,
        auszug: p.auszug, aenderung: p.aenderung, quelle: p.quelle_text, url: p.quelle_url ?? null, agent: p.erstellt_von === 'agent' })),
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

// Parteien mit Inhalten (C.parteien) und das Verzeichnis weiterer Parteien (katalog.js, noch ohne Positionen).
export const partei = id => C.parteien.find(p => p.id === id) || PARTEIEN_DE.find(p => p.id === id) || null;
export const hatInhalt = id => C.parteien.some(p => p.id === id);
export const ohneInhalt = () => PARTEIEN_DE.filter(p => !hatInhalt(p.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
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
// Wie Menschen Parteien im Alltag nennen. "Union" meint CDU und CSU zugleich (gemeinsames Programm).
const ANDERE_NAMEN = { 'GRÜNE': ['Grünen', 'Bündnis 90'], 'Die Linke': ['Linke', 'Linken'], CDU: ['Union'], CSU: ['Union'],
  'FREIE WÄHLER': ['Freie Wähler', 'Freien Wähler'], AfD: ['Alternative für Deutschland'] };
export function suche(text) {
  let rest = norm(text);
  const namen = p => [p.name, p.kuerzel?.length >= 2 ? p.kuerzel : null, ...(ANDERE_NAMEN[p.kuerzel] ?? [])].filter(Boolean).map(norm);
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
export const istWertend = text => /(am besten|am meisten|\bbeste|\bbesser|\bschlecht)/i.test(String(text));
export function frageSuche(text) {
  const tokens = norm(text).split(/[^\p{L}\p{N}]+/u).filter(w => w.length >= 3 && !FRAGEWOERTER.has(w));
  if (!tokens.length) return null;
  const staemme = tokens.map(w => [w, ...Object.entries(BEGRIFFE).filter(([k]) => w.startsWith(k)).flatMap(([, v]) => v)]);
  const fragen = C.fragen.map(f => {
    const heu = norm([thema(f.thema)?.titel, f.frage, f.kurz, ...C.positionen.filter(p => p.frage === f.id).flatMap(p => [p.text, p.auszug, p.aenderung]),
      ...argumenteZuFrage(f.id).map(a => a.text)].join(' '));
    const woerter = heu.split(/[^\p{L}\p{N}]+/u);
    return { f, treffer: staemme.filter(st => st.some(s => woerter.some(w => w.startsWith(s)))).length };
  }).filter(x => x.treffer).sort((a, b) => b.treffer - a.treffer || nachSort(a.f, b.f));
  return { fragen: fragen.map(x => x.f), wertend: istWertend(text) };
}
