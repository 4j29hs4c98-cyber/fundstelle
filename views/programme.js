// views/programme.js — jedes Wahlprogramm mit Lesezeit im Original gegen Lesezeit in der App.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { PROGRAMME, IS_DEMO } from '../content.js';

export function viewProgramme() {
  return `
  <header class="page-head"><p class="eyebrow">${tr('Programmes')}</p>
    <h1>${tr('Every election programme, sorted once.')}</h1>
    <p class="sub">${tr('On the left the reading time of the original, on the right in the app. Nothing important is left out, it is only ordered differently.')}</p></header>

  <div class="cards">
    ${PROGRAMME.map(p => `<article class="card prog">
      <div class="prog-head"><span class="swatch" aria-hidden="true"></span>
        <b>${tr('Party {p}', { p: esc(p.partei) })}</b>
        <span class="meta">${tr('{n} pages', { n: p.seiten })} · ${tr('{n} topics', { n: p.themen })}</span></div>
      <div class="times">
        <div class="time"><span class="lab">${tr('Original')}</span><span class="val">${esc(p.original)}</span></div>
        <div class="time hi"><span class="lab">${tr('In the app')}</span><span class="val">${esc(p.app)}</span></div>
      </div></article>`).join('')}
  </div>

  ${IS_DEMO ? `<section class="notice"><b>${tr('Invented programmes')}</b>
    <p>${tr('Parties A to F do not exist. Page counts and positions are example values.')}</p></section>` : ''}`;
}
