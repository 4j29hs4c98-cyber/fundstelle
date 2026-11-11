// views/nachrichten.js — Schlagzeilen anzeigen. Nur Titel, Quelle und Zeit, verlinkt auf den Artikel: kein fremder Text,
// keine Bewertung, keine Rangfolge, immer die neuesten zuerst. Startseite: alle Schlagzeilen. Partei und Person: nur die,
// in denen ihr Name im Titel oder Anreisser steht (geprueft in nachrichten-holen/zuordnung.ts).
import { tr, LOC } from '../i18n.js';
import { esc } from '../core.js';
import { N, zuPartei, zuPerson } from '../nachrichten.js';
import { extLink } from './teile.js';

const START_ANZAHL = 8, START_MEHR = 40, PARTEI_ANZAHL = 6, PERSON_ANZAHL = 5;

const zeit = iso => new Date(iso).toLocaleString(LOC(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const zeile = n => `<li>${extLink(n.url, esc(n.titel))}<span class="meta">${esc(n.quelle)} · ${esc(zeit(n.datum))}</span></li>`;
const liste = items => `<ul class="news">${items.map(zeile).join('')}</ul>`;
const HINWEIS = () => `<p class="note small">${tr('Headlines collected automatically every 30 minutes from eight news sources and the Bundestag, newest first, without rating. Read the article before you rely on it.')}</p>`;

// Oben hoechstens zwei Schlagzeilen je Quelle, damit keine Quelle die Startseite fuellt (der Bundestag veroeffentlicht
// etwa in Schueben). Der Rest steht, weiter nach Zeit geordnet, unter "Weitere Schlagzeilen".
const JE_QUELLE_OBEN = 2;
function oben(alle) {
  const zaehler = new Map();
  return alle.filter(n => {
    const k = zaehler.get(n.quelle) ?? 0;
    if (k >= JE_QUELLE_OBEN) return false;
    zaehler.set(n.quelle, k + 1);
    return true;
  }).slice(0, START_ANZAHL);
}

export function aktuellHtml() {
  if (!N.liste.length) return '';
  const top = oben(N.liste);
  const mehr = N.liste.filter(n => !top.includes(n)).slice(0, START_MEHR);
  return `<h2 class="eyebrow section-label">${tr('Current news')}</h2>
  ${liste(top)}
  ${mehr.length ? `<details class="mehr"><summary>${tr('More headlines')}</summary>${liste(mehr)}</details>` : ''}
  ${HINWEIS()}`;
}

export function parteiNachrichten(id) {
  const items = zuPartei(id).slice(0, PARTEI_ANZAHL);
  if (!items.length) return '';
  return `<h2 class="eyebrow section-label">${tr('In the news')}</h2>${liste(items)}
  <p class="note small">${tr('Headlines that name this party. Being named says nothing about what the party did.')}</p>`;
}

export function personNachrichten(name) {
  const items = zuPerson(name).slice(0, PERSON_ANZAHL);
  if (!items.length) return '';
  return `<h3 class="eyebrow section-label">${tr('Recent headlines')}</h3>${liste(items)}
  <p class="note small">${tr('Headlines that name this person. Being named says nothing about their position.')}</p>`;
}
