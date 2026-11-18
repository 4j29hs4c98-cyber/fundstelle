// views/halbkreis.js — Sitzverteilung des 21. Bundestags als Halbkreis, Kopf des Parteienvergleichs (#vergleich/).
// Aus mockups/vergleich.js uebernommen. Jeder Sitzblock ist ein Knopf-Ersatz fuer Maus und Finger: Tippen waehlt die
// Partei ueber dieselbe Aktion wie ihr Knopf in der Liste darunter (data-action="vergleich"). Die Liste bleibt der
// zugaengliche Weg (Tastatur, Screenreader); der Halbkreis selbst ist ein Bild mit Beschreibung.
// Farben dienen nur dem Erkennen und bewerten nichts.
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { PARTEIEN_DE } from '../katalog.js';
import { extLink, parteiFarbe } from './teile.js';

// Sitze nach dem endgueltigen Ergebnis der Bundestagswahl 2025 (630 Sitze), Schluessel ist der Kurzname im Katalog.
export const SITZE = { CDU: 164, CSU: 44, SPD: 120, AfD: 152, 'GRÜNE': 85, 'Die Linke': 64, SSW: 1 };
const SITZE_QUELLE = 'https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/bund-99.html';
export const sitzeVon = p => SITZE[p?.kuerzel] ?? 0;
export const imBundestag = p => sitzeVon(p) > 0;

// REIHENFOLGE DER SITZE (Entscheidung Lennox, 18.11.2026): die tatsaechliche Sitzordnung im Plenarsaal, vom Praesidium
// aus gesehen, statt des Alphabets, weil alphabetische Keile eine Links-Rechts-Lage vortaeuschten, die nicht stimmt.
// Belege: "Das Parlament" (Linke ganz links, AfD ganz rechts, Bloecke nach dem traditionellen Links-Rechts-Schema) und
// Drucksache 20/268 (Linke, SPD, Gruene, FDP, CDU/CSU, AfD; die FDP ist 2025 ausgeschieden). Die Reihenfolge legt der
// Bundestag fest, nicht die App. Innerhalb der Fraktion CDU/CSU ist die Aufteilung vereinfacht (CDU, dann CSU).
// Der fraktionslose SSW-Abgeordnete hat keinen belegten Platz und steht deshalb gesondert unter dem Halbkreis.
// Chips und Spalten bleiben alphabetisch; nur dieses Bild folgt dem Plenarsaal.
const SITZORDNUNG = ['Die Linke', 'SPD', 'GRÜNE', 'CDU', 'CSU', 'AfD'];
const SITZORDNUNG_QUELLE = 'https://www.das-parlament.de/panorama/ortstermin/sonderschichten-fuer-den-umbau-des-plenarsaals';
const rangImSaal = p => SITZORDNUNG.indexOf(p.kuerzel);
const IM_SAAL = PARTEIEN_DE.filter(p => imBundestag(p) && rangImSaal(p) >= 0).sort((a, b) => rangImSaal(a) - rangImSaal(b));
const GESONDERT = PARTEIEN_DE.filter(p => imBundestag(p) && rangImSaal(p) < 0);
const IM_BT = [...IM_SAAL, ...GESONDERT];
const GESAMT = IM_BT.reduce((s, p) => s + sitzeVon(p), 0);
const IM_SAAL_SITZE = IM_SAAL.reduce((s, p) => s + sitzeVon(p), 0);

// Sitze in Reihen; Platz je Reihe waechst mit dem Radius. Danach nach Winkel sortiert (links beginnend) und blockweise
// in Listenreihenfolge vergeben. So entstehen Keile je Partei wie in ueblichen Parlamentsgrafiken.
const REIHEN = 13, R_INNEN = 0.38, PUNKT = 0.019, EINBLENDEN_MS = 1100;
function sitzplaetze(n) {
  const radien = Array.from({ length: REIHEN }, (_, i) => R_INNEN + (1 - R_INNEN) * i / (REIHEN - 1));
  const summe = radien.reduce((s, r) => s + r, 0);
  const anzahl = radien.map(r => Math.round(n * r / summe));
  anzahl[REIHEN - 1] += n - anzahl.reduce((s, x) => s + x, 0);
  const plaetze = radien.flatMap((r, i) => Array.from({ length: anzahl[i] }, (_, j) => {
    const w = anzahl[i] > 1 ? Math.PI * (1 - j / (anzahl[i] - 1)) : Math.PI / 2;
    return { r, w, x: r * Math.cos(w), y: -r * Math.sin(w) };
  }));
  return plaetze.sort((p, q) => q.w - p.w || p.r - q.r);
}
// Die Geometrie aendert sich nie: einmal berechnen, je Partei ihre Sitze und deren Mitte (fuer den Buchstaben).
const BLOECKE = (() => {
  // Gesonderte Sitze (fraktionslos) unter der Mitte des Halbkreises, nebeneinander, ausserhalb der Fraktionsbloecke.
  const unten = GESONDERT.flatMap(p => Array.from({ length: sitzeVon(p) }, () => p));
  const plaetze = [...sitzplaetze(IM_SAAL_SITZE),
    ...unten.map((_, k) => ({ r: 0, w: 0, x: (k - (unten.length - 1) / 2) * PUNKT * 3, y: 0.045 }))];
  let i = 0;
  return IM_BT.map(p => {
    const sitze = plaetze.slice(i, i + sitzeVon(p));
    i += sitzeVon(p);
    const mitte = { x: sitze.reduce((s, x) => s + x.x, 0) / sitze.length, y: sitze.reduce((s, x) => s + x.y, 0) / sitze.length };
    return { p, sitze, mitte };
  });
})();

// Die Bloecke blenden nur beim ersten Zeichnen nacheinander ein, nicht bei jeder Auswahl erneut.
let eingeblendet = false;

// buchstabe(id) liefert "A", "B", ... fuer gewaehlte Parteien (Spaltenreihenfolge), sonst ''.
export function halbkreis(buchstabe) {
  const einblenden = !eingeblendet;
  eingeblendet = true;
  const gewaehlt = BLOECKE.some(b => buchstabe(b.p.id));
  // Eingeblendet wird blockweise (7 Gruppen) statt Sitz fuer Sitz: 630 einzeln animierte SVG-Kreise zwingen den Browser,
  // die ganze Grafik in jedem Bild neu zu zeichnen, und ruckeln vor allem auf Handys.
  const bloecke = BLOECKE.map(({ p, sitze }, k) => {
    const punkte = sitze.map(s => `<circle class="seat" cx="${s.x.toFixed(4)}" cy="${s.y.toFixed(4)}" r="${PUNKT}"></circle>`).join('');
    return `<g class="block${buchstabe(p.id) ? ' an' : ''}" data-action="vergleich" data-id="${esc(p.id)}" fill="${parteiFarbe(p)}" style="--d:${Math.round(k / BLOECKE.length * EINBLENDEN_MS)}ms">${punkte}</g>`;
  }).join('');
  const liste = IM_BT.map(p => `${p.name}: ${tr('{n} seats', { n: sitzeVon(p) })}`).join(', ');
  return `<figure class="halbkreis${einblenden ? ' einblenden' : ''}" data-halbkreis>
    <svg viewBox="-1.04 -1.04 2.08 1.12" class="${gewaehlt ? 'auswahl' : ''}" role="img" aria-label="${esc(tr('Seat distribution in the 21st Bundestag, {n} seats: {list}', { n: GESAMT, list: liste }))}">
      ${bloecke}
      <g class="hk-marken" aria-hidden="true">${marken(buchstabe)}</g>
      <text class="hk-zahl" x="0" y="-0.12" text-anchor="middle">${GESAMT}</text>
      <text class="hk-text" x="0" y="-0.03" text-anchor="middle">${esc(tr('Seats'))}</text>
    </svg>
    <figcaption class="meta">${tr('Seating order of the parliamentary groups in the plenary hall, as seen from the President’s chair. The Bundestag sets this order, not this app. Within the CDU/CSU group the split is simplified; the non-attached SSW member is shown separately below.')}
      ${tr('Seats: {src}', { src: extLink(SITZE_QUELLE, esc(tr('The Federal Returning Officer, final result 2025'))) })}
      ${tr('Seating order: {src}', { src: extLink(SITZORDNUNG_QUELLE, esc(tr('Das Parlament, plenary hall conversion 2025'))) })}</figcaption>
  </figure>`;
}

// Buchstaben A bis D in eigener Ebene ueber allen Bloecken, damit sie sich austauschen lassen, ohne Sitze neu zu bauen.
function marken(buchstabe) {
  return BLOECKE.map(({ p, mitte }) => {
    const b = buchstabe(p.id);
    return b ? `<g class="hk-marke"><circle cx="${mitte.x.toFixed(4)}" cy="${mitte.y.toFixed(4)}" r="0.065"></circle>
      <text x="${mitte.x.toFixed(4)}" y="${(mitte.y + 0.024).toFixed(4)}" text-anchor="middle">${esc(b)}</text></g>` : '';
  }).join('');
}

// Beim Neuzeichnen derselben Seite bleibt die alte Grafik im Dokument und uebernimmt nur Klassen, Buchstaben und Texte
// der neuen. Nur so laufen die CSS-Uebergaenge (Abblenden, Vergroessern) wirklich ab, statt hart umzuspringen.
// Die Geometrie ist fest, deshalb passen die Bloecke in alter und neuer Grafik der Reihe nach zusammen.
export function halbkreisUebernehmen(alt, neu) {
  const [svgA, svgN] = [alt.querySelector('svg'), neu.querySelector('svg')];
  if (!svgA || !svgN) return false;
  const [blA, blN] = [svgA.querySelectorAll('.block'), svgN.querySelectorAll('.block')];
  if (blA.length !== blN.length) return false;
  alt.setAttribute('class', neu.getAttribute('class')); // entfernt "einblenden", damit das Einblenden nicht erneut startet
  blA.forEach((b, i) => b.setAttribute('class', blN[i].getAttribute('class')));
  svgA.setAttribute('class', svgN.getAttribute('class'));
  svgA.setAttribute('aria-label', svgN.getAttribute('aria-label'));
  svgA.querySelector('.hk-marken').innerHTML = svgN.querySelector('.hk-marken').innerHTML;
  svgA.querySelector('.hk-text').textContent = svgN.querySelector('.hk-text').textContent;
  alt.querySelector('figcaption').innerHTML = neu.querySelector('figcaption').innerHTML;
  return true;
}
