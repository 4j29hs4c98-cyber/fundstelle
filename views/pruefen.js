// views/pruefen.js — "Stimmt das, was ich hoere?": Suche ueber alle Programme und Abstimmungen.
// Ergebnis sind Fundstellen mit Seite, oder der klare Hinweis, dass es keine gibt. Die App urteilt nicht.
import { tr } from '../i18n.js';
import { esc, S } from '../core.js';
import { suche, partei, frage } from '../content.js';
import { kopf, pfeil, seite, datum, demoHinweis, safeUrl } from './teile.js';

function ergebnis(r) {
  if (!r) return `<p class="note">${tr('For example: “SPD Mietpreisbremse” or “CO2-Preis Klimageld”.')}</p>`;
  const wer = r.parteien.map(p => esc(p.name)).join(', ');
  const treffer = r.positionen.map(p => `<a class="card paper link" href="#frage/${esc(p.frage)}">
      <span class="meta">${esc(partei(p.partei)?.name ?? '')} · ${esc(frage(p.frage)?.kurz ?? '')}</span>
      ${p.auszug ? `<blockquote class="auszug">„${esc(p.auszug)}“</blockquote>` : `<p>${esc(p.text)}</p>`}
      <span class="meta">${esc(p.quelle)}, ${seite(p.seite)} ${pfeil}</span></a>`).join('');
  const abst = r.abstimmungen.map(a => {
    const f = frage(a.fragen[0]);
    const href = f ? `#frage/${esc(f.id)}` : safeUrl(a.url) ? esc(safeUrl(a.url)) : null;
    const inhalt = `<h3>${esc(a.titel)}</h3><span class="meta">${esc(a.parlament)} · ${datum(a.datum)} · ${esc(a.quelle)}</span>`;
    return href ? `<a class="card link" href="${href}"${f ? '' : ' target="_blank" rel="noopener"'}>${inhalt}</a>` : `<article class="card">${inhalt}</article>`;
  }).join('');
  return `${wer ? `<p class="meta">${tr('Searching only in: {p}', { p: wer })}</p>` : ''}
    <h2 class="eyebrow section-label">${tr('Found in the programmes')}</h2>
    ${treffer ? `<div class="cards">${treffer}</div>` : `<section class="notice"><b>${tr('No passage found in the programmes.')}</b>
      <p>${tr('That does not prove the opposite. The search only finds words that are actually written there.')}</p></section>`}
    ${abst ? `<h2 class="eyebrow section-label">${tr('Found in votes')}</h2><div class="cards">${abst}</div>` : ''}`;
}

export function viewPruefen() {
  return `${kopf(tr('Check'), tr('Is what I heard true?'), tr('Search all programmes and votes. You get the passage with its page, or a clear note that there is none.'))}
  <form class="search" data-form="suche" role="search">
    <label class="sr-only" for="suche-q">${tr('Search')}</label>
    <input id="suche-q" name="q" type="search" value="${esc(S.suche)}" placeholder="${tr('Party X wants …')}" autocomplete="off" maxlength="200">
    <button class="btn primary">${tr('Search')}</button>
  </form>
  ${ergebnis(suche(S.suche))}
  ${demoHinweis()}`;
}
