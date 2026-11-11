// actions.js — what happens on taps and form submits. Buttons carry data-action="name" (+ data-* values),
// forms carry data-form="name". app.js routes every click/submit here, so screens stay plain HTML strings.
import * as sync from './sync.js';
import { tr } from './i18n.js';
import { S, get, list, save, remove, toast, undoable, uid } from './core.js';
import { render, applyLang, applyTheme } from './render.js';
import { WAHLARTEN, BUNDESLAENDER } from './katalog.js';
import { C, frageSuche } from './content.js';
import { R, tippen } from './recherche.js';
import { ergebnisHtml } from './views/eigene.js';
import { PROFIL_ID } from './profil.js';
import { vergleichAus, vergleichLink, MAX_VERGLEICH } from './views/vergleich.js';

// Aktuelle Vergleichsauswahl direkt aus der Adresse, nicht aus S.param: Das hashchange-Ereignis kommt verzoegert, und
// wer schnell hintereinander tippt, wuerde sonst auf einer veralteten Auswahl aufbauen und eine Partei verlieren.
function vergleichJetzt() {
  const [seite, ...rest] = location.hash.slice(1).split('/');
  if (seite !== 'vergleich') return vergleichAus('');
  try { return vergleichAus(decodeURIComponent(rest.join('/'))); } catch { return vergleichAus(''); }
}

export const actions = {
  // Eine gemerkte Frage ist ein Record des Nutzers, kein redaktioneller Inhalt. Format: { frage: <id>, created }.
  async merken({ frage }) {
    const vorhanden = list('merk').find(r => r.data.frage === frage);
    if (vorhanden) { await undoable('Question removed', [vorhanden.id], () => remove(vorhanden.id), render); return; }
    await save('merk', uid(), { frage, created: new Date().toISOString() });
    render(); toast('Question remembered');
  },
  // Eigenes Thema speichern: Frage und gepruefte Ergebnisse als Record des Nutzers. Format: { frage, ergebnisse, stand }.
  async 'eigen-speichern'() {
    if (R.status !== 'fertig' || !(R.ergebnisse.length || R.belege.length || R.taten.length)) return;
    const id = uid();
    await save('eigenes', id, { frage: R.frage, typ: R.typ, ergebnisse: R.ergebnisse.map(e => ({ ...e })),
      ...(R.typ === 'person' ? { person: { ...R.person }, belege: R.belege.map(b => ({ ...b })) }
        : { taten: R.taten.map(t => structuredClone(t)), ohne_fraktion: [...R.ohneFraktion] }), stand: new Date().toISOString() });
    toast('Topic saved'); location.hash = `#eigene/${id}`;
  },
  async 'eigen-loeschen'({ id }) { location.hash = '#eigene'; await undoable('Topic deleted', [id], () => remove(id), render); },
  // Entfernt einen gemerkten Eintrag aus Version 1 (Thema statt Frage).
  async vergessen({ id }) { await undoable('Topic removed', [id], () => remove(id), render); },
  // Oeffnet (bezug gesetzt) oder schliesst (bezug leer) das Formular "Fehler melden".
  melden({ bezug }) {
    S.melden = bezug || null; render();
    if (S.melden) document.getElementById('melden-text')?.focus();
  },
  // Partei im Vergleich an- oder abwaehlen. Die Auswahl lebt in der Adresse, deshalb nur den Hash setzen.
  vergleich({ id }) {
    const v = vergleichJetzt();
    if (!v.ids.includes(id) && v.ids.length >= MAX_VERGLEICH) { toast('At most four parties at once.'); return; }
    location.hash = vergleichLink(v.ids.includes(id) ? v.ids.filter(x => x !== id) : [...v.ids, id], v.thema);
  },
  'vergleich-thema'({ id }) { location.hash = vergleichLink(vergleichJetzt().ids, id); },
  'alle-wahlen'() { S.alleWahlen = !S.alleWahlen; render(); },
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
  // Gibt es in der App schon passende Fragen, erscheinen sie auf der Startseite. Sonst oeffnet sich eine eigene Seite,
  // und der Agent recherchiert sofort.
  startfrage(fd) {
    S.frage = String(fd.get('q') || '').trim().slice(0, 200);
    const r = S.frage ? frageSuche(S.frage) : null;
    if (!S.frage || r?.fragen.length) return;
    tippen(S.frage, () => { const el = document.getElementById('recherche'); if (el) el.innerHTML = ergebnisHtml(); }, true);
    location.hash = '#recherche';
  },
  // Nur bekannte Werte speichern: was aus dem Formular kommt, wird gegen die Listen geprueft.
  async profil(fd) {
    const arten = WAHLARTEN.map(w => w.id), laender = BUNDESLAENDER.map(l => l.id), themen = C.themen.map(t => t.id);
    const land = String(fd.get('land') || '');
    await save('profil', PROFIL_ID, {
      wahlarten: fd.getAll('art').filter(a => arten.includes(a)),
      land: laender.includes(land) ? land : '',
      themen: fd.getAll('thema').filter(t => themen.includes(t)),
      hinweise: fd.get('hinweise') === '1',
    });
    toast('Profile saved');
  },
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
