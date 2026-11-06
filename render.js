// render.js — draws the current screen. Every change re-renders the screen, but scroll positions
// and the focused control are kept, so the page never jumps.
import { $, S } from './core.js';
import { tr, setLang, getLang } from './i18n.js';
import { viewUeberblick } from './views/ueberblick.js';
import { viewVergleich } from './views/vergleich.js';
import { viewKontext } from './views/kontext.js';
import { viewProgramme } from './views/programme.js';
import { viewSettings } from './views/settings.js';

const views = { ueberblick: viewUeberblick, vergleich: viewVergleich, kontext: viewKontext, programme: viewProgramme, settings: viewSettings };
const FOCUS_KEYS = ['action', 'id', 'v', 'thema'];

export function render() {
  const main = $('#main'), keep = render.last === S.view, y = window.scrollY;
  const ae = document.activeElement, sig = keep && main.contains(ae) ? { tag: ae.tagName, elId: ae.id, d: Object.fromEntries(FOCUS_KEYS.map(k => [k, ae.dataset[k]])) } : null;
  main.style.minHeight = keep ? `${main.offsetHeight}px` : '';
  main.innerHTML = views[S.view]();
  main.style.minHeight = '';
  document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === S.view ? 'page' : 'false'));
  if (keep) window.scrollTo(0, y); else window.scrollTo(0, 0);
  if (sig) {
    const el = sig.elId ? document.getElementById(sig.elId) : [...main.querySelectorAll(sig.tag)].find(e => FOCUS_KEYS.every(k => e.dataset[k] === sig.d[k]));
    el?.focus({ preventScroll: true });
  }
  render.last = S.view;
}
export function applyLang(v) {
  let l = v; try { l ||= localStorage.getItem('lang'); } catch {}
  setLang(l || ((navigator.language || 'en').startsWith('de') ? 'de' : 'en'));
  try { localStorage.setItem('lang', getLang()); } catch {}
  document.documentElement.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.dataset.i18n); });
}
export function applyTheme() {
  let t = 'system'; try { t = localStorage.getItem('theme') || 'system'; } catch {}
  if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
}
