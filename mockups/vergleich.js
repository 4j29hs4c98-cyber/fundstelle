// mockups/vergleich.js — MOCKUP, nicht veroeffentlicht. Allgemeiner Parteienvergleich: Halbkreis des 21. Bundestags oben,
// darunter zwei Spalten (Partei A und B) mit Hauptmerkmalen, "Wofuer sie steht" und "Wogegen sie ist".
// Liest die vorhandenen Daten nur (katalog.js, parteiprofile.js, content.js). Erfindet keine Inhalte zu echten Parteien:
// jeder angezeigte Satz kommt woertlich aus diesen Dateien, jede Quelle ebenso.
import { esc } from '../core.js';
import { PARTEIEN_DE } from '../katalog.js';
import { profilVon, PROFIL_STAND } from '../parteiprofile.js';
import { C, thema, themenSortiert, fragenZuThema, positionVon, programmVon } from '../content.js';
import { extLink, safeUrl, logo } from '../views/teile.js';

// Sitze im 21. Deutschen Bundestag nach dem endgueltigen Ergebnis der Bundestagswahl 2025 (630 Sitze).
const SITZE = { CDU: 164, CSU: 44, SPD: 120, AfD: 152, 'GRÜNE': 85, 'Die Linke': 64, SSW: 1 };
const SITZE_QUELLE = 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/bund-99.html';
const sitzText = n => (n === 1 ? '1 Sitz' : `${n} Sitze`);
const NICHT_IM_BT = ['FDP', 'BSW', 'FREIE WÄHLER', 'Volt'];

// REIHENFOLGE DER SITZE: Die amtliche Sitzordnung des 21. Bundestags liess sich am 10.11.2026 nicht auf bundestag.de
// bestaetigen. Deshalb folgen die Bloecke der Reihenfolge der Parteiliste in katalog.js. Das ist KEINE politische
// Einordnung (nicht links nach rechts) und darf auch nicht so dargestellt werden. Nie selbst nach links/rechts sortieren.
const IM_BT = PARTEIEN_DE.filter(p => SITZE[p.kuerzel]);
const GESAMT = IM_BT.reduce((s, p) => s + SITZE[p.kuerzel], 0);

const nachName = (a, b) => a.name.localeCompare(b.name, 'de');
const parteiK = k => PARTEIEN_DE.find(p => p.kuerzel === k) ?? null;
const HEX = /^#[0-9a-f]{6}$/i;
const farbe = p => (HEX.test(p?.farbe ?? '') ? p.farbe : '#6E7076');
const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = { a: null, b: null, t: '' };
const main = document.getElementById('main');

// ---------- Zustand in der Adresse (#a=CDU&b=SPD&t=<thema>), damit sich ein Stand teilen und neu laden laesst ----------
function ausAdresse() {
  const q = new URLSearchParams(location.hash.slice(1));
  const ok = k => (parteiK(k) && (SITZE[k] || NICHT_IM_BT.includes(k)) ? k : null);
  S.a = ok(q.get('a')); S.b = ok(q.get('b')); if (S.b === S.a) S.b = null;
  S.t = thema(q.get('t') ?? '') ? q.get('t') : '';
}
function inAdresse() {
  const q = new URLSearchParams();
  if (S.a) q.set('a', S.a); if (S.b) q.set('b', S.b); if (S.t) q.set('t', S.t);
  history.replaceState(null, '', `#${q}`);
}

// ---------- Halbkreis ----------
// Sitze in Reihen; Platz je Reihe waechst mit dem Radius. Danach nach Winkel sortiert (links beginnend) und blockweise
// in Listenreihenfolge vergeben. So entstehen Keile je Partei wie in ueblichen Parlamentsgrafiken.
const REIHEN = 13, R_INNEN = 0.38, PUNKT = 0.019;
function sitzplaetze(n) {
  const radien = Array.from({ length: REIHEN }, (_, i) => R_INNEN + (1 - R_INNEN) * i / (REIHEN - 1));
  const summe = radien.reduce((s, r) => s + r, 0);
  const anzahl = radien.map(r => Math.round(n * r / summe));
  anzahl[REIHEN - 1] += n - anzahl.reduce((s, x) => s + x, 0);
  const plaetze = radien.flatMap((r, i) => Array.from({ length: anzahl[i] }, (_, j) => {
    const w = Math.PI * (1 - j / (anzahl[i] - 1));
    return { r, w, x: r * Math.cos(w), y: -r * Math.sin(w) };
  }));
  return plaetze.sort((p, q) => q.w - p.w || p.r - q.r);
}

function halbkreis() {
  const plaetze = sitzplaetze(GESAMT);
  const besitzer = IM_BT.flatMap(p => Array(SITZE[p.kuerzel]).fill(p));
  const ms = ruhig() ? 0 : 1100;
  const punkte = plaetze.map((s, i) => {
    const p = besitzer[i];
    return `<circle class="seat" data-k="${esc(p.kuerzel)}" cx="${s.x.toFixed(4)}" cy="${s.y.toFixed(4)}" r="${PUNKT}" fill="${farbe(p)}" style="--d:${Math.round(i / GESAMT * ms)}ms"></circle>`;
  }).join('');
  const zusammenfassung = [...IM_BT].sort(nachName).map(p => `${p.name} ${SITZE[p.kuerzel]}`).join(', ');
  return `<figure class="halbkreis">
    <svg id="sitze" viewBox="-1.04 -1.04 2.08 1.1" role="img" aria-label="${esc(`Sitzverteilung im 21. Bundestag, ${GESAMT} Sitze: ${zusammenfassung}`)}">
      ${punkte}
      <text class="hk-zahl" x="0" y="-0.12" text-anchor="middle">${GESAMT}</text>
      <text class="hk-text" x="0" y="-0.03" text-anchor="middle">Sitze</text>
    </svg>
    <figcaption class="meta">Die Reihenfolge der Blöcke folgt der Parteiliste der App und ist keine politische Einordnung.
      Die amtliche Sitzordnung im Plenarsaal ist hier noch nicht übernommen. Sitze: ${extLink(SITZE_QUELLE, esc('Die Bundeswahlleiterin, endgültiges Ergebnis 2025'))}</figcaption>
  </figure>`;
}

// ---------- Auswahl ----------
const chip = (p, zusatz) => `<button type="button" class="pchip mchip" data-k="${esc(p.kuerzel)}" aria-pressed="false" aria-label="${esc(`${p.name}, ${zusatz}`)}">
  ${logo(p, 'klein')}<span>${esc(p.name)}</span><span class="meta">${esc(zusatz)}</span><span class="slot" aria-hidden="true"></span></button>`;

function waehle(k) {
  if (S.a === k) S.a = null;
  else if (S.b === k) S.b = null;
  else if (!S.a) S.a = k;
  else S.b = k; // Sind beide belegt, ersetzt die neue Wahl die zweite Spalte.
  aktualisiere();
}

// ---------- Spalten ----------
const quelle = (url, text) => `<p class="quelle">Quelle: ${extLink(url, esc(text))}</p>`;
const satz = e => `<li class="eintrag"><p>${esc(e.text)}</p>${quelle(e.url, e.quelle)}</li>`;

function posQuelle(pos) {
  if (pos.seite) {
    const basis = safeUrl(programmVon(pos.partei)?.url ?? '');
    const url = basis ? `${basis.split('#')[0]}#page=${Number(pos.seite)}` : null;
    return quelle(url, `${pos.quelle}, PDF-Seite ${pos.seite}`);
  }
  return quelle(pos.url, pos.quelle);
}
function posEintrag(pos, f, th) {
  return `<li class="eintrag">
    <p class="kontext"><span class="eyebrow">${esc(th.titel)}</span>${esc(f.frage)}</p>
    <p>${esc(pos.text)}</p>
    ${pos.auszug ? `<details class="zitat"><summary>Wortlaut zeigen</summary><blockquote>${esc(pos.auszug)}</blockquote></details>` : ''}
    ${posQuelle(pos)}</li>`;
}
// Positionen einer Haltung, nach Thema und Frage in der redaktionellen Reihenfolge. Haltung bezieht sich immer auf die Frage.
function positionen(id, haltung) {
  const themen = S.t ? [thema(S.t)] : themenSortiert();
  return themen.flatMap(th => fragenZuThema(th.id).map(f => [positionVon(id, f.id), f, th]))
    .filter(([pos]) => pos?.haltung === haltung).map(([pos, f, th]) => posEintrag(pos, f, th));
}

function spalte(k, slot) {
  if (!k) return `<div class="leer"><p class="eyebrow">Partei ${slot}</p>
    <p>Tippe oben auf eine Partei, im Halbkreis oder in der Liste.</p></div>`;
  const p = parteiK(k), profil = profilVon(p.id) ?? [];
  const merkmale = profil.filter(e => e.art === 'extern');
  const programm = S.t ? [] : profil.filter(e => e.art === 'programm');
  const dafuer = positionen(p.id, 'dafuer'), dagegen = positionen(p.id, 'dagegen');
  const sitz = SITZE[k] ? `${sitzText(SITZE[k])} im 21. Bundestag` : 'nicht im Bundestag';
  return `<header class="spalte-kopf">${logo(p)}<div><h2>${esc(p.voll)}</h2><p class="meta">${esc(sitz)}</p></div>
      <button type="button" class="abwaehlen" data-k="${esc(k)}" aria-label="${esc(`${p.name} abwählen`)}">×</button></header>
    <section><h3>Hauptmerkmale</h3>
      ${merkmale.length ? `<ul class="liste">${merkmale.map(satz).join('')}</ul>` : '<p class="note">Noch kein Profil erfasst.</p>'}</section>
    <section><h3>Wofür sie steht</h3>
      ${programm.length ? `<p class="unter">Aus dem Wahlprogramm 2025</p><ul class="liste">${programm.map(satz).join('')}</ul>` : ''}
      ${dafuer.length ? `<p class="unter">Haltung „dafür“ zu Fragen der App</p><ul class="liste">${dafuer.join('')}</ul>` : ''}
      ${!programm.length && !dafuer.length ? '<p class="note">Noch keine erfassten Positionen dafür.</p>' : ''}</section>
    <section><h3>Wogegen sie ist</h3>
      ${dagegen.length ? `<p class="unter">Haltung „dagegen“ zu Fragen der App</p><ul class="liste">${dagegen.join('')}</ul>`
        : '<p class="note">Noch keine erfassten Positionen dagegen.</p>'}</section>`;
}

// Inhalt einer Spalte weich ueberblenden. Unveraenderter Inhalt wird nicht neu gezeichnet.
function setzeSpalte(el, k, slot) {
  const schluessel = `${k ?? ''}|${S.t}`;
  if (el.dataset.key === schluessel) return;
  el.dataset.key = schluessel;
  const p = k ? parteiK(k) : null;
  const tauschen = () => {
    el.innerHTML = spalte(k, slot);
    el.classList.toggle('belegt', !!k);
    el.style.setProperty('--c', p ? farbe(p) : 'var(--line)');
    el.classList.remove('weg');
  };
  if (ruhig() || !el.dataset.fertig) { el.dataset.fertig = '1'; tauschen(); return; }
  el.classList.add('weg');
  clearTimeout(el._tm);
  el._tm = setTimeout(tauschen, 170);
}

function aktualisiere() {
  inAdresse();
  const gewaehlt = [S.a, S.b].filter(Boolean);
  const svg = document.getElementById('sitze');
  svg.classList.toggle('auswahl', gewaehlt.length > 0);
  svg.querySelectorAll('.seat').forEach(c => c.classList.toggle('an', gewaehlt.includes(c.dataset.k)));
  document.querySelectorAll('.mchip').forEach(b => {
    const slot = b.dataset.k === S.a ? 'A' : b.dataset.k === S.b ? 'B' : '';
    b.setAttribute('aria-pressed', String(!!slot));
    b.querySelector('.slot').textContent = slot;
  });
  document.querySelectorAll('.tchip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === S.t)));
  setzeSpalte(document.getElementById('spalte-a'), S.a, 'A');
  setzeSpalte(document.getElementById('spalte-b'), S.b, 'B');
}

function zeichne() {
  const tchip = (id, text) => `<button type="button" class="qchip tchip" data-t="${esc(id)}" aria-pressed="false">${esc(text)}</button>`;
  const andere = NICHT_IM_BT.map(parteiK).filter(Boolean).sort(nachName);
  main.innerHTML = `
  <header class="page-head"><p class="eyebrow">Parteien</p><h1>Wofür Parteien stehen</h1>
    <p class="sub">Zwei Parteien nebeneinander: Hauptmerkmale, wofür sie steht und wogegen sie ist. Jeder Satz mit Quelle.</p></header>
  ${halbkreis()}
  <p class="eyebrow">Im 21. Bundestag</p>
  <div class="pchips">${[...IM_BT].sort(nachName).map(p => chip(p, sitzText(SITZE[p.kuerzel]))).join('')}</div>
  <p class="eyebrow">Nicht im Bundestag</p>
  <div class="pchips">${andere.map(p => chip(p, 'nicht im Bundestag')).join('')}</div>
  <p class="eyebrow">Thema</p>
  <div class="qbar">${tchip('', 'Alle Themen')}${themenSortiert().map(t => tchip(t.id, t.titel)).join('')}</div>
  <div class="spalten"><article class="spalte" id="spalte-a" aria-live="polite"></article><article class="spalte" id="spalte-b" aria-live="polite"></article></div>
  ${C.ungeprueft ? `<div class="notice"><b>Von KI zusammengestellt, noch nicht geprüft</b>
    <p>Profile (Stand ${esc(PROFIL_STAND)}) und Positionen (Stand ${esc(C.stand)}) hat ein KI-Agent aus den Quellen zusammengestellt. Das Team hat sie noch nicht geprüft. Vor dem Verwenden bitte die Quelle öffnen.</p></div>` : ''}
  <p class="hint">Mockup, nicht veröffentlicht. Parteifarben dienen nur dem Erkennen, sie bewerten nichts.</p>`;

  main.addEventListener('click', e => {
    const ziel = e.target.closest('.mchip, .abwaehlen, .seat, .tchip');
    if (!ziel) return;
    if (ziel.classList.contains('tchip')) { S.t = ziel.dataset.t; aktualisiere(); return; }
    waehle(ziel.dataset.k);
  });
  aktualisiere();
  // Sitze nacheinander einblenden; danach Verzoegerungen entfernen, damit die Hervorhebung sofort reagiert.
  const svg = document.getElementById('sitze');
  requestAnimationFrame(() => requestAnimationFrame(() => svg.classList.add('gefuellt')));
  setTimeout(() => svg.classList.add('bereit'), ruhig() ? 0 : 1700);
}

// Erscheinungsbild nur fuer das Mockup umschalten: System, Hell, Dunkel. Nichts wird gespeichert.
const THEMES = [['', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']];
const themeKnopf = document.getElementById('theme');
themeKnopf.addEventListener('click', () => {
  const i = (THEMES.findIndex(([v]) => v === (document.documentElement.dataset.theme ?? '')) + 1) % THEMES.length;
  const [wert, name] = THEMES[i];
  if (wert) document.documentElement.dataset.theme = wert; else delete document.documentElement.dataset.theme;
  themeKnopf.textContent = name;
});

ausAdresse();
zeichne();
