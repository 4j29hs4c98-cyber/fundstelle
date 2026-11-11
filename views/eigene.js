// views/eigene.js — "Eigenes Thema": eine eigene Frage stellen, der Agent recherchiert schon beim Tippen.
// Gespeicherte eigene Themen sind Records des Nutzers (kind 'eigenes'), kein
// redaktioneller Inhalt. Neutral wie ueberall: Parteien alphabetisch, jede Aussage mit Zitat. Ja-Nein-Fragen zeigen je
// Partei Ja oder Nein, offene Fragen nur die Position. Record: { frage, typ ('ja_nein' | 'offen', aeltere ohne), ergebnisse, stand }.
import { tr, plural } from '../i18n.js';
import { esc, list, get } from '../core.js';
import { partei } from '../content.js';
import { R, MIN_LAENGE, MAX_LAENGE } from '../recherche.js';
import { kopf, pfeil, marke, extLink, pdfSeite, datum } from './teile.js';
import { belegListe, personStatus, ohneMandat, PERSON_HINWEIS } from './person.js';
import { tatenHtml } from './taten.js';

const nachName = (a, b) => (partei(a.partei)?.name ?? '').localeCompare(partei(b.partei)?.name ?? '', 'de');
const pdfLink = (url, seite) => (url ? `${url.split('#')[0]}#page=${seite}` : null);

// Ja-Nein-Frage: zuerst die Bubble (Ja gruen mit Haken, Nein rot mit Kreuz; Wort und Zeichen, damit es nicht nur an der
// Farbe haengt), darunter zwei bis drei Saetze "Warum". Offene Frage: keine Bubble, nur die Position der Partei.
const BUBBLE = { dafuer: ['ja', '✓', 'Yes', 'Why yes'], dagegen: ['nein', '✗', 'No', 'Why no'] };

function karte(e) {
  const p = partei(e.partei);
  const b = Object.hasOwn(BUBBLE, e.haltung) ? BUBBLE[e.haltung] : null;
  const bubble = b ? `<span class="bubble ${b[0]}"><span aria-hidden="true">${b[1]}</span> ${tr(b[2])}</span>` : '';
  return `<article class="pos eigen"><div class="pos-head eigen-head">${bubble}<span class="who">${marke(p)}</span></div>
    <p class="warum"><span class="eyebrow">${tr(b ? b[3] : 'Position')}</span>${esc(e.zusammenfassung)}</p>
    <blockquote class="auszug">„${esc(e.auszug)}“</blockquote>
    <p class="meta">${extLink(pdfLink(e.quelle_url, e.seite), esc(tr('Election programme 2025')) + ', ' + pdfSeite(e.seite))}</p></article>`;
}

const ergebnisListe = liste => (liste.length
  ? `<div class="cards">${[...liste].sort(nachName).map(karte).join('')}</div>`
  : '');

// Was die Parteien versprechen (Wahlprogramme). Darunter folgt tatenHtml: was sie tun.
function versprochen(ergebnisse, fertig) {
  if (!ergebnisse.length && !fertig) return '';
  return `<h2 class="eyebrow section-label">${tr('What the programmes promise')}</h2>
    ${ergebnisListe(ergebnisse) || `<p class="note small">${tr('No programme answers this question clearly.')}</p>`}${ergebnisse.length ? HINWEIS() : ''}`;
}

const HINWEIS = () => `<p class="note small">${tr('Researched from the 2025 programmes. Every quote was checked automatically, word for word, against the programme page. Parties without a matching passage are not shown.')}</p>`;

// Personenfrage: Belege aus drei Quellen statt Parteiprogrammen (views/person.js).
function personHtml() {
  const status = ['laeuft', 'fertig'].includes(R.status) ? personStatus(R.status, R.person, R.belege, R.fertig, R.gesamt) : '';
  const luecke = R.status === 'fertig' && R.fehlgeschlagen
    ? `<p class="note">${plural(R.fehlgeschlagen, tr('1 source could not be read. The result is incomplete.'), tr('{n} sources could not be read. The result is incomplete.', { n: R.fehlgeschlagen }))}</p>` : '';
  const speichern = R.status === 'fertig' && R.belege.length && !R.fehlgeschlagen
    ? `<p><button class="btn" data-action="eigen-speichern">${tr('Save topic')}</button></p>` : '';
  return `${status ? `<p class="meta" role="status"${R.status === 'laeuft' ? ' aria-busy="true"' : ''}>${esc(status)}</p>` : ''}
    ${luecke}${R.status === 'fertig' ? ohneMandat(R.person) : ''}${belegListe(R.belege)}${speichern}${R.belege.length || R.status === 'fertig' ? PERSON_HINWEIS() : ''}`;
}

// Statuszeile, Hinweis auf unvollstaendige Ergebnisse und Anmeldelink. Auch der Vergleich nutzt das (views/vergleich-eigene.js).
export function rechercheKopf() {
  const status = {
    leer: R.frage.length && R.frage.length < MIN_LAENGE ? tr('Keep typing. The agent starts from {n} characters.', { n: MIN_LAENGE }) : '',
    laeuft: R.gesamt ? tr('Agent is researching: {a} of {b} sources checked', { a: R.fertig, b: R.gesamt }) : tr('Agent is starting …'),
    // Die Abschnitte darunter sagen selbst, was fehlt; die Statuszeile zaehlt nur neutral.
    fertig: tr('Done. Programmes with a matching passage: {a}. Actions found: {b}.', { a: R.ergebnisse.length, b: R.taten.length }),
    anmelden: tr('Sign in to let the agent research. Research is limited per account.'),
    aus: tr('The research agent is not switched on yet.'),
    fehler: /^Zu viele/.test(R.fehler ?? '') ? tr('Too many research requests. Please try again later.') : tr('Research failed. Change the question slightly to try again.'),
  }[R.status] ?? '';
  // Konnte eine Quelle nicht gelesen werden, ist das Ergebnis unvollstaendig: deutlich sagen und nicht speichern lassen.
  const luecke = R.status === 'fertig' && R.fehlgeschlagen
    ? `<p class="note">${plural(R.fehlgeschlagen, tr('1 source could not be read. The result is incomplete.'), tr('{n} sources could not be read. The result is incomplete.', { n: R.fehlgeschlagen }))}</p>` : '';
  const anmelden = R.status === 'anmelden' ? `<p><a class="go" href="#settings">${tr('Sign in')} ${pfeil}</a></p>` : '';
  return `${status ? `<p class="meta" role="status"${R.status === 'laeuft' ? ' aria-busy="true"' : ''}>${esc(status)}</p>` : ''}${luecke}${anmelden}`;
}

// Wird beim Tippen und bei jedem eintreffenden Ergebnis neu gezeichnet, ohne das Eingabefeld anzufassen.
export function ergebnisHtml() {
  if (R.typ === 'person') return personHtml();
  const speichern = R.status === 'fertig' && (R.ergebnisse.length || R.taten.length) && !R.fehlgeschlagen
    ? `<p><button class="btn" data-action="eigen-speichern">${tr('Save topic')}</button></p>` : '';
  const zeigen = ['laeuft', 'fertig'].includes(R.status);
  return `${rechercheKopf()}
    ${zeigen ? versprochen(R.ergebnisse, R.status === 'fertig') + tatenHtml(R.taten, R.ohneFraktion, R.status === 'fertig') : ''}${speichern}`;
}

function gespeichertes(id) {
  const r = get(id);
  if (!r || r.kind !== 'eigenes') return `${kopf(tr('Own topic'), tr('This topic no longer exists.'), '', { href: '#eigene', text: tr('Own topics') })}`;
  return `${kopf(tr('Own topic'), esc(r.data.frage), tr('Researched on {d}', { d: datum(String(r.data.stand ?? '').slice(0, 10)) }), { href: '#eigene', text: tr('Own topics') })}
  ${r.data.typ === 'person' ? belegListe(r.data.belege ?? []) + PERSON_HINWEIS()
    : versprochen(r.data.ergebnisse ?? [], true) + tatenHtml(r.data.taten ?? [], r.data.ohne_fraktion ?? [], Array.isArray(r.data.taten))}
  <p><button class="btn" data-action="eigen-loeschen" data-id="${esc(r.id)}">${tr('Delete topic')}</button></p>`;
}

// Liste der gespeicherten eigenen Themen, neueste zuerst. Erscheint unter "Eigene Frage" und unter "Themen".
export function gespeicherteThemen() {
  const meine = list('eigenes').sort((a, b) => String(b.data.stand).localeCompare(String(a.data.stand)));
  if (!meine.length) return '';
  return `<h2 class="eyebrow section-label">${tr('Your saved topics')}</h2>
  <div class="cards">${meine.map(r => `<a class="card link" href="#eigene/${esc(r.id)}"><div class="card-row"><h3>${esc(r.data.frage)}</h3>${pfeil}</div>
    <span class="meta">${r.data.typ === 'person'
      ? plural((r.data.belege ?? []).length, tr('1 source'), tr('{n} sources', { n: (r.data.belege ?? []).length }))
      : plural((r.data.ergebnisse ?? []).length, tr('1 programme takes a position'), tr('{n} programmes take a position', { n: (r.data.ergebnisse ?? []).length }))
        + ((r.data.taten ?? []).length ? `, ${plural(r.data.taten.length, tr('1 action'), tr('{n} actions', { n: r.data.taten.length }))}` : '')}</span></a>`).join('')}</div>`;
}

// Eigene Seite fuer eine Frage von der Startseite, zu der es in der App noch nichts gibt: der Agent recherchiert sofort,
// die Ergebnisse erscheinen hier. Gehoert zum Bereich Start, nicht zu Themen.
export function viewRecherche() {
  // Mit eigenem Eingabefeld (dieselbe id wie unter #eigene, app.js startet darueber die Recherche beim Tippen): so laesst
  // sich die Frage hier aendern, nach der Anmeldung erneut starten oder verlaengern, ohne zurueck zur Startseite.
  return `${kopf(tr('Research'), tr('Ask your own question'), '', { href: '#start', text: tr('Start') })}
  <label class="field"><span>${tr('Your question')}</span>
    <textarea id="eigen-frage" rows="2" maxlength="${MAX_LAENGE}">${esc(R.frage)}</textarea></label>
  <div id="recherche" aria-live="polite">${ergebnisHtml()}</div>`;
}

export function viewEigene(id) {
  if (id) return gespeichertes(id);
  return `${kopf(tr('Own topic'), tr('Ask your own question'), tr('As you type, an agent searches every programme and summarises where each party stands.'), { href: '#themen', text: tr('All topics') })}
  <label class="field"><span>${tr('Your question')}</span>
    <textarea id="eigen-frage" rows="2" maxlength="${MAX_LAENGE}" placeholder="${esc(tr('e.g. Should there be a speed limit on motorways?'))}">${esc(R.frage)}</textarea></label>
  <p class="note small">${tr('Ask a yes or no question, or an open one starting with How, What or Why. All parties appear in alphabetical order, no ranking.')}</p>
  <div id="recherche" aria-live="polite">${ergebnisHtml()}</div>
  ${gespeicherteThemen()}`;
}
