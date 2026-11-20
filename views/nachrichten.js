// views/nachrichten.js — Nachrichten anzeigen. Startseite: "Themen des Tages" (Meldungen zum selben Ereignis, mit Kurzfassung der
// KI), keine lange Schlagzeilenliste. Eine eigene Seite je Thema (#nachricht/<id>) mit Kurzfassung, den verlinkten Meldungen und
// dem Weg zu Programm und Taten der Parteien. Nur Titel, Quelle und Zeit stammen von den Redaktionen, verlinkt auf den
// Artikel: kein fremder Text, keine Bewertung, keine Rangfolge der Parteien, immer die neuesten zuerst.
import { tr, LOC } from '../i18n.js';
import { esc } from '../core.js';
import { frage, partei } from '../content.js';
import { R, MAX_LAENGE } from '../recherche.js';
import { N, BEREICHE, startThemen, themenNachBereich, themaNachId, themenZuPartei, zuPartei, zuPerson } from '../nachrichten.js';
import { ergebnisHtml } from './eigene.js';
import { extLink, kopf, pfeil } from './teile.js';

const PARTEI_ANZAHL = 6, PARTEI_THEMEN = 4, PERSON_ANZAHL = 5;

const zeit = iso => new Date(iso).toLocaleString(LOC(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const zeile = n => `<li>${extLink(n.url, esc(n.titel))}<span class="meta">${esc(n.quelle)} · ${esc(zeit(n.datum))}</span></li>`;
const zeile2 = m => `<li>${extLink(m.u, esc(m.t))}<span class="meta">${esc(m.q)} · ${esc(zeit(m.d))}</span></li>`;
const liste = items => `<ul class="news">${items.map(zeile).join('')}</ul>`;
const ersterSatz = t => (t.split(/(?<=[.!?])\s+/)[0] ?? t);
const ART = { kommentar: 'Comment', interview: 'Interview', video: 'Video' };

function themenZahl(t) {
  const n = t.meldungen.length;
  if (n === 1) return tr('1 report from 1 source');
  return t.quellen === 1 ? tr('{n} reports from one source', { n }) : tr('{n} reports from {m} sources', { n, m: t.quellen });
}

const themenKarte = (t, rang, von) => `<a class="card link${rang === 1 ? ' aufm' : ''}" href="#nachricht/${esc(t.id)}">${rang ? `<span class="meta">${tr('{n} of {m}', { n: rang, m: von })}</span>` : ''}<h3>${esc(t.titel)}</h3>
  ${t.zusammenfassung ? `<p><span class="tag">${tr('KI summary')}</span> ${esc(ersterSatz(t.zusammenfassung))}</p>` : ''}
  <span class="meta">${esc(themenZahl(t))} · ${esc(zeit(t.aktualisiert))}</span></a>`;

// Startseite: die drei wichtigsten Themen (Rang der KI) und der Weg zur Nachrichtenabfrage mit allen Themen nach Bereich.
export function aktuellHtml() {
  if (!N.themen.length) return '';
  const drei = startThemen();
  return `<h2 class="eyebrow section-label">${tr('Topics of the day')}</h2>
  ${drei.length ? `<div class="cards">${drei.map((t, i) => themenKarte(t, i + 1, drei.length)).join('')}</div>` : ''}
  <p class="note small">${tr('Topics and summaries are written by a KI from the headlines and teasers of eight news sources and the Bundestag, and checked automatically. A person has not checked them. Read the sources.')}</p>
  <p><a class="go" href="#nachrichten">${tr('News overview')} ${pfeil}</a></p>
  <p class="note small">${tr('All important news of the last 36 hours, sorted by area.')}</p>`;
}

// Seite "Nachrichtenabfrage": alle Themen nach Bereich, jeweils mit den verlinkten Meldungen. param: Nummer eines Bereichs oder leer.
const MELDUNGEN_JE_THEMA = 4;
export function viewNachrichten(param) {
  const nr = /^\d+$/.test(String(param ?? '')) && Number(param) < BEREICHE.length ? Number(param) : null;
  const chip = (href, text, an) => `<a class="qchip" href="${href}" aria-pressed="${an}"${an ? ' aria-current="page"' : ''}>${text}</a>`;
  const filter = `<div class="qbar" role="group" aria-label="${esc(tr('Area'))}">${chip('#nachrichten', tr('All areas'), nr == null)}${BEREICHE.map((b, i) => chip(`#nachrichten/${i}`, esc(b), nr === i)).join('')}</div>`;
  const gruppen = themenNachBereich(nr).map(g => `<h2 class="eyebrow section-label">${esc(g.name)}</h2>
    ${g.themen.map(t => `<article class="card"><h3><a href="#nachricht/${esc(t.id)}">${esc(t.titel)}</a></h3>
      <ul class="news">${t.meldungen.slice(0, MELDUNGEN_JE_THEMA).map(zeile2).join('')}</ul>
      <span class="meta">${esc(themenZahl(t))}${t.meldungen.length > MELDUNGEN_JE_THEMA ? ` · <a href="#nachricht/${esc(t.id)}">${tr('All reports')}</a>` : ''}</span></article>`).join('')}`).join('');
  const leer = N.themen.length ? tr('No topics in this area right now.') : tr(N.stand ? 'No news available right now.' : 'Loading the news …');
  return `${kopf(tr('News'), tr('News overview'), tr('The most important reports of the last 36 hours, sorted by area. Only headline, source and time, linked to the newsroom.'), { href: '#start', text: tr('Start') })}
  ${filter}
  ${gruppen || `<p class="note">${leer}</p>`}
  <p class="note small">${tr('A KI sorts the topics into areas. The reports themselves stay unchanged. An area is no judgement about a report.')}</p>`;
}

export function parteiNachrichten(id) {
  const themen = themenZuPartei(id).slice(0, PARTEI_THEMEN);
  const gesehen = new Set(themen.flatMap(t => t.meldungen.map(m => m.u)));
  const items = zuPartei(id).filter(n => !gesehen.has(n.url)).slice(0, PARTEI_ANZAHL);
  if (!themen.length && !items.length) return '';
  return `<h2 class="eyebrow section-label">${tr('In the news')}</h2>
  ${themen.length ? `<div class="cards">${themen.map(t => themenKarte(t)).join('')}</div>` : ''}${items.length ? liste(items) : ''}
  <p class="note small">${tr('Topics and headlines that name this party. Being named says nothing about what the party did.')}</p>`;
}

export function personNachrichten(name) {
  const items = zuPerson(name).slice(0, PERSON_ANZAHL);
  if (!items.length) return '';
  return `<h3 class="eyebrow section-label">${tr('Recent headlines')}</h3>${liste(items)}
  <p class="note small">${tr('Headlines that name this person. Being named says nothing about their position.')}</p>`;
}

// ---------- Seite eines Themas ----------
const meldungZeile = m => `<li><span>${m.a !== 'meldung' ? `<span class="tag">${tr(ART[m.a])}</span> ` : ''}${extLink(m.u, esc(m.t))}</span><span class="meta">${esc(m.q)} · ${esc(zeit(m.d))}</span></li>`;

function programmTeil(t) {
  const f = t.frageId ? frage(t.frageId) : null;
  if (f) {
    return `<h2 class="eyebrow section-label">${tr('What the parties say and do')}</h2>
    <a class="card link" href="#frage/${esc(f.id)}"><span class="meta">${tr('A prepared question matches this topic')}</span><h3>${esc(f.frage)}</h3></a>`;
  }
  if (!t.frage) return '';
  const gleich = R.frage === t.frage.slice(0, MAX_LAENGE);
  return `<h2 class="eyebrow section-label">${tr('What the parties say and do')}</h2>
  <p class="note small">${tr('The KI searches all election programmes and the Bundestag record for the question below. You need to be signed in.')}</p>
  <p><b>${esc(t.frage)}</b></p>
  <p><button class="btn primary" data-action="nachricht-frage" data-frage="${esc(t.frage)}">${tr('What do the parties say about this?')}</button></p>
  <div id="recherche" data-ansicht="nachricht" data-frage="${esc(t.frage)}" aria-live="polite">${gleich && R.status !== 'leer' ? ergebnisHtml() : ''}</div>`;
}

export function viewNachricht(id) {
  const t = themaNachId(id);
  // Noch nicht geladen (oder offline) ist nicht dasselbe wie "nicht mehr aktuell".
  if (!t) return `${kopf(tr('Topic of the day'), tr(N.stand ? 'This topic is no longer current.' : 'Loading the topic …'), '', { href: '#start', text: tr('Start') })}`;
  const namen = t.parteien.map(p => partei(p)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return `${kopf(tr('Topic of the day'), esc(t.titel), esc(`${themenZahl(t)} · ${zeit(t.aktualisiert)}`), { href: '#start', text: tr('Start') })}
  ${t.zusammenfassung ? `<p><span class="tag">${tr('KI summary')}</span> ${esc(t.zusammenfassung)}</p>
  <p class="note small">${tr('Summary by a KI from the titles and teasers of the reports below, in its own words. Numbers and names are checked against them. A person has not checked it.')}</p>` : `<p class="note">${tr('No summary for this topic: the automatic check did not pass or only commentary exists. The reports are listed below.')}</p>`}
  ${t.quellen === 1 ? `<p class="note small"><b>${tr('Only one source')}</b></p>` : ''}
  ${namen.length || t.personen.length ? `<p class="meta">${tr('Named in these reports:')} ${[...namen.map(p => esc(p.name)), ...t.personen.map(esc)].join(', ')}</p>` : ''}
  <h2 class="eyebrow section-label">${tr('Reports')}</h2>
  <ul class="news">${t.meldungen.map(meldungZeile).join('')}</ul>
  ${t.meldungen.some(m => m.a === 'kommentar' || m.a === 'interview') ? `<p class="note small">${tr('Comments and interviews do not count as evidence for the summary.')}</p>` : ''}
  ${programmTeil(t)}`;
}
