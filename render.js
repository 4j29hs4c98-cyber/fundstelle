// render.js — draws the current screen. Every change re-renders the screen, but scroll positions
// and the focused control are kept, so the page never jumps.
import { $, S, TAB_OF, TABS } from './core.js';
import { tr, setLang, getLang } from './i18n.js';
import { viewStart } from './views/start.js';
import { viewThemen, viewThema } from './views/themen.js';
import { viewFrage } from './views/frage.js';
import { viewParteien, viewPartei } from './views/parteien.js';
import { viewPruefen } from './views/pruefen.js';
import { viewAuswahl } from './views/auswahl.js';
import { viewSettings } from './views/settings.js';
import { viewVergleich } from './views/vergleich.js';
import { halbkreisUebernehmen } from './views/halbkreis.js';
import { viewProgramm } from './views/programm.js';
import { viewWahlen } from './views/wahlen.js';
import { viewGrundlagen } from './views/grundlagen.js';
import { viewEigene, viewRecherche } from './views/eigene.js';

const views = { start: viewStart, themen: viewThemen, thema: viewThema, frage: viewFrage, parteien: viewParteien, partei: viewPartei,
  vergleich: viewVergleich, programm: viewProgramm, wahlen: viewWahlen, grundlagen: viewGrundlagen, pruefen: viewPruefen, auswahl: viewAuswahl, settings: viewSettings, eigene: viewEigene, recherche: viewRecherche };
const FOCUS_KEYS = ['action', 'id', 'v', 'frage', 'bezug'];

// Seiten, deren Parameter nur eine Auswahl auf derselben Seite ist (Parteien im Vergleich). Ein Wechsel dort ist kein
// Seitenwechsel: kein erneutes Einblenden, kein Sprung nach oben.
const AUSWAHL_IM_PARAM = new Set(['vergleich']);

export function render() {
  const seite = `${S.view}/${S.param ?? ''}`;
  const main = $('#main'), y = window.scrollY;
  const keep = render.last === seite || (render.lastView === S.view && AUSWAHL_IM_PARAM.has(S.view));
  const ae = document.activeElement, sig = keep && main.contains(ae) ? { tag: ae.tagName, elId: ae.id, d: Object.fromEntries(FOCUS_KEYS.map(k => [k, ae.dataset[k]])) } : null;
  main.style.minHeight = keep ? `${main.offsetHeight}px` : '';
  if (keep) main.classList.remove('enter'); // neue Kinder derselben Seite sollen nicht erneut einblenden
  const html = views[S.view](S.param);
  if (!(keep && halbkreisBehalten(main, html))) main.innerHTML = html;
  main.style.minHeight = '';
  const tab = TAB_OF[S.view] || S.view;
  if (!keep) einblenden(main, tab);
  document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === tab ? 'page' : 'false'));
  const ziel = keep ? null : main.querySelector('[data-ziel]');
  if (keep) window.scrollTo(0, y); else if (ziel) ziel.scrollIntoView(); else window.scrollTo(0, 0);
  if (sig) {
    const el = sig.elId ? document.getElementById(sig.elId) : [...main.querySelectorAll(sig.tag)].find(e => FOCUS_KEYS.every(k => e.dataset[k] === sig.d[k]));
    el?.focus({ preventScroll: true });
  }
  render.last = seite;
  render.lastView = S.view;
  render.lastTab = tab;
}

// Neuzeichnen um den Halbkreis herum: Alle anderen Kinder von #main werden ersetzt, die Grafik selbst bleibt die ganze
// Zeit im Dokument und uebernimmt nur Klassen und Texte. Verlaesst ein Element das Dokument auch nur kurz, verwirft der
// Browser seinen Stil; dann liefen weder Uebergaenge noch bliebe das Einblenden aus. Liefert false, wenn das nicht passt.
function halbkreisBehalten(main, html) {
  const alt = main.querySelector(':scope > [data-halbkreis]');
  if (!alt) return false;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const neu = [...tpl.content.children].find(el => el.hasAttribute('data-halbkreis')); // ":scope >" greift in Fragmenten nicht
  if (!neu || !halbkreisUebernehmen(alt, neu)) return false;
  const kinder = [...tpl.content.childNodes], k = kinder.indexOf(neu);
  [...main.childNodes].forEach(n => { if (n !== alt) n.remove(); });
  alt.before(...kinder.slice(0, k));
  alt.after(...kinder.slice(k + 1));
  return true;
}

// Sanfter Uebergang nur beim Wechsel der Seite, nie beim Neuzeichnen derselben Seite (sonst flackert jede Eingabe).
// Zwischen Bereichen der Tab-Leiste gleitet der Inhalt aus der passenden Richtung, tiefere Seiten steigen leicht auf.
// Das CSS schaltet die Bewegung bei prefers-reduced-motion ab.
function einblenden(main, tab) {
  const vorher = TABS.indexOf(render.lastTab), jetzt = TABS.indexOf(tab);
  main.dataset.dir = vorher < 0 || jetzt < 0 || vorher === jetzt || !TABS.includes(S.view) ? 'auf' : jetzt > vorher ? 'vor' : 'zurueck';
  main.classList.remove('enter');
  void main.offsetWidth; // Neustart der Animation erzwingen
  main.classList.add('enter');
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
