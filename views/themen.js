// views/themen.js — "Was sagen die Parteien zu X?": Themen, dann die Fragen eines Themas.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { themenSortiert, thema, fragenZuThema, positionenZuFrage } from '../content.js';
import { kopf, pfeil, demoHinweis } from './teile.js';

export function viewThemen() {
  return `${kopf(tr('Topics'), tr('What do the parties say about it?'), tr('Pick a topic, then a question. Every question shows all programmes side by side.'))}
  <div class="cards">${themenSortiert().map(t => {
    const n = fragenZuThema(t.id).length;
    return `<article class="card"><h3>${esc(t.titel)}</h3><p>${esc(t.kurz ?? '')}</p>
      <div class="card-foot"><span class="meta">${tr('{n} questions', { n })}</span>
        <a class="go" href="#thema/${esc(t.id)}">${tr('Open')} ${pfeil}</a></div></article>`;
  }).join('')}</div>
  ${demoHinweis()}`;
}

export function viewThema(id) {
  const t = thema(id);
  if (!t) return viewThemen();
  return `${kopf(tr('Topic'), esc(t.titel), esc(t.kurz ?? ''), { href: '#themen', text: tr('All topics') })}
  <div class="cards">${fragenZuThema(t.id).map(f => {
    const n = positionenZuFrage(f.id).filter(p => p.haltung !== 'keine_angabe').length;
    return `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3>
      <span class="meta">${tr('{n} programmes take a position', { n })}</span></a>`;
  }).join('') || `<p class="note">${tr('No questions on this topic yet.')}</p>`}</div>`;
}
