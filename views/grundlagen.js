// views/grundlagen.js — Erklaerschicht "Wie Politik funktioniert": Bereiche mit Erklaerkarten und das Glossar.
// Daten: grundlagen.js, erzeugt aus den Notizen im Projektordner. Alle Karten sind "Vorschlag, ungeprueft",
// das bleibt sichtbar, bis ein Mensch sie freigibt. #grundlagen/<bereich>/<karte> oeffnet eine Karte direkt.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { GRUNDLAGEN } from '../grundlagen.js';
import { kopf, pfeil, safeUrl } from './teile.js';

const G = GRUNDLAGEN;
const bereichNr = nr => G.bereiche.find(b => b.nr === nr);
const norm = s => String(s ?? '').toLocaleLowerCase('de');

// Text mit Links: URLs werden nur als https verlinkt, "[pruefen]" wird als offener Pruefpunkt markiert.
function text(s) {
  return String(s ?? '').split(/(https?:\/\/[^\s,;)]+)/g).map((teil, i) => {
    if (i % 2) { const u = safeUrl(teil.replace(/[.]$/, '')); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname)}</a>` : esc(teil); }
    return esc(teil).replace(/\[(prüfen[^\]]*)\]/g, '<mark class="pruefen">[$1]</mark>');
  }).join('');
}

function karteHtml(b, k, offen) {
  return `<details class="karte" id="karte-${esc(k.id)}"${offen ? ' open data-ziel' : ''}>
    <summary><b>${esc(k.titel)}</b><span>${text(k.kurz)}</span></summary>
    <p>${text(k.erklaerung)}</p>
    ${k.warum ? `<p><b>${tr('Why it matters')}:</b> ${text(k.warum)}</p>` : ''}
    <p class="meta">${tr('Source')}: ${text(k.quelle)}</p>
    <p class="meta"><span class="status">${esc(k.status || tr('Suggestion, unchecked'))}</span>
      <a href="#grundlagen/${esc(b.id)}/${esc(k.id)}">${tr('Link to this card')}</a></p></details>`;
}

function uebersicht() {
  const buchstaben = [...new Set(G.glossar.map(g => g.begriff[0].toUpperCase()))];
  return `${kopf(tr('Topics'), tr('How politics works'), tr('Short, neutral explanations of the terms that come up in programmes and votes.'), { href: '#themen', text: tr('All topics') })}
  <section class="notice"><b>${tr('Draft, not checked yet')}</b><p>${tr('Every card is a suggestion until someone in the team has checked it. Open points are marked.')}</p></section>
  <h2 class="eyebrow section-label">${tr('Areas')}</h2>
  <div class="cards">${G.bereiche.map(b => `<a class="card link" href="#grundlagen/${esc(b.id)}"><h3>${esc(b.titel)}</h3>
    <span class="meta">${tr('{n} cards', { n: b.karten.length })}</span></a>`).join('')}</div>
  <h2 class="eyebrow section-label">${tr('Glossary')}</h2>
  ${buchstaben.map(l => `<h3 class="buchstabe">${esc(l)}</h3><dl class="glossar">${G.glossar.filter(g => g.begriff[0].toUpperCase() === l).map(g => `<dt id="begriff-${esc(g.id)}">${esc(g.begriff)}</dt>
    <dd>${text(g.text)}${g.verweis.map(bereichNr).filter(Boolean).map(b => ` <a href="#grundlagen/${esc(b.id)}">${esc(b.titel)}</a>`).join(' ·')}</dd>`).join('')}</dl>`).join('')}
  <p class="meta">${tr('As of {d}', { d: esc(G.stand) })}</p>`;
}

export function viewGrundlagen(param) {
  const [bid, kid] = String(param ?? '').split('/');
  const b = G.bereiche.find(x => x.id === bid);
  if (!b) return uebersicht();
  return `${kopf(tr('How politics works'), esc(b.titel), '', { href: '#grundlagen', text: tr('All areas') })}
  ${b.intro ? `<p class="note">${text(b.intro)}</p>` : ''}
  <div class="cards">${b.karten.map(k => karteHtml(b, k, k.id === kid)).join('')}</div>`;
}

// Glossarbegriffe, die in einem Text vorkommen (fuer die Frage-Seite). Nur ganze Woerter, damit "Rat" nicht in "Beirat" trifft.
export function begriffeIn(...texte) {
  const h = norm(texte.join(' '));
  return G.glossar.filter(g => new RegExp(`(^|[^\\p{L}])${norm(g.begriff).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(h));
}
export function begriffeBlock(...texte) {
  const bs = begriffeIn(...texte);
  return bs.length ? `<h2 class="eyebrow section-label">${tr('Terms explained')}</h2>
    <dl class="glossar">${bs.map(g => `<dt>${esc(g.begriff)}</dt><dd>${text(g.text)} <a href="#grundlagen">${tr('More')} ${pfeil}</a></dd>`).join('')}</dl>` : '';
}
export const grundlagenLink = () => `<a class="card link grundlagen-link" href="#grundlagen"><h3>${tr('How politics works')}</h3>
  <span class="meta">${tr('{n} explainer cards and {m} terms, for example who may vote and how a law is made.', { n: G.bereiche.reduce((n, b) => n + b.karten.length, 0), m: G.glossar.length })}</span></a>`;
