// profil.js — das Nutzerprofil: welche Wahlen und Themen jemanden interessieren. Ein Record { kind: 'profil' }
// mit fester ID, damit es auf allen Geraeten nur eines gibt; wird wie alle Records synchronisiert.
// Ohne Profil gilt: alle Wahlarten, kein Bundesland (dann erscheinen alle Landes- und Kommunalwahlen).
import { get } from './core.js';
import { WAHLEN, WAHLARTEN } from './katalog.js';

export const PROFIL_ID = 'profil';
const STANDARD = { wahlarten: WAHLARTEN.map(w => w.id), land: '', themen: [], hinweise: true };

export const hatProfil = () => !!get(PROFIL_ID);
// Kaputte oder alte Profile (Import, Sync, aeltere Version) duerfen den Start nicht brechen: nur Arrays/Strings uebernehmen.
export function profil() {
  const d = get(PROFIL_ID)?.data || {}, liste = (v, std) => (Array.isArray(v) && v.length ? v.filter(x => typeof x === 'string') : std);
  return { wahlarten: liste(d.wahlarten, STANDARD.wahlarten), land: typeof d.land === 'string' ? d.land : '',
    themen: liste(d.themen, []), hinweise: d.hinweise !== false };
}

const ortsdatum = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Termine ohne festes Datum bleiben sichtbar, bis der geschaetzte Zeitraum sicher vorbei ist.
const ZEITRAUM_TAGE = 90;
const bisZeitraum = sort => ortsdatum(new Date(new Date(sort + 'T12:00:00').getTime() + ZEITRAUM_TAGE * 864e5));
const passt = (w, pr) => pr.wahlarten.includes(w.art) && (!w.land || !pr.land || w.land === pr.land);

// Kommende Wahlen, die zum Profil passen (alle = true ignoriert das Profil). Sortiert nach Datum.
export function meineWahlen({ alle = false, heute = new Date() } = {}) {
  const pr = profil(), tag = ortsdatum(heute);
  return WAHLEN.filter(w => (w.datum || bisZeitraum(w.sort)) >= tag && (alle || passt(w, pr))).sort((a, b) => a.sort.localeCompare(b.sort));
}
// Die naechste eigene Wahl mit festem Datum, sonst die naechste ueberhaupt.
export const naechsteEigeneWahl = () => { const ws = meineWahlen(); return ws.find(w => w.datum) || ws[0] || null; };
