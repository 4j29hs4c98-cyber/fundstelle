// views/kontext.js — der Signaturmoment: ein Ausschnitt klappt zur vollstaendigen Aussage auf.
import { tr } from '../i18n.js';
import { esc, S } from '../core.js';
import { AUSSAGE, IS_DEMO } from '../content.js';

export function viewKontext() {
  const offen = !!S.kontextOffen;
  return `
  <header class="page-head"><p class="eyebrow">${tr('In context')}</p>
    <h1>${tr('A clip often says something different from the whole sentence.')}</h1>
    <p class="sub">${tr('This is how the sentence is going around. Tap to see what was said before and after.')}</p></header>

  <section class="clip ${offen ? 'open' : ''}">
    <p class="clip-tag"><span class="dot" aria-hidden="true"></span>${tr('How it is going around')}</p>
    <blockquote class="quote">
      <span class="wrap" ${offen ? '' : 'hidden'}>${esc(AUSSAGE.davor)} </span>
      <span class="frag">${esc(AUSSAGE.ausschnitt)}</span>
      <span class="wrap" ${offen ? '' : 'hidden'}> ${esc(AUSSAGE.danach)}</span>
    </blockquote>
    ${offen ? '' : `<button class="btn primary" data-action="aussage-aufklappen">${tr('Show the full statement')}</button>`}
    <dl class="ctx-meta">
      <dt>${tr('Source')}</dt><dd>${esc(AUSSAGE.quelle)}</dd>
      <dt>${tr('Date')}</dt><dd>${esc(AUSSAGE.datum)}</dd>
      <dt>${tr('The clip shows')}</dt><dd>${tr('{a} of {b} seconds', { a: AUSSAGE.dauerAusschnitt, b: AUSSAGE.dauerGesamt })}</dd>
    </dl>
  </section>

  ${IS_DEMO ? `<section class="notice"><b>${tr('Invented example')}</b>
    <p>${tr('This statement never happened. It is here to show how the app would handle a clip.')}</p></section>` : ''}`;
}
