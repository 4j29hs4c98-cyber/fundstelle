// views/start.js — "Was ist gerade los?": eigene Frage stellen, naechste eigene Wahl, Hinweise zu den eigenen Themen,
// neue Abstimmungen (fuehren zur Frage), fuer spaeter Gemerktes.
import { tr } from '../i18n.js';
import { esc, list, S } from '../core.js';
import { tageBis, neueAbstimmungen, frage, thema, fragenZuThema, partei, positionenZuFrage, frageSuche, ALTE_THEMEN } from '../content.js';
import { profil, hatProfil, naechsteEigeneWahl } from '../profil.js';
import { kopf, pfeil, datum, termin, logo, haltung, seitenLink, demoHinweis, safeUrl } from './teile.js';
import { vergleichLink } from './vergleich.js';

const HINWEIS_TAGE = 90;

function abstimmungKarte(a) {
  const f = frage(a.fragen[0]);
  const ziel = f ? `<a class="go" href="#frage/${esc(f.id)}">${tr('To the question')} ${pfeil}</a>`
    : safeUrl(a.url) ? `<a class="go" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">${tr('Official source')} ${pfeil}</a>` : '';
  return `<article class="card"><h3>${esc(a.titel)}</h3>
    <p>${esc(a.parlament)} · ${datum(a.datum)}</p>
    <div class="card-foot"><span class="meta">${f ? esc(f.kurz) : ''}</span>${ziel}</div></article>`;
}

function gemerkteKarten() {
  const fragen = list('merk').map(r => frage(r.data.frage)).filter(Boolean);
  // Gemerkte Themen aus Version 1 (Kurzname oder ID) bleiben sichtbar.
  const themen = list('merk').map(r => ({ rec: r, t: thema(ALTE_THEMEN[r.data.thema] || r.data.thema) })).filter(x => x.t);
  return [
    ...fragen.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`),
    ...themen.map(({ rec, t }) => `<article class="card"><div class="card-row"><h3>${esc(t.titel)}</h3>
        <button class="pin" data-action="vergessen" data-id="${esc(rec.id)}" aria-pressed="true" aria-label="${tr('Remove')}">★</button></div>
      <div class="card-foot"><span class="meta">${tr('Topic')}</span><a class="go" href="#thema/${esc(t.id)}">${tr('Open')} ${pfeil}</a></div></article>`),
  ];
}


function antwortKarte(f) {
  const zeilen = positionenZuFrage(f.id).map(p => `<li>${logo(partei(p.partei), 'klein')}<b>${esc(partei(p.partei)?.name ?? '')}</b>
    <span class="stance">${haltung(p.haltung)}</span>${p.seite ? seitenLink(p.partei, p.seite) : ''}</li>`).join('');
  return `<article class="card"><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span><h3>${esc(f.frage)}</h3>
    <ul class="mini">${zeilen}</ul>
    <div class="row"><a class="go" href="#frage/${esc(f.id)}">${tr('All details')} ${pfeil}</a>
      <a class="btn" href="${esc(vergleichLink([], f.thema))}">${tr('Compare parties')}</a></div></article>`;
}

function antwort(text) {
  const r = frageSuche(text);
  if (!r || !r.fragen.length) return `<section class="notice"><b>${tr('Nothing in the programmes on this yet.')}</b>
    <p>${tr('The example programmes only cover a few questions. Under Check you can search for exact words.')}</p></section>`;
  return `${r.wertend ? `<p class="note small">${tr('Who does something “best” is your call. The app shows what each programme says, with the page.')}</p>` : ''}
    <div class="cards">${r.fragen.slice(0, 3).map(antwortKarte).join('')}</div>`;
}

function hinweis(w, pr) {
  if (!pr.hinweise || !w?.datum || !pr.themen.length) return '';
  const tage = tageBis(w.datum);
  if (tage > HINWEIS_TAGE) return '';
  return `<section class="hinweis" role="status"><b>${tr('In {n} days: {name}', { n: tage, name: esc(w.name) })}</b>
    <p>${tr('See what the parties say on your topics.')}</p><a class="go" href="${esc(vergleichLink([], pr.themen[0]))}">${tr('Compare')} ${pfeil}</a></section>`;
}

export function viewStart() {
  const pr = profil(), w = naechsteEigeneWahl(), gemerkt = gemerkteKarten();
  const meine = pr.themen.flatMap(fragenZuThema);
  return `${kopf(tr('Today'), `${tr('Politics is complicated enough.')}<br><em>${tr('The information about it is not.')}</em>`)}

  <form class="search fragefeld" data-form="startfrage" role="search">
    <label class="sr-only" for="start-q">${tr('Ask your own question')}</label>
    <input id="start-q" name="q" type="search" value="${esc(S.frage)}" placeholder="${tr('e.g. Which party wants more for homeless people?')}" autocomplete="off" maxlength="200">
    <button class="btn primary">${tr('Ask')}</button>
  </form>
  ${S.frage ? antwort(S.frage) : ''}

  ${hinweis(w, pr)}
  ${w ? `<a class="ballot" href="#wahlen"><div><b>${esc(w.name)}</b><span>${termin(w)}</span></div>
    ${w.datum ? `<span class="n" aria-label="${tr('{n} days to go', { n: tageBis(w.datum) })}">${tageBis(w.datum)}</span>` : `<span class="arrow" aria-hidden="true">→</span>`}</a>` : ''}
  ${hatProfil() ? '' : `<section class="notice"><b>${tr('Which elections matter to you?')}</b>
    <p>${tr('Choose your state, the kinds of election and your topics. Start then shows only what concerns you.')}</p>
    <p><a href="#settings">${tr('Set up profile')} →</a></p></section>`}

  ${meine.length ? `<h2 class="eyebrow section-label">${tr('For you')}</h2>
    <div class="cards">${meine.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`).join('')}</div>` : ''}

  <h2 class="eyebrow section-label">${tr('New votes')}</h2>
  <div class="cards">${neueAbstimmungen().map(abstimmungKarte).join('') || `<p class="note">${tr('No votes yet.')}</p>`}</div>

  <h2 class="eyebrow section-label">${tr('Saved for later')}</h2>
  ${gemerkt.length ? `<div class="cards">${gemerkt.join('')}</div>`
    : `<p class="note">${tr('Tap the star on a question to find it here again.')}</p>`}

  ${demoHinweis()}
  <p class="hint">${tr('Swipe sideways to change section.')}</p>`;
}
