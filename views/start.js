// views/start.js — "Was willst du wissen?": ein Fragenfeld, darunter die Themen des Tages und die Themenreihe, dann
// naechste eigene Wahl und Fragen zu den eigenen Themen. Neue Abstimmungen stehen auf der Frage, Gemerktes unter Themen.
import { tr, plural } from '../i18n.js';
import { esc, S } from '../core.js';
import { tageBis, thema, themenSortiert, fragenZuThema, frageSuche } from '../content.js';
import { profil, hatProfil, naechsteEigeneWahl } from '../profil.js';
import { kopf, pfeil, termin, demoHinweis } from './teile.js';
import { vergleichLink } from './vergleich.js';
import { aktuellHtml } from './nachrichten.js';

const HINWEIS_TAGE = 90;

// Vorschlaege beim Tippen: nur aufbereitete Fragen aus der App, sortiert nach Zahl der Treffer (frageSuche), nie nach
// Beliebtheit. Wird bei jeder Eingabe in #vorschlaege neu gezeichnet, das Feld selbst bleibt unberuehrt (app.js).
export const MAX_VORSCHLAEGE = 5;
export function vorschlaegeHtml(text) {
  const r = String(text ?? '').trim().length >= 3 ? frageSuche(text) : null;
  if (!r?.fragen.length) return '';
  return `<p class="eyebrow">${tr('Already in the app')}</p>
  <ul class="vorschlaege">${r.fragen.slice(0, MAX_VORSCHLAEGE).map(f => `<li><a href="#frage/${esc(f.id)}"><span>${esc(f.frage)}</span>
    <span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a></li>`).join('')}</ul>`;
}

function hinweis(w, pr) {
  if (!pr.hinweise || !w?.datum || !pr.themen.length) return '';
  const tage = tageBis(w.datum);
  if (tage > HINWEIS_TAGE) return '';
  return `<section class="hinweis" role="status"><b>${plural(tage, tr('Tomorrow: {name}', { name: esc(w.name) }), tr('In {n} days: {name}', { n: tage, name: esc(w.name) }))}</b>
    <p>${tr('See what the parties say on your topics.')}</p><a class="go" href="${esc(vergleichLink([], pr.themen[0]))}">${tr('Compare')} ${pfeil}</a></section>`;
}

export function viewStart() {
  const pr = profil(), w = naechsteEigeneWahl();
  const meine = pr.themen.flatMap(fragenZuThema);
  return `${kopf(tr('Today'), `${tr('Politics is complicated enough.')}<br><em>${tr('The information about it is not.')}</em>`)}

  <form class="search fragefeld" data-form="startfrage" role="search">
    <label class="sr-only" for="start-q">${tr('Ask your own question')}</label>
    <input id="start-q" name="q" type="search" value="${esc(S.frage)}" placeholder="${tr('e.g. Which party wants more for homeless people?')}" autocomplete="off" maxlength="200">
    <button class="btn primary">${tr('Ask')}</button>
  </form>
  <div id="vorschlaege" aria-live="polite"></div>
  <p class="note small erstbesuch">${tr('Ask something, or pick a topic. Every answer ends at the passage in the programme.')}</p>
  ${aktuellHtml()}

  <h2 class="eyebrow section-label">${tr('Topics')}</h2>
  <nav class="qbar themenreihe" aria-label="${tr('Topics')}">${themenSortiert().map(t => `<a class="qchip" href="#thema/${esc(t.id)}">${esc(t.titel)}</a>`).join('')}</nav>

  ${hinweis(w, pr)}
  ${w ? `<a class="ballot" href="#wahlen"><div><b>${esc(w.name)}</b><span>${termin(w)}</span></div>
    ${w.datum ? `<span class="n" aria-label="${plural(tageBis(w.datum), tr('1 day to go'), tr('{n} days to go', { n: tageBis(w.datum) }))}">${tageBis(w.datum)}</span>` : `<span class="arrow" aria-hidden="true">→</span>`}</a>` : ''}
  ${hatProfil() ? '' : `<a class="card link profil-tipp" href="#settings"><b>${tr('Which elections matter to you?')}</b>
    <span class="meta">${tr('Set up profile')} →</span></a>`}

  ${meine.length ? `<h2 class="eyebrow section-label">${tr('For you')}</h2>
    <div class="cards">${meine.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`).join('')}</div>` : ''}

  ${demoHinweis()}
  <p class="hint">${tr('Swipe sideways to change section.')}</p>`;
}
