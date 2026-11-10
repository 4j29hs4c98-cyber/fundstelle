// views/parteien.js — "Wofuer steht Partei Y?": das Programm einer Partei nach Themen, darunter "gesagt und abgestimmt"
// und aktuelle Aussagen. Oben der Weg zum Vergleich; darunter das Verzeichnis echter Parteien (noch ohne Inhalte).
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { parteienSortiert, ohneInhalt, hatInhalt, partei, programmVon, themenSortiert, fragenZuThema, positionVon, abstimmungenZuFrage, aussagenVon, frage } from '../content.js';
import { kopf, pfeil, haltung, stimme, rolle, datum, seitenLink, herkunft, demoHinweis, safeUrl, logo, extLink } from './teile.js';
import { profilVon, PROFIL_STAND } from '../parteiprofile.js';

// "Kurz gesagt" vor den Themen: vier Saetze, jeder mit Quellennummer; die Quellen samt Zitat aufklappbar.
// Die Nummern sind bewusst keine Links: ein #-Sprung wuerde vom Hash-Router als Seitenwechsel gelesen.
function profilBlock(p) {
  const saetze = profilVon(p.id);
  if (!saetze) return '';
  const text = saetze.map((s, i) => `${esc(s.text)}<sup class="fn" aria-label="${esc(tr('Source {n}', { n: i + 1 }))}">${i + 1}</sup>`).join(' ');
  const quellen = saetze.map(s => `<li><span class="meta">${tr(s.art === 'programm' ? 'Election programme 2025' : 'Outside source')}</span>
    ${extLink(s.url, esc(s.quelle))}${s.zitat ? `<blockquote class="auszug">„${esc(s.zitat)}“</blockquote>` : ''}</li>`).join('');
  return `<section class="profil" aria-labelledby="profil-titel">
    <p class="eyebrow" id="profil-titel">${tr('In short: what does {name} stand for?', { name: esc(p.name) })}</p>
    <p class="profil-text">${text}</p>
    <details class="mehr"><summary>${tr('Sources ({n})', { n: saetze.length })}</summary><ol class="profil-quellen">${quellen}</ol></details>
    <p class="note small">${tr('Summarised in our own words from the 2025 programme and neutral sources such as the bpb. Researched by an AI agent on {d}, not yet checked by people.', { d: datum(PROFIL_STAND) })}</p>
  </section>`;
}


export function viewParteien() {
  return `${kopf(tr('Parties'), tr('What does a party stand for?'), tr('Each programme sorted by topic, next to how the party voted.'))}
  <p><a class="go" href="#vergleich/">${tr('Compare parties')} ${pfeil}</a></p>
  <h2 class="eyebrow section-label">${tr('Parties with content')}</h2>
  <div class="cards">${parteienSortiert().map(p => {
    const pr = programmVon(p.id);
    return `<a class="card link" href="#partei/${esc(p.id)}"><div class="prog-head">${logo(p)}<b>${esc(p.voll ?? p.name)}</b>
        ${pr?.seiten ? `<span class="meta">${tr('{n} pages', { n: pr.seiten })}</span>` : ''}${pfeil}</div></a>`;
  }).join('')}</div>
  <h2 class="eyebrow section-label">${tr('More parties, content follows')}</h2>
  <div class="cards">${ohneInhalt().map(p => `<a class="card link" href="#partei/${esc(p.id)}"><div class="prog-head">${logo(p)}<b>${esc(p.voll)}</b></div>
    <span class="meta">${p.programm ? tr('Programme 2025 linked') : tr('No programme PDF found yet')}</span></a>`).join('')}</div>
  <details class="mehr"><summary>${tr('Why these parties?')}</summary>
    <p class="note small">${tr('Which parties appear needs a fixed rule before launch, ideally all parties admitted to the election in question.')}</p></details>
  ${demoHinweis()}`;
}

function gesagtUndAbgestimmt(parteiId, frageId) {
  return abstimmungenZuFrage(frageId).filter(a => a.stimmen[parteiId]).map(a => {
    const [s, r] = a.stimmen[parteiId];
    return `<p class="voted"><span class="stance">${stimme(s)}</span> ${esc(a.titel)} <span class="meta">${datum(a.datum)}${r ? ` · ${rolle(r)}` : ''}</span></p>`;
  }).join('');
}

// Aktuelle Aussagen (MOCKUP): Person, Datum, Kanal, Quelle. Wird spaeter von einem Agenten gesammelt und freigegeben.
export function aussagenBlock(liste, mitPartei = false) {
  if (!liste.length) return '';
  return `<h2 class="eyebrow section-label">${tr('Recent statements')}</h2>
  <div class="cards">${liste.map(a => `<article class="card aussage"><div class="prog-head">${mitPartei ? logo(partei(a.partei), 'klein') : ''}<b>${esc(a.person)}</b>
      <span class="meta">${esc(a.rolle)}</span></div>
    <p>${esc(a.text)}</p>
    <p class="meta">${datum(a.datum)} · ${extLink(a.url, esc(a.quelle))}${!mitPartei && frage(a.frage) ? ` · <a href="#frage/${esc(a.frage)}">${esc(frage(a.frage).kurz)}</a>` : ''}</p></article>`).join('')}</div>
  <p class="note small">${tr('Summarised in our own words, with the source. Mockup: people and quotes here are invented.')}</p>`;
}

function echtePartei(p) {
  return `${kopf(tr('Party'), `${logo(p)} ${esc(p.voll)}`, '', { href: '#parteien', text: tr('All parties') })}
  ${profilBlock(p)}
  <div class="row">${safeUrl(p.programm) ? `<a class="go" href="#programm/${esc(p.id)}">${tr('Read programme')} ${pfeil}</a>` : ''}
    ${extLink(p.web, tr('Party website'))}</div>
  <section class="notice"><b>${tr('No positions recorded yet.')}</b>
    <p>${tr('Positions follow once the programme has been read. Invented statements are never attached to a real party.')}</p></section>`;
}

export function viewPartei(id) {
  const p = partei(id);
  if (!p) return viewParteien();
  if (!hatInhalt(p.id)) return echtePartei(p);
  const pr = programmVon(p.id);
  const bloecke = themenSortiert().map(t => {
    const zeilen = fragenZuThema(t.id).map(f => {
      const pos = positionVon(p.id, f.id);
      if (!pos) return '';
      const abg = gesagtUndAbgestimmt(p.id, f.id);
      return `<article class="pos"><div class="pos-head"><a class="who" href="#frage/${esc(f.id)}">${esc(f.kurz)}</a>
          <span class="stance">${haltung(pos.haltung)}</span></div>
        <p>${esc(pos.text)}</p>
        ${pos.seite ? `<p class="src">${esc(pos.quelle)}, ${seitenLink(p.id, pos.seite)}</p>` : pos.url ? `<p class="src">${extLink(pos.url, esc(pos.quelle))}</p>` : ''}
        ${abg ? `<div class="said-voted"><p class="eyebrow">${tr('Said and voted')}</p>${abg}</div>` : ''}</article>`;
    }).join('');
    return zeilen ? `<h2 class="eyebrow section-label">${esc(t.titel)}</h2><div class="cards">${zeilen}</div>` : '';
  }).join('');

  return `${kopf(tr('Party'), `${logo(p)} ${esc(p.voll ?? p.name)}`, pr ? `${esc(pr.titel)}${pr.seiten ? ` · ${tr('{n} pages', { n: pr.seiten })}` : ''}` : '',
    { href: '#parteien', text: tr('All parties') })}
  ${profilBlock(p)}
  <div class="row"><a class="go" href="#programm/${esc(p.id)}">${tr('Read programme')} ${pfeil}</a>
    <a class="btn" href="#vergleich/${esc(p.id)}">${tr('Compare with …')}</a></div>
  ${bloecke || `<p class="note">${tr('No positions recorded yet.')}</p>`}
  <p class="note small">${tr('A vote next to a programme point is not a verdict. Parties in government often vote with their coalition, parties in opposition cannot pass their own programme.')}</p>
  ${aussagenBlock(aussagenVon(p.id))}
  ${demoHinweis()}
  ${herkunft(`partei:${p.id}`)}`;
}
