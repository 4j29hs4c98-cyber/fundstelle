// views/teile.js — Bausteine, die mehrere Bildschirme teilen. Reine Funktionen, die HTML liefern.
import { tr, LOC } from '../i18n.js';
import { esc, list, S } from '../core.js';
import { C } from '../content.js';

export const pfeil = '<span class="arrow" aria-hidden="true">→</span>';

// Bewusst wertfreie Bezeichner. Die Oberflaeche faerbt sie nicht ein: gruen und rot wuerden gut und schlecht bedeuten.
const HALTUNG = { dafuer: 'In favour', dagegen: 'Against', teilweise: 'In part', keine_angabe: 'No statement' };
const STIMME = { ja: 'Yes', nein: 'No', enthaltung: 'Abstained' };
const ROLLE = { koalition: 'in government', opposition: 'in opposition' };
export const haltung = h => (HALTUNG[h] ? tr(HALTUNG[h]) : esc(h));
export const stimme = s => (STIMME[s] ? tr(STIMME[s]) : esc(s));

// Links aus der Datenbank nur als https. esc() allein liesse "javascript:..." durch.
export const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch { return null; } };
export const extLink = (url, text) => { const u = safeUrl(url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${text}</a>` : text; };
export const rolle = r => (ROLLE[r] ? tr(ROLLE[r]) : '');

export const datum = iso => new Date(iso + 'T12:00:00').toLocaleDateString(LOC(), { day: 'numeric', month: 'long', year: 'numeric' });
export const seite = n => tr('Page {n}', { n });

export function kopf(eyebrow, titel, sub = '', zurueck = null) {
  return `${zurueck ? `<a class="back" href="${esc(zurueck.href)}"><span aria-hidden="true">←</span> ${esc(zurueck.text)}</a>` : ''}
  <header class="page-head">${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}<h1>${titel}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</header>`;
}

export const istGemerkt = frageId => list('merk').some(r => r.data.frage === frageId);
export function merkKnopf(frageId) {
  const an = istGemerkt(frageId);
  return `<button class="pin" data-action="merken" data-frage="${esc(frageId)}" aria-pressed="${an}" aria-label="${tr('Remember question')}">${an ? '★' : '☆'}</button>`;
}

export const demoHinweis = () => (C.ist_demo ? `<section class="notice"><b>${tr('These are example data')}</b>
  <p>${tr('The parties are called A to F and every position, quote and vote is invented. That keeps the prototype neutral and stops anyone reading it as a real statement about a real party.')}</p></section>` : '');

// Auf jeder Inhaltsseite: Stand, ob KI beteiligt war, und der Weg, einen Fehler zu melden.
export function herkunft(bezug) {
  const ki = C.ki ? tr('Partly compiled with AI, checked by people.') : tr('Compiled by people.');
  const offen = S.melden === bezug;
  return `<footer class="herkunft">
    <p class="meta">${ki} ${tr('As of {d}', { d: datum(C.stand) })} · <a href="#auswahl">${tr('How we select')}</a></p>
    ${offen ? `<form class="stack melden" data-form="melden">
        <input type="hidden" name="bezug" value="${esc(bezug)}">
        <label>${tr('What is wrong here?')}<textarea id="melden-text" name="text" rows="3" minlength="3" maxlength="1000" required></textarea></label>
        <div class="row"><button class="btn primary">${tr('Send report')}</button><button type="button" class="btn" data-action="melden" data-bezug="">${tr('Cancel')}</button></div>
      </form>`
    : `<button class="btn" data-action="melden" data-bezug="${esc(bezug)}">${tr('Report an error')}</button>`}
  </footer>`;
}
