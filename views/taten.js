// views/taten.js — "Was die Parteien tun" unter einer eigenen Parteifrage, neben dem, was sie in den Programmen versprechen.
// Drei Abschnitte, immer in derselben Reihenfolge: namentliche Abstimmungen der Fraktionen, Antraege und Gesetzentwuerfe,
// Meldungen. Innerhalb eines Abschnitts nach Datum (neueste zuerst), Fraktionen alphabetisch: keine Rangfolge der Parteien.
// Parteien ohne Fraktion im Bundestag werden ausdruecklich genannt, damit die Luecke nicht als "tut nichts" gelesen wird.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { partei } from '../content.js';
import { tatPruefen } from '../recherche.js';
import { extLink, marke, datum } from './teile.js';

const MEHRHEIT = { ja: ['ja', '✓', 'Majority yes'], nein: ['nein', '✗', 'Majority no'], enthalten: ['enth', '–', 'Majority abstained'] };
const wann = t => (t.datum ? `, ${esc(datum(t.datum))}` : '');
const nachDatum = (a, b) => String(b.datum ?? '').localeCompare(String(a.datum ?? ''));

function fraktionZeile(f) {
  const m = MEHRHEIT[f.mehrheit];
  const bubble = m ? `<span class="bubble ${m[0]}"><span aria-hidden="true">${m[1]}</span> ${tr(m[2])}</span>` : `<span class="bubble fehlt">${tr('No clear majority')}</span>`;
  return `<li>${bubble}<strong>${esc(f.fraktion)}</strong><span class="meta">${esc(tr('{a} yes, {b} no, {c} abstained', { a: f.ja, b: f.nein, c: f.enthalten }))}</span></li>`;
}

function abstimmung(t) {
  const ergebnis = t.angenommen === true ? tr('Accepted') : t.angenommen === false ? tr('Rejected') : tr('Recorded vote');
  return `<article class="pos eigen beleg"><p class="warum"><span class="eyebrow">${esc(ergebnis)}</span>${esc(t.titel)}</p>
    <ul class="fraktionen">${t.fraktionen.map(fraktionZeile).join('')}</ul>
    <p class="meta">${extLink(t.url, esc(tr('Vote on abgeordnetenwatch.de')))}${wann(t)}</p></article>`;
}

function antrag(t) {
  const art = [t.art, t.nummer].filter(Boolean).join(' ');
  return `<article class="pos eigen beleg"><p class="warum"><span class="eyebrow">${esc(art || tr('Printed paper'))}</span>${esc(t.titel)}</p>
    <p class="meta">${esc(tr('Introduced by: {f}', { f: t.fraktionen.map(f => f.fraktion).join(', ') }))}</p>
    <p class="meta">${extLink(t.url, esc(tr('Bundestag printed paper (PDF)')))}${wann(t)}</p></article>`;
}

function meldung(t) {
  return `<article class="pos eigen beleg web"><div class="pos-head eigen-head"><span class="who">${marke(partei(t.partei))}</span></div>
    <p class="warum"><span class="eyebrow">${esc(t.titel)}</span>${esc(t.zusammenfassung)}</p>
    <blockquote class="auszug">„${esc(t.auszug)}“</blockquote>
    <p class="meta">${extLink(t.url, esc(t.seite_name || tr('Web source')))}${wann(t)}</p></article>`;
}

const ABSCHNITTE = [
  ['fraktion_abstimmung', 'Recorded votes in the Bundestag', 'Only roll-call votes are recorded per member; most decisions are taken by show of hands and do not appear here. Shown is how the members of each parliamentary group voted. Source: abgeordnetenwatch.de.', abstimmung],
  ['antrag', 'Motions and bills', 'Introduced by a parliamentary group in the current Bundestag. Title and group are taken unchanged from the Bundestag record (DIP). Parties in government often act through the federal government instead of their own motions.', antrag],
  ['web', 'In the news', 'Checked less strictly: the quote was found word for word on the page, but the page itself was not reviewed. Read the source before you rely on it.', meldung],
];

// taten: aus dem Strom oder gespeichert (wird hier erneut geprueft). ohneFraktion: Partei-ids. fertig: Recherche beendet.
export function tatenHtml(taten, ohneFraktion, fertig) {
  // Meldungen nur zu bekannten Parteien: ein Zitat ohne erkennbare Partei waere irrefuehrend.
  const sauber = (Array.isArray(taten) ? taten : []).map(tatPruefen).filter(t => t && (t.quelle !== 'web' || partei(t.partei)));
  const teile = ABSCHNITTE.map(([quelle, titel, hinweis, karte]) => {
    const liste = sauber.filter(t => t.quelle === quelle).sort(nachDatum);
    return liste.length ? `<h3 class="eyebrow section-label">${tr(titel)}</h3><p class="note small">${tr(hinweis)}</p><div class="cards">${liste.map(karte).join('')}</div>` : '';
  }).join('');
  const namen = (Array.isArray(ohneFraktion) ? ohneFraktion : []).map(id => partei(id)?.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'de'));
  const ohne = namen.length && (sauber.length || fertig)
    ? `<p class="note small">${esc(tr('No votes or motions for {names}: these parties have no parliamentary group in the current Bundestag. This says nothing about their position.', { names: namen.join(', ') }))}</p>` : '';
  const leer = fertig && !sauber.length ? `<p class="note small">${tr('No recorded votes, motions or news on this question were found.')}</p>` : '';
  if (!teile && !ohne && !leer) return '';
  return `<h2 class="eyebrow section-label">${tr('What the parties do')}</h2>${teile}${leer}${ohne}`;
}
