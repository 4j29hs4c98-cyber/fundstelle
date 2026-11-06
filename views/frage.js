// views/frage.js — der Knotenpunkt: eine Frage, alle Programme nebeneinander, was die Parteien selbst ankuendigen,
// Argumente dafuer und dagegen, Abstimmungen dazu. Jeder Weg endet an der Originalstelle.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { frage, thema, partei, programmVon, positionenZuFrage, argumenteZuFrage, abstimmungenZuFrage } from '../content.js';
import { kopf, merkKnopf, haltung, stimme, rolle, datum, seite, herkunft, demoHinweis, safeUrl, extLink } from './teile.js';

const quelleLink = (url, text) => extLink(url, esc(text));

function positionKarte(p) {
  const pr = programmVon(p.partei), name = partei(p.partei)?.name ?? '';
  const stelle = p.seite ? `<details class="stelle"><summary>${esc(p.quelle)}, ${seite(p.seite)}</summary>
      ${p.auszug ? `<blockquote class="auszug">„${esc(p.auszug)}“</blockquote>` : ''}
      <p class="meta">${safeUrl(pr?.url) ? extLink(pr.url, tr('Open the original programme')) : tr('The original programme is not linked yet.')}</p></details>`
    : `<p class="src">${esc(p.quelle)}</p>`;
  return `<article class="pos">
    <div class="pos-head"><a class="who" href="#partei/${esc(p.partei)}"><span class="swatch" aria-hidden="true"></span>${esc(name)}</a>
      <span class="stance">${haltung(p.haltung)}</span></div>
    <p>${esc(p.text)}</p>${stelle}</article>`;
}

function abstimmungBlock(a) {
  const zeilen = Object.entries(a.stimmen).map(([id, [s, r]]) => ({ name: partei(id)?.name ?? '', s, r }))
    .sort((x, y) => x.name.localeCompare(y.name, 'de'));
  return `<article class="card vote"><h3>${esc(a.titel)}</h3>
    <p>${esc(a.parlament)} · ${datum(a.datum)} · ${quelleLink(a.url, a.quelle)}</p>
    <dl class="stimmen">${zeilen.map(z => `<dt>${esc(z.name)}</dt><dd><b>${stimme(z.s)}</b>${z.r ? ` <span class="meta">${rolle(z.r)}</span>` : ''}</dd>`).join('')}</dl></article>`;
}

export function viewFrage(id) {
  const f = frage(id);
  if (!f) return `${kopf(tr('Topics'), tr('This question no longer exists.'), '', { href: '#themen', text: tr('All topics') })}`;
  const t = thema(f.thema), pos = positionenZuFrage(f.id), args = argumenteZuFrage(f.id), votes = abstimmungenZuFrage(f.id);
  const angekuendigt = pos.filter(p => p.aenderung);
  const liste = richtung => args.filter(a => a.richtung === richtung)
    .map(a => `<li>${esc(a.text)} <span class="src-inline">${quelleLink(a.url, a.quelle)}</span></li>`).join('') || `<li class="meta">${tr('None yet.')}</li>`;

  return `${kopf(esc(t?.titel ?? tr('Question')), esc(f.frage), '', { href: t ? `#thema/${t.id}` : '#themen', text: t?.titel ?? tr('All topics') })}
  <div class="row merk-row">${merkKnopf(f.id)}<span class="meta">${tr('All parties in alphabetical order. No ranking, no recommendation.')}</span></div>

  <div class="cards">${pos.map(positionKarte).join('')}</div>

  <h2 class="eyebrow section-label">${tr('What the parties say would change')}</h2>
  ${angekuendigt.length ? `<div class="cards">${angekuendigt.map(p => `<article class="card paper"><h3>${esc(partei(p.partei)?.name ?? '')}</h3>
      <p>${esc(p.aenderung)}</p><p class="meta">${esc(p.quelle)}, ${seite(p.seite)}</p></article>`).join('')}</div>
    <p class="note small">${tr('Only what each programme itself announces. The app does not predict effects of its own.')}</p>`
    : `<p class="note">${tr('No programme names a concrete change.')}</p>`}

  <h2 class="eyebrow section-label">${tr('Arguments')}</h2>
  <div class="args"><section class="panel"><h3>${tr('For')}</h3><ul>${liste('dafuer')}</ul></section>
    <section class="panel"><h3>${tr('Against')}</h3><ul>${liste('dagegen')}</ul></section></div>

  <h2 class="eyebrow section-label">${tr('Votes on this')}</h2>
  ${votes.length ? `<p class="note small">${tr('Parties in government usually vote together, even where their own programme says something different. That is why the role at the time of the vote is shown.')}</p>
    <div class="cards">${votes.map(abstimmungBlock).join('')}</div>`
    : `<p class="note">${tr('No vote has been linked to this question yet.')}</p>`}

  ${demoHinweis()}
  ${herkunft(`frage:${f.id}`)}`;
}
