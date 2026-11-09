// inhalt-2025.js — eingebauter Inhalt: echte Parteien mit woertlichen Zitaten aus ihren Programmen zur
// Bundestagswahl 2025 (die neuesten Bundesprogramme), dazu eine echte Abstimmung und belegte Argumente.
//
// Herkunft: von einem KI-Agenten am 09.11.2026 aus den Original-PDFs zusammengestellt, vom Team NOCH NICHT
// geprueft. Deshalb ki: true und ungeprueft: true; die App zeigt das auf jeder Inhaltsseite.
// Regeln: Jeder Auszug ist woertlich (nur Silbentrennung entfernt). "seite" ist die PDF-Seite, damit der Link
// das Original auf der richtigen Seite oeffnet; weicht die gedruckte Seitenzahl ab, steht sie in "quelle".
// Gibt ein Programm zu einer Frage nichts her, lautet die Haltung keine_angabe; ein Auszug ist dann hoechstens
// die naechstgelegene Stelle und die Zusammenfassung sagt das ausdruecklich.
// scripts/inhalt-sql.mjs erzeugt aus diesen Daten supabase/migrations/004_echte_parteien.sql.

import { PARTEIEN_DE } from './katalog.js';

const id = k => PARTEIEN_DE.find(p => p.kuerzel === k).id;
const P = { CDU: id('CDU'), CSU: id('CSU'), SPD: id('SPD'), GRUENE: id('GRÜNE'), FDP: id('FDP'), AFD: id('AfD'),
  LINKE: id('Die Linke'), BSW: id('BSW'), FW: id('FREIE WÄHLER'), SSW: id('SSW') };
export const T = { wohnen: '3a18c189-c9a4-49dc-8ad9-7e49ac440fe4', klima: '2a2cf39a-2cac-490e-bc3f-6557b9efb890', rente: 'd864065a-5d5c-4ad4-8149-645b4a1602eb' };
const F = { miete: 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8', co2: '584471ef-30b5-4334-a3d7-e51f20d929aa', rente: '95c54175-3b25-4055-a704-52ebec90696f' };
const BTW = '0544b90d-2bbf-4a4c-aa15-3ac785928ef7';

// [Partei, Titel, URL, gedruckte Seite = PDF-Seite minus ...]
const PROGRAMME = [
  ['CDU', 'Politikwechsel für Deutschland. Wahlprogramm von CDU und CSU', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf', 2],
  ['CSU', 'Politikwechsel für Deutschland. Wahlprogramm von CDU und CSU', 'https://www.cdu.de/app/uploads/2025/01/km_btw_2025_wahlprogramm_langfassung_ansicht.pdf', 2],
  ['SPD', 'Mehr für Dich. Besser für Deutschland. Regierungsprogramm der SPD für die Bundestagswahl 2025', 'https://www.spd.de/fileadmin/Dokumente/Beschluesse/Programm/2025_SPD_Regierungsprogramm.pdf', 0],
  ['GRUENE', 'Zusammen wachsen. Regierungsprogramm 2025', 'https://cms.gruene.de/uploads/assets/20250318_Regierungsprogramm_DIGITAL_DINA5.pdf', 0],
  ['FDP', 'Alles lässt sich ändern. Das Programm der Freien Demokraten zur Bundestagswahl 2025 (Fassung vor der redaktionellen Schlussbearbeitung)', 'https://www.fdp.de/sites/default/files/2024-12/fdp-wahlprogramm_2025.pdf', 1],
  ['AFD', 'Zeit für Deutschland. Programm der Alternative für Deutschland für die Wahl zum 21. Deutschen Bundestag', 'https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_web.pdf', 1],
  ['LINKE', 'Alle wollen regieren. Wir wollen verändern. Wahlprogramm (Langfassung)', 'https://www.die-linke.de/fileadmin/user_upload/Wahlprogramm_Langfassung_Linke-BTW25_01.pdf', 0],
  ['BSW', 'Unser Land verdient mehr! Wahlprogramm für die Bundestagswahl 2025', 'https://bsw-vg.de/wp-content/themes/bsw/assets/downloads/BSW%20Wahlprogramm%202025.pdf', 0],
  ['FW', 'Verantwortung für Deutschland. Bundestagswahlprogramm 2025-2029', 'https://ni.freiewaehler.eu/template/elemente/71/Verantwortung%20f%C3%BCr%20Deutschland_FREIE%20W%C3%84HLER%20Wahlprogramm%202025.pdf', 2],
  ['SSW', 'Deine Stimme für den Norden. Wahlprogramm zur Bundestagswahl am 23. Februar 2025', 'https://ssw.de/fileadmin/user_upload/daten/aktuelles/2025/BTW25/SSW-Wahlprogramm_BTW_2025.pdf', 0],
];
const versatz = Object.fromEntries(PROGRAMME.map(([k, , , d]) => [k, d]));

// Die Union hat ein gemeinsames Programm: dieselbe Stelle gilt fuer CDU und CSU.
const UNION = ['CDU', 'CSU'];
// [Frage, Partei(en), Haltung, Zusammenfassung, PDF-Seite, woertlicher Auszug, was die Partei selbst als Aenderung ankuendigt]
const POS = [
  [F.miete, UNION, 'keine_angabe', 'Keine Fundstelle zur Mietpreisbremse. Das Programm bekennt sich allgemein zu Regeln zur Miethöhe als Teil des Mieterschutzes (nächstgelegene Stelle).', 73,
    'Deutschland ist Mieterland. Wir stehen für einen wirksamen und angemessenen Mieterschutz – dazu gehören auch die Regeln zur Miethöhe.', null],
  [F.miete, 'SPD', 'dafuer', 'Will die Mietpreisbremse unbefristet gelten lassen und auf Wohnungen ausweiten, die bis 2019 bezogen wurden.', 20,
    'Die Mietpreisbremse soll unbefristet und auch für Immobilien, die bis 2019 bezogen wurden, gelten, um langfristig für stabile und bezahlbare Mieten in angespannten Wohnungsmärkten zu sorgen. Wir werden dafür sorgen, dass die Mietpreisbremse nicht durch zum Beispiel (teil-)möblierte und befristete Wohnungsangebote umgangen werden kann.',
    'Mietpreisbremse entfristen, auf Wohnungen mit Erstbezug bis 2019 ausweiten und Umgehung über möblierte oder befristete Vermietung unterbinden.'],
  [F.miete, 'GRUENE', 'dafuer', 'Wollen die Mietpreisbremse verlängern und durch den Wegfall von Ausnahmen verschärfen.', 69,
    'Wir werden die Mietpreisbremse verlängern und sie durch die Abschaffung von Ausnahmen verschärfen. Wir wollen die Mietpreisbremse außerdem bereits auf Wohnungen anwenden, die älter als fünf Jahre sind.',
    'Ausnahmen streichen und die Bremse auf Wohnungen anwenden, die älter als fünf Jahre sind.'],
  [F.miete, 'FDP', 'dagegen', 'Hält die Mietpreisbremse für ein Investitionshemmnis und will sie auslaufen lassen.', 44,
    'Die Mietpreisbremse ist nachweislich eine Investitionsbremse. Deshalb lassen wir sie auslaufen.', 'Mietpreisbremse auslaufen lassen.'],
  [F.miete, 'AFD', 'dagegen', 'Lehnt die Mietpreisbremse als staatliche Überregulierung und Investitionshemmnis ab.', 39,
    'Die AfD steht für ein ausgewogenes Mietrecht und lehnt staatliche Überregulierungen sowie Investitionshemmnisse wie die Mietpreisbremse oder den Mietendeckel ab.', null],
  [F.miete, 'LINKE', 'teilweise', 'Hält die Mietpreisbremse für zu schwach, kritisiert, dass sie nicht verlängert und verschärft wurde, und fordert stattdessen einen strengeren bundesweiten Mietendeckel.', 8,
    'Die Ampel hat es nicht einmal geschafft, die Mietpreisbremse zu verlängern, geschweige denn sie zu verschärfen.',
    'Bundesweiter Mietendeckel und als Sofortmaßnahme Ausschluss von Mieterhöhungen für sechs Jahre.'],
  [F.miete, 'BSW', 'dagegen', 'Will die Mietpreisbremse durch eine strengere Regel ersetzen, einen bundesweiten Mietendeckel. Das „dagegen“ heißt hier: mehr Regulierung, nicht weniger.', 28,
    'Wir fordern einen bundesweiten Mietendeckel statt einer wirkungslosen Mietpreisbremse.',
    'Mietendeckel statt Mietpreisbremse; Mieten in überteuerten Regionen bis Ende des Jahrzehnts einfrieren.'],
  [F.miete, 'FW', 'keine_angabe', 'Keine Fundstelle zur Mietpreisbremse. Das Programm lehnt nur einen Mietendeckel ab und setzt auf Wohnungsbau (nächstgelegene Stelle).', 85,
    'Statt für einen investitionsfeindlichen Mietendeckel stehen wir für zweckgebundene Bürgeranleihen nach Münchener Vorbild.', null],
  [F.miete, 'SSW', 'keine_angabe', 'Keine Fundstelle: Das Programm nennt die Mietpreisbremse nicht.', null, null, null],

  [F.co2, UNION, 'teilweise', 'Will die CO2-Bepreisung zum Leitinstrument ausbauen und die Einnahmen zurückgeben, nennt aber keinen schnelleren Preispfad.', 24,
    'Die CO2-Bepreisung bauen wir im Instrumentenmix zum Leitinstrument aus und geben deren Einnahmen an Verbraucher und Wirtschaft zurück.',
    'Klimabonus einführen; mit den CO2-Einnahmen zuerst Stromsteuer und Netzentgelte senken.'],
  [F.co2, 'SPD', 'teilweise', 'Hält am beschlossenen Preispfad fest und will ab 2027 eine Überforderung verhindern, etwa mit einem Klimageld.', 33,
    'Der bereits gesetzlich beschlossene CO2-Preis pro Tonne von 55 Euro in 2025 und maximal 65 Euro in 2026 gilt. Wenn ab 2027 die europäische Regelung in Kraft tritt, werden wir durch geeignete Maßnahmen auf europäischer und nationaler Ebene (zum Beispiel Klimageld) dafür Sorge tragen, dass niemand überfordert wird.',
    'Entlastung etwa durch ein Klimageld ab 2027.'],
  [F.co2, 'GRUENE', 'teilweise', 'Wollen den europäischen Emissionshandel wie geplant umsetzen und die Einnahmen als Klimageld auszahlen, fordern aber keinen schnelleren Anstieg.', 38,
    'Dazu gehört die Umsetzung der Emissionshandelssysteme auf europäischer Ebene wie geplant. So stärken wir den CO₂-Preis als einen zentralen Hebel für mehr Klimaschutz in Deutschland und Europa.',
    'Sozial gestaffeltes Klimageld, das mit den Einnahmen steigt (S. 40).'],
  [F.co2, 'FDP', 'teilweise', 'Will den EU-Emissionshandel mit marktgebildetem Preis und eine Klimadividende pro Kopf, nennt aber keinen beschleunigten Pfad.', 40,
    'Wir Freie Demokraten wollen eine Klimadividende einführen, um Einnahmen aus dem Emissionshandel direkt und pauschal pro Kopf an die Bürgerinnen und Bürger zurückzuzahlen.',
    'Klimadividende pro Kopf; Klimaneutralitätsziel von 2045 auf 2050 verschieben.'],
  [F.co2, 'AFD', 'dagegen', 'Will alle CO2-Abgaben ersatzlos abschaffen.', 58, 'Wir fordern eine ersatzlose Abschaffung der CO₂-Abgaben.', 'CO2-Abgaben abschaffen.'],
  [F.co2, 'LINKE', 'dagegen', 'Lehnt den Emissionshandel für Wärme und Verkehr ab und will dort feste Emissionsgrenzen statt eines CO2-Preises.', 33,
    'Wir lehnen den Emissionshandel in den Sektoren Wärme und Verkehr (ETS-2) ab: Stattdessen müssen verbindliche Klimaziele und Emissionsgrenzen gesetzt werden.',
    'Soziales Klimageld von 320 Euro pro Person und Jahr (S. 7).'],
  [F.co2, 'BSW', 'dagegen', 'Will den CO2-Preis abschaffen.', 10,
    'Den CO2-Preis, der alles teurer macht, ohne dass es für die meisten Menschen Alternativen gibt, wollen wir abschaffen.',
    'CO2-Preis abschaffen; EU-Emissionshandel globalisieren oder abschaffen (S. 11).'],
  [F.co2, 'FW', 'keine_angabe', 'Keine Fundstelle zum allgemeinen CO2-Preis. Nur für die Luftfahrt befürwortet das Programm eine langfristig festgeschriebene Bepreisung (nächstgelegene Stelle).', 39,
    'Verlässliche politische Rahmenbedingungen, die eine Bepreisung der CO2 -Äquivalente über einen Zertifikate-Handel langfristig festschreiben, schaffen die Voraussetzung dafür, dass die Branche in die Entwicklung und den Umstieg investiert.', null],
  [F.co2, 'SSW', 'teilweise', 'Will den steigenden CO2-Preis mit einem Pro-Kopf-Klimageld sozialverträglich machen.', 23,
    'Wir wollen ein Pro-Kopf-Klimageld, das private Haushalte entlastet, umweltbewusstes Verhalten belohnt und die steigende CO2-Steuer so sozialverträglich ausgestalten.',
    'Pro-Kopf-Klimageld nach österreichischem Vorbild.'],

  [F.rente, UNION, 'dagegen', 'Hält an der geltenden Regelung fest, also an der Rente mit 67 ab 2031, ohne weitere Anhebung.', 34,
    'An der bestehenden gesetzlichen Regelung zum Renteneintrittsalter halten wir fest. Die Regelung für besonders langjährige Versicherte mit 45 Versicherungsjahren behalten wir mit Blick auf die Planungssicherheit für Unternehmen und rentennahe Jahrgänge bei.',
    'Aktivrente für freiwilliges Weiterarbeiten (S. 33).'],
  [F.rente, 'SPD', 'dagegen', 'Lehnt eine Anhebung der Regelaltersgrenze ab.', 25,
    'Das haben sich gerade Menschen verdient, die früh begonnen haben zu arbeiten. Eine Anhebung der Regelaltersgrenze lehnen wir ab.', null],
  [F.rente, 'GRUENE', 'dagegen', 'Halten an der Rente mit 67 fest und wollen freiwilliges längeres Arbeiten erleichtern.', 98,
    'Wir halten an der Rente mit 67 fest. Aber wir schaffen Anreize und machen es den Menschen leichter, länger zu arbeiten, wenn sie dies wollen, auch über die Regelaltersgrenze hinaus.', null],
  [F.rente, 'FDP', 'teilweise', 'Will keine feste Anhebung, sondern einen frei wählbaren Renteneintritt nach schwedischem Vorbild.', 21,
    'Wir Freie Demokraten stehen für einen wirklich flexiblen Renteneintritt. Die Menschen sollen nach schwedischem Vorbild künftig selbst entscheiden, wann der Ruhestand beginnt, sofern dann keine Sozialleistungen beantragt werden müssen.',
    'Flexibler Renteneintritt nach schwedischem Vorbild.'],
  [F.rente, 'AFD', 'keine_angabe', 'Keine Fundstelle zur Regelaltersgrenze. Das Programm fordert einen flexiblen Renteneintritt und Anreize für freiwilliges längeres Arbeiten (nächstgelegene Stelle).', 19,
    'Wir wollen der Rentenversicherung mehr Beitragszahler zuführen, die Verrentung flexibler und gerechter gestalten und Anreize für eine freiwillige Verlängerung der Lebensarbeitszeit setzen, indem wir:',
    'Flexibles Renteneintrittsalter, abschlagsfrei nach 45 beitragsberechtigten Arbeitsjahren.'],
  [F.rente, 'LINKE', 'dagegen', 'Will die Regelaltersgrenze auf 65 Jahre senken.', 15,
    'Die Rente erst ab 67 bedeutet Rentenkürzungen für alle, insbesondere in Berufen, in denen Erwerbstätige nicht so lange durchhalten können. Wir fordern eine Regelaltersgrenze von 65 Jahren.',
    'Regelaltersgrenze 65; nach 40 Beitragsjahren abschlagsfrei ab 60.'],
  [F.rente, 'BSW', 'dagegen', 'Lehnt eine weitere Erhöhung des Renteneintrittsalters ab.', 23,
    'Forderungen, das Renteneintrittsalter weiter zu erhöhen, erteilen wir eine klare Absage.', null],
  [F.rente, 'FW', 'dagegen', 'Lehnt eine Erhöhung des Rentenalters ab.', 69, 'Wir sprechen uns klar gegen eine Erhöhung des Rentenalters aus.',
    'Volle Rente abschlagsfrei nach 45 Beitragsjahren; Rentenniveau nicht unter 48 Prozent.'],
  [F.rente, 'SSW', 'dagegen', 'Will keine Erhöhung des Renteneintrittsalters.', 8, 'Wir wollen keine Erhöhung des Renteneintrittsalters.', null],
];

// Seitenangaben in "aenderung" wie "(S. 40)" sind ebenfalls PDF-Seiten.
function quelle(k, pdf) {
  const name = UNION.includes(k) ? 'Gemeinsames Wahlprogramm von CDU und CSU 2025' : 'Wahlprogramm 2025';
  if (!pdf) return `Keine Fundstelle im ${name}`;
  const d = versatz[k];
  return d ? `${name}, gedruckte Seite ${pdf - d}` : name;
}

const WD = 'https://bundestag.de/resource/blob/651090/7f66ea9edc5dd92fbafb8197b783eeea/WD-7-086-19-pdf-data.pdf';
const BPB = 'https://www.bpb.de/kurz-knapp/taegliche-dosis-politik/542683/diskussion-um-erhoehung-des-renteneintrittsalters/';
const ARGUMENTE = [
  [F.miete, 'dafuer', 'Eine im Auftrag des Bundesjustizministeriums erstellte Studie des DIW kam zu dem Ergebnis, dass sich der Mietanstieg durch die Mietpreisbremse verlangsamt hat.',
    'Wissenschaftliche Dienste des Bundestages, WD 7 - 3000 - 086/19 (2019)', WD],
  [F.miete, 'dagegen', 'Der Wissenschaftliche Beirat beim Bundeswirtschaftsministerium bescheinigte der Mietpreisbremse mangelnde Wirksamkeit; Effekte für untere Einkommensschichten seien nicht nachweisbar.',
    'Wissenschaftliche Dienste des Bundestages, WD 7 - 3000 - 086/19 (2019)', WD],
  [F.co2, 'dafuer', 'Das Umweltbundesamt beziffert die gesellschaftlichen Klimakosten auf rund 350 Euro je Tonne CO2, also deutlich mehr als der derzeitige CO2-Preis.',
    'Umweltbundesamt, Gesellschaftliche Kosten von Umweltbelastungen', 'https://www.umweltbundesamt.de/daten/umwelt-wirtschaft/gesellschaftliche-kosten-von-umweltbelastungen'],
  [F.co2, 'dagegen', 'Haushalte mit niedrigem Einkommen geben einen größeren Teil ihres Einkommens für Energie und Mobilität aus und werden durch einen steigenden CO2-Preis relativ stärker belastet.',
    'DIW Wochenbericht 42/2024', 'https://www.diw.de/de/diw_01.c.917856.de/publikationen/wochenberichte/2024_42_1/.html'],
  [F.rente, 'dafuer', 'Weil die Lebenserwartung steigt und viele Babyboomer in Rente gehen, zahlen immer weniger Beschäftigte für immer mehr Rentner; eine Mehrheit des Sachverständigenrats empfiehlt deshalb, das Eintrittsalter an die Lebenserwartung zu koppeln.',
    'bpb, Diskussion um Erhöhung des Renteneintrittsalters (14.11.2023)', BPB],
  [F.rente, 'dagegen', 'In vielen Berufen kann aus gesundheitlichen Gründen nicht bis ins hohe Alter gearbeitet werden, und das tatsächliche Renteneintrittsalter liegt schon heute unter dem gesetzlichen.',
    'bpb, Diskussion um Erhöhung des Renteneintrittsalters (14.11.2023)', BPB],
];
const ARG_IDS = ['59458aad-fc36-406b-8f8e-ff2800db3865', 'd1c4e2a0-6b1f-4c39-9a57-1f0e8b3c2d41', 'e7a9b3c5-2d4f-4e61-8b70-3c1d5e9f0a12',
  'f2b6d8e0-4a1c-4f73-9e85-6d2c7a0b1e23', 'a8c1e3f5-7b2d-4c94-8f06-9e3a1b5c7d34', 'b3d5f7a9-1c3e-4da5-9b17-2f4b6c8e0a45'];

export const EINGEBAUT = {
  ist_demo: false, ki: true, ungeprueft: true, stand: '2026-11-09',
  wahlen: [{ id: BTW, name: 'Bundestagswahl 2025', datum: '2025-02-23', parlament: 'Deutscher Bundestag' }],
  parteien: PARTEIEN_DE.filter(p => Object.values(P).includes(p.id)),
  aussagen: [],
  themen: [
    { id: T.wohnen, titel: 'Wohnen und Mieten', kurz: 'Die Mietpreisbremse gilt bis Ende 2029. Was die Programme zur Bundestagswahl 2025 dazu sagen.', sort: 1 },
    { id: T.klima, titel: 'Klima und Energie', kurz: 'Kein Programm fordert ausdrücklich einen schnelleren Anstieg des CO2-Preises. Drei lehnen ihn ab.', sort: 2 },
    { id: T.rente, titel: 'Rente und Alterssicherung', kurz: 'Fast alle Programme lehnen eine weitere Anhebung des Rentenalters ab, eines will einen frei wählbaren Eintritt.', sort: 3 },
  ],
  fragen: [
    { id: F.miete, thema: T.wohnen, kurz: 'Mietpreisbremse', frage: 'Soll die Mietpreisbremse über 2029 hinaus verlängert werden?', sort: 1 },
    { id: F.co2, thema: T.klima, kurz: 'CO2-Preis', frage: 'Soll der CO2-Preis schneller steigen als bisher geplant?', sort: 1 },
    { id: F.rente, thema: T.rente, kurz: 'Renteneintritt', frage: 'Soll das Renteneintrittsalter nach 2031 weiter steigen?', sort: 1 },
  ],
  programme: PROGRAMME.map(([k, titel, url]) => ({ partei: P[k], wahl: BTW, titel, url, seiten: null })),
  positionen: POS.flatMap(([frage, wer, haltung, text, seite, auszug, aenderung]) => [wer].flat().map(k =>
    ({ frage, partei: P[k], haltung, text, seite, auszug, aenderung, quelle: quelle(k, seite), agent: true }))),
  argumente: ARGUMENTE.map(([frage, richtung, text, q, url], i) => ({ id: ARG_IDS[i], frage, richtung, text, quelle: q, url, agent: true })),
  abstimmungen: [
    { id: '7c9a2265-9404-4a78-a18b-8ba0e37e910b', parlament: 'Deutscher Bundestag', datum: '2025-06-26',
      titel: 'Verlängerung der Mietpreisbremse bis Ende 2029 (Drucksachen 21/322 und 21/631)',
      quelle: 'Deutscher Bundestag, Textarchiv', url: 'https://www.bundestag.de/dokumente/textarchiv/2025/kw26-de-mietpreisbremse-1084786', fragen: [F.miete],
      // Die Fraktion CDU/CSU stimmt gemeinsam ab, deshalb dieselbe Stimme fuer beide Parteien.
      stimmen: { [P.CDU]: ['ja', 'koalition'], [P.CSU]: ['ja', 'koalition'], [P.SPD]: ['ja', 'koalition'], [P.AFD]: ['nein', 'opposition'],
        [P.GRUENE]: ['ja', 'opposition'], [P.LINKE]: ['enthaltung', 'opposition'] } },
  ],
};
