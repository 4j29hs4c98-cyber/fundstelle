// scripts/demo-sql.mjs — erzeugt supabase/migrations/003_demo_inhalte.sql aus DEMO in content.js.
// So stehen in Supabase genau dieselben Beispieldaten wie offline in der App. Aufruf: node scripts/demo-sql.mjs
// Nur fuer die erfundenen Parteien A bis F gedacht; echte Inhalte kommen spaeter ueber die Pruefliste.
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { DEMO } = await import(pathToFileURL(path.join(root, 'content.js')).href);
const v = x => x === null || x === undefined ? 'null' : typeof x === 'number' ? String(x) : `'${String(x).replace(/'/g, "''")}'`;
const pub = `'veroeffentlicht'`;
const out = [`-- 003_demo_inhalte.sql — ERZEUGT von scripts/demo-sql.mjs aus content.js (DEMO). Nicht von Hand aendern.
-- Erfundene Beispieldaten fuer die Parteien A bis F. Setzt 002_struktur.sql voraus. Mehrfach ausfuehrbar.`];

out.push(...DEMO.wahlen.map(w => `insert into public.wahlen (id, name, datum, parlament, ist_demo, status) values (${v(w.id)}, ${v(w.name)}, ${v(w.datum)}, ${v(w.parlament)}, true, ${pub})
  on conflict (id) do update set name = excluded.name, datum = excluded.datum, parlament = excluded.parlament, status = excluded.status;`));
out.push(...DEMO.themen.map(t => `update public.themen set titel = ${v(t.titel)}, kurzfassung = ${v(t.kurz)}, sortierung = ${v(t.sort)} where id = ${v(t.id)};`));
out.push(...DEMO.fragen.map(f => `update public.fragen set frage = ${v(f.frage)}, kurz = ${v(f.kurz)}, sortierung = ${v(f.sort)} where id = ${v(f.id)};`));
out.push(...DEMO.programme.map(p => `update public.programme set wahl_id = ${v(p.wahl)}, titel = ${v(p.titel)}, seiten = ${v(p.seiten)} where partei_id = ${v(p.partei)};`));
out.push(...DEMO.positionen.map(p => `update public.positionen set haltung = ${v(p.haltung)}, zusammenfassung = ${v(p.text)}, quelle_text = ${v(p.quelle)}, quelle_seite = ${v(p.seite)}, auszug = ${v(p.auszug)}, aenderung = ${v(p.aenderung)}
  where frage_id = ${v(p.frage)} and partei_id = ${v(p.partei)};`));
out.push(...DEMO.argumente.map(a => `insert into public.argumente (id, frage_id, richtung, text, quelle_text, quelle_url, ist_demo, status) values (${v(a.id)}, ${v(a.frage)}, ${v(a.richtung)}, ${v(a.text)}, ${v(a.quelle)}, ${v(a.url)}, true, ${pub})
  on conflict (id) do update set text = excluded.text, richtung = excluded.richtung, quelle_text = excluded.quelle_text, status = excluded.status;`));
for (const a of DEMO.abstimmungen) {
  out.push(`insert into public.abstimmungen (id, parlament, datum, titel, quelle_text, quelle_url, ist_demo, status) values (${v(a.id)}, ${v(a.parlament)}, ${v(a.datum)}, ${v(a.titel)}, ${v(a.quelle)}, ${v(a.url)}, true, ${pub})
  on conflict (id) do update set titel = excluded.titel, datum = excluded.datum, status = excluded.status;`);
  out.push(...Object.entries(a.stimmen).map(([partei, [stimme, rolle]]) => `insert into public.stimmverhalten (abstimmung_id, partei_id, stimme, rolle) values (${v(a.id)}, ${v(partei)}, ${v(stimme)}, ${v(rolle)})
  on conflict (abstimmung_id, partei_id) do update set stimme = excluded.stimme, rolle = excluded.rolle;`));
  out.push(...a.fragen.map(f => `insert into public.abstimmung_frage (abstimmung_id, frage_id, begruendung, status) values (${v(a.id)}, ${v(f)}, 'Beispielzuordnung', ${pub})
  on conflict (abstimmung_id, frage_id) do nothing;`));
}
const file = path.join(root, 'supabase/migrations/003_demo_inhalte.sql');
fs.writeFileSync(file, out.join('\n') + '\n');
console.log(`geschrieben: ${path.relative(root, file)} (${out.length - 1} Anweisungen)`);
