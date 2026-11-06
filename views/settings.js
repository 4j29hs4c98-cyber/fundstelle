// views/settings.js — theme, language, account/sync, backup.
import { tr, getLang } from '../i18n.js';
import * as sync from '../sync.js';
import { esc } from '../core.js';

function ago(iso) { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? tr('just now') : tr('{n} min ago', { n: m }); }
export function syncLine() {
  const st = sync.status;
  return { syncing: tr('Syncing…'), offline: tr('Offline. Changes sync when you are back online.'), error: tr('Sync failed: {msg}', { msg: esc(st.error || '') }), idle: st.last ? tr('Synced {ago}', { ago: ago(st.last) }) : '' }[st.state] || '';
}
export function viewSettings() {
  let theme = 'system'; try { theme = localStorage.getItem('theme') || 'system'; } catch {}
  const st = sync.status;
  const account = st.state === 'unavailable' || st.state === 'off' ? `<p class="note">${tr('Local only: add your Supabase keys in config.js to sync between devices.')}</p>`
    : !st.user ? `<form class="stack" data-form="sign-in">
        <label>${tr('Email')}<input name="email" type="email" autocomplete="email" required></label>
        <label>${tr('Password')}<input name="password" type="password" autocomplete="current-password" minlength="8" required></label>
        <div class="row"><button class="btn primary">${tr('Sign in')}</button><button type="button" class="btn" data-action="sign-up">${tr('Create account')}</button></div></form>`
    : `<p>${tr('Signed in as {email}', { email: esc(st.user.email) })}</p><p class="note">${syncLine()}</p><div class="row"><button class="btn" data-action="sign-out">${tr('Sign out')}</button></div>`;
  return `
  <header class="page-head"><h1>${tr('Settings')}</h1></header>
  <section class="panel"><h2>${tr('Appearance')}</h2>
    <div class="seg">${['system', 'light', 'dark'].map(v => `<button data-action="theme" data-v="${v}" aria-pressed="${v === theme}">${tr(v[0].toUpperCase() + v.slice(1))}</button>`).join('')}</div>
    <h2>${tr('Language')}</h2>
    <div class="seg">${[['en', 'English'], ['de', 'Deutsch']].map(([v, l]) => `<button data-action="lang" data-v="${v}" aria-pressed="${v === getLang()}">${l}</button>`).join('')}</div>
  </section>
  <section class="panel"><h2>${tr('Sync')}</h2>${account}</section>
  <section class="panel"><h2>${tr('Your data')}</h2>
    <div class="row"><button class="btn" data-action="export">${tr('Export backup')}</button><label class="btn">${tr('Import backup')}<input type="file" id="import-file" accept="application/json" hidden></label></div>
  </section>`;
}
