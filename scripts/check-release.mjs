// scripts/check-release.mjs — run before every release: node scripts/check-release.mjs
// Catches the mistakes that broke updates in the past: missing/misplaced files, files missing from the
// offline cache list, forgotten version bump, missing German texts, syntax errors and leaked secrets.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
// fileURLToPath statt .pathname: sonst bleiben Leerzeichen im Pfad als %20 stehen und nichts wird gefunden.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = f => path.relative(root, f).split(path.sep).join('/');
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') || ['node_modules', 'tests', 'scripts', 'supabase', 'test-results', 'mockups'].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(root).map(rel), js = files.filter(f => f.endsWith('.js') && f !== 'sw.js' && !f.endsWith('.config.js') && f !== 'config.example.js');
const problems = [], ok = m => console.log('  ok  ' + m);

// 1. syntax
for (const f of [...js, 'sw.js']) { try { execSync(`node --check "${path.join(root, f)}"`, { stdio: 'pipe' }); } catch (e) { problems.push(`syntax error in ${f}: ${e.stderr}`); } }
ok('syntax');
// 2. every import points to an existing file
for (const f of js) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) { const t = rel(path.resolve(path.dirname(path.join(root, f)), m[1])); if (!fs.existsSync(path.join(root, t))) problems.push(`${f} imports missing file ${t}`); }
}
ok('imports');
// 3. offline cache list: every app file is in SHELL and every SHELL entry exists
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const shell = [...sw.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map(m => m[1]).filter(Boolean);
for (const f of [...js, 'styles.css', 'index.html']) if (!shell.includes(f)) problems.push(`sw.js SHELL is missing ${f}`);
for (const f of shell) if (!fs.existsSync(path.join(root, f))) problems.push(`sw.js SHELL lists ${f}, which does not exist`);
ok('offline cache list');
// 4. version bumped compared to the last commit (skipped outside git)
try {
  const before = execSync('git show HEAD:sw.js', { cwd: root, stdio: 'pipe' }).toString().match(/VERSION = '([^']+)'/)?.[1];
  const now = sw.match(/VERSION = '([^']+)'/)[1];
  const changed = execSync('git status --porcelain', { cwd: root }).toString().trim();
  if (changed && before === now) problems.push(`files changed but sw.js VERSION is still '${now}' (bump it, or devices keep the old version)`);
  ok(`version ${before} -> ${now}`);
} catch { ok('version (not a git repo, skipped)'); }
// 5. every tr('…') text has a German translation
const { missingGerman } = await import(pathToFileURL(path.join(root, 'i18n.js')).href);
const keys = new Set(); for (const f of js.filter(f => f !== 'i18n.js')) for (const m of fs.readFileSync(path.join(root, f), 'utf8').matchAll(/\btr\((['"])((?:\\.|(?!\1).)*)\1/g)) keys.add(m[2].replace(/\\'/g, "'"));
const miss = missingGerman([...keys]); if (miss.length) problems.push(`missing German texts in i18n.js: ${miss.join(' | ')}`);
ok(`translations (${keys.size} texts)`);
// 6. no secrets in the repository
for (const f of files.filter(f => /\.(js|html|json|md|webmanifest|css)$/.test(f))) {
  const s = fs.readFileSync(path.join(root, f), 'utf8');
  if (/service_role|sb_secret_|BEGIN [A-Z ]*PRIVATE KEY|"role"\s*:\s*"service_role"/.test(s)) problems.push(`possible secret in ${f}`);
}
ok('no secrets');
if (problems.length) { console.error('\nRELEASE CHECK FAILED:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log('\nRelease check passed.');
