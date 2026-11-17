// views/einordnung.js — "Wie wird die Partei von außen eingeordnet?": drei feste Zeilen für jede Partei (Verfassungsschutz des Bundes,
// Parteiverbot, Links-Rechts nach der Wissenschaft) und eine Skala aller Parteien auf der Parteien-Übersicht. Die App bewertet nicht
// selbst: jede Angabe kommt von einer Behörde, einem Gericht oder aus einer Expertenbefragung und hat ihre Quelle direkt daneben.
// Nur Angaben, die am 10.11.2026 in der genannten Quelle nachgesehen wurden (Arbeitsstand.md, "Einordnungs-Box: Recherche").
// Gleiche Zeilen bei jeder Partei, damit keine hervorgehoben wird. Die Parteien stehen auf der Skala alphabetisch, nicht nach Wert.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { partei, parteienSortiert } from '../content.js';
import { profilVon } from '../parteiprofile.js';
import { extLink, marke } from './teile.js';

const STAND = '10.11.2026';
const VS_BERICHT = { t: 'Verfassungsschutzbericht 2025 des BfV, 30.06.2026', u: 'https://www.verfassungsschutz.de/SharedDocs/publikationen/DE/verfassungsschutzberichte/2026-06-30-verfassungsschutzbericht-2025.pdf?__blob=publicationFile&v=6' };
const VS_KEINE = 'Keine Einstufung durch das Bundesamt für Verfassungsschutz bekannt.';
const CHES = { t: 'Chapel Hill Expert Survey 2024, Variable lrgen', u: 'https://www.chesdata.eu/ches-europe' };
const VERBOT = {
  text: 'Kein Verbotsverfahren beantragt oder entschieden. Das Bundesverfassungsgericht hat bisher zwei Parteien verboten, SRP und KPD, beide in den 1950er Jahren.',
  q: [{ t: 'bpb, Recht A bis Z: Parteiverbot', u: 'https://www.bpb.de/kurz-knapp/lexika/recht-a-z/323822/parteiverbot/' },
      { t: 'Correctiv-Ticker, Stand 07.11.2026, mit Zitat der BVerfG-Vizepräsidentin vom 01.06.2026', u: 'https://correctiv.org/themen/afd-verbot/' }],
};

// Schlüssel: Anzeigename der Partei in der App. lr: Mittelwert der Einschätzungen von Fachleuten (0 ganz links bis 10 ganz rechts),
// null = in der Befragung nicht erfasst. vs/vsQ nur, wo es über "keine Einstufung" hinausgeht.
const DATEN = {
  'AfD': { lr: 9.26,
    vs: 'Verdachtsfall beim Bundesamt für Verfassungsschutz, gerichtlich rechtskräftig bestätigt. Die Hochstufung zur „gesichert rechtsextremistischen Bestrebung“ hat das Verwaltungsgericht Köln am 26.02.2026 vorläufig untersagt; das Hauptverfahren ist offen.',
    vsQ: [VS_BERICHT, { t: 'BVerwG, Pressemitteilung 54/2025 vom 22.07.2025', u: 'https://www.bverwg.de/de/pm/2025/54' },
      { t: 'VG Köln, Pressemitteilung vom 26.02.2026', u: 'https://www.vg-koeln.nrw.de/behoerde/presse/Pressemitteilungen/05_26022026/index.php' },
      { t: 'Correctiv, 05.03.2026 (Hauptverfahren offen)', u: 'https://correctiv.org/aktuelles/afd/2026/03/05/justiz-ab-wann-ist-die-afd-gesichert-rechtsextrem/' }],
    verbotPlus: 'Im Bundestag lag in der 20. Wahlperiode ein Gruppenantrag von 113 Abgeordneten vor (Drucksache 20/13750), das Bundesverfassungsgericht entscheiden zu lassen. Er wurde bis zum Ende der Wahlperiode nicht abgestimmt.',
    verbotPlusQ: [{ t: 'Bundestag, hib 790/2024', u: 'https://www.bundestag.de/presse/hib/kurzmeldungen-1029764' },
      { t: 'Bundestag, Pressemitteilung 12.02.2025', u: 'https://www.bundestag.de/presse/pressemitteilungen/2025/pm-250212-vorab-interview-1050312' }] },
  'BSW': { lr: 3.63 },
  'CDU': { lr: 6.58 },
  'CSU': { lr: 7.57 },
  'Die Linke': { lr: 1.42,
    vs: 'Keine Einstufung durch das Bundesamt für Verfassungsschutz bekannt. Der Bericht des Bundesamts nennt die Partei als Umfeld, in dem trotzkistische Gruppen wirken.', vsQ: [VS_BERICHT] },
  'FDP': { lr: 6.06 },
  'FREIE WÄHLER': { lr: 6.75 },
  'GRÜNE': { lr: 3.06 },
  'SPD': { lr: 3.47 },
  'SSW': { lr: null },
  'Volt': { lr: null },
};

const zahl = v => v.toFixed(2).replace('.', ',');
const quellen = qs => `<span class="quellen">${qs.map(q => extLink(q.u, esc(q.t))).join('')}</span>`;
const datenVon = p => DATEN[p.name] ?? null;

// Dieselbe Skala auf der Parteiseite und in der Übersicht: 0 (ganz links) bis 10 (ganz rechts).
const skala = (wert, text) => `<div class="skala" role="img" aria-label="${esc(text)}"><div class="spur"></div><div class="punkt" style="left:${(wert * 10).toFixed(1)}%"></div></div>`;

function linksRechts(d) {
  if (d.lr == null) return `<p>${tr('Not included in the survey 2024, which covers nine German parties.')}</p>${quellen([CHES])}`;
  return `<p><b>${zahl(d.lr)}</b> ${tr('on a scale from 0 (far left) to 10 (far right)')}</p>
    ${skala(d.lr, tr('Value {v} of 10', { v: zahl(d.lr) }))}
    <div class="enden" aria-hidden="true"><span>0</span><span>5</span><span>10</span></div>
    <span class="meta">${tr('Average of the assessments of political science experts, surveyed October to December 2024. Not an assessment by the app.')}</span>${quellen([CHES])}`;
}

export function einordnungBlock(p) {
  const d = datenVon(p);
  if (!d) return '';
  return `<section class="einordnung" aria-labelledby="einordnung-titel">
    <h2 class="eyebrow section-label" id="einordnung-titel">${tr('Classification')}</h2>
    <p class="meta">${tr('Statements of authorities, courts and science, each with its source. The app does not rate.')}</p>
    <dl class="fakten">
      <div class="fakt"><dt>${tr('Domestic intelligence (federal)')}</dt><dd><p>${esc(d.vs ?? VS_KEINE)}</p>${quellen(d.vsQ ?? [VS_BERICHT])}</dd></div>
      <div class="fakt"><dt>${tr('Ban proceedings')}</dt><dd><p>${esc(VERBOT.text)}</p>${quellen(VERBOT.q)}
        ${d.verbotPlus ? `<p>${esc(d.verbotPlus)}</p>${quellen(d.verbotPlusQ)}` : ''}</dd></div>
      <div class="fakt"><dt>${tr('Left to right (science)')}</dt><dd>${linksRechts(d)}</dd></div>
    </dl>
    <details class="mehr"><summary>${tr('How this box is made')}</summary>
      <p class="note small">${tr('Three fixed lines for every party. Only statements that were looked up in the named source on {d} appear. “No classification” applies to the federal office only; state offices were not checked one by one. A person from the team has not proofread the box yet.', { d: STAND })}</p></details>
  </section>`;
}

// Alle Parteien auf einer Skala, alphabetisch: die Reihenfolge ist keine Rangfolge, die Lage des Punktes ist die Aussage.
export function skalaHtml() {
  const zeilen = parteienSortiert().map(p => ({ p, d: datenVon(p) })).filter(x => x.d);
  if (!zeilen.length) return '';
  return `<h2 class="eyebrow section-label">${tr('Left to right')}</h2>
  <p class="note small">${tr('Where political science experts place the parties on a scale from 0 (far left) to 10 (far right). Alphabetical order, not a ranking. Parties not covered by the 2024 survey are listed without a value.')}</p>
  <ul class="lr-liste">${zeilen.map(({ p, d }) => `<li><a href="#partei/${esc(p.id)}"><b>${esc(p.name)}</b>
    ${d.lr == null ? `<span class="meta">${tr('not included')}</span>` : `<span class="meta">${zahl(d.lr)}</span>${skala(d.lr, `${p.name}: ${tr('Value {v} of 10', { v: zahl(d.lr) })}`)}`}</a></li>`).join('')}</ul>
  <p class="meta">${tr('Source:')} ${extLink(CHES.u, esc(CHES.t))}</p>`;
}

// Gesamtbild im Vergleich, solange kein Thema gewaehlt ist: jede Partei als Ganzes nebeneinander, gleiche Bausteine in gleicher
// Reihenfolge (Links-Rechts, was sie laut Programm will, Verfassungsschutz). Spalten wie im restlichen Vergleich alphabetisch.
function gesamtSpalte(id, b) {
  const p = partei(id), d = p ? datenVon(p) : null;
  if (!p) return '';
  const will = (profilVon(id) ?? []).filter(s => s.art === 'programm');
  return `<div class="vz"><p class="vz-partei"><span class="slot" aria-hidden="true">${b}</span>${marke(p, 'klein', 'b')}</p>
    <p class="eyebrow">${tr('Left to right (science)')}</p>${d ? linksRechts(d) : `<p class="meta">${tr('Not recorded yet')}</p>`}
    <p class="eyebrow">${tr('What the party wants')}</p>${will.length ? `<ul class="vz-taten">${will.map(s => `<li>${esc(s.text)} ${extLink(s.url, esc(s.quelle))}</li>`).join('')}</ul>` : `<p class="meta">${tr('Not recorded yet')}</p>`}
    <p class="eyebrow">${tr('Domestic intelligence (federal)')}</p><p>${esc(d?.vs ?? VS_KEINE)}</p>${d ? quellen(d.vsQ ?? [VS_BERICHT]) : ''}
    <a href="#partei/${esc(id)}">${tr('Full party page')}</a></div>`;
}

export const gesamtbildHtml = ids => `<h2 class="eyebrow section-label">${tr('Overall picture')}</h2>
  <div class="vgrid">${ids.map((id, i) => gesamtSpalte(id, 'ABCD'[i])).join('')}</div>
  <p class="note small">${tr('The whole party, not one topic. Choose a topic below to see only what the parties say and do on it. The left-right value always describes the whole party.')}</p>`;
