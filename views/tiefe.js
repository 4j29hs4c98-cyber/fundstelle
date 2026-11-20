// views/tiefe.js — Block "Tiefensuche" unter den Ergebnissen einer Frage der Startseite. Zeigt erst einen Knopf,
// dann den Fortschritt, dann Zusammenfassung und Belege (jeder Beleg wurde auf seiner Seite woertlich nachgeprueft).
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { R } from '../recherche.js';
import { T } from '../tiefe.js';
import { pfeil, extLink } from './teile.js';

const SCHRITT = { suchen: 'Searching reputable sources …', belege: 'Checking every quote on its source page …' };
const RICHTUNG = { dafuer: 'Speaks for yes', dagegen: 'Speaks for no', kontext: 'Adds context' };
const FEHLER = { zu_wenig: 'The question is too short for a deep search.', grenze: 'You have reached the limit of deep searches for now. Please try again later.',
  nicht_verfuegbar: 'Deep search is not available right now.', keine_antwort: 'The deep search did not produce a usable result. Please try again.',
  abgebrochen: 'The deep search was interrupted. Please try again.' };

const knopf = text => `<p><button class="btn" data-action="tiefe-starten">${tr(text)}</button></p>`;

function befundHtml(b) {
  return `<li class="befund ${esc(b.richtung)}"><span class="meta">${tr(RICHTUNG[b.richtung])} · ${esc(b.seite)}</span>
    <p>${esc(b.aussage)}</p><blockquote class="auszug">„${esc(b.auszug)}“</blockquote>
    <p class="meta">${extLink(b.url, `${esc(b.titel || b.seite)} ${pfeil}`)}</p></li>`;
}

function ergebnisBlock(e) {
  const zusammenfassung = e.zusammenfassung
    ? `<p class="warum"><span class="eyebrow">${tr('Summary of the sources')}</span>${esc(e.zusammenfassung)}</p>` : '';
  const duenn = e.wenigBelege
    ? `<p class="note">${e.befunde.length ? tr('Only one source could be verified, so there is no summary. The verified passage is shown below.') : tr('No source could be verified, so nothing is shown.')}</p>` : '';
  const teil = e.teilfragen.length ? `<p class="meta">${tr('Sub-questions')}: ${e.teilfragen.map(esc).join(' · ')}</p>` : '';
  const offen = e.offen ? `<p class="note small"><b>${tr('Still unclear')}:</b> ${esc(e.offen)}</p>` : '';
  return `${teil}${zusammenfassung}${duenn}${e.befunde.length ? `<ul class="befunde">${e.befunde.map(befundHtml).join('')}</ul>` : ''}${offen}
    <p class="note small">${tr('Deep search by a KI on a fixed list of reputable sites. Every quote was checked word for word on its page. This is not a verdict.')}</p>`;
}

// Nur bei einer fertigen Recherche und nur fuer genau diese Frage; eine Tiefensuche zu einer anderen Frage bleibt unsichtbar.
export function tiefeHtml() {
  if (R.status !== 'fertig') return '';
  const kopf = `<h2 class="eyebrow section-label">${tr('Deep search')}</h2>`;
  if (T.frage !== R.frage || T.status === 'leer') {
    return `${kopf}<p class="note small">${tr('Searches reputable sources on the web in addition to the programmes. Takes about two minutes. Each deep search uses paid KI research, so please only start it when you need it.')}</p>${knopf('Start deep search')}`;
  }
  if (T.status === 'laeuft') return `${kopf}<p class="meta" role="status" aria-busy="true">${tr(SCHRITT[T.schritt] ?? SCHRITT.suchen)}</p>`;
  if (T.status === 'anmelden') return `${kopf}<p class="note">${tr('Sign in to start a deep search.')} <a class="go" href="#settings">${tr('Sign in')} ${pfeil}</a></p>`;
  if (T.status === 'aus') return `${kopf}<p class="note">${tr('Deep search is not available in this version.')}</p>`;
  if (T.status === 'fehler') return `${kopf}<p class="note">${tr(FEHLER[T.fehler] ?? FEHLER.abgebrochen)}</p>${knopf('Try again')}`;
  return `${kopf}${ergebnisBlock(T.ergebnis)}`;
}
