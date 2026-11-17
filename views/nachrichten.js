// views/nachrichten.js — Nachrichten anzeigen. Startseite: "Themen des Tages" (Meldungen zum selben Ereignis, mit Kurzfassung der
// KI), keine lange Schlagzeilenliste. Eine eigene Seite je Thema (#nachricht/<id>) mit Kurzfassung, den verlinkten Meldungen und
// dem Weg zu Programm und Taten der Parteien. Nur Titel, Quelle und Zeit stammen von den Redaktionen, verlinkt auf den
// Artikel: kein fremder Text, keine Bewertung, keine Rangfolge der Parteien, immer die neuesten zuerst.
import { tr, LOC } from '../i18n.js';
import { esc } from '../core.js';
import { frage, partei } from '../content.js';
import { R, MAX_LAENGE } from '../recherche.js';
import { N, themaNachId, themenZuPartei, zuPartei, zuPerson } from '../nachrichten.js';
import { ergebnisHtml } from './eigene.js';
import { extLink, kopf } from './teile.js';

const PARTEI_ANZAHL = 6, PARTEI_THEMEN = 4, PERSON_ANZAHL = 5, START_THEMEN = 8;

const zeit = iso => new Date(iso).toLocaleString(LOC(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const zeile = n => `<li>${extLink(n.url, esc(n.titel))}<span class="meta">${esc(n.quelle)} · ${esc(zeit(n.datum))}</span></li>`;
const liste = items => `<ul class="news">${items.map(zeile).join('')}</ul>`;
const ersterSatz = t => (t.split(/(?<=[.!?])\s+/)[0] ?? t);
const ART = { kommentar: 'Comment', interview: 'Interview', video: 'Video' };

function themenZahl(t) {
  const n = t.meldungen.length;
  if (n === 1) return tr('1 report from 1 source');
  return t.quellen === 1 ? tr('{n} reports from one source', { n }) : tr('{n} reports from {m} sources', { n, m: t.quellen });
}

const themenKarte = t => `<a class="card link" href="#nachricht/${esc(t.id)}"><h3>${esc(t.titel)}</h3>
  ${t.zusammenfassung ? `<p><span class="tag">${tr('KI summary')}</span> ${esc(ersterSatz(t.zusammenfassung))}</p>` : ''}
  <span class="meta">${esc(themenZahl(t))} · ${esc(zeit(t.aktualisiert))}</span></a>`;

export function aktuellHtml() {
  const themen = N.themen.length
    ? `<h2 class="eyebrow section-label">${tr('Topics of the day')}</h2>
  <div class="cards">${N.themen.slice(0, START_THEMEN).map(themenKarte).join('')}</div>
  <p class="note small">${tr('Topics and summaries are written by a KI from the headlines and teasers of eight news sources and the Bundestag, and checked automatically. A person has not checked them. Read the sources.')}</p>` : '';
  return themen;
}

export function parteiNachrichten(id) {
  const themen = themenZuPartei(id).slice(0, PARTEI_THEMEN);
  const gesehen = new Set(themen.flatMap(t => t.meldungen.map(m => m.u)));
  const items = zuPartei(id).filter(n => !gesehen.has(n.url)).slice(0, PARTEI_ANZAHL);
  if (!themen.length && !items.length) return '';
  return `<h2 class="eyebrow section-label">${tr('In the news')}</h2>
  ${themen.length ? `<div class="cards">${themen.map(themenKarte).join('')}</div>` : ''}${items.length ? liste(items) : ''}
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
  <p class="note small">${tr('The agent searches all election programmes and the Bundestag record for the question below. You need to be signed in.')}</p>
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
