// views/vergleich-eigene.js — eine eigene Frage im Vergleich: dieselbe Recherche wie unter "Eigenes Thema" (recherche.js),
// Der Server recherchiert alle Parteien; gezeigt werden nur die gewaehlten, nebeneinander, je Spalte was das Programm
// verspricht und was die Partei tut. So bleibt das Ergebnis gueltig, wenn man Parteien an- oder abwaehlt.
// Spalten in derselben alphabetischen Reihenfolge wie der restliche Vergleich (A, B, C, D), keine Rangfolge.
// Eingabefeld und Ergebnisbereich tragen dieselben ids wie unter #eigene; rechercheZeichnen (unten) zeichnet #recherche je nach Ansicht neu.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { partei } from '../content.js';
import { R, MAX_LAENGE, tatPruefen } from '../recherche.js';
import { rechercheKopf, ergebnisHtml } from './eigene.js';
import { marke, extLink, pdfSeite } from './teile.js';

const MEHRHEIT = { ja: 'Majority yes', nein: 'Majority no', enthalten: 'Majority abstained' };
const pdfLink = (url, seite) => (url ? `${url.split('#')[0]}#page=${seite}` : null);
const nachDatum = (a, b) => String(b.datum ?? '').localeCompare(String(a.datum ?? ''));
const slot = b => `<span class="slot" aria-hidden="true">${b}</span>`;

function programm(e, fertig) {
  if (!e) return `<p class="meta">${fertig ? tr('No matching passage in the programme.') : tr('Reading the programme …')}</p>`;
  const richtung = e.haltung === 'dafuer' ? `<span class="bubble ja"><span aria-hidden="true">✓</span> ${tr('Yes')}</span>`
    : e.haltung === 'dagegen' ? `<span class="bubble nein"><span aria-hidden="true">✗</span> ${tr('No')}</span>` : '';
  return `${richtung}<p>${esc(e.zusammenfassung)}</p><blockquote class="auszug">„${esc(e.auszug)}“</blockquote>
    <p class="meta">${extLink(pdfLink(e.quelle_url, e.seite), esc(tr('Election programme 2025')) + ', ' + pdfSeite(e.seite))}</p>`;
}

// Was die Partei tut: nur Taten, an denen ihre Fraktion beteiligt ist, oder Meldungen ueber sie.
function taten(id, liste) {
  const zeilen = [...liste].sort(nachDatum).flatMap(t => {
    if (t.quelle === 'fraktion_abstimmung') {
      const f = t.fraktionen.find(x => x.parteien.includes(id));
      return f ? [`<li>${extLink(t.url, esc(t.titel))}: ${esc(f.fraktion)}, ${esc(f.mehrheit ? tr(MEHRHEIT[f.mehrheit]) : tr('No clear majority'))} (${esc(tr('{a} yes, {b} no, {c} abstained', { a: f.ja, b: f.nein, c: f.enthalten }))})</li>`] : [];
    }
    if (t.quelle === 'antrag') return t.fraktionen.some(f => f.parteien.includes(id)) ? [`<li>${esc(t.art || tr('Printed paper'))}: ${extLink(t.url, esc(t.titel))}</li>`] : [];
    if (t.quelle === 'web' && t.partei === id) return [`<li>${esc(t.zusammenfassung)} ${extLink(t.url, esc(t.seite_name || tr('Web source')))}</li>`];
    return [];
  });
  return zeilen.length ? `<ul class="vz-taten">${zeilen.join('')}</ul>` : '';
}

function spalte(id, b, fertig, liste) {
  const p = partei(id);
  const e = R.ergebnisse.find(x => x.partei === id);
  const getan = taten(id, liste);
  const ohne = R.ohneFraktion.includes(id) ? `<p class="meta">${tr('No group in the current Bundestag, so no votes or motions.')}</p>` : '';
  const leer = fertig && !getan && !ohne ? `<p class="meta">${tr('Nothing found.')}</p>` : '';
  return `<div class="vz"><p class="vz-partei">${slot(b)}${marke(p, 'klein', 'b')}</p>
    <p class="eyebrow">${tr('Promised')}</p>${programm(e, fertig)}
    <p class="eyebrow">${tr('Done')}</p>${getan}${ohne}${leer}</div>`;
}

// Ergebnisbereich fuer den Vergleich. ids: gewaehlte Parteien in Spaltenreihenfolge.
export function vergleichErgebnisHtml(ids) {
  if (R.typ === 'person') return `<p class="note">${tr('This question is about a person. Ask it under Research to see votes, speeches and statements of that person.')} <a href="#recherche">${tr('Open Research')}</a></p>`;
  const liste = R.taten.map(tatPruefen).filter(Boolean);
  const zeigen = ['laeuft', 'fertig'].includes(R.status);
  const spalten = zeigen ? `<div class="vgrid">${ids.map((id, i) => spalte(id, 'ABCD'[i], R.status === 'fertig', liste)).join('')}</div>
    <p class="note small">${tr('Programme quotes were checked word for word. Votes and motions come from the Bundestag record, news from a fixed list of sites.')}</p>` : '';
  return `${rechercheKopf()}${spalten}`;
}

export function vergleichEigene(ids) {
  return `<h2 class="eyebrow section-label">${tr('Your own question')}</h2>
  <label class="field"><span>${tr('Ask a question to compare these parties')}</span>
    <textarea id="eigen-frage" rows="2" maxlength="${MAX_LAENGE}" placeholder="${esc(tr('e.g. Should there be a speed limit on motorways?'))}">${esc(R.frage)}</textarea></label>
  <div id="recherche" data-ansicht="vergleich" data-ids="${esc(ids.join(','))}" aria-live="polite">${vergleichErgebnisHtml(ids)}</div>`;
}

// Zeichnet #recherche neu, je nach Seite als Liste (Eigenes Thema) oder als Spalten (Vergleich). Fuer jeden Strom dieselbe.
export function rechercheZeichnen() {
  const el = document.getElementById('recherche');
  if (!el) return;
  const ansicht = el.dataset.ansicht;
  if (ansicht === 'vergleich') el.innerHTML = vergleichErgebnisHtml((el.dataset.ids || '').split(',').filter(Boolean));
  else el.innerHTML = ansicht === 'start' && R.status === 'leer' ? '' : ergebnisHtml();
}
