// views/vergleich.js — zwei bis vier Parteien nebeneinander: je Frage Haltung, Satz und Seite, darunter
// Argumente dafuer und dagegen. Adresse: #vergleich/<id,id>/<thema>. Thema leer = alle Themen.
// Oben die Sitzverteilung des Bundestags (views/halbkreis.js); Tippen auf Sitze waehlt wie die Knoepfe darunter.
// Ab zwei Parteien laesst sich auch eine eigene Frage stellen (views/vergleich-eigene.js).
// Neutralitaet: Spalten immer alphabetisch, egal in welcher Reihenfolge gewaehlt wurde. Links von anderen Seiten
// setzen hoechstens das Thema vor, nie die Parteien.
import { tr, plural } from '../i18n.js';
import { esc } from '../core.js';
import { partei, parteienSortiert, ohneInhalt, thema, themenSortiert, fragenZuThema, positionVon, argumenteZuFrage } from '../content.js';
import { profil } from '../profil.js';
import { kopf, marke, haltungZeile, quelleZeile, demoHinweis, herkunft } from './teile.js';
import { halbkreis, sitzeVon, imBundestag } from './halbkreis.js';
import { vergleichEigene } from './vergleich-eigene.js';

export const MAX_VERGLEICH = 4;
const nachName = (a, b) => (partei(a)?.name ?? '').localeCompare(partei(b)?.name ?? '', 'de');
export function vergleichAus(param) {
  const [ids = '', t = ''] = String(param ?? '').split('/');
  const gueltig = [...new Set(ids.split(','))].filter(id => partei(id)).slice(0, MAX_VERGLEICH);
  return { ids: gueltig.sort(nachName), thema: thema(t) ? t : '' };
}
export const vergleichLink = (ids, t = '') => `#vergleich/${[...ids].sort(nachName).join(',')}${t ? `/${t}` : ''}`;

// Spaltenbuchstabe A, B, C, D in der (alphabetischen) Spaltenreihenfolge.
const buchstabeIn = v => id => (v.ids.includes(id) ? 'ABCD'[v.ids.indexOf(id)] : '');
const slot = b => `<span class="slot" aria-hidden="true">${b}</span>`;

function chip(p, v, zusatz = '') {
  const b = buchstabeIn(v)(p.id);
  return `<button class="pchip" data-action="vergleich" data-id="${esc(p.id)}" aria-pressed="${!!b}">${marke(p)}${zusatz ? `<span class="meta">${zusatz}</span>` : ''}${b ? slot(b) : ''}</button>`;
}
const themaChip = (id, text, v) => `<button class="qchip" data-action="vergleich-thema" data-id="${esc(id)}" aria-pressed="${v.thema === id}">${text}</button>`;
const sitzText = p => plural(sitzeVon(p), tr('1 seat'), tr('{n} seats', { n: sitzeVon(p) }));

function zelle(p, f, b) {
  const pos = positionVon(p.id, f.id);
  const kopfZeile = `<p class="vz-partei">${slot(b)}${marke(p, 'klein', 'b')}</p>`;
  if (!pos) return `<div class="vz leer">${kopfZeile}<p class="meta">${tr('Not recorded yet')}</p></div>`;
  return `<div class="vz">${kopfZeile}${haltungZeile(pos.haltung)}<p>${esc(pos.text)}</p>${quelleZeile(p.id, pos)}</div>`;
}

function frageBlock(f, ids) {
  const args = argumenteZuFrage(f.id), liste = r => args.filter(a => a.richtung === r).map(a => `<li>${esc(a.text)}</li>`).join('') || `<li class="meta">${tr('None yet.')}</li>`;
  return `<article class="vfrage"><p class="eyebrow">${tr('Question')}</p><h3><a href="#frage/${esc(f.id)}">${esc(f.frage)}</a></h3>
    <div class="vgrid">${ids.map((id, i) => zelle(partei(id), f, 'ABCD'[i])).join('')}</div>
    <details class="mehr args-mehr"><summary>${tr('General arguments for and against')}</summary>
    <p class="note small">${tr('Arguments from research and public bodies. They belong to no party.')}</p>
    <div class="args"><section class="panel"><h3>${tr('Arguments in favour')}</h3><ul>${liste('dafuer')}</ul></section>
      <section class="panel"><h3>${tr('Arguments against')}</h3><ul>${liste('dagegen')}</ul></section></div></details></article>`;
}

// Knopfliste: zugaenglicher, alphabetischer Weg zur Auswahl. Gruppen nach Tatsachen, nicht nach Wertung.
function auswahl(v) {
  const mitInhalt = parteienSortiert(), rest = ohneInhalt();
  const imBT = mitInhalt.filter(imBundestag), ausserhalb = mitInhalt.filter(p => !imBundestag(p));
  const gruppe = (titel, liste, zusatz) => (liste.length ? `<p class="eyebrow">${titel}</p>
    <div class="pchips">${liste.map(p => chip(p, v, zusatz(p))).join('')}</div>` : '');
  return `${gruppe(tr('In the 21st Bundestag'), imBT, sitzText)}
  ${gruppe(tr('Not in the Bundestag'), ausserhalb, () => '')}
  ${gruppe(tr('More parties, content follows'), rest, () => '')}`;
}

export function viewVergleich(param) {
  const v = vergleichAus(param), meine = profil().themen;
  // Gewaehltes Thema allein; sonst alle, Themen aus dem Profil zuerst.
  const themen = v.thema ? [thema(v.thema)] : themenSortiert().sort((a, b) => meine.includes(b.id) - meine.includes(a.id));
  const inhalt = v.ids.length < 2 ? `<p class="note">${tr('Choose at least two parties.')}</p>`
    : themen.map(t => {
      const fr = fragenZuThema(t.id);
      return fr.length ? `<h2 class="eyebrow section-label">${esc(t.titel)}${meine.includes(t.id) ? ` · ${tr('Your topic')}` : ''}</h2>${fr.map(f => frageBlock(f, v.ids)).join('')}` : '';
    }).join('');
  return `${kopf(tr('Parties'), tr('Compare parties'), tr('Choose up to four. Same questions, side by side, in alphabetical order.'), { href: '#parteien', text: tr('All parties') })}
  ${halbkreis(buchstabeIn(v))}
  <p class="meta hk-hinweis">${tr('Tap a block of seats or a party in the list.')}</p>
  ${auswahl(v)}
  ${v.ids.length >= 2 ? vergleichEigene(v.ids) : ''}
  <p class="eyebrow">${tr('Choose a topic')}</p>
  <div class="qbar">${themaChip('', tr('All topics'), v)}${themenSortiert().map(t => themaChip(t.id, esc(t.titel), v)).join('')}</div>
  ${inhalt}
  ${demoHinweis()}
  ${herkunft('vergleich')}`;
}
