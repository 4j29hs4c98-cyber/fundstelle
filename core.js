// core.js — state, data records and small helpers. No screen code here.
// DATA RULE: everything is a record { id, kind, data, updated_at, deleted, synced }.
// New fields inside data must be OPTIONAL (old records don't have them). Never rename or remove fields;
// add new ones instead, so older app versions and other devices keep working.
import * as db from './db.js';
import * as sync from './sync.js';
import { tr } from './i18n.js';

export const $ = (s, el = document) => el.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
// Vier Bereiche in der Leiste (seitlich wischen wechselt zwischen ihnen). Dazu Detailseiten mit Parameter
// (#frage/<id>), die feste Seite "Wie wir auswaehlen" und die Einstellungen hinter dem Zahnrad.
export const TABS = ['start', 'themen', 'parteien', 'pruefen'];
// #vergleich/<id,id>, #programm/<partei>/<seite>, #wahlen.
export const VIEWS = [...TABS, 'thema', 'frage', 'partei', 'vergleich', 'programm', 'wahlen', 'grundlagen', 'auswahl', 'settings', 'eigene'];
export const TAB_OF = { thema: 'themen', frage: 'themen', partei: 'parteien', vergleich: 'parteien', programm: 'parteien', wahlen: 'start', grundlagen: 'themen', eigene: 'themen' };
// Adressen aus Version 1, damit alte Lesezeichen weiter funktionieren. #vergleich ist wieder eine eigene Seite.
export const ALTE_ADRESSEN = { ueberblick: 'start', programme: 'parteien', kontext: 'pruefen' };

// param/suche/frage/alleWahlen/melden sind reiner Anzeigezustand, nichts davon wird gespeichert.
export const S = { recs: new Map(), view: 'start', param: null, suche: '', frage: '', alleWahlen: false, melden: null };

export const list = kind => [...S.recs.values()].filter(r => r.kind === kind && !r.deleted);
export const get = id => { const r = S.recs.get(id); return r && !r.deleted ? r : null; };

export async function save(kind, id, data) {
  const rec = { id, kind, data, updated_at: new Date().toISOString(), deleted: false, synced: false };
  S.recs.set(id, rec);
  await db.put(rec);
  sync.schedule();
  return rec;
}
export async function remove(id) { // soft delete, so the deletion syncs to other devices
  const r = S.recs.get(id);
  if (!r) return;
  const rec = { ...r, deleted: true, updated_at: new Date().toISOString(), synced: false };
  S.recs.set(id, rec);
  await db.put(rec);
  sync.schedule();
}

// Toast with optional action button ("Undo"). onTimeout runs if the action wasn't used.
export function toast(msg, opt = {}) {
  const t = $('#toast');
  const pending = toast.pending; toast.pending = null; clearTimeout(toast.tm); pending?.();
  t.replaceChildren(Object.assign(document.createElement('span'), { textContent: tr(msg) }));
  t.classList.toggle('has-action', !!opt.action);
  if (opt.action) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'toast-action', textContent: tr(opt.action) });
    b.onclick = e => { e.stopPropagation(); toast.pending = null; clearTimeout(toast.tm); t.classList.remove('show'); opt.onAction?.(); };
    t.append(b);
  }
  toast.pending = opt.onTimeout || null;
  t.classList.add('show');
  toast.tm = setTimeout(() => { t.classList.remove('show'); const p = toast.pending; toast.pending = null; p?.(); }, opt.duration || 2200);
}
// Delete/overwrite right away and offer Undo for 5 s instead of a confirm() popup.
export async function undoable(msg, ids, work, render) {
  const before = ids.map(id => ({ id, rec: get(id) ? structuredClone(get(id)) : null }));
  await work(); render();
  toast(msg, { action: 'Undo', duration: 5000, onAction: async () => {
    for (const b of before) { if (b.rec) await save(b.rec.kind, b.id, b.rec.data); else await remove(b.id); }
    render(); toast('Restored');
  } });
}
