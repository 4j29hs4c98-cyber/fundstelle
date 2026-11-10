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
// Haltung nie allein im Raum: immer mit Beschriftung, wessen Haltung zu welcher Frage gemeint ist.
export const haltungZeile = (h, wer) => `<p class="haltung-zeile"><span class="hz-label">${wer ? tr('Stance of {p}', { p: esc(wer) }) : tr('Stance')}</span>
  <span class="stance">${haltung(h)}</span></p>`;
export const stimme = s => (STIMME[s] ? tr(STIMME[s]) : esc(s));

// Links aus der Datenbank nur als https. esc() allein liesse "javascript:..." durch.
export const safeUrl = u => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch { return null; } };
export const extLink = (url, text) => { const u = safeUrl(url); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${text}</a>` : text; };
export const rolle = r => (ROLLE[r] ? tr(ROLLE[r]) : '');

// Parteizeichen: Pille in der Parteifarbe mit dem Kurznamen, Zweitfarbe als Streifen. Farben nur als #RRGGBB,
// sonst koennte ein Wert aus der Datenbank eigenes CSS einschleusen. Textfarbe nach Helligkeit, damit lesbar.
// Sobald ein offizielles Logo abgelegt ist (p.logo), erscheint es statt des Kurznamens.
const HEX = /^#[0-9a-f]{6}$/i;
const istHell = h => { const n = parseInt(h.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150; };
export function logo(p, klasse = '') {
  const f = HEX.test(p?.farbe ?? '') ? p.farbe : '#6E7076', f2 = HEX.test(p?.farbe2 ?? '') ? p.farbe2 : f;
  const inhalt = p?.logo ? `<img src="${esc(p.logo)}" alt="">` : esc(p?.kuerzel ?? '?');
  return `<span class="logo ${klasse}" style="--c:${f};--c2:${f2};--t:${istHell(f) ? '#0B0B0C' : '#FFFFFF'}" aria-hidden="true">${inhalt}</span>`;
}
// Seitenzahl als Link in den Programm-Leser.
export const seitenLink = (parteiId, n, text) => `<a class="seite-link" href="#programm/${esc(parteiId)}/${esc(n)}">${text ?? seite(n)} <span aria-hidden="true">→</span></a>`;
export const termin = w => (w.datum ? datum(w.datum) : esc(w.zeitraum));

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

// Hinweis, solange Inhalte nicht vom Team geprueft sind (KI-Zusammenstellung).
// Aufklappbar, damit der lange Text nicht jede Seite fuellt. Die Ueberschrift bleibt immer sichtbar.
// Hinweise "mit KI zusammengestellt, noch nicht geprueft": auf Wunsch von Lennox (10.11.2026) vorerst ausgeblendet.
// Vor einer Veroeffentlichung wieder einschalten (true), die Texte bleiben dafuer erhalten.
export const ZEIGE_KI_HINWEIS = false;
export const demoHinweis = () => (ZEIGE_KI_HINWEIS && C.ungeprueft ? `<details class="notice demo"><summary><b>${tr('Compiled by AI, not yet checked')}</b></summary>
  <p>${tr('The quotes come word for word from the parties’ programmes for the federal election 2025, with the page. An AI agent selected them and the team has not checked them yet. Open the original before you rely on a passage.')}</p>
  ${C.maschinell ? `<p class="meta">${tr('A script has compared every quote with the original PDF and found it word for word on the stated page. Whether the quote fits the question still needs a person.')}</p>` : ''}</details>` : '');
// PDF-Seite, nicht die gedruckte Seitenzahl: der Link oeffnet das PDF genau dort.
export const pdfSeite = n => tr('PDF page {n}', { n });

// Auf jeder Inhaltsseite: Stand, ob KI beteiligt war, und der Weg, einen Fehler zu melden.
export function herkunft(bezug) {
  const ki = C.ungeprueft ? tr('Compiled with AI, not yet checked by people.') : C.ki ? tr('Partly compiled with AI, checked by people.') : tr('Compiled by people.');
  const offen = S.melden === bezug;
  return `<footer class="herkunft">
    <p class="meta">${ZEIGE_KI_HINWEIS ? `${ki} ${tr('As of {d}', { d: datum(C.stand) })} · ` : ''}<a href="#auswahl">${tr('How we select')}</a></p>
    ${offen ? `<form class="stack melden" data-form="melden">
        <input type="hidden" name="bezug" value="${esc(bezug)}">
        <label>${tr('What is wrong here?')}<textarea id="melden-text" name="text" rows="3" minlength="3" maxlength="1000" required></textarea></label>
        <div class="row"><button class="btn primary">${tr('Send report')}</button><button type="button" class="btn" data-action="melden" data-bezug="">${tr('Cancel')}</button></div>
      </form>`
    : `<button class="btn" data-action="melden" data-bezug="${esc(bezug)}">${tr('Report an error')}</button>`}
  </footer>`;
}
