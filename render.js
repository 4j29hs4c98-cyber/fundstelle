// render.js — draws the current screen. Every change re-renders the screen, but scroll positions
// and the focused control are kept, so the page never jumps.
import { $, S, TAB_OF } from './core.js';
import { tr, setLang, getLang } from './i18n.js';
import { viewStart } from './views/start.js';
import { viewThemen, viewThema } from './views/themen.js';
import { viewFrage } from './views/frage.js';
import { viewParteien, viewPartei } from './views/parteien.js';
import { viewPruefen } from './views/pruefen.js';
import { viewAuswahl } from './views/auswahl.js';
import { viewSettings } from './views/settings.js';
import { viewVergleich } from './views/vergleich.js';
import { viewProgramm } from './views/programm.js';
import { viewWahlen } from './views/wahlen.js';
import { viewGrundlagen } from './views/grundlagen.js';
import { viewEigene } from './views/eigene.js';

const views = { start: viewStart, themen: viewThemen, thema: viewThema, frage: viewFrage, parteien: viewParteien, partei: viewPartei,
  vergleich: viewVergleich, programm: viewProgramm, wahlen: viewWahlen, grundlagen: viewGrundlagen, pruefen: viewPruefen, auswahl: viewAuswahl, settings: viewSettings, eigene: viewEigene };
const FOCUS_KEYS = ['action', 'id', 'v', 'frage', 'bezug'];

export function render() {
  const seite = `${S.view}/${S.param ?? ''}`;
  const main = $('#main'), keep = render.last === seite, y = window.scrollY;
  const ae = document.activeElement, sig = keep && main.contains(ae) ? { tag: ae.tagName, elId: ae.id, d: Object.fromEntries(FOCUS_KEYS.map(k => [k, ae.dataset[k]])) } : null;
  main.style.minHeight = keep ? `${main.offsetHeight}px` : '';
  main.innerHTML = views[S.view](S.param);
  main.style.minHeight = '';
  const tab = TAB_OF[S.view] || S.view;
  document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === tab ? 'page' : 'false'));
  const ziel = keep ? null : main.querySelector('[data-ziel]');
  if (keep) window.scrollTo(0, y); else if (ziel) ziel.scrollIntoView(); else window.scrollTo(0, 0);
  if (sig) {
    const el = sig.elId ? document.getElementById(sig.elId) : [...main.querySelectorAll(sig.tag)].find(e => FOCUS_KEYS.every(k => e.dataset[k] === sig.d[k]));
    el?.focus({ preventScroll: true });
  }
  render.last = seite;
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
