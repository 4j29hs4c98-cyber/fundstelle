// scripts/zitate-pruefen.mjs — prueft jeden Auszug aus inhalt-2025.js woertlich gegen die angegebene PDF-Seite.
// Aufruf: node scripts/zitate-pruefen.mjs <leerer Ordner fuer die PDFs>   (braucht pdftotext, z. B. brew install poppler)
// Ergebnis je Position: woertlich, woertlich auf einer Nachbarseite, oder Anteil passender Wortfolgen. Unter 100 %
// heisst nicht falsch: Kopfzeilen oder Trennstriche im PDF stoeren den Abgleich. Dann die Stelle von Hand ansehen.
import { execFileSync } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = process.argv[2];
if (!dir) { console.error('Ordner fuer die PDFs angeben.'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const { EINGEBAUT: I } = await import(pathToFileURL(path.join(app, 'inhalt-2025.js')).href);
const norm = s => String(s).normalize('NFKC').replace(/[₂]/g, '2').replace(/[­]/g, '').replace(/-\s*\n\s*/g, '')
  .replace(/[„“”"«»]/g, '"').replace(/[‚‘’']/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').toLowerCase().trim();
const datei = {};
for (const p of I.programme) {
  const f = path.join(dir, Buffer.from(p.url).toString('base64url').slice(-40) + '.pdf');
  if (!fs.existsSync(f)) execFileSync('curl', ['-sSL', '--max-time', '120', '-A', 'Mozilla/5.0', '-o', f, p.url]);
  datei[p.partei] = f;
}
const raw = (f, n) => { try { return execFileSync('pdftotext', ['-f', String(n), '-l', String(n), f, '-'], { maxBuffer: 1e7, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };
const out = [];
for (const p of I.positionen) {
  const name = I.parteien.find(x => x.id === p.partei).kuerzel;
  if (!p.auszug) { out.push({ name, frage: p.frage.slice(0, 4), ok: 'ohne Auszug' }); continue; }
  // Andere Quellen (Wahl-O-Mat, Bundestag) liegen nicht als Programm-PDF vor; sie wurden bei der Recherche einzeln geprueft.
  if (p.url || !p.seite) { out.push({ name, frage: p.frage.slice(0, 4), ok: 'andere Quelle, hier nicht pruefbar' }); continue; }
  const f = datei[p.partei], a = norm(p.auszug);
  const seiten = [p.seite, p.seite + 1, p.seite - 1];
  let fund = null;
  for (const n of seiten) { const t = norm(raw(f, n) + ' ' + raw(f, n + 1)); if (t.includes(a)) { fund = n; break; } }
  // Teiltreffer: Anteil der Wortfolgen (8 Woerter) auf der Seite
  let anteil = 0;
  if (fund === null) { const t = norm(raw(f, p.seite) + ' ' + raw(f, p.seite + 1)); const w = a.split(' '); let hit = 0, tot = 0;
    for (let i = 0; i + 6 <= w.length; i += 3) { tot++; if (t.includes(w.slice(i, i + 6).join(' '))) hit++; } anteil = tot ? Math.round(100 * hit / tot) : 0; }
  out.push({ name, frage: p.frage.slice(0, 4), seite: p.seite, ok: fund === p.seite ? 'woertlich' : fund ? `woertlich auf Seite ${fund}` : `nicht woertlich (${anteil} % der Wortfolgen)` });
}
console.log(JSON.stringify(out, null, 0).replace(/},{/g, '},\n{'));
