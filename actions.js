// actions.js — what happens on taps and form submits. Buttons carry data-action="name" (+ data-* values),
// forms carry data-form="name". app.js routes every click/submit here, so screens stay plain HTML strings.
import * as sync from './sync.js';
import { tr } from './i18n.js';
import { S, get, list, save, remove, toast, undoable, uid } from './core.js';
import { frageZuThema } from './content.js';
import { render, applyLang, applyTheme } from './render.js';

export const actions = {
  // Ein gemerktes Thema ist ein Record des Nutzers, kein redaktioneller Inhalt.
  async merken({ thema }) {
    const vorhanden = list('merk').find(r => r.data.thema === thema);
    if (vorhanden) { await undoable('Topic removed', [vorhanden.id], () => remove(vorhanden.id), render); return; }
    await save('merk', uid(), { thema, created: new Date().toISOString() });
    render(); toast('Topic remembered');
  },
  'open-thema'({ thema }) {
    const f = frageZuThema(thema);
    if (f) S.frage = f.id;
    location.hash = '#vergleich';
  },
  frage({ id }) { S.frage = id; render(); },
  'aussage-aufklappen'() { S.kontextOffen = true; render(); },
  theme({ v }) { try { localStorage.setItem('theme', v); } catch {} applyTheme(); render(); },
  lang({ v }) { applyLang(v); render(); },
  async 'sign-up'(_, el) {
    const f = el.closest('form'); if (!f.reportValidity()) return;
    const fd = new FormData(f);
    try { const inNow = await sync.signUp(fd.get('email').trim(), fd.get('password')); toast(inNow ? 'Signed in' : 'Check your email and confirm, then sign in here.'); }
    catch (e) { toast(sync.friendly(e)); }
  },
  async 'sign-out'() { if (!confirm(tr('Sign out? Your data stays on this device.'))) return; await sync.signOut(); render(); },
  export() {
    const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), records: [...S.recs.values()] }, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `backup-${new Date().toISOString().slice(0, 10)}.json` });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};

export const forms = {
  async 'sign-in'(fd) {
    try { await sync.signIn(fd.get('email').trim(), fd.get('password')); }
    catch (e) { throw new Error(sync.friendly(e)); }
  },
};
