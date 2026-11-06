// scripts/grundlagen.mjs — erzeugt grundlagen.js aus den Erklaerkarten im Projektordner (Quelle bleiben die Notizen).
// Aufruf: node scripts/grundlagen.mjs "<Pfad zum Ordner Grundlagen>"
// Karte = "## Titel" mit den Feldern **Kurz:**, **Erklärung:**, **Warum das wichtig ist:**, **Quelle:**, **Status:**.
// Glossar (09) = "**Begriff:** Text (01, 05)". Nach jeder Aenderung an den Notizen erneut ausfuehren.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ordner = process.argv[2];
if (!ordner || !fs.existsSync(ordner)) { console.error('Ordner Grundlagen fehlt: node scripts/grundlagen.mjs "<Pfad>"'); process.exit(1); }
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ohneKopf = t => t.replace(/^---[\s\S]*?---\s*/, '');
const schluessel = s => s.toLocaleLowerCase('de').replace(/ß/g, 'ss').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const FELDER = { kurz: 'Kurz', erklaerung: 'Erklärung', warum: 'Warum das wichtig ist', quelle: 'Quelle', status: 'Status' };

function karte(block) {
  const [kopf, ...rest] = block.split('\n'), text = rest.join('\n');
  const k = { titel: kopf.trim() };
  for (const [f, name] of Object.entries(FELDER)) {
    const m = text.match(new RegExp(`\\*\\*${name}:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[^*]+:\\*\\*|$)`));
    k[f] = m ? m[1].trim() : '';
  }
  k.id = schluessel(k.titel);
  return k.kurz ? k : null;
}

const dateien = fs.readdirSync(ordner).filter(f => /^0[1-8] .*\.md$/.test(f)).sort();
const bereiche = dateien.map(f => {
  const t = ohneKopf(fs.readFileSync(path.join(ordner, f), 'utf8'));
  const titel = t.match(/^# (.+)$/m)?.[1].trim() ?? f;
  const intro = t.split(/\n## /)[0].replace(/^# .+$/m, '').trim();
  const karten = t.split(/\n## /).slice(1).map(karte).filter(Boolean);
  return { nr: f.slice(0, 2), titel, id: schluessel(titel), intro, karten };
});

const glossarDatei = path.join(ordner, '09 Glossar.md');
const glossar = fs.existsSync(glossarDatei) ? [...fs.readFileSync(glossarDatei, 'utf8').matchAll(/^\*\*([^*]+):\*\*\s*(.+)$/gm)].map(([, begriff, rest]) => {
  const verweis = rest.match(/\(([\d,\s]+)\)\s*$/);
  return { begriff: begriff.trim(), id: schluessel(begriff), text: rest.replace(/\s*\([\d,\s]+\)\s*$/, '').trim(), verweis: verweis ? verweis[1].split(/[,\s]+/).filter(Boolean) : [] };
}) : [];

const ids = new Set(); bereiche.flatMap(b => b.karten).forEach(k => { if (ids.has(k.id)) k.id += '-2'; ids.add(k.id); });
const daten = { stand: new Date().toISOString().slice(0, 10), bereiche, glossar };
const kopf = '// grundlagen.js — ERZEUGT von scripts/grundlagen.mjs aus den Notizen im Ordner "Grundlagen". Nicht von Hand aendern.\n';
fs.writeFileSync(path.join(root, 'grundlagen.js'), `${kopf}export const GRUNDLAGEN = ${JSON.stringify(daten, null, 1)};\n`);
console.log(`grundlagen.js: ${bereiche.length} Bereiche, ${bereiche.reduce((n, b) => n + b.karten.length, 0)} Karten, ${glossar.length} Glossareintraege`);
