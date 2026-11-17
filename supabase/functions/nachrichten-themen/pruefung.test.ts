// Prueft pruefung.ts mit echten Beispielen vom 13.11.2026 und mit Faellen, die scheitern muessen. Start: deno test pruefung.test.ts
import { assertEquals } from 'jsr:@std/assert@1';
import { artVon, frageOk, inhaltAnteil, istKeineMeldung, istKopie, kurzfassungOk, pruefeThema, titelOk, zahlenBelegt } from './pruefung.ts';

const P = [{ id: 'a', name: 'AfD' }, { id: 'c', name: 'CDU' }, { id: 's', name: 'SPD' }];
const m = (i: number, quelle: string, titel: string, anreisser: string) => ({ url: `https://x.de/${i}`, quelle, titel, anreisser, datum: `2026-11-13T1${i}:00:00.000Z` });
const M = [
  m(0, 'bundestag.de (hib)', 'Ausschuss beschließt Bundeshaushalt 2027', 'Der Haushaltsausschuss hat den Etat mit Ausgaben von 560,92 Milliarden Euro beschlossen.'),
  m(1, 'zdfheute.de', 'Stromsteuer: Merz will Senkung 2027, Klingbeil zögert', 'Die Union fordert eine Senkung, die SPD verweist auf die Haushaltslage.'),
  m(2, 'spiegel.de', 'Bundeshaushalt: Die fetten Jahre sind vorbei - Kommentar', 'Ein Kommentar.'),
];

Deno.test('Zahlen muessen in den Quellen stehen', () => {
  assertEquals(zahlenBelegt('Die Ausgaben liegen bei 560,92 Milliarden Euro.', 'Ausgaben von 560,92 Milliarden Euro'), true);
  assertEquals(zahlenBelegt('Die Ausgaben liegen bei 600 Milliarden Euro.', 'Ausgaben von 560,92 Milliarden Euro'), false);
  assertEquals(zahlenBelegt('Es sind 5 Punkte.', 'Beschluss von 2025 mit 15 Punkten'), false);        // "5" steckt nur in "2025" und "15"
  assertEquals(zahlenBelegt('Es sind 5 Punkte.', 'Beschluss mit 5 Punkten'), true);
  assertEquals(zahlenBelegt('Es sind 5 Punkte.', 'Beschluss mit 5,3 Punkten'), false);
  assertEquals(zahlenBelegt('Drei Millionen Menschen.', 'Viele Menschen'), false);                    // Zahlwoerter zaehlen auch
  assertEquals(zahlenBelegt('Drei Millionen Menschen.', 'Drei Millionen Euro fuer Menschen'), true);
  assertEquals(zahlenBelegt('Eine Zusammenfassung ganz ohne Zahlen.', 'egal'), true);
});

Deno.test('Woertliche Uebernahmen werden erkannt, eigene Worte nicht', () => {
  const q = ['Der Haushaltsausschuss hat den Etat mit Ausgaben von 560,92 Milliarden Euro beschlossen.'];
  assertEquals(istKopie('Er hat den Etat mit Ausgaben von 560,92 Milliarden Euro beschlossen, hieß es.', q), true);
  assertEquals(istKopie('Das Gremium billigte den Bundesetat für 2027 und plant Ausgaben von 560,92 Milliarden Euro.', q), false);
});

Deno.test('Kurzfassung: Laenge, Zahlen, Kopie', () => {
  const q = [`${M[0].titel} ${M[0].anreisser}`];
  const ok = (zf: unknown) => kurzfassungOk(zf, q, q, P);
  assertEquals(ok('Zu kurz.'), null);
  assertEquals(ok('Der Ausschuss billigte den Haushalt für 2027 und plant Ausgaben von 560,92 Milliarden Euro.') !== null, true);
  assertEquals(ok('Der Ausschuss billigte den Haushalt für 2027 und plant Ausgaben von 999 Milliarden Euro.'), null);
  assertEquals(ok('Die AfD hat den Haushalt für 2027 beschlossen und plant 560,92 Milliarden Euro.'), null);                // AfD steht in keiner Quelle
  assertEquals(ok('Der Ausschuss billigte den Haushalt 2027, mehr unter https://beispiel.de/abo und 560,92 Milliarden Euro.'), null);
  assertEquals(ok('Eine Meteoritenwarnung sorgte fuer voellig neue Sicherheitsdebatten ueber Raumfahrtbehoerden weltweit.'), null);   // erfundener Inhalt
  assertEquals(ok('Der Ausschuss billigte den Haushalt für 2027 und plant Ausgaben von 560,92 Milliarden Euro, gegen einen Beteiligten laufen Ermittlungen.'), null);   // heikles Thema
  assertEquals(ok(null), null);
});

Deno.test('Titel: erfundene Zusaetze fallen durch', () => {
  const q = [`${M[0].titel} ${M[0].anreisser}`];
  assertEquals(titelOk('Ausschuss beschließt Bundeshaushalt 2027', q, P), true);
  assertEquals(titelOk('AfD will Bundeshaushalt abschaffen', q, P), false);
  assertEquals(titelOk('Ausschuss beschließt Bundeshaushalt 2030', q, P), false);
  assertEquals(inhaltAnteil('Haushalt Ausschuss', q) > 0.9, true);
});

Deno.test('Art: Hinweise in Titel und Adresse schlagen die KI', () => {
  assertEquals(artVon({ titel: 'Kommentar: Die Koalition wankt', url: 'https://x.de/a' }, 'meldung'), 'kommentar');
  assertEquals(artVon({ titel: 'Ganz normal', url: 'https://x.de/meinung/a' }, 'meldung'), 'kommentar');
  assertEquals(artVon({ titel: 'Interview mit der Ministerin', url: 'https://x.de/a' }, 'meldung'), 'interview');
  assertEquals(artVon({ titel: 'Ganz normal', url: 'https://x.de/a' }, 'meldung'), 'meldung');
});

Deno.test('Frage: neutral, ohne Namen, mit Fragezeichen', () => {
  assertEquals(frageOk('Sollte die Union das Bürgergeld kürzen?', P.concat([{ id: 'x', name: 'CDU' }]), []), null);       // Alias "Union"
  assertEquals(frageOk('Soll die Rente mit der Linken reformiert werden?', [{ id: 'l', name: 'Die Linke' }], []), null);
  assertEquals(frageOk('Sollen linke Konzepte Vorrang haben?', [{ id: 'l', name: 'Die Linke' }], []) !== null, true);     // Adjektiv ist keine Partei
  assertEquals(frageOk('Soll die Stromsteuer für private Haushalte gesenkt werden?', P, ['Friedrich Merz']) !== null, true);
  assertEquals(frageOk('Soll die Stromsteuer laut SPD gesenkt werden?', P, []), null);
  assertEquals(frageOk('Was will Merz bei der Stromsteuer?', P, ['Friedrich Merz']), null);
  assertEquals(frageOk('Die Stromsteuer soll gesenkt werden', P, []), null);
});

Deno.test('Sendungen und Newsletter werden ausgesondert', () => {
  assertEquals(istKeineMeldung({ titel: 'heute journal vom 12. November 2026' }), true);
  assertEquals(istKeineMeldung({ titel: 'SZ am Abend: Nachrichten vom 13. November 2026' }), true);
  assertEquals(istKeineMeldung({ titel: 'Bundestag beschließt Reform der Nachrichtendienste' }), false);
});

Deno.test('Thema: Indizes, Doppelbelegung, Parteien nur bei Nennung', () => {
  const benutzt = new Set<number>();
  const t = pruefeThema({
    titel: 'Haushalt 2027: Ausschuss beschließt Etat, Stromsteuer bleibt Streitpunkt', zusammenfassung: 'Der Ausschuss billigte den Haushalt für 2027 und plant Ausgaben von 560,92 Milliarden Euro. Bei der Stromsteuer fordert die Union eine Senkung.',
    meldungen: [{ i: 0, art: 'meldung' }, { i: 1, art: 'meldung' }, { i: 2, art: 'kommentar' }, { i: 99, art: 'meldung' }],
    parteien: ['SPD', 'AfD'], personen: ['Friedrich Merz', 'Olaf Scholz'], frage: 'Soll die Stromsteuer für private Haushalte gesenkt werden?',
  }, M, P, [], benutzt);
  assertEquals(t?.meldungen.length, 3);
  assertEquals(t?.parteien, ['s']);                  // AfD steht nirgends in den Texten
  assertEquals(t?.personen, ['Friedrich Merz']);     // Scholz steht nirgends
  assertEquals(t?.anzahl_quellen, 3);
  assertEquals(t?.aktualisiert, M[2].datum);
  assertEquals(t?.zusammenfassung !== null, true);
  // dieselben Meldungen duerfen kein zweites Thema bilden
  assertEquals(pruefeThema({ titel: 'Noch ein Thema dazu', meldungen: [{ i: 0 }] }, M, P, [], benutzt), null);
});

Deno.test('Nur Kommentare: keine Kurzfassung', () => {
  const t = pruefeThema({ titel: 'Kommentare zum Haushalt', zusammenfassung: 'Das Gremium billigte den Bundesetat und plant Ausgaben von 560,92 Milliarden Euro.', meldungen: [{ i: 2, art: 'kommentar' }] }, M, P, [], new Set());
  assertEquals(t?.zusammenfassung, null);
});

Deno.test('Vorbereitete Frage nur aus der Liste', () => {
  const vb = [{ id: 'f1', frage: 'Soll die Miete gedeckelt werden?' }];
  assertEquals(pruefeThema({ titel: 'Mietenthema im Bundestag', meldungen: [{ i: 0 }], vorbereitete_frage: 'f1' }, M, P, vb, new Set())?.frage_id, 'f1');
  assertEquals(pruefeThema({ titel: 'Mietenthema im Bundestag', meldungen: [{ i: 0 }], vorbereitete_frage: 'erfunden' }, M, P, vb, new Set())?.frage_id, null);
});
