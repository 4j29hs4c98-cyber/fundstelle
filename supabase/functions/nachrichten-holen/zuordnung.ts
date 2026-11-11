// zuordnung.ts — prueft die KI-Zuordnung einer Schlagzeile. Eine Partei oder Person zaehlt nur, wenn ihr Name als ganzes
// Wort in Titel oder Anreisser steht. So kann die KI keiner Partei und keiner Person eine Meldung anhaengen, in der sie
// gar nicht vorkommt. Aliasse wie in thema-recherche/taten.ts (dort fuer Zitate auf Webseiten).
import type { Meldung } from './rss.ts';

export type Partei = { id: string; name: string };

// Fuer jede Partei die gaengigen Namen in Schlagzeilen, damit keine Partei schlechter erkannt wird als eine andere.
const ALIAS: Record<string, string[]> = {
  'CDU': ['Union', 'Christdemokraten'], 'CSU': ['Union', 'Christsoziale'], 'SPD': ['Sozialdemokraten'], 'FDP': ['Liberale', 'Liberalen'],
  'GRÜNE': ['Grüne', 'Grünen'], 'Die Linke': ['Linke', 'Linken'], 'BSW': ['Bündnis Sahra Wagenknecht'],
  'FREIE WÄHLER': ['Freie Wähler', 'Freien Wähler'],
};
const MAX_PERSONEN = 4;
const PERSON_OK = /^[\p{L}][\p{L} .'-]{2,60}$/u;

// Gross- und Kleinschreibung bleibt erhalten: "Linke" (Partei) ist nicht "linke" (Adjektiv), "Klein" nicht "klein".
const norm = (s: string) => s.normalize('NFC').replace(/[\u00ad\u200b]/g, '').replace(/\s+/g, ' ');
const regexText = (t: string) => t.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const kommtVor = (name: string, text: string) => new RegExp(`(?<![\\p{L}\\p{N}])${regexText(norm(name))}(?![\\p{L}\\p{N}])`, 'u').test(text);
const nachname = (name: string) => name.trim().split(/\s+/).pop() ?? '';

export function pruefeZuordnung(m: Meldung, roh: { parteien?: unknown; personen?: unknown } | undefined, alle: Partei[]) {
  // "Europäische Union" ist nicht die Union aus CDU und CSU.
  const text = norm(`${m.titel} ${m.anreisser}`).replace(/Europäische[nrs]? Union/g, 'EU');
  const vorgeschlagen = {
    parteien: Array.isArray(roh?.parteien) ? roh!.parteien.filter((x): x is string => typeof x === 'string') : [],
    personen: Array.isArray(roh?.personen) ? roh!.personen.filter((x): x is string => typeof x === 'string') : [],
  };
  const parteien = [...new Set(vorgeschlagen.parteien
    .map(n => alle.find(p => p.name === n.trim()))
    .filter((p): p is Partei => !!p && [p.name, ...(ALIAS[p.name] ?? [])].some(n => kommtVor(n, text)))
    .map(p => p.id))];
  const personen = [...new Set(vorgeschlagen.personen.map(n => n.replace(/\s+/g, ' ').trim())
    .filter(n => PERSON_OK.test(n) && n.includes(' ') && kommtVor(nachname(n), text)))].slice(0, MAX_PERSONEN);
  const verworfen = (vorgeschlagen.parteien.length - parteien.length) + (vorgeschlagen.personen.length - personen.length);
  return { parteien, personen, verworfen: Math.max(0, verworfen) };
}
