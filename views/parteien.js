// views/parteien.js — "Wofuer steht Partei Y?": das Programm einer Partei nach Themen, darunter "gesagt und abgestimmt".
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { parteienSortiert, partei, programmVon, themenSortiert, fragenZuThema, positionVon, abstimmungenZuFrage } from '../content.js';
import { kopf, pfeil, haltung, stimme, rolle, datum, seite, herkunft, demoHinweis, safeUrl } from './teile.js';

export function viewParteien() {
  return `${kopf(tr('Parties'), tr('What does a party stand for?'), tr('Each programme sorted by topic, next to how the party voted.'))}
  <div class="cards">${parteienSortiert().map(p => {
    const pr = programmVon(p.id);
    return `<article class="card"><div class="prog-head"><span class="swatch" aria-hidden="true"></span><b>${esc(p.name)}</b>
        ${pr?.seiten ? `<span class="meta">${tr('{n} pages', { n: pr.seiten })}</span>` : ''}</div>
      <div class="card-foot"><span class="meta">${esc(pr?.titel ?? tr('No programme yet'))}</span>
        <a class="go" href="#partei/${esc(p.id)}">${tr('Open')} ${pfeil}</a></div></article>`;
  }).join('')}</div>
  ${demoHinweis()}`;
}

function gesagtUndAbgestimmt(parteiId, frageId) {
  return abstimmungenZuFrage(frageId).filter(a => a.stimmen[parteiId]).map(a => {
    const [s, r] = a.stimmen[parteiId];
    return `<p class="voted"><span class="stance">${stimme(s)}</span> ${esc(a.titel)} <span class="meta">${datum(a.datum)}${r ? ` · ${rolle(r)}` : ''}</span></p>`;
  }).join('');
}

export function viewPartei(id) {
  const p = partei(id);
  if (!p) return viewParteien();
  const pr = programmVon(p.id);
  const bloecke = themenSortiert().map(t => {
    const zeilen = fragenZuThema(t.id).map(f => {
      const pos = positionVon(p.id, f.id);
      if (!pos) return '';
      const abg = gesagtUndAbgestimmt(p.id, f.id);
      return `<article class="pos"><div class="pos-head"><a class="who" href="#frage/${esc(f.id)}">${esc(f.kurz)}</a>
          <span class="stance">${haltung(pos.haltung)}</span></div>
        <p>${esc(pos.text)}</p>
        ${pos.seite ? `<p class="src">${esc(pos.quelle)}, ${seite(pos.seite)}</p>` : ''}
        ${abg ? `<div class="said-voted"><p class="eyebrow">${tr('Said and voted')}</p>${abg}</div>` : ''}</article>`;
    }).join('');
    return zeilen ? `<h2 class="eyebrow section-label">${esc(t.titel)}</h2><div class="cards">${zeilen}</div>` : '';
  }).join('');

  return `${kopf(tr('Party'), esc(p.name), pr ? `${esc(pr.titel)}${pr.seiten ? ` · ${tr('{n} pages', { n: pr.seiten })}` : ''}` : '',
    { href: '#parteien', text: tr('All parties') })}
  ${safeUrl(pr?.url) ? `<p><a class="go" href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener">${tr('Open the original programme')} ${pfeil}</a></p>` : ''}
  ${bloecke || `<p class="note">${tr('No positions recorded yet.')}</p>`}
  <p class="note small">${tr('A vote next to a programme point is not a verdict. Parties in government often vote with their coalition, parties in opposition cannot pass their own programme.')}</p>
  ${demoHinweis()}
  ${herkunft(`partei:${p.id}`)}`;
}
