// scripts/programme-text.mjs — holt den Volltext aller Programme Seite fuer Seite und schreibt daraus SQL fuer die
// Tabelle programm_seiten (Migration 006). Grundlage fuer den Recherche-Agenten bei "Eigenes Thema".
// Aufruf: node scripts/programme-text.mjs <leerer Ordner fuer die PDFs>   (braucht pdftotext und pdfinfo, brew install poppler)
// Ergebnis: supabase/seed/programm_seiten.sql. Die Datei ist gross und steht deshalb nicht im Repository (.gitignore).
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = process.argv[2];
if (!dir) { console.error('Ordner fuer die PDFs angeben.'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const { EINGEBAUT: I } = await import(pathToFileURL(path.join(app, 'inhalt-2025.js')).href);

const lauf = (cmd, args) => execFileSync(cmd, args, { maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
// Dollar-Quoting mit eigenem Marker, damit kein Text des Programms das SQL beenden kann.
const dq = s => { const t = String(s).replace(/\u0000/g, ''); if (t.includes('$seite$')) throw new Error('Marker im Text'); return `$seite$${t}$seite$`; };

const out = ['-- programm_seiten.sql — ERZEUGT von scripts/programme-text.mjs. Setzt 006_eigene_themen.sql voraus.', 'begin;'];
for (const p of I.programme) {
  const f = path.join(dir, Buffer.from(p.url).toString('base64url').slice(-40) + '.pdf');
  if (!fs.existsSync(f)) execFileSync('curl', ['-sSL', '--fail', '--max-time', '180', '-A', 'Mozilla/5.0', '-o', f, p.url]);
  const seiten = Number((lauf('pdfinfo', [f]).match(/Pages:\s+(\d+)/) || [])[1]);
  if (!seiten) { console.error('Keine Seitenzahl:', p.url); process.exit(1); }
  out.push(`delete from public.programm_seiten where partei_id = '${p.partei}';`);
  let leer = 0;
  for (let n = 1; n <= seiten; n++) {
    const text = lauf('pdftotext', ['-f', String(n), '-l', String(n), f, '-']).trim();
    if (text.length < 40) { leer++; continue; } // Titelbilder und leere Seiten
    out.push(`insert into public.programm_seiten (partei_id, seite, text) values ('${p.partei}', ${n}, ${dq(text)});`);
  }
  console.log(`${I.parteien.find(x => x.id === p.partei)?.kuerzel}: ${seiten} Seiten, ${leer} ohne Text`);
}
out.push('commit;');
const ziel = path.join(app, 'supabase/seed/programm_seiten.sql');
fs.mkdirSync(path.dirname(ziel), { recursive: true });
fs.writeFileSync(ziel, out.join('\n') + '\n');
console.log(`geschrieben: ${path.relative(app, ziel)} (${(fs.statSync(ziel).size / 1e6).toFixed(1)} MB)`);
