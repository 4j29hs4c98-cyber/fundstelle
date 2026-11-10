// views/wahlen.js — alle kommenden Wahltermine, nach Jahr. Standard: nur was zum Profil passt; ein Schalter zeigt alle.
// Nicht festgelegte Termine stehen als "voraussichtlich ...", nie als erfundenes genaues Datum.
import { tr, plural } from '../i18n.js';
import { esc, S } from '../core.js';
import { WAHLARTEN, BUNDESLAENDER } from '../katalog.js';
import { meineWahlen, profil, hatProfil } from '../profil.js';
import { tageBis } from '../content.js';
import { kopf, termin, extLink } from './teile.js';

const artName = id => { const w = WAHLARTEN.find(x => x.id === id); return w ? tr(w.name) : esc(id); }; // id kann aus einem Backup stammen
const landName = id => BUNDESLAENDER.find(l => l.id === id)?.name ?? '';

export function wahlKarte(w) {
  const tage = w.datum ? tageBis(w.datum) : null;
  return `<article class="card wahl"><div class="card-row"><div><span class="meta">${artName(w.art)}${w.land ? ` · ${esc(landName(w.land))}` : ''}</span>
      <h3>${esc(w.name)}</h3><p>${termin(w)}</p></div>
      ${tage !== null ? `<span class="tage" aria-label="${plural(tage, tr('1 day to go'), tr('{n} days to go', { n: tage }))}">${tage}<small>${plural(tage, tr('day'), tr('days'))}</small></span>` : ''}</div>
    <p class="meta">${extLink(w.quelle, tr('Source'))}</p></article>`;
}

export function viewWahlen() {
  const ws = meineWahlen({ alle: S.alleWahlen }), pr = profil();
  const jahre = [...new Set(ws.map(w => w.sort.slice(0, 4)))];
  const filter = hatProfil() ? `${pr.wahlarten.map(artName).join(', ')}${pr.land ? ` · ${esc(landName(pr.land))}` : ''}` : tr('All elections');
  return `${kopf(tr('Today'), tr('Upcoming elections'), tr('Fixed dates with a countdown, everything else as the expected period.'), { href: '#start', text: tr('Start') })}
  <div class="row merk-row"><button class="btn" data-action="alle-wahlen" aria-pressed="${S.alleWahlen}">${S.alleWahlen ? tr('Only my elections') : tr('Show all elections')}</button>
    <span class="meta">${S.alleWahlen ? tr('All elections') : filter} · <a href="#settings">${tr('Change profile')}</a></span></div>
  ${jahre.map(j => `<h2 class="eyebrow section-label">${j}</h2><div class="cards">${ws.filter(w => w.sort.startsWith(j)).map(wahlKarte).join('')}</div>`).join('')
    || `<p class="note">${tr('No upcoming elections match your profile.')}</p>`}
  <p><a class="btn" href="#grundlagen/wahlen-und-parteien/wahlalter-in-bund-land-und-eu">${tr('Who may vote, from what age?')} ${'→'}</a></p>
  <p class="note small">${tr('Elections of mayors and district administrators are not listed yet, they take place on scattered dates.')}</p>`;
}
