// views/vergleich.js — zwei bis vier Parteien nebeneinander: je Frage Haltung, Satz und Seite, darunter
// Argumente dafuer und dagegen. Auswahl steckt in der Adresse (#vergleich/<id,id>), damit man sie teilen kann.
// Echte Parteien sind waehlbar, zeigen aber "noch nicht erfasst", bis ihre Programme ausgewertet sind.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { PARTEIEN_DE } from '../katalog.js';
import { partei, parteienSortiert, themenSortiert, fragenZuThema, positionVon, argumenteZuFrage } from '../content.js';
import { profil } from '../profil.js';
import { kopf, logo, haltung, seitenLink, demoHinweis, herkunft } from './teile.js';

export const MAX_VERGLEICH = 4;
export const auswahlAus = param => [...new Set(String(param ?? '').split(','))].filter(id => partei(id)).slice(0, MAX_VERGLEICH);

function chip(p, gewaehlt) {
  return `<button class="pchip" data-action="vergleich" data-id="${esc(p.id)}" aria-pressed="${gewaehlt.includes(p.id)}">${logo(p, 'klein')}<span>${esc(p.name)}</span></button>`;
}

function zelle(p, f) {
  const pos = positionVon(p.id, f.id);
  if (!pos) return `<div class="vz leer">${logo(p, 'klein')}<p class="meta">${tr('Not recorded yet')}</p></div>`;
  return `<div class="vz">${logo(p, 'klein')}<span class="stance">${haltung(pos.haltung)}</span>
    <p>${esc(pos.text)}</p>${pos.seite ? seitenLink(p.id, pos.seite) : `<p class="meta">${esc(pos.quelle)}</p>`}</div>`;
}

function frageBlock(f, gewaehlt) {
  const args = argumenteZuFrage(f.id), liste = r => args.filter(a => a.richtung === r).map(a => `<li>${esc(a.text)}</li>`).join('') || `<li class="meta">${tr('None yet.')}</li>`;
  return `<article class="vfrage"><h3><a href="#frage/${esc(f.id)}">${esc(f.frage)}</a></h3>
    <div class="vgrid" style="--n:${gewaehlt.length}">${gewaehlt.map(id => zelle(partei(id), f)).join('')}</div>
    <div class="args"><section class="panel"><h4>${tr('For')}</h4><ul>${liste('dafuer')}</ul></section>
      <section class="panel"><h4>${tr('Against')}</h4><ul>${liste('dagegen')}</ul></section></div></article>`;
}

export function viewVergleich(param) {
  const gewaehlt = auswahlAus(param), meine = profil().themen;
  // Themen aus dem Profil zuerst, sonst die feste Reihenfolge.
  const themen = themenSortiert().sort((a, b) => meine.includes(b.id) - meine.includes(a.id));
  const inhalt = gewaehlt.length < 2 ? `<p class="note">${tr('Choose at least two parties.')}</p>`
    : themen.map(t => {
      const fr = fragenZuThema(t.id);
      return fr.length ? `<h2 class="eyebrow section-label">${esc(t.titel)}${meine.includes(t.id) ? ` · ${tr('Your topic')}` : ''}</h2>${fr.map(f => frageBlock(f, gewaehlt)).join('')}` : '';
    }).join('');
  return `${kopf(tr('Parties'), tr('Compare parties'), tr('Choose up to four. Same questions, side by side, in the order you picked.'), { href: '#parteien', text: tr('All parties') })}
  <p class="eyebrow">${tr('Example parties with content')}</p>
  <div class="pchips">${parteienSortiert().map(p => chip(p, gewaehlt)).join('')}</div>
  <p class="eyebrow">${tr('Real parties, content follows')}</p>
  <div class="pchips">${PARTEIEN_DE.map(p => chip(p, gewaehlt)).join('')}</div>
  ${inhalt}
  ${demoHinweis()}
  ${herkunft('vergleich')}`;
}
