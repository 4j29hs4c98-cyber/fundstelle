// render.js — draws the current screen. Every change re-renders the screen, but scroll positions
// and the focused control are kept, so the page never jumps.
import { $, S, TAB_OF, TABS, FOLGT_HERKUNFT } from './core.js';
import { tr, setLang, getLang } from './i18n.js';
import { viewStart } from './views/start.js';
import { viewThemen, viewThema } from './views/themen.js';
import { viewFrage } from './views/frage.js';
import { viewParteien, viewPartei } from './views/parteien.js';
import { viewPruefen } from './views/pruefen.js';
import { viewSettings } from './views/settings.js';
import { viewVergleich } from './views/vergleich.js';
import { halbkreisUebernehmen } from './views/halbkreis.js';
import { viewProgramm } from './views/programm.js';
import { viewWahlen } from './views/wahlen.js';
import { viewGrundlagen } from './views/grundlagen.js';
import { viewRecherche } from './views/eigene.js';
import { viewNachricht, viewNachrichten } from './views/nachrichten.js';

const views = { start: viewStart, themen: viewThemen, thema: viewThema, frage: viewFrage, parteien: viewParteien, partei: viewPartei,
  vergleich: viewVergleich, programm: viewProgramm, wahlen: viewWahlen, grundlagen: viewGrundlagen, pruefen: viewPruefen, settings: viewSettings, recherche: viewRecherche, nachricht: viewNachricht, nachrichten: viewNachrichten };
const FOCUS_KEYS = ['action', 'id', 'v', 'frage', 'bezug'];

// Seiten, deren Parameter nur eine Auswahl auf derselben Seite ist (Parteien im Vergleich). Ein Wechsel dort ist kein
// Seitenwechsel: kein erneutes Einblenden, kein Sprung nach oben.
const AUSWAHL_IM_PARAM = new Set(['vergleich']);

// Tab-Titel aus der sichtbaren Ueberschrift, damit Verlauf und Tabs zeigen, welche Seite offen ist.
// Parteizeichen (aria-hidden) fallen weg, sonst stuende der Kurzname doppelt im Titel.
const APP_NAME = 'Fundstelle';
function seitenTitel(main) {
  const h1 = S.view === 'start' ? null : main.querySelector('h1');
  if (!h1) return APP_NAME;
  const kopie = h1.cloneNode(true);
  kopie.querySelectorAll('[aria-hidden="true"]').forEach(e => e.remove());
  const text = kopie.textContent.replace(/\s+/g, ' ').trim();
  return text ? `${text} · ${APP_NAME}` : APP_NAME;
}

// Bereich der Tab-Leiste fuer die aktuelle Seite. Vergleich und Programm-Leser behalten den Bereich der vorigen Seite.
export function bereich() {
  if (FOLGT_HERKUNFT.has(S.view) && TABS.includes(render.lastTab)) return render.lastTab;
  return TAB_OF[S.view] || S.view;
}

// Namen der Bereiche, wenn eine Seite keinen Pfad hat (Startseiten der Bereiche).
const BEREICH_NAME = { start: 'Start', themen: 'Topics', parteien: 'Parties', pruefen: 'Check', settings: 'Settings' };

// Pfad der gezeichneten Seite samt ihr selbst als letzte Stufe. Daraus wird die Herkunft der naechsten Seite.
function seitenPfad(main) {
  const nav = main.querySelector('nav.pfad');
  const stufen = nav ? [...nav.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim() })) : [];
  const text = nav?.querySelector('[aria-current] span')?.textContent.trim()
    || (BEREICH_NAME[S.view] ? tr(BEREICH_NAME[S.view]) : seitenTitel(main).split(' · ')[0]);
  return [...stufen, { href: location.hash || '#start', text }];
}

// Vergleich, Programm-Leser und eigene Frage haengen sich an die vorige Seite. Fuehrt der Weg im Kreis (Programm aus dem
// Vergleich, dann zurueck zum Vergleich), wird der Pfad an der Stelle der Seite selbst abgeschnitten.
function herkunftMerken() {
  if (!FOLGT_HERKUNFT.has(S.view) || render.lastView === S.view) return;
  if (!render.pfad) { S.herkunft = null; return; }
  const hier = location.hash, i = render.pfad.findIndex(s => s.href === hier);
  S.herkunft = i >= 0 ? render.pfad.slice(0, i) : render.pfad;
}

// Zuruecknavigation: Jeder Verlaufseintrag bekommt beim ersten Zeichnen die Marke "besucht", danach schreibt app.js beim
// Scrollen die Position hinein (history.state.y). Traegt der Eintrag die Marke schon, war man hier: die Seite springt an
// dieselbe Stelle. Inhalte, die spaeter laden, machen die Seite erst nach und nach lang genug: dann noch ein paar Mal nachfassen.
function scrollWiederherstellen(seite) {
  const st = history.state, y = st?.y;
  if (!st?.besucht || typeof y !== 'number') {
    try { history.replaceState({ ...(st || {}), besucht: true, y: 0 }, ''); } catch {}
    return false;
  }
  window.scrollTo(0, y);
  [150, 400, 900].forEach(ms => setTimeout(() => {
    if (render.last === seite && Math.abs(window.scrollY - y) > 2 && !render.gescrollt) window.scrollTo(0, y);
  }, ms));
  return true;
}

export function render() {
  const seite = `${S.view}/${S.param ?? ''}`;
  const main = $('#main'), y = window.scrollY;
  if (!main) return; // Seite ohne App-Geruest (etwa in Tests ersetzt): nichts zu zeichnen
  const keep = render.last === seite || (render.lastView === S.view && AUSWAHL_IM_PARAM.has(S.view));
  if (!keep) { herkunftMerken(); render.vorigeAdresse = render.adresse; render.adresse = location.hash || '#start'; render.gescrollt = false; }
  const ae = document.activeElement, sig = keep && main.contains(ae) ? { tag: ae.tagName, elId: ae.id, d: Object.fromEntries(FOCUS_KEYS.map(k => [k, ae.dataset[k]])) } : null;
  main.style.minHeight = keep ? `${main.offsetHeight}px` : '';
  if (keep) main.classList.remove('enter'); // neue Kinder derselben Seite sollen nicht erneut einblenden
  const html = views[S.view](S.param);
  if (!(keep && halbkreisBehalten(main, html))) main.innerHTML = html;
  main.style.minHeight = '';
  document.title = seitenTitel(main);
  const tab = bereich();
  if (!keep) einblenden(main, tab);
  document.querySelectorAll('[data-nav]').forEach(a => a.setAttribute('aria-current', a.dataset.nav === tab ? 'page' : 'false'));
  const ziel = keep ? null : main.querySelector('[data-ziel]');
  if (keep) window.scrollTo(0, y); else if (scrollWiederherstellen(seite)) { /* zurueck an dieselbe Stelle */ } else if (ziel) ziel.scrollIntoView(); else window.scrollTo(0, 0);
  if (sig) {
    const el = sig.elId ? document.getElementById(sig.elId) : [...main.querySelectorAll(sig.tag)].find(e => FOCUS_KEYS.every(k => e.dataset[k] === sig.d[k]));
    el?.focus({ preventScroll: true });
  }
  render.pfad = seitenPfad(main);
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
