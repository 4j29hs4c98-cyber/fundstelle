// scripts/inhalt-sql.mjs — erzeugt supabase/migrations/004_echte_parteien.sql aus EINGEBAUT (inhalt-2025.js).
// So stehen in Supabase genau dieselben Inhalte wie offline in der App. Aufruf: node scripts/inhalt-sql.mjs
// Entfernt zuerst die erfundenen Beispieldaten (alles mit ist_demo = true, also Partei A bis F), dann kommen
// die echten Parteien mit den Zitaten aus den Programmen 2025. Inhalte des KI-Agenten tragen erstellt_von = 'agent'
// und geprueft = 'nein'; die App zeigt dazu den Hinweis "noch nicht geprueft".
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { EINGEBAUT: I } = await import(pathToFileURL(path.join(root, 'inhalt-2025.js')).href);
const v = x => x === null || x === undefined ? 'null' : typeof x === 'number' ? String(x) : `'${String(x).replace(/'/g, "''")}'`;
const pub = `'veroeffentlicht'`, agent = `'agent', 'nein'`;
const ids = I.parteien.map(p => v(p.id)).join(', ');

const out = [`-- 004_echte_parteien.sql — ERZEUGT von scripts/inhalt-sql.mjs aus inhalt-2025.js. Nicht von Hand aendern.
-- Ersetzt die erfundenen Parteien A bis F durch echte Parteien mit woertlichen Zitaten aus den Programmen zur
-- Bundestagswahl 2025. Setzt 002_struktur.sql voraus. Mehrfach ausfuehrbar.
begin;

-- 1. Erfundene Beispieldaten entfernen (nur Zeilen mit ist_demo = true).
delete from public.stimmverhalten where abstimmung_id in (select id from public.abstimmungen where ist_demo)
  or partei_id in (select id from public.parteien where ist_demo);
delete from public.abstimmung_frage where abstimmung_id in (select id from public.abstimmungen where ist_demo);
delete from public.abstimmungen where ist_demo;
delete from public.argumente where ist_demo;
delete from public.positionen where partei_id in (select id from public.parteien where ist_demo);
delete from public.programme where partei_id in (select id from public.parteien where ist_demo);
delete from public.parteien where ist_demo;
delete from public.wahlen where ist_demo;

-- 2. Echte Inhalte.`];

out.push(...I.wahlen.map(w => `insert into public.wahlen (id, name, datum, parlament, ist_demo, status) values (${v(w.id)}, ${v(w.name)}, ${v(w.datum)}, ${v(w.parlament)}, false, ${pub})
  on conflict (id) do update set name = excluded.name, datum = excluded.datum, parlament = excluded.parlament, ist_demo = false, status = excluded.status;`));
out.push(...I.themen.map(t => `update public.themen set titel = ${v(t.titel)}, kurzfassung = ${v(t.kurz)}, sortierung = ${v(t.sort)} where id = ${v(t.id)};`));
out.push(...I.fragen.map(f => `update public.fragen set frage = ${v(f.frage)}, kurz = ${v(f.kurz)}, sortierung = ${v(f.sort)} where id = ${v(f.id)};`));
// Parteien sind Tatsachen aus dem Katalog, deshalb erstellt_von = mensch.
out.push(...I.parteien.map(p => `insert into public.parteien (id, kuerzel, anzeigename, ist_demo, status) values (${v(p.id)}, ${v(p.kuerzel)}, ${v(p.name)}, false, ${pub})
  on conflict (id) do update set kuerzel = excluded.kuerzel, anzeigename = excluded.anzeigename, ist_demo = false, status = excluded.status;`));
// Programme und Positionen haben keinen fachlichen Schluessel: erst die der echten Parteien loeschen, dann neu anlegen.
out.push(`delete from public.positionen where partei_id in (${ids});`, `delete from public.programme where partei_id in (${ids});`);
out.push(...I.programme.map(p => `insert into public.programme (partei_id, wahl_id, titel, jahr, seiten, quelle_url, status, erstellt_von, geprueft)
  values (${v(p.partei)}, ${v(p.wahl)}, ${v(p.titel)}, 2025, ${v(p.seiten)}, ${v(p.url)}, ${pub}, ${agent});`));
out.push(...I.positionen.map(p => `insert into public.positionen (frage_id, partei_id, haltung, zusammenfassung, quelle_text, quelle_seite, auszug, aenderung, status, erstellt_von, geprueft)
  values (${v(p.frage)}, ${v(p.partei)}, ${v(p.haltung)}, ${v(p.text)}, ${v(p.quelle)}, ${v(p.seite)}, ${v(p.auszug)}, ${v(p.aenderung)}, ${pub}, ${agent});`));
out.push(...I.argumente.map(a => `insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status, erstellt_von, geprueft)
  values (${v(a.id)}, ${v(a.frage)}, ${v(a.richtung)}, ${v(a.text)}, ${v(a.quelle)}, ${v(a.url)}, false, ${pub}, ${agent})
  on conflict (id) do update set frage_id = excluded.frage_id, text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text,
    quelle_url = excluded.quelle_url, ist_demo = false, status = excluded.status, erstellt_von = excluded.erstellt_von, geprueft = excluded.geprueft;`));
for (const a of I.abstimmungen) {
  out.push(`insert into public.abstimmungen (id, parlament, datum, titel, quelle_text, quelle_url, ist_demo, status) values (${v(a.id)}, ${v(a.parlament)}, ${v(a.datum)}, ${v(a.titel)}, ${v(a.quelle)}, ${v(a.url)}, false, ${pub})
  on conflict (id) do update set titel = excluded.titel, datum = excluded.datum, quelle_text = excluded.quelle_text, quelle_url = excluded.quelle_url, status = excluded.status;`);
  out.push(...Object.entries(a.stimmen).map(([partei, [stimme, rolle]]) => `insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values (${v(a.id)}, ${v(partei)}, ${v(stimme)}, ${v(rolle)})
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;`));
  out.push(...a.fragen.map(f => `insert into public.abstimmung_frage (abstimmung_id, frage_id, begruendung, status, erstellt_von) values (${v(a.id)}, ${v(f)}, 'Gesetz zur Verlängerung der Mietpreisbremse', ${pub}, 'agent')
  on conflict (abstimmung_id, frage_id) do nothing;`));
}
out.push('commit;');
const file = path.join(root, 'supabase/migrations/004_echte_parteien.sql');
fs.writeFileSync(file, out.join('\n') + '\n');
console.log(`geschrieben: ${path.relative(root, file)} (${out.length - 2} Anweisungsbloecke)`);
