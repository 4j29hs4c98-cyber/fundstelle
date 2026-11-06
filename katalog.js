// katalog.js — Verzeichnis echter Parteien und Wahltermine in Deutschland. Reine Tatsachen, keine Positionen.
// Echten Parteien werden hier bewusst KEINE Aussagen zugeordnet; das passiert erst, wenn echte Programme
// ausgewertet und geprueft sind. Farben sind Erkennungszeichen, keine Wertung.
// Logos: Feld "logo" (Pfad unter icons/parteien/) bleibt leer, bis offizielle Logos mit Erlaubnis abgelegt sind.
// Recherche vom 06.11.2026. Farbwerte aus der Farbtabelle der Wikipedia, nicht aus den Gestaltungsrichtlinien
// der Parteien; unsicher sind die Linke, die Tierschutzpartei und alle Zweitfarben.

const CDU_CSU_2025 = 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf';
// [id, Kurzname, voller Name, Farbe, Zweitfarbe, Website, Programm zur Bundestagswahl 2025 (oder null)]
const P = [
  ['de-cdu', 'CDU', 'Christlich Demokratische Union Deutschlands', '#51B8C2', '#151518', 'https://www.cdu.de', CDU_CSU_2025],
  ['de-csu', 'CSU', 'Christlich-Soziale Union in Bayern', '#008AC5', null, 'https://www.csu.de', CDU_CSU_2025],
  ['de-spd', 'SPD', 'Sozialdemokratische Partei Deutschlands', '#E3000F', null, 'https://www.spd.de',
    'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf'],
  ['de-gruene', 'GRÜNE', 'Bündnis 90/Die Grünen', '#409A3C', '#FFF17A', 'https://www.gruene.de',
    'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf'],
  ['de-fdp', 'FDP', 'Freie Demokratische Partei', '#FFED00', '#E5007D', 'https://www.fdp.de',
    'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf'],
  ['de-afd', 'AfD', 'Alternative für Deutschland', '#00A2DE', null, 'https://www.afd.de',
    'https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_web.pdf'],
  ['de-linke', 'Die Linke', 'Die Linke', '#BE3075', null, 'https://www.die-linke.de',
    'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf'],
  // Seit 01.10.2026 "Buendnis Soziale Gerechtigkeit und Wirtschaftliche Vernunft", Kurzname bleibt BSW.
  ['de-bsw', 'BSW', 'Bündnis Soziale Gerechtigkeit und Wirtschaftliche Vernunft', '#792351', null, 'https://bsw-vg.de',
    'https://bsw-vg.de/wp-content/themes/bsw/assets/downloads/BSW%20Wahlprogramm%202025.pdf'],
  ['de-fw', 'FREIE WÄHLER', 'Freie Wähler', '#F7A800', null, 'https://www.freiewaehler.eu',
    'https://ni.freiewaehler.eu/template/elemente/71/Verantwortung%20f%C3%BCr%20Deutschland_FREIE%20W%C3%84HLER%20Wahlprogramm%202025.pdf'],
  ['de-volt', 'Volt', 'Volt Deutschland', '#502379', null, 'https://voltdeutschland.org',
    'https://voltdeutschland.org/storage/assets-bonn/pdf/programm-leichte-sprache-volt-bundestags-wahl-2025.pdf'],
  ['de-ssw', 'SSW', 'Südschleswigscher Wählerverband', '#003C8F', null, 'https://www.ssw.de',
    'https://ssw.de/fileadmin/user_upload/daten/aktuelles/2025/BTW25/SSW-Wahlprogramm_BTW_2025.pdf'],
  ['de-oedp', 'ÖDP', 'Ökologisch-Demokratische Partei', '#FF6400', null, 'https://www.oedp.de', null],
  ['de-tierschutz', 'Tierschutzpartei', 'Partei Mensch Umwelt Tierschutz', '#00545F', null, 'https://www.tierschutzpartei.de', null],
  ['de-partei', 'Die PARTEI', 'Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative', '#B5152B', null,
    'https://www.die-partei.de', null],
];
export const PARTEIEN_DE = P.map(([id, kuerzel, voll, farbe, farbe2, web, programm]) =>
  ({ id, kuerzel, name: kuerzel, voll, farbe, farbe2, web, programm, logo: null, echt: true }));

export const WAHLARTEN = [
  { id: 'bund', name: 'Federal election' }, { id: 'europa', name: 'European election' },
  { id: 'land', name: 'State election' }, { id: 'kommunal', name: 'Local election' },
];

export const BUNDESLAENDER = [
  ['BW', 'Baden-Württemberg'], ['BY', 'Bayern'], ['BE', 'Berlin'], ['BB', 'Brandenburg'], ['HB', 'Bremen'], ['HH', 'Hamburg'],
  ['HE', 'Hessen'], ['MV', 'Mecklenburg-Vorpommern'], ['NI', 'Niedersachsen'], ['NW', 'Nordrhein-Westfalen'], ['RP', 'Rheinland-Pfalz'],
  ['SL', 'Saarland'], ['SN', 'Sachsen'], ['ST', 'Sachsen-Anhalt'], ['SH', 'Schleswig-Holstein'], ['TH', 'Thüringen'],
].map(([id, name]) => ({ id, name }));

// Wahlen bis Ende 2029. datum nur, wenn amtlich festgelegt; sonst zeitraum und ein geschaetztes sort-Datum fuer die
// Reihenfolge (nie anzeigen). Buergermeister- und Landratswahlen fehlen bewusst, sie liegen verstreut.
const WL = 'https://www.wahlrecht.de/termine.htm', BWL = 'https://bundeswahlleiterin.de/service/wahltermine.html';
// [art, Land, Name, Datum, Zeitraum, sort, Quelle]
const W = [
  ['land', 'SH', 'Landtagswahl Schleswig-Holstein', '2027-04-18', null, null,
    'https://www.schleswig-holstein.de/DE/landesregierung/themen/demokratie-gesellschaft/wahlen/Termine'],
  ['land', 'SL', 'Landtagswahl Saarland', '2027-04-18', null, null, WL],
  ['land', 'NW', 'Landtagswahl Nordrhein-Westfalen', '2027-04-25', null, null, BWL],
  ['land', 'HB', 'Bürgerschaftswahl Bremen', '2027-05-30', null, null, WL],
  ['kommunal', 'HB', 'Stadtverordnetenversammlung Bremerhaven und Beiräte', '2027-05-30', null, null, WL],
  ['land', 'NI', 'Landtagswahl Niedersachsen', '2027-09-26', null, null, WL],
  ['kommunal', 'SH', 'Kommunalwahl Schleswig-Holstein', null, 'voraussichtlich Mai 2028', '2028-05-07', BWL],
  ['land', 'BY', 'Landtagswahl Bayern', null, 'voraussichtlich Herbst 2028', '2028-10-01', WL],
  ['land', 'HE', 'Landtagswahl Hessen', null, 'voraussichtlich Herbst 2028', '2028-10-15', WL],
  ['bund', null, 'Bundestagswahl', null, 'voraussichtlich Januar bis März 2029', '2029-02-25', BWL],
  ['kommunal', 'BW', 'Kommunalwahlen Baden-Württemberg', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'BB', 'Kommunalwahlen Brandenburg', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'HH', 'Bezirksversammlungswahlen Hamburg', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', WL],
  ['kommunal', 'MV', 'Kommunalwahlen Mecklenburg-Vorpommern', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'RP', 'Kommunalwahlen Rheinland-Pfalz', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'SL', 'Kommunalwahlen Saarland', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'SN', 'Kommunalwahlen Sachsen', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'ST', 'Kommunalwahlen Sachsen-Anhalt', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['kommunal', 'TH', 'Kommunalwahlen Thüringen', null, 'voraussichtlich Frühjahr 2029', '2029-05-20', BWL],
  ['europa', null, 'Europawahl', null, 'voraussichtlich Mai/Juni 2029', '2029-06-01', BWL],
  ['land', 'SN', 'Landtagswahl Sachsen', null, 'voraussichtlich Herbst 2029', '2029-09-15', BWL],
  ['land', 'BB', 'Landtagswahl Brandenburg', null, 'voraussichtlich Herbst 2029', '2029-09-15', BWL],
  ['land', 'TH', 'Landtagswahl Thüringen', null, 'voraussichtlich Herbst 2029', '2029-09-15', BWL],
];
export const WAHLEN = W.map(([art, land, name, datum, zeitraum, sort, quelle], i) =>
  ({ id: `w${i + 1}`, art, land, name, datum, zeitraum, sort: datum || sort, quelle }));
