// views/pruefen.js — "Stimmt das, was ich hoere?": Suche ueber alle Programme und Abstimmungen.
// Ergebnis sind Fundstellen mit Seite, oder der klare Hinweis, dass es keine gibt. Die App urteilt nicht.
import { tr } from '../i18n.js';
import { esc, S } from '../core.js';
import { suche, partei, frage } from '../content.js';
import { kopf, pfeil, seite, pdfSeite, datum, demoHinweis, safeUrl, auszugBlock, extLink } from './teile.js';
import { P } from '../pruefung.js';

function ergebnis(r) {
  if (!r) return `<p class="note">${tr('For example: “SPD Mietpreisbremse” or “CO2-Preis Klimageld”.')}</p>`;
  const wer = r.parteien.map(p => esc(p.name)).join(', ');
  const treffer = r.positionen.map(p => `<a class="card paper link" href="#frage/${esc(p.frage)}">
      <span class="meta">${esc(partei(p.partei)?.name ?? '')} · ${esc(frage(p.frage)?.kurz ?? '')}</span>
      ${p.auszug ? auszugBlock(p.auszug, p.quelle) : `<p>${esc(p.text)}</p>`}
      <span class="meta">${esc(p.quelle)}${p.seite ? `, ${pdfSeite(p.seite)}` : ''} ${pfeil}</span></a>`).join('');
  const abst = r.abstimmungen.map(a => {
    const f = frage(a.fragen[0]);
    const href = f ? `#frage/${esc(f.id)}` : safeUrl(a.url) ? esc(safeUrl(a.url)) : null;
    const inhalt = `<h3>${esc(a.titel)}</h3><span class="meta">${esc(a.parlament)} · ${datum(a.datum)} · ${esc(a.quelle)}</span>`;
    return href ? `<a class="card link" href="${href}"${f ? '' : ' target="_blank" rel="noopener"'}>${inhalt}</a>` : `<article class="card">${inhalt}</article>`;
  }).join('');
  return `${wer ? `<p class="meta">${tr('Searching only in: {p}', { p: wer })}</p>` : ''}
    <h2 class="eyebrow section-label">${tr('Found in the programmes')}</h2>
    ${treffer ? `<div class="cards">${treffer}</div>` : `<section class="notice"><b>${tr('No passage found in the programmes.')}</b>
      <p>${tr('That does not prove the opposite. The search only finds words that are actually written there.')}</p></section>`}
    ${abst ? `<h2 class="eyebrow section-label">${tr('Found in votes')}</h2><div class="cards">${abst}</div>` : ''}`;
}

// ---------- Link pruefen (Edge Function behauptung-pruefen) ----------
const URTEIL = { stimmt: 'True', stimmt_nicht: 'False', teilweise: 'Partly true', nicht_belegbar: 'Cannot be verified' };
const SCHRITT = { lesen: 'Reading the link …', suchen: 'Searching reputable sources …', belege: 'Checking every quote on its source page …', gegenprobe: 'Cross-checking the verdict …' };
const RICHTUNG = { stuetzt: 'Supports the claim', widerlegt: 'Contradicts the claim', ergaenzt: 'Adds context' };
const GRUND = { keine_belege: 'No source could be verified, so there is no verdict.',
  zu_wenig_belege: 'The verdict was set more cautiously: a clear verdict needs verified sources from at least two different sites.',
  gegenprobe: 'The verdict was set more cautiously because the cross-check did not confirm it.' };
const FEHLER = { zu_lang: 'The link or text is too long.', link_ungueltig: 'Only secure web addresses (https) can be checked.',
  zu_wenig: 'Please paste a link or at least a full sentence.', grenze: 'You have reached the limit of checks for now. Please try again later.',
  nicht_verfuegbar: 'Checking is not available right now.', link_nicht_lesbar: 'The link could not be opened. Please paste the text of the post as well.',
  keine_antwort: 'The check did not produce a usable result. Please try again.', behauptung_unklar: 'No clear claim was found. Please paste the exact sentence you want checked.',
  abgebrochen: 'The check was interrupted. Please try again.' };

function befundHtml(b) {
  return `<li class="befund ${b.richtung}"><span class="meta">${tr(RICHTUNG[b.richtung])} · ${esc(b.seite)}</span>
    <p>${esc(b.aussage)}</p><blockquote class="auszug">„${esc(b.auszug)}“</blockquote>
    <p class="meta">${extLink(b.url, `${esc(b.titel || b.seite)} ${pfeil}`)}</p></li>`;
}

export function pruefungHtml() {
  if (P.status === 'leer') return `<p class="note">${tr('Takes about a minute. You need to be signed in. Each check uses paid KI research, so please only start it when you need it.')}</p>`;
  if (P.status === 'anmelden') return `<p class="notice">${tr('Please sign in under Settings to check links.')} <a href="#settings">${tr('Settings')} ${pfeil}</a></p>`;
  if (P.status === 'aus') return `<p class="notice">${tr('Checking links is not available in this version.')}</p>`;
  if (P.status === 'laeuft') return `<p class="laeuft" role="status"><span class="spinner" aria-hidden="true"></span> ${tr(SCHRITT[P.schritt] ?? SCHRITT.lesen)}</p>`;
  if (P.status === 'fehler') return `<p class="notice">${tr(FEHLER[P.fehler] ?? FEHLER.abgebrochen)}</p>`;
  const r = P.ergebnis;
  const gruppe = rt => r.befunde.filter(b => b.richtung === rt).map(befundHtml).join('');
  const belege = ['stuetzt', 'widerlegt', 'ergaenzt'].map(gruppe).join('');
  return `<article class="card faktencheck urteil-${r.urteil}">
    <span class="eyebrow">${tr('Checked claim')}</span>
    <blockquote class="auszug">„${esc(r.behauptung)}“</blockquote>
    ${P.url && !r.linkGelesen ? `<p class="meta">${tr('The link could not be opened. The check is based on the text you pasted.')}</p>` : ''}
    <p class="urteil"><span class="urteil-label">${tr('Verdict')}</span> <b>${tr(URTEIL[r.urteil])}</b></p>
    ${r.grund ? `<p class="meta">${tr(GRUND[r.grund])}</p>` : ''}
    ${r.begruendung ? `<h3>${tr('Why')}</h3><p>${esc(r.begruendung)}</p>` : ''}
    ${r.einwand ? `<p class="meta">${tr('Cross-check:')} ${esc(r.einwand)}</p>` : ''}
    ${belege ? `<h3>${tr('Sources')}</h3><ul class="befunde">${belege}</ul>` : `<p class="meta">${tr('No verified source found.')}</p>`}
    ${r.offen ? `<h3>${tr('Still open')}</h3><p>${esc(r.offen)}</p>` : ''}
    ${r.teilfragen.length ? `<details><summary>${tr('How it was checked')}</summary><ul>${r.teilfragen.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>` : ''}
    <p class="meta">${tr('Researched by KI on a fixed list of reputable sites. Every quote was checked on its source page. The verdict can still be wrong: please read the sources.')}</p>
  </article>`;
}

export function pruefungZeichnen() {
  const el = document.getElementById('link-pruefung');
  if (el) el.innerHTML = pruefungHtml();
  const knopf = document.querySelector('[data-form="linkpruefen"] button');
  if (knopf) knopf.disabled = P.status === 'laeuft';
}

function linkBlock() {
  return `<section class="link-check" aria-labelledby="link-titel">
    <h2 id="link-titel" class="eyebrow section-label">${tr('Check a link')}</h2>
    <p>${tr('Paste a link, for example from social media, and if possible the text of the post. A KI agent researches whether the claim is true.')}</p>
    <form class="link-form" data-form="linkpruefen">
      <label for="link-url">${tr('Link')}</label>
      <input id="link-url" name="url" type="url" inputmode="url" value="${esc(P.url)}" placeholder="https://…" maxlength="2000" autocomplete="off">
      <label for="link-text">${tr('Text of the post (optional, helps with social media)')}</label>
      <textarea id="link-text" name="text" rows="3" maxlength="3000">${esc(P.text)}</textarea>
      <button class="btn primary"${P.status === 'laeuft' ? ' disabled' : ''}>${tr('Check')}</button>
    </form>
    <div id="link-pruefung" aria-live="polite">${pruefungHtml()}</div>
  </section>`;
}

export function viewPruefen() {
  return `${kopf(tr('Check'), tr('Is what I heard true?'), tr('Search all programmes and votes. You get the passage with its page, or a clear note that there is none.'))}
  <form class="search" data-form="suche" role="search">
    <label class="sr-only" for="suche-q">${tr('Search')}</label>
    <input id="suche-q" name="q" type="search" value="${esc(S.suche)}" placeholder="${tr('Party X wants …')}" autocomplete="off" maxlength="200">
    <button class="btn primary">${tr('Search')}</button>
  </form>
  ${ergebnis(suche(S.suche))}
  ${linkBlock()}
  ${demoHinweis()}`;
}
