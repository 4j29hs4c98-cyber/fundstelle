// views/start.js — "Was ist gerade los?": eigene Frage stellen, naechste eigene Wahl, Hinweise zu den eigenen Themen,
// neue Abstimmungen (fuehren zur Frage), fuer spaeter Gemerktes.
import { tr, plural } from '../i18n.js';
import { esc, list, S } from '../core.js';
import { tageBis, neueAbstimmungen, frage, thema, fragenZuThema, partei, positionenZuFrage, frageSuche, ALTE_THEMEN } from '../content.js';
import { profil, hatProfil, naechsteEigeneWahl } from '../profil.js';
import { kopf, pfeil, datum, termin, marke, haltung, seitenLink, demoHinweis, safeUrl } from './teile.js';
import { vergleichLink } from './vergleich.js';
import { R, MAX_LAENGE } from '../recherche.js';
import { ergebnisHtml } from './eigene.js';

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
  const zeilen = positionenZuFrage(f.id).map(p => `<li>${marke(partei(p.partei), 'klein', 'b')}
    <span class="stance">${haltung(p.haltung)}</span>${p.seite ? seitenLink(p.partei, p.seite) : ''}</li>`).join('');
  return `<article class="card"><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span><h3>${esc(f.frage)}</h3>
    <ul class="mini">${zeilen}</ul>
    <div class="row"><a class="go" href="#frage/${esc(f.id)}">${tr('All details')} ${pfeil}</a>
      <a class="btn" href="${esc(vergleichLink([], f.thema))}">${tr('Compare parties')}</a></div></article>`;
}

// Jede Frage aus dem Fragenfeld wird direkt hier recherchiert (actions.js startet den Agenten), die Ergebnisse
// erscheinen unter dem Feld. Passende, schon aufbereitete Fragen aus der App stehen zusaetzlich darunter.
// Der Ergebnisbereich zeigt nur die Recherche zu genau dieser Frage, nicht eine, die anderswo gestellt wurde.
function antwort(text) {
  const r = frageSuche(text);
  const gleich = R.frage === text.replace(/\s+/g, ' ').trim().slice(0, MAX_LAENGE);
  // Der Bereich steht immer da, damit eintreffende Ergebnisse ihn finden. Im Zustand "leer" bleibt er leer:
  // kein "Weitertippen"-Hinweis unter einem schon abgeschickten Feld.
  const recherche = gleich ? `<div id="recherche" data-ansicht="start" aria-live="polite">${R.status === 'leer' ? '' : ergebnisHtml()}</div>` : '';
  const vorhanden = r?.fragen.length
    ? `<h2 class="eyebrow section-label">${tr('Already in the app')}</h2>
    ${r.wertend ? `<p class="note small">${tr('Who does something “best” is your call. The app shows what each programme says, with the page.')}</p>` : ''}
    <div class="cards">${r.fragen.slice(0, 3).map(antwortKarte).join('')}</div>` : '';
  return `${recherche}${vorhanden}`;
}

function hinweis(w, pr) {
  if (!pr.hinweise || !w?.datum || !pr.themen.length) return '';
  const tage = tageBis(w.datum);
  if (tage > HINWEIS_TAGE) return '';
  return `<section class="hinweis" role="status"><b>${plural(tage, tr('Tomorrow: {name}', { name: esc(w.name) }), tr('In {n} days: {name}', { n: tage, name: esc(w.name) }))}</b>
    <p>${tr('See what the parties say on your topics.')}</p><a class="go" href="${esc(vergleichLink([], pr.themen[0]))}">${tr('Compare')} ${pfeil}</a></section>`;
}

// Die drei Hauptwege, gross und eindeutig. Symbole wie in der Tab-Leiste, damit man sie wiedererkennt.
const ICON = {
  themen: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
  parteien: '<path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  eigene: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4"/><path d="M12 16.5h.01"/>',
  grundlagen: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/><path d="M9 7h6"/>',
};
function weg(href, icon, titel, text) {
  return `<a class="weg" href="${href}"><span class="weg-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${ICON[icon]}</svg></span>
    <span class="weg-text"><b>${titel}</b><span>${text}</span></span>${pfeil}</a>`;
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

  <h2 class="eyebrow section-label">${tr('Where do you want to start?')}</h2>
  <nav class="wege" aria-label="${tr('Where do you want to start?')}">
    ${weg('#themen', 'themen', tr('Topics'), tr('What do the parties say about it?'))}
    ${weg('#parteien', 'parteien', tr('Parties'), tr('What does a party stand for?'))}
    ${weg('#eigene', 'eigene', tr('Ask your own question'), tr('An agent researches all programmes while you type.'))}
    ${weg('#grundlagen', 'grundlagen', tr('How politics works'), tr('Short, neutral explanations of the terms that come up in programmes and votes.'))}
  </nav>

  ${hinweis(w, pr)}
  ${w ? `<a class="ballot" href="#wahlen"><div><b>${esc(w.name)}</b><span>${termin(w)}</span></div>
    ${w.datum ? `<span class="n" aria-label="${plural(tageBis(w.datum), tr('1 day to go'), tr('{n} days to go', { n: tageBis(w.datum) }))}">${tageBis(w.datum)}</span>` : `<span class="arrow" aria-hidden="true">→</span>`}</a>` : ''}
  ${hatProfil() ? '' : `<a class="card link profil-tipp" href="#settings"><b>${tr('Which elections matter to you?')}</b>
    <span class="meta">${tr('Set up profile')} →</span></a>`}

  ${meine.length ? `<h2 class="eyebrow section-label">${tr('For you')}</h2>
    <div class="cards">${meine.map(f => `<a class="card link" href="#frage/${esc(f.id)}"><h3>${esc(f.frage)}</h3><span class="meta">${esc(thema(f.thema)?.titel ?? '')}</span></a>`).join('')}</div>` : ''}

  <h2 class="eyebrow section-label">${tr('New votes')}</h2>
  <div class="cards">${neueAbstimmungen().map(abstimmungKarte).join('') || `<p class="note">${tr('No votes yet.')}</p>`}</div>

  <h2 class="eyebrow section-label">${tr('Saved for later')}</h2>
  ${gemerkt.length ? `<div class="cards">${gemerkt.join('')}</div>`
    : `<p class="note small">${tr('Tap the star on a question to find it here again.')}</p>`}

  ${demoHinweis()}
  <p class="hint">${tr('Swipe sideways to change section.')}</p>`;
}
