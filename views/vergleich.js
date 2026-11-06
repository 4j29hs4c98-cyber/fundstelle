// views/vergleich.js — Kernstueck: eine Frage, alle Programme nebeneinander.
import { tr } from '../i18n.js';
import { esc, S } from '../core.js';
import { FRAGEN, frage } from '../content.js';

const HALTUNG = { dafuer: 'In favour', dagegen: 'Against', teilweise: 'In part', keine_angabe: 'No statement' };

export function positionenHTML(f) {
  return f.positionen.map(([p, haltung, text, quelle]) => `<article class="pos">
    <div class="pos-head"><span class="who"><span class="swatch" aria-hidden="true"></span>${tr('Party {p}', { p: esc(p) })}</span>
      <span class="stance">${tr(HALTUNG[haltung] || haltung)}</span></div>
    <p>${esc(text)}</p>
    <p class="src">${tr('Source')}: ${esc(quelle)}</p></article>`).join('');
}

export function viewVergleich() {
  const f = frage(S.frage);
  return `
  <header class="page-head"><p class="eyebrow">${tr('Compare')}</p>
    <h1>${tr('The same question, all programmes side by side.')}</h1></header>

  <div class="qbar" role="group" aria-label="${tr('Questions')}">
    ${FRAGEN.map(q => `<button class="qchip" data-action="frage" data-id="${esc(q.id)}" aria-pressed="${q.id === f.id}">${esc(q.kurz)}</button>`).join('')}
  </div>

  <p class="question">${esc(f.frage)}</p>
  <div class="cards">${positionenHTML(f)}</div>

  <details class="panel howto"><summary>${tr('How this is sorted')}</summary>
    <ul>
      <li>${tr('All parties appear in alphabetical order. There is no ranking and no recommendation.')}</li>
      <li>${tr('Every card is the same size and the same design. No party gets more room or more colour.')}</li>
      <li>${tr('The labels are deliberately all one colour. Green and red would mean good and bad, and deciding that is not the job of this app.')}</li>
      <li>${tr('Under every position you can see which document it comes from and which page.')}</li>
      <li>${tr('If a programme says nothing about it, nothing is shown. Gaps are not filled in.')}</li>
    </ul></details>`;
}
