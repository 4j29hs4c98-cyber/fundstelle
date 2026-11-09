// views/programm.js — Programm-Leser (MOCKUP): #programm/<partei>/<seite> zeigt eine Seite mit hervorgehobener
// Fundstelle, Blaettern und alle Fundstellen. Der Volltext liegt noch nicht in der App (Speicherplatz in Supabase
// ungeklaert); uebrige Zeilen sind Platzhalter. Ist das Original verlinkt, oeffnet es auf derselben Seite (#page=N).
import { tr } from '../i18n.js';
import { esc } from '../core.js';
import { partei, programmVon, positionenAufSeite, fundstellenVon, frage } from '../content.js';
import { kopf, logo, seite, pfeil, safeUrl, demoHinweis } from './teile.js';

const zurueck = () => ({ href: '#parteien', text: tr('All parties') });
const platz = (n, k) => Array.from({ length: k }, (_, i) => `<span class="platz" style="width:${70 + ((n * 7 + i * 13) % 28)}%"></span>`).join('');
const mitSeite = (u, n) => { const x = new URL(u); if (n) x.hash = `page=${n}`; return x.href; };
const original = (url, n) => { const u = safeUrl(url); return u ? `<a class="go" href="${esc(mitSeite(u, n))}" target="_blank" rel="noopener">${n ? tr('Open the original on page {n}', { n }) : tr('Open the original programme')} ${pfeil}</a>` : ''; };

function echtesProgramm(p) {
  return `${kopf(tr('Programme'), `${logo(p)} ${esc(p.voll)}`, tr('Programme for the federal election 2025'), zurueck())}
  ${original(p.programm) || `<p class="note">${tr('No official programme PDF found yet.')}</p>`}
  <section class="notice"><b>${tr('Not in the app yet')}</b><p>${tr('Positions with page numbers follow once this programme has been read and checked. Until then the link opens the party’s own PDF.')}</p></section>`;
}

export function viewProgramm(param) {
  const [id, roh] = String(param ?? '').split('/');
  const p = partei(id);
  if (!p) return kopf(tr('Programme'), tr('This programme is not available.'), '', zurueck());
  if (p.echt) return echtesProgramm(p);
  const pr = programmVon(id), fund = fundstellenVon(id), max = Math.max(pr?.seiten || 0, ...fund.map(s => s.seite), 1);
  const n = Math.min(max, Math.max(1, parseInt(roh, 10) || fund[0]?.seite || 1));
  const stellen = positionenAufSeite(id, n);
  const blatt = `<article class="blatt" aria-label="${tr('Page {n}', { n })}">
      <p class="meta">${esc(pr?.titel ?? '')} · ${tr('Page {n} of {m}', { n, m: max })}</p>
      ${platz(n, 4)}
      ${stellen.map(s => `<p><mark>${esc(s.auszug ?? s.text)}</mark></p>
        <p class="meta"><a href="#frage/${esc(s.frage)}">${esc(frage(s.frage)?.kurz ?? '')} ${pfeil}</a></p>`).join('')}
      ${platz(n + 3, stellen.length ? 3 : 6)}
    </article>`;
  return `${kopf(tr('Programme'), `${logo(p)} ${esc(p.name)}`, esc(pr?.titel ?? ''), { href: `#partei/${esc(id)}`, text: p.name })}
  <nav class="blaettern" aria-label="${tr('Pages')}">
    ${n > 1 ? `<a class="btn" href="#programm/${esc(id)}/${n - 1}">← ${seite(n - 1)}</a>` : '<span></span>'}
    <b>${tr('Page {n} of {m}', { n, m: max })}</b>
    ${n < max ? `<a class="btn" href="#programm/${esc(id)}/${n + 1}">${seite(n + 1)} →</a>` : '<span></span>'}
  </nav>
  ${blatt}
  <p class="note small">${tr('Mockup: only the highlighted passage is from the (example) programme, the grey lines stand for the rest of the page.')}</p>
  ${original(pr?.url, n)}
  <h2 class="eyebrow section-label">${tr('Passages in this programme')}</h2>
  <div class="cards">${fund.map(s => `<a class="card link" href="#programm/${esc(id)}/${s.seite}"><h3>${seite(s.seite)} · ${esc(frage(s.frage)?.kurz ?? '')}</h3>
    <span class="meta">${esc(s.text)}</span></a>`).join('') || `<p class="note">${tr('No positions recorded yet.')}</p>`}</div>
  ${demoHinweis()}`;
}
