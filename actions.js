// actions.js — what happens on taps and form submits. Buttons carry data-action="name" (+ data-* values),
// forms carry data-form="name". app.js routes every click/submit here, so screens stay plain HTML strings.
import * as sync from './sync.js';
import { tr } from './i18n.js';
import { S, get, list, save, remove, toast, undoable, uid } from './core.js';
import { render, applyLang, applyTheme } from './render.js';

export const actions = {
  // Eine gemerkte Frage ist ein Record des Nutzers, kein redaktioneller Inhalt. Format: { frage: <id>, created }.
  async merken({ frage }) {
    const vorhanden = list('merk').find(r => r.data.frage === frage);
    if (vorhanden) { await undoable('Question removed', [vorhanden.id], () => remove(vorhanden.id), render); return; }
    await save('merk', uid(), { frage, created: new Date().toISOString() });
    render(); toast('Question remembered');
  },
  // Entfernt einen gemerkten Eintrag aus Version 1 (Thema statt Frage).
  async vergessen({ id }) { await undoable('Topic removed', [id], () => remove(id), render); },
  // Oeffnet (bezug gesetzt) oder schliesst (bezug leer) das Formular "Fehler melden".
  melden({ bezug }) {
    S.melden = bezug || null; render();
    if (S.melden) document.getElementById('melden-text')?.focus();
  },
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
  suche(fd) { S.suche = String(fd.get('q') || '').trim().slice(0, 200); },
  // Meldungen landen in einer Tabelle, die nur das Team lesen kann. Nur angemeldet, damit niemand anonym flutet.
  async melden(fd) {
    const text = String(fd.get('text') || '').trim(), bezug = String(fd.get('bezug') || '').slice(0, 200);
    if (text.length < 3) throw new Error('Please describe the error in a few words.');
    const client = sync.getClient();
    if (!client) throw new Error('Reports need a connection to the server.');
    if (!sync.status.user) throw new Error('Sign in under Settings to send a report.');
    const { error } = await client.from('fehlermeldungen').insert({ bezug, text: text.slice(0, 1000) });
    if (error) { console.error(error); throw new Error('The report could not be sent. Try again later.'); }
    S.melden = null; toast('Thank you. The team will check it.');
  },
  async 'sign-in'(fd) {
    try { await sync.signIn(fd.get('email').trim(), fd.get('password')); }
    catch (e) { throw new Error(sync.friendly(e)); }
  },
};
