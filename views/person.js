// views/person.js — Ergebnisse, wenn eine eigene Frage eine Person nennt ("Was sagt Friedrich Merz zum Tierschutz?").
// Drei Quellen, immer in derselben Reihenfolge und klar beschriftet: Abstimmungen im Bundestag (abgeordnetenwatch.de),
// Reden im Bundestag (Plenarprotokolle, DIP) und Webquellen. Webquellen sind weniger streng geprueft und stehen deshalb
// zuletzt mit eigenem Hinweis. Keine Bewertung, keine Rangfolge: nur was die Person gesagt oder wie sie abgestimmt hat.
import { tr, plural } from '../i18n.js';
import { esc } from '../core.js';
import { extLink, datum } from './teile.js';
import { belegPruefen } from '../recherche.js';

const STIMME = { ja: ['ja', '✓', 'Voted yes'], nein: ['nein', '✗', 'Voted no'], enthalten: ['enth', '–', 'Abstained'], nicht_abgestimmt: ['fehlt', '·', 'Did not vote'] };
const ABSCHNITTE = [
  ['abstimmung', 'Votes in the Bundestag', 'Source: abgeordnetenwatch.de, the recorded vote of each member.'],
  ['rede', 'Speeches in the Bundestag', 'Source: plenary records of the Bundestag. Every quote was checked word for word against the record.'],
  ['web', 'Web sources', 'Checked less strictly: the quote was found word for word on the page, but the page itself was not reviewed. Read the source before you rely on it.'],
];

const wann = b => (b.datum ? datum(b.datum) : '');

function abstimmung(b) {
  const [klasse, zeichen, wort] = STIMME[b.stimme];
  return `<article class="pos eigen beleg"><div class="pos-head eigen-head"><span class="bubble ${klasse}"><span aria-hidden="true">${zeichen}</span> ${tr(wort)}</span></div>
    <p class="warum">${esc(b.titel)}</p>
    <p class="meta">${extLink(b.url, esc(tr('Vote on abgeordnetenwatch.de')))}${wann(b) ? `, ${esc(wann(b))}` : ''}</p></article>`;
}

function zitat(b) {
  const quelle = b.quelle === 'rede' ? (b.fundstelle || tr('Plenary record')) : (b.seite_name || tr('Web source'));
  return `<article class="pos eigen beleg${b.quelle === 'web' ? ' web' : ''}">
    <p class="warum"><span class="eyebrow">${esc(b.titel)}</span>${esc(b.zusammenfassung)}</p>
    <blockquote class="auszug">„${esc(b.auszug)}“</blockquote>
    <p class="meta">${extLink(b.url, esc(quelle))}${wann(b) ? `, ${esc(wann(b))}` : ''}</p></article>`;
}

// Neueste Belege zuerst, damit die aktuelle Haltung oben steht; ohne Datum ans Ende.
const nachDatum = (a, b) => String(b.datum ?? '').localeCompare(String(a.datum ?? ''));

// Auch gespeicherte Belege laufen erneut durch die Pruefung: ein veraenderter Record darf die Ansicht nicht brechen.
export function belegListe(belege) {
  const sauber = (Array.isArray(belege) ? belege : []).map(belegPruefen).filter(Boolean);
  return ABSCHNITTE.map(([quelle, titel, hinweis]) => {
    const liste = sauber.filter(b => b.quelle === quelle).sort(nachDatum);
    if (!liste.length) return '';
    const karten = liste.map(b => (quelle === 'abstimmung' ? abstimmung(b) : zitat(b))).join('');
    return `<h3 class="eyebrow section-label">${tr(titel)}</h3><p class="note small">${tr(hinweis)}</p><div class="cards">${karten}</div>`;
  }).join('');
}

// Statuszeile fuer Personenfragen. person: { name, partei, gefunden }.
export function personStatus(status, person, belege, fertig, gesamt) {
  const name = person?.name || tr('this person');
  if (status === 'laeuft') return tr('Agent is researching {name}: {a} of {b} sources checked', { name, a: fertig, b: gesamt });
  if (status !== 'fertig') return '';
  return belege.length
    ? plural(belege.length, tr('Done: 1 source found for {name}.', { name }), tr('Done: {n} sources found for {name}.', { n: belege.length, name }))
    : tr('Done: no source on this question found for {name}.', { name });
}

// Ohne Mandat im aktuellen Bundestag gibt es keine Abstimmungen; das sagen wir, statt die Luecke stumm zu lassen.
export const ohneMandat = person => (person && !person.gefunden
  ? `<p class="note small">${tr('No votes shown: {name} was not found as a member of the current Bundestag.', { name: esc(person.name || tr('this person')) })}</p>` : '');

export const PERSON_HINWEIS = () => `<p class="note small">${tr('Questions about a person are answered from what the person said or how they voted, not from the party programme. The selection is not complete: a missing vote or speech does not mean the person has no opinion.')}</p>`;
