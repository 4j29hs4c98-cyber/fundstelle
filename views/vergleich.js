// views/vergleich.js — zwei bis vier Parteien nebeneinander: je Frage Haltung, Satz und Seite, darunter
// Argumente dafuer und dagegen. Adresse: #vergleich/<id,id>/<thema>. Thema leer = alle Themen.
// Neutralitaet: Links von anderen Seiten setzen hoechstens das Thema vor, nie die Parteien (sonst gewinnt das Alphabet).
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { PARTEIEN_DE } from '../katalog.js';
import { C, partei, parteienSortiert, thema, themenSortiert, fragenZuThema, positionVon, argumenteZuFrage } from '../content.js';
import { profil } from '../profil.js';
import { kopf, logo, haltung, seitenLink, demoHinweis, herkunft } from './teile.js';

export const MAX_VERGLEICH = 4;
export function vergleichAus(param) {
  const [ids = '', t = ''] = String(param ?? '').split('/');
  return { ids: [...new Set(ids.split(','))].filter(id => partei(id)).slice(0, MAX_VERGLEICH), thema: thema(t) ? t : '' };
}
export const vergleichLink = (ids, t = '') => `#vergleich/${ids.join(',')}${t ? `/${t}` : ''}`;
// Echte Parteien ohne Inhalte, alphabetisch (keine Rangfolge nach Groesse).
const ohneInhalt = () => PARTEIEN_DE.filter(p => !C.parteien.some(c => c.id === p.id)).sort((a, b) => a.name.localeCompare(b.name, 'de'));

function chip(p, v) {
  return `<button class="pchip" data-action="vergleich" data-id="${esc(p.id)}" aria-pressed="${v.ids.includes(p.id)}">${logo(p, 'klein')}<span>${esc(p.name)}</span></button>`;
}
const themaChip = (id, text, v) => `<button class="qchip" data-action="vergleich-thema" data-id="${esc(id)}" aria-pressed="${v.thema === id}">${text}</button>`;

function zelle(p, f) {
  const pos = positionVon(p.id, f.id);
  if (!pos) return `<div class="vz leer">${logo(p, 'klein')}<p class="meta">${tr('Not recorded yet')}</p></div>`;
  return `<div class="vz">${logo(p, 'klein')}<span class="stance">${haltung(pos.haltung)}</span>
    <p>${esc(pos.text)}</p>${pos.seite ? seitenLink(p.id, pos.seite) : `<p class="meta">${esc(pos.quelle)}</p>`}</div>`;
}

function frageBlock(f, ids) {
  const args = argumenteZuFrage(f.id), liste = r => args.filter(a => a.richtung === r).map(a => `<li>${esc(a.text)}</li>`).join('') || `<li class="meta">${tr('None yet.')}</li>`;
  return `<article class="vfrage"><h3><a href="#frage/${esc(f.id)}">${esc(f.frage)}</a></h3>
    <div class="vgrid">${ids.map(id => zelle(partei(id), f)).join('')}</div>
    <div class="args"><section class="panel"><h4>${tr('For')}</h4><ul>${liste('dafuer')}</ul></section>
      <section class="panel"><h4>${tr('Against')}</h4><ul>${liste('dagegen')}</ul></section></div></article>`;
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
  const rest = ohneInhalt();
  return `${kopf(tr('Parties'), tr('Compare parties'), tr('Choose up to four. Same questions, side by side, in the order you picked.'), { href: '#parteien', text: tr('All parties') })}
  <p class="eyebrow">${tr('Choose a topic')}</p>
  <div class="qbar">${themaChip('', tr('All topics'), v)}${themenSortiert().map(t => themaChip(t.id, esc(t.titel), v)).join('')}</div>
  <p class="eyebrow">${tr('Parties')}</p>
  <div class="pchips">${parteienSortiert().map(p => chip(p, v)).join('')}</div>
  ${rest.length ? `<p class="eyebrow">${tr('Real parties, content follows')}</p><div class="pchips">${rest.map(p => chip(p, v)).join('')}</div>` : ''}
  ${inhalt}
  ${demoHinweis()}
  ${herkunft('vergleich')}`;
}
