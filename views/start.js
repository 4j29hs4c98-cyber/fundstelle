// views/start.js — "Was ist gerade los?": naechste Wahl, neue Abstimmungen (fuehren zur Frage), fuer spaeter Gemerktes.
import { tr } from '../i18n.js';
import { esc, list } from '../core.js';
import { naechsteWahl, tageBis, neueAbstimmungen, frage, thema, ALTE_THEMEN } from '../content.js';
import { kopf, pfeil, datum, demoHinweis, safeUrl } from './teile.js';

function abstimmungKarte(a) {
  const f = frage(a.fragen[0]);
  const ziel = f ? `<a class="go" href="#frage/${esc(f.id)}">${tr('To the question')} ${pfeil}</a>`
    : safeUrl(a.url) ? `<a class="go" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">${tr('Official source')} ${pfeil}</a>` : '';
  return `<article class="card"><h3>${esc(a.titel)}</h3>
    <p>${esc(a.parlament)} · ${datum(a.datum)}</p>
    <div class="card-foot"><span class="meta">${f ? esc(f.kurz) : ''}</span>${ziel}</div></article>`;
}

function gemerkteKarten() {
  const fragen = list('merk').map(r => frage(r.data.frage)).filter(Boolean);
  // Gemerkte Themen aus Version 1 (Kurzname oder ID) bleiben sichtbar.
  const themen = list('merk').map(r => ({ rec: r, t: thema(ALTE_THEMEN[r.data.thema] || r.data.thema) })).filter(x => x.t);
  return [
    ...fragen.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`),
    ...themen.map(({ rec, t }) => `<article class="card"><div class="card-row"><h3>${esc(t.titel)}</h3>
        <button class="pin" data-action="vergessen" data-id="${esc(rec.id)}" aria-pressed="true" aria-label="${tr('Remove')}">★</button></div>
      <div class="card-foot"><span class="meta">${tr('Topic')}</span><a class="go" href="#thema/${esc(t.id)}">${tr('Open')} ${pfeil}</a></div></article>`),
  ];
}

export function viewStart() {
  const w = naechsteWahl(), gemerkt = gemerkteKarten();
  return `${kopf(tr('Today'), `${tr('Politics is complicated enough.')}<br><em>${tr('The information about it is not.')}</em>`)}
  ${demoHinweis()}

  ${w ? `<section class="ballot"><div><b>${esc(w.name)}</b><span>${datum(w.datum)} · ${esc(w.parlament)}</span></div>
    <span class="n" aria-label="${tr('{n} days to go', { n: tageBis(w.datum) })}">${tageBis(w.datum)}</span></section>` : ''}

  <h2 class="eyebrow section-label">${tr('New votes')}</h2>
  <div class="cards">${neueAbstimmungen().map(abstimmungKarte).join('') || `<p class="note">${tr('No votes yet.')}</p>`}</div>

  <h2 class="eyebrow section-label">${tr('Saved for later')}</h2>
  ${gemerkt.length ? `<div class="cards">${gemerkt.join('')}</div>`
    : `<p class="note">${tr('Tap the star on a question to find it here again.')}</p>`}

  <p class="hint">${tr('Swipe sideways to change section.')}</p>`;
}
