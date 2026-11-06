// content.js — redaktioneller Inhalt: Parteien, Themen, Fragen, Positionen, Aussagen.
//
// WICHTIG, Unterschied zu core.js: Das hier ist fuer alle Nutzer gleich und nur lesbar.
// Es gehoert NICHT in die Records des Nutzers. Die Records (core.js) halten nur, was dem
// einzelnen Nutzer gehoert, etwa gemerkte Themen und Einstellungen.
//
// Spaeter kommen diese Daten aus den Supabase-Tabellen parteien, themen, programme, fragen,
// positionen und aussagen. Bis dahin stehen sie hier, damit die App offline vollstaendig laeuft.
//
// DEMO: Die Parteien heissen A bis F und alle Positionen sind erfunden. So wird keine erfundene
// Aussage je einer echten Partei zugeschrieben. Inhalte sind deutsch, die Bedienung zweisprachig.

export const IS_DEMO = true;

export const PARTEIEN = ['A', 'B', 'C', 'D', 'E', 'F'];

export const THEMEN = [
  { id: 'wohnen', titel: 'Wohnen und Mieten', kurz: 'Die Mietpreisbremse läuft aus. Sechs Programme sagen dazu etwas, vier davon ausführlich.', geprueft: '2026-10-02' },
  { id: 'klima', titel: 'Klima und Energie', kurz: 'Beim CO2-Preis gehen die Programme am weitesten auseinander. Drei nennen konkrete Zahlen.', geprueft: '2026-09-29' },
  { id: 'rente', titel: 'Rente und Alterssicherung', kurz: 'Vier Programme äußern sich zum Renteneintrittsalter, zwei lassen die Frage offen.', geprueft: '2026-09-27' },
];

// haltung: bewusst wertfreie Bezeichner. Die Oberflaeche faerbt sie nicht ein.
export const FRAGEN = [
  { id: 'mietpreisbremse', thema: 'wohnen', kurz: 'Mietpreisbremse',
    frage: 'Soll die Mietpreisbremse über 2029 hinaus verlängert werden?', positionen: [
    ['A', 'dafuer', 'Will die Regelung unbefristet fortführen und auf weitere Landkreise ausweiten.', 'Beispielprogramm 2026, S. 34'],
    ['B', 'teilweise', 'Befürwortet eine Verlängerung um fünf Jahre, gekoppelt an eine Prüfung der Wirkung.', 'Beispielprogramm 2026, S. 12'],
    ['C', 'dagegen', 'Hält die Regelung für wirkungslos und setzt stattdessen auf schnelleren Neubau.', 'Beispielprogramm 2026, S. 51'],
    ['D', 'dafuer', 'Verlängerung ja, zusätzlich eine Obergrenze bei Neuvermietung.', 'Beispielprogramm 2026, S. 8'],
    ['E', 'keine_angabe', 'Das Programm äußert sich nicht zur Mietpreisbremse.', 'Keine Fundstelle im Programm 2026'],
    ['F', 'teilweise', 'Nur in Gebieten mit nachgewiesener Wohnungsnot, sonst auslaufen lassen.', 'Beispielprogramm 2026, S. 27'],
  ] },
  { id: 'co2preis', thema: 'klima', kurz: 'CO2-Preis',
    frage: 'Soll der CO2-Preis schneller steigen als bisher geplant?', positionen: [
    ['A', 'teilweise', 'Schnellerer Anstieg, aber nur mit vollständiger Rückzahlung an die Haushalte.', 'Beispielprogramm 2026, S. 41'],
    ['B', 'dafuer', 'Nennt einen festen Zielwert je Tonne bis 2030.', 'Beispielprogramm 2026, S. 19'],
    ['C', 'dagegen', 'Lehnt eine Beschleunigung ab und verweist auf die Belastung der Industrie.', 'Beispielprogramm 2026, S. 63'],
    ['D', 'dafuer', 'Schnellerer Anstieg, verbunden mit einem Ausgleich für Pendler.', 'Beispielprogramm 2026, S. 15'],
    ['E', 'dagegen', 'Will den Preis einfrieren, bis ein europäischer Rahmen steht.', 'Beispielprogramm 2026, S. 22'],
    ['F', 'keine_angabe', 'Das Programm nennt kein Tempo und keine Zahl.', 'Keine Fundstelle im Programm 2026'],
  ] },
  { id: 'renteneintritt', thema: 'rente', kurz: 'Renteneintritt',
    frage: 'Soll das Renteneintrittsalter nach 2031 weiter steigen?', positionen: [
    ['A', 'dagegen', 'Schließt eine weitere Anhebung aus und will stattdessen die Beitragsbasis verbreitern.', 'Beispielprogramm 2026, S. 55'],
    ['B', 'teilweise', 'Kopplung an die Lebenserwartung, mit Ausnahmen für körperlich schwere Berufe.', 'Beispielprogramm 2026, S. 31'],
    ['C', 'dafuer', 'Hält eine schrittweise Anhebung für unvermeidlich und nennt einen Zeitplan.', 'Beispielprogramm 2026, S. 48'],
    ['D', 'keine_angabe', 'Das Programm legt sich nicht fest.', 'Keine Fundstelle im Programm 2026'],
    ['E', 'dagegen', 'Will das Eintrittsalter senken und die Finanzierung über Steuern lösen.', 'Beispielprogramm 2026, S. 9'],
    ['F', 'keine_angabe', 'Nennt das Thema, ohne eine Position zu beziehen.', 'Beispielprogramm 2026, S. 60'],
  ] },
];

export const PROGRAMME = [
  { partei: 'A', seiten: 152, themen: 12, original: '6 Std 20 Min', app: '11 Min' },
  { partei: 'B', seiten: 98, themen: 9, original: '4 Std 05 Min', app: '8 Min' },
  { partei: 'C', seiten: 211, themen: 14, original: '8 Std 45 Min', app: '14 Min' },
  { partei: 'D', seiten: 74, themen: 8, original: '3 Std 05 Min', app: '7 Min' },
  { partei: 'E', seiten: 133, themen: 11, original: '5 Std 30 Min', app: '10 Min' },
  { partei: 'F', seiten: 187, themen: 13, original: '7 Std 45 Min', app: '13 Min' },
];

export const AUSSAGE = {
  davor: 'Mir ist klar, dass wir ohne Zusagen an die Kommunen nicht weiterkommen, und deshalb sage ich offen:',
  ausschnitt: '„Wir können das Versprechen so nicht halten."',
  danach: 'Wir halten es anders. Statt der Pauschale kommt die Förderung ab Januar direkt bei den Städten an, und zwar im vollen Umfang.',
  quelle: 'Beispiel-Rede, fiktives Protokoll, Zeile 212 bis 218',
  datum: '2026-09-14',
  dauerGesamt: 41,
  dauerAusschnitt: 7,
};

export const WAHL_IN_TAGEN = 54;

export const frage = id => FRAGEN.find(f => f.id === id) || FRAGEN[0];
export const thema = id => THEMEN.find(t => t.id === id) || null;
export const frageZuThema = themaId => FRAGEN.find(f => f.thema === themaId) || null;
