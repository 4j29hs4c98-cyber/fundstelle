-- 003_demo_inhalte.sql — ERZEUGT von scripts/demo-sql.mjs aus content.js (DEMO). Nicht von Hand aendern.
-- Erfundene Beispieldaten fuer die Parteien A bis F. Setzt 002_struktur.sql voraus. Mehrfach ausfuehrbar.
insert into public.wahlen (id, name, datum, parlament, ist_demo, status) values ('a0000000-0000-4000-8000-000000000001', 'Beispielwahl zum Landtag', '2027-05-09', 'Beispielparlament', true, 'veroeffentlicht')
  on conflict (id) do update set name = excluded.name, datum = excluded.datum, parlament = excluded.parlament, status = excluded.status;
update public.themen set titel = 'Wohnen und Mieten', kurzfassung = 'Die Mietpreisbremse läuft aus. Sechs Programme sagen dazu etwas, vier davon ausführlich.', sortierung = 1 where id = '3a18c189-c9a4-49dc-8ad9-7e49ac440fe4';
update public.themen set titel = 'Klima und Energie', kurzfassung = 'Beim CO2-Preis gehen die Programme am weitesten auseinander.', sortierung = 2 where id = '2a2cf39a-2cac-490e-bc3f-6557b9efb890';
update public.themen set titel = 'Rente und Alterssicherung', kurzfassung = 'Vier Programme äußern sich zum Renteneintrittsalter, zwei lassen die Frage offen.', sortierung = 3 where id = 'd864065a-5d5c-4ad4-8149-645b4a1602eb';
update public.fragen set frage = 'Soll die Mietpreisbremse über 2029 hinaus verlängert werden?', kurz = 'Mietpreisbremse', sortierung = 1 where id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8';
update public.fragen set frage = 'Soll der CO2-Preis schneller steigen als bisher geplant?', kurz = 'CO2-Preis', sortierung = 1 where id = '584471ef-30b5-4334-a3d7-e51f20d929aa';
update public.fragen set frage = 'Soll das Renteneintrittsalter nach 2031 weiter steigen?', kurz = 'Renteneintritt', sortierung = 1 where id = '95c54175-3b25-4055-a704-52ebec90696f';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 152 where partei_id = '6675c29e-7733-4cdb-8738-25ebb4c5d516';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 98 where partei_id = '98f32a21-44b3-4220-81d6-c0631e34bbae';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 211 where partei_id = '67e4a12b-4b7b-4c63-9cae-1296ad67c676';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 74 where partei_id = '452265a3-d1fc-4cca-9133-775e79068925';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 133 where partei_id = '7096c8f1-785d-46d8-84f6-a6f3906d46e2';
update public.programme set wahl_id = 'a0000000-0000-4000-8000-000000000001', titel = 'Beispielprogramm 2026', seiten = 187 where partei_id = 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc';
update public.positionen set haltung = 'dafuer', zusammenfassung = 'Will die Regelung unbefristet fortführen und auf weitere Landkreise ausweiten.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 34, auszug = 'Wir werden die Mietpreisbremse unbefristet fortführen und auf alle Landkreise mit angespanntem Wohnungsmarkt ausweiten.', aenderung = 'Die Mietpreisbremse gilt dauerhaft und in mehr Landkreisen als heute.'
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = '6675c29e-7733-4cdb-8738-25ebb4c5d516';
update public.positionen set haltung = 'teilweise', zusammenfassung = 'Befürwortet eine Verlängerung um fünf Jahre, gekoppelt an eine Prüfung der Wirkung.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 12, auszug = 'Wir verlängern die Mietpreisbremse um fünf Jahre und lassen ihre Wirkung bis dahin unabhängig prüfen.', aenderung = null
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = '98f32a21-44b3-4220-81d6-c0631e34bbae';
update public.positionen set haltung = 'dagegen', zusammenfassung = 'Hält die Regelung für wirkungslos und setzt stattdessen auf schnelleren Neubau.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 51, auszug = 'Die Mietpreisbremse hat keine einzige neue Wohnung geschaffen. Wir setzen auf schnelleres Bauen.', aenderung = 'Baugenehmigungen sollen innerhalb von drei Monaten erteilt werden.'
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = '67e4a12b-4b7b-4c63-9cae-1296ad67c676';
update public.positionen set haltung = 'dafuer', zusammenfassung = 'Verlängerung ja, zusätzlich eine Obergrenze bei Neuvermietung.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 8, auszug = 'Neben der Verlängerung führen wir eine feste Obergrenze für Mieten bei Neuvermietung ein.', aenderung = 'Bei Neuvermietung gilt eine feste Obergrenze für die Miete.'
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = '452265a3-d1fc-4cca-9133-775e79068925';
update public.positionen set haltung = 'keine_angabe', zusammenfassung = 'Das Programm äußert sich nicht zur Mietpreisbremse.', quelle_text = 'Keine Fundstelle im Programm 2026', quelle_seite = null, auszug = null, aenderung = null
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = '7096c8f1-785d-46d8-84f6-a6f3906d46e2';
update public.positionen set haltung = 'teilweise', zusammenfassung = 'Nur in Gebieten mit nachgewiesener Wohnungsnot, sonst auslaufen lassen.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 27, auszug = 'Die Mietpreisbremse soll nur dort gelten, wo Wohnungsnot nachgewiesen ist.', aenderung = null
  where frage_id = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8' and partei_id = 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc';
update public.positionen set haltung = 'teilweise', zusammenfassung = 'Schnellerer Anstieg, aber nur mit vollständiger Rückzahlung an die Haushalte.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 41, auszug = 'Ein schnellerer Anstieg des CO2-Preises kommt nur, wenn jeder Euro als Klimageld an die Haushalte zurückgeht.', aenderung = 'Einnahmen aus dem CO2-Preis gehen vollständig als Klimageld an die Haushalte.'
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = '6675c29e-7733-4cdb-8738-25ebb4c5d516';
update public.positionen set haltung = 'dafuer', zusammenfassung = 'Nennt einen festen Zielwert je Tonne bis 2030.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 19, auszug = 'Bis 2030 soll der CO2-Preis einen festen Zielwert je Tonne erreichen.', aenderung = null
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = '98f32a21-44b3-4220-81d6-c0631e34bbae';
update public.positionen set haltung = 'dagegen', zusammenfassung = 'Lehnt eine Beschleunigung ab und verweist auf die Belastung der Industrie.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 63, auszug = 'Eine Beschleunigung des CO2-Preises gefährdet Arbeitsplätze in der Industrie.', aenderung = null
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = '67e4a12b-4b7b-4c63-9cae-1296ad67c676';
update public.positionen set haltung = 'dafuer', zusammenfassung = 'Schnellerer Anstieg, verbunden mit einem Ausgleich für Pendler.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 15, auszug = 'Wir beschleunigen den CO2-Preis und gleichen die Mehrkosten für Pendlerinnen und Pendler aus.', aenderung = 'Pendlerinnen und Pendler erhalten einen Ausgleich für höhere Spritkosten.'
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = '452265a3-d1fc-4cca-9133-775e79068925';
update public.positionen set haltung = 'dagegen', zusammenfassung = 'Will den Preis einfrieren, bis ein europäischer Rahmen steht.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 22, auszug = 'Bis ein europäischer Rahmen steht, wird der CO2-Preis eingefroren.', aenderung = null
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = '7096c8f1-785d-46d8-84f6-a6f3906d46e2';
update public.positionen set haltung = 'keine_angabe', zusammenfassung = 'Das Programm nennt kein Tempo und keine Zahl.', quelle_text = 'Keine Fundstelle im Programm 2026', quelle_seite = null, auszug = null, aenderung = null
  where frage_id = '584471ef-30b5-4334-a3d7-e51f20d929aa' and partei_id = 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc';
update public.positionen set haltung = 'dagegen', zusammenfassung = 'Schließt eine weitere Anhebung aus und will stattdessen die Beitragsbasis verbreitern.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 55, auszug = 'Eine weitere Anhebung des Rentenalters schließen wir aus. Stattdessen sollen mehr Erwerbstätige einzahlen.', aenderung = 'Mehr Erwerbstätige zahlen in die Rentenversicherung ein.'
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = '6675c29e-7733-4cdb-8738-25ebb4c5d516';
update public.positionen set haltung = 'teilweise', zusammenfassung = 'Kopplung an die Lebenserwartung, mit Ausnahmen für körperlich schwere Berufe.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 31, auszug = 'Das Rentenalter folgt der Lebenserwartung, mit Ausnahmen für körperlich schwere Berufe.', aenderung = null
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = '98f32a21-44b3-4220-81d6-c0631e34bbae';
update public.positionen set haltung = 'dafuer', zusammenfassung = 'Hält eine schrittweise Anhebung für unvermeidlich und nennt einen Zeitplan.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 48, auszug = 'Eine schrittweise Anhebung des Renteneintrittsalters ist unvermeidlich.', aenderung = null
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = '67e4a12b-4b7b-4c63-9cae-1296ad67c676';
update public.positionen set haltung = 'keine_angabe', zusammenfassung = 'Das Programm legt sich nicht fest.', quelle_text = 'Keine Fundstelle im Programm 2026', quelle_seite = null, auszug = null, aenderung = null
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = '452265a3-d1fc-4cca-9133-775e79068925';
update public.positionen set haltung = 'dagegen', zusammenfassung = 'Will das Eintrittsalter senken und die Finanzierung über Steuern lösen.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 9, auszug = 'Wir senken das Renteneintrittsalter und finanzieren die Rente stärker aus Steuern.', aenderung = null
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = '7096c8f1-785d-46d8-84f6-a6f3906d46e2';
update public.positionen set haltung = 'keine_angabe', zusammenfassung = 'Nennt das Thema, ohne eine Position zu beziehen.', quelle_text = 'Beispielprogramm 2026', quelle_seite = 60, auszug = 'Die Zukunft der Rente ist eine der großen Fragen unserer Zeit.', aenderung = null
  where frage_id = '95c54175-3b25-4055-a704-52ebec90696f' and partei_id = 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc';
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000021', 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8', 'dafuer', 'Begrenzt den Anstieg der Mieten bei Neuvermietung in Städten mit knappem Wohnraum.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000022', 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8', 'dagegen', 'Kann dazu führen, dass weniger in neue Mietwohnungen investiert wird.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000023', '584471ef-30b5-4334-a3d7-e51f20d929aa', 'dafuer', 'Macht klimaschädliche Energie teurer und lenkt Investitionen in Alternativen.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000024', '584471ef-30b5-4334-a3d7-e51f20d929aa', 'dagegen', 'Belastet Haushalte mit niedrigem Einkommen und lange Pendelwege besonders.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000025', '95c54175-3b25-4055-a704-52ebec90696f', 'dafuer', 'Hält die Beiträge stabil, wenn Menschen länger leben und länger Rente beziehen.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000026', '95c54175-3b25-4055-a704-52ebec90696f', 'dagegen', 'Trifft Menschen in körperlich schweren Berufen, die oft nicht länger arbeiten können.', 'Beispielquelle, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;
insert into public.abstimmungen (id, parlament, datum, titel, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000011', 'Beispielparlament', '2026-10-15', 'Antrag: Mietpreisbremse um fünf Jahre verlängern', 'Beispielprotokoll, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set titel = excluded.titel, datum = excluded.datum, status = excluded.status;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', '6675c29e-7733-4cdb-8738-25ebb4c5d516', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', '98f32a21-44b3-4220-81d6-c0631e34bbae', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', '67e4a12b-4b7b-4c63-9cae-1296ad67c676', 'nein', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', '452265a3-d1fc-4cca-9133-775e79068925', 'ja', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000011', '7096c8f1-785d-46d8-84f6-a6f3906d46e2', 'enthaltung', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.abstimmung_frage (abstimmung_id, frage_id, begruendung, status) values ('a0000000-0000-4000-8000-000000000011', 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8', 'Beispielzuordnung', 'veroeffentlicht')
  on conflict (abstimmung_id, frage_id) do nothing;
insert into public.abstimmungen (id, parlament, datum, titel, quelle_text, quelle_url, ist_demo, status) values ('a0000000-0000-4000-8000-000000000012', 'Beispielparlament', '2026-09-24', 'Gesetzentwurf: Ausgleich für Pendler beim CO2-Preis', 'Beispielprotokoll, erfunden', null, true, 'veroeffentlicht')
  on conflict (id) do update set titel = excluded.titel, datum = excluded.datum, status = excluded.status;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', '6675c29e-7733-4cdb-8738-25ebb4c5d516', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', '98f32a21-44b3-4220-81d6-c0631e34bbae', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', 'b3f0f5c7-4fb2-4512-8b2f-28a1ac6adfdc', 'ja', 'koalition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', '67e4a12b-4b7b-4c63-9cae-1296ad67c676', 'nein', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', '452265a3-d1fc-4cca-9133-775e79068925', 'ja', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values ('a0000000-0000-4000-8000-000000000012', '7096c8f1-785d-46d8-84f6-a6f3906d46e2', 'nein', 'opposition')
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;
insert into public.abstimmung_frage (abstimmung_id, frage_id, begruendung, status) values ('a0000000-0000-4000-8000-000000000012', '584471ef-30b5-4334-a3d7-e51f20d929aa', 'Beispielzuordnung', 'veroeffentlicht')
  on conflict (abstimmung_id, frage_id) do nothing;
