// app.js — entry point: event routing, URL routing (#home, #settings), sync wiring, startup.
import * as db from './db.js';
import * as sync from './sync.js';
import { $, S, VIEWS, toast } from './core.js';
import { tr } from './i18n.js';
import { render, applyLang, applyTheme } from './render.js';
import { actions, forms } from './actions.js';
import { syncLine } from './views/settings.js';

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled || !actions[el.dataset.action]) return;
  e.preventDefault();
  try { await actions[el.dataset.action](el.dataset, el); } catch (err) { console.error(err); toast('Something went wrong. Try again.'); }
});
document.addEventListener('submit', async e => {
  const f = e.target.closest('[data-form]'); if (!f || !forms[f.dataset.form]) return;
  e.preventDefault();
  try { await forms[f.dataset.form](new FormData(f), f); f.reset(); } catch (err) { toast(err.message || 'Something went wrong. Try again.'); return; }
  render();
});
document.addEventListener('change', async e => {
  if (e.target.id !== 'import-file' || !e.target.files[0]) return;
  try { // merge: newer version of each record wins (same rule as sync)
    const recs = JSON.parse(await e.target.files[0].text()).records || [];
    const merged = recs.filter(r => r?.id && r.kind && (!S.recs.get(r.id) || r.updated_at > S.recs.get(r.id).updated_at)).map(r => ({ ...r, synced: false }));
    merged.forEach(r => S.recs.set(r.id, r)); await db.putMany(merged); sync.schedule(); render(); toast(tr('Imported {n} items', { n: merged.length }));
  } catch { toast('That file is not a valid backup.'); }
});

function route() { const v = location.hash.slice(1); S.view = VIEWS.includes(v) ? v : 'ueberblick'; render(); }
window.addEventListener('hashchange', route);

// Wischen nach links oder rechts wechselt den Bereich. Die Gesteuerung laeuft ueber den Hash,
// damit die Architektur des Kits (eine Ansicht in #main) unveraendert bleibt.
(function swipeNav() {
  let x0 = 0, y0 = 0, id = null, locked = null;
  const main = document.getElementById('main');
  main.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; id = e.pointerId; x0 = e.clientX; y0 = e.clientY; locked = null; });
  main.addEventListener('pointermove', e => {
    if (e.pointerId !== id || locked !== null) return;
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  });
  main.addEventListener('pointerup', e => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - x0;
    id = null;
    if (locked !== 'x' || Math.abs(dx) < 60) return;
    const i = VIEWS.indexOf(S.view), next = VIEWS[i + (dx < 0 ? 1 : -1)];
    if (next) location.hash = '#' + next;
  });
  main.addEventListener('pointercancel', () => { id = null; });
})();


const typing = () => ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
const syncHooks = { // how sync talks to the app
  async applyRemote(rows) {
    const changed = rows.filter(r => !S.recs.get(r.id) || r.updated_at > S.recs.get(r.id).updated_at).map(r => ({ ...r, synced: true }));
    changed.forEach(r => S.recs.set(r.id, r));
    if (changed.length) { await db.putMany(changed); if (!typing()) render(); }
  },
  pending: () => [...S.recs.values()].filter(r => !r.synced),
  async markSynced(rows) {
    const done = rows.map(r => S.recs.get(r.id)).filter((c, i) => c && c.updated_at === rows[i].updated_at);
    done.forEach(c => { c.synced = true; }); await db.putMany(done);
  },
  onStatus() { const dot = $('#sync-dot'); if (dot) { dot.dataset.state = sync.status.user ? sync.status.state : 'off'; dot.title = syncLine(); } if (S.view === 'settings' && !typing()) render(); },
  onRecovery() {}, onLinkError(msg) { toast(msg); },
};

(async function start() {
  applyTheme(); applyLang();
  await db.open();
  (await db.loadAll()).forEach(r => S.recs.set(r.id, r));
  route();
  await sync.init(syncHooks);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
})();
