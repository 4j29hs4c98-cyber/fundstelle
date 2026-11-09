// views/eigene.js — "Eigenes Thema": eine eigene Frage stellen, der Agent recherchiert schon beim Tippen.
// Gespeicherte eigene Themen sind Records des Nutzers (kind 'eigenes': { frage, ergebnisse, stand }), kein
// redaktioneller Inhalt. Neutral wie ueberall: Parteien alphabetisch, nur dafuer oder dagegen, jede Aussage mit Zitat.
import { tr } from '../i18n.js';
import { esc, list, get } from '../core.js';
import { partei } from '../content.js';
import { R, MIN_LAENGE, MAX_LAENGE } from '../recherche.js';
import { kopf, pfeil, haltung, logo, extLink, pdfSeite, datum } from './teile.js';

const nachName = (a, b) => (partei(a.partei)?.name ?? '').localeCompare(partei(b.partei)?.name ?? '', 'de');
const pdfLink = (url, seite) => (url ? `${url.split('#')[0]}#page=${seite}` : null);

function karte(e) {
  const p = partei(e.partei);
  return `<article class="pos"><div class="pos-head"><span class="who">${logo(p, 'klein')}${esc(p?.name ?? '')}</span>
      <span class="stance">${haltung(e.haltung)}</span></div>
    <p>${esc(e.zusammenfassung)}</p>
    <blockquote class="auszug">„${esc(e.auszug)}“</blockquote>
    <p class="meta">${extLink(pdfLink(e.quelle_url, e.seite), esc(tr('Election programme 2025')) + ', ' + pdfSeite(e.seite))}</p></article>`;
}

const ergebnisListe = liste => (liste.length
  ? `<div class="cards">${[...liste].sort(nachName).map(karte).join('')}</div>`
  : '');

const HINWEIS = () => `<p class="note small">${tr('Researched by an AI agent. Every quote was checked word for word against the programme page, but not yet by people. Parties without a clear passage for or against are not shown.')}</p>`;

// Wird beim Tippen und bei jedem eintreffenden Ergebnis neu gezeichnet, ohne das Eingabefeld anzufassen.
export function ergebnisHtml() {
  const status = {
    leer: R.frage.length && R.frage.length < MIN_LAENGE ? tr('Keep typing. The agent starts from {n} characters.', { n: MIN_LAENGE }) : '',
    laeuft: R.gesamt ? tr('Agent is researching: {a} of {b} programmes read', { a: R.fertig, b: R.gesamt }) : tr('Agent is starting …'),
    fertig: R.ergebnisse.length ? tr('Done: {n} programmes take a clear position.', { n: R.ergebnisse.length }) : tr('Done: no programme answers this question clearly.'),
    anmelden: tr('Sign in to let the agent research. Research is limited per account.'),
    aus: tr('The research agent is not switched on yet.'),
    fehler: tr('Research failed. Change the question slightly to try again.'),
  }[R.status] ?? '';
  const speichern = R.status === 'fertig' && R.ergebnisse.length
    ? `<p><button class="btn" data-action="eigen-speichern">${tr('Save topic')}</button></p>` : '';
  const anmelden = R.status === 'anmelden' ? `<p><a class="go" href="#settings">${tr('Sign in')} ${pfeil}</a></p>` : '';
  return `${status ? `<p class="meta" role="status"${R.status === 'laeuft' ? ' aria-busy="true"' : ''}>${esc(status)}</p>` : ''}
    ${ergebnisListe(R.ergebnisse)}${speichern}${anmelden}${R.ergebnisse.length ? HINWEIS() : ''}`;
}

function gespeichertes(id) {
  const r = get(id);
  if (!r || r.kind !== 'eigenes') return `${kopf(tr('Own topic'), tr('This topic no longer exists.'), '', { href: '#eigene', text: tr('Own topics') })}`;
  return `${kopf(tr('Own topic'), esc(r.data.frage), tr('Researched on {d}', { d: datum(String(r.data.stand ?? '').slice(0, 10)) }), { href: '#eigene', text: tr('Own topics') })}
  ${ergebnisListe(r.data.ergebnisse ?? []) || `<p class="note">${tr('No programme answers this question clearly.')}</p>`}
  <p><button class="btn" data-action="eigen-loeschen" data-id="${esc(r.id)}">${tr('Delete topic')}</button></p>
  ${HINWEIS()}`;
}

export function viewEigene(id) {
  if (id) return gespeichertes(id);
  const meine = list('eigenes').sort((a, b) => String(b.data.stand).localeCompare(String(a.data.stand)));
  return `${kopf(tr('Own topic'), tr('Ask your own question'), tr('As you type, an agent searches every programme for a clear passage for or against.'), { href: '#themen', text: tr('All topics') })}
  <label class="field"><span>${tr('Your question')}</span>
    <textarea id="eigen-frage" rows="2" maxlength="${MAX_LAENGE}" placeholder="${esc(tr('e.g. Should there be a speed limit on motorways?'))}">${esc(R.frage)}</textarea></label>
  <p class="note small">${tr('Ask a yes or no question. All parties appear in alphabetical order, no ranking.')}</p>
  <div id="recherche" aria-live="polite">${ergebnisHtml()}</div>
  ${meine.length ? `<h2 class="eyebrow section-label">${tr('Your saved topics')}</h2>
  <div class="cards">${meine.map(r => `<a class="card link" href="#eigene/${esc(r.id)}"><h3>${esc(r.data.frage)}</h3>
    <span class="meta">${tr('{n} programmes take a position', { n: (r.data.ergebnisse ?? []).length })}</span></a>`).join('')}</div>` : ''}`;
}
