// views/ueberblick.js — Startbildschirm: gemerkte Themen zuerst, dann was gerade ansteht.
import { tr } from '../i18n.js';
import { esc, list } from '../core.js';
import { THEMEN, WAHL_IN_TAGEN, IS_DEMO, thema } from '../content.js';

const pfeil = '<span class="arrow" aria-hidden="true">→</span>';

function themaKarte(t, gemerkt) {
  return `<article class="card">
    <div class="card-row"><h3>${esc(t.titel)}</h3>
      <button class="pin" data-action="merken" data-thema="${esc(t.id)}"
        aria-pressed="${gemerkt}" aria-label="${tr('Remember topic')}">${gemerkt ? '★' : '☆'}</button></div>
    <p>${esc(t.kurz)}</p>
    <div class="card-foot"><span class="meta">${tr('{n} positions', { n: 6 })} · ${tr('checked')} ${esc(t.geprueft)}</span>
      <a class="go" href="#vergleich" data-action="open-thema" data-thema="${esc(t.id)}">${tr('Compare')} ${pfeil}</a></div>
  </article>`;
}

export function viewUeberblick() {
  const gemerkt = list('merk').map(r => r.data.thema).filter(id => thema(id));
  const offen = THEMEN.filter(t => !gemerkt.includes(t.id));
  return `
  <header class="page-head"><p class="eyebrow">${tr('Today')}</p>
    <h1>${tr('Politics is complicated enough.')}<br><em>${tr('The information about it is not.')}</em></h1></header>

  ${IS_DEMO ? `<section class="notice"><b>${tr('These are example data')}</b>
    <p>${tr('The parties are called A to F and every position is invented. That keeps the prototype neutral and stops anyone reading it as a real statement about a real party.')}</p></section>` : ''}

  <section class="ballot"><div><b>${tr('Example election date')}</b>
    <span>${tr('Before an election the app shows what matters for the decision.')}</span></div>
    <span class="n">${WAHL_IN_TAGEN}</span></section>

  ${gemerkt.length ? `<h2 class="eyebrow section-label">${tr('Saved for later')}</h2>
    <div class="cards">${gemerkt.map(id => themaKarte(thema(id), true)).join('')}</div>` : ''}

  <h2 class="eyebrow section-label">${gemerkt.length ? tr('More topics') : tr('What is going on')}</h2>
  ${offen.length ? `<div class="cards">${offen.map(t => themaKarte(t, false)).join('')}</div>`
    : `<p class="note">${tr('You have saved every topic.')}</p>`}

  <h2 class="eyebrow section-label">${tr('Taken out of context')}</h2>
  <div class="cards"><article class="card">
    <div class="card-row"><h3>${tr('One statement, two impressions')}</h3></div>
    <p>${tr('A sentence that is going around as a short clip, next to what was said before and after it.')}</p>
    <div class="card-foot"><span class="meta">${tr('With source and date')}</span>
      <a class="go" href="#kontext">${tr('Context')} ${pfeil}</a></div>
  </article></div>

  <p class="hint">${tr('Swipe sideways to change section.')}</p>`;
}
