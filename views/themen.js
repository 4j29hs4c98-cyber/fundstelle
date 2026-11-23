// views/themen.js — "Was sagen die Parteien zu X?": Themen, dann die Fragen eines Themas.
import { tr, plural } from '../i18n.js';
import { esc, list } from '../core.js';
import { themenSortiert, thema, frage, fragenZuThema, positionenZuFrage, ALTE_THEMEN } from '../content.js';
import { kopf, pfad, pfeil, demoHinweis } from './teile.js';
import { gespeicherteThemen } from './eigene.js';

// Gemerkte Fragen (kind 'merk', { frage }) und gemerkte Themen aus Version 1 ({ thema }, Kurzname oder ID).
function gemerkteKarten() {
  const fragen = list('merk').map(r => frage(r.data.frage)).filter(Boolean);
  const themen = list('merk').map(r => ({ rec: r, t: thema(ALTE_THEMEN[r.data.thema] || r.data.thema) })).filter(x => x.t);
  return [
    ...fragen.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`),
    ...themen.map(({ rec, t }) => `<article class="card"><div class="card-row"><h3>${esc(t.titel)}</h3>
        <button class="pin" data-action="vergessen" data-id="${esc(rec.id)}" aria-pressed="true" aria-label="${tr('Remove')}">★</button></div>
      <div class="card-foot"><span class="meta">${tr('Topic')}</span><a class="go" href="#thema/${esc(t.id)}">${tr('Open')} ${pfeil}</a></div></article>`),
  ];
}

export function viewThemen() {
  const gemerkt = gemerkteKarten();
  return `${kopf(tr('Topics'), tr('What do the parties say about it?'), tr('Pick a topic, then a question. Every question shows all programmes side by side.'))}
  ${gemerkt.length ? `<h2 class="eyebrow section-label">${tr('Saved for later')}</h2><div class="cards">${gemerkt.join('')}</div>
  <h2 class="eyebrow section-label">${tr('All topics')}</h2>` : ''}
  <div class="cards">${themenSortiert().map(t => {
    const n = fragenZuThema(t.id).length;
    return `<a class="card link" href="#thema/${esc(t.id)}"><div class="card-row"><h3>${esc(t.titel)}</h3>${pfeil}</div>
      <p>${esc(t.kurz ?? '')}</p><span class="meta">${plural(n, tr('1 question'), tr('{n} questions', { n }))}</span></a>`;
  }).join('')}</div>
  ${gespeicherteThemen()}
  <h2 class="eyebrow section-label">${tr('Not listed?')}</h2>
  <a class="card link" href="#recherche"><div class="card-row"><h3>${tr('Ask your own question')}</h3>${pfeil}</div>
    <span class="meta">${tr('A KI searches all programmes while you type.')}</span></a>
  <h2 class="eyebrow section-label">${tr('Basics')}</h2>
  <a class="card link" href="#grundlagen"><div class="card-row"><h3>${tr('How politics works')}</h3>${pfeil}</div>
    <span class="meta">${tr('Short, neutral explanations of the terms that come up in programmes and votes.')}</span></a>
  ${demoHinweis()}`;
}

export function viewThema(id) {
  const t = thema(id);
  if (!t) return viewThemen();
  return `${kopf(tr('Topic'), esc(t.titel), esc(t.kurz ?? ''), pfad([{ href: '#themen', text: tr('Topics') }], t.titel))}
  <div class="cards">${fragenZuThema(t.id).map(f => {
    const n = positionenZuFrage(f.id).filter(p => p.haltung !== 'keine_angabe').length;
    return `<a class="card link" href="#frage/${esc(f.id)}"><div class="card-row"><h3>${esc(f.frage)}</h3>${pfeil}</div>
      <span class="meta">${plural(n, tr('1 programme takes a position'), tr('{n} programmes take a position', { n }))}</span></a>`;
  }).join('') || `<p class="note">${tr('No questions on this topic yet.')}</p>`}</div>`;
}
