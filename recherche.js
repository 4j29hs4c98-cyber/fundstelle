// recherche.js — "Eigenes Thema": schon waehrend man die Frage tippt, startet der Recherche-Agent
// (Edge Function thema-recherche). Ergebnisse kommen Partei fuer Partei als Strom an und erscheinen sofort.
// Wer weitertippt, bricht die laufende Recherche ab; nach einer kurzen Pause startet eine neue.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import * as sync from './sync.js';

export const MIN_LAENGE = 12, MAX_LAENGE = 200;
// Der Agent startet sofort, wenn die Frage mit "?" endet, sonst nach einer laengeren Tipp-Pause. Jede Recherche kostet Geld.
const PAUSE_MS = 2000;

// Zustand der aktuellen Recherche. status: leer | laeuft | fertig | anmelden | aus | fehler
// typ kommt vom Server: 'ja_nein' (Ja oder Nein je Partei) oder 'offen' (nur Zusammenfassung, keine Richtung).
// typ 'person': die Frage nennt eine Politikerin oder einen Politiker. Dann kommen statt Parteiprogrammen Belege aus drei
// Quellen (belege): Abstimmungen (abgeordnetenwatch.de), Reden im Bundestag (DIP) und Webquellen. gesamt/fertig zaehlen Quellen.
export const R = { frage: '', status: 'leer', typ: null, ergebnisse: [], person: null, belege: [], fertig: 0, gesamt: 0, fehler: null, fehlgeschlagen: 0 };
let lauf = null, timer = null, laufNr = 0;

const zuruecksetzen = (status, fehler = null) => Object.assign(R, { status, typ: null, ergebnisse: [], person: null, belege: [], fertig: 0, gesamt: 0, fehler, fehlgeschlagen: 0 });

// Nur https-Links, nur bekannte Quellen, nur Text: Server-Daten werden hier wie Nutzereingaben behandelt.
const QUELLEN = new Set(['abstimmung', 'rede', 'web']);
const STIMMEN = new Set(['ja', 'nein', 'enthalten', 'nicht_abgestimmt']);
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = v => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
export function belegPruefen(b) {
  if (!b || !QUELLEN.has(b.quelle)) return null;
  const url = httpsUrl(b.url), titel = text(b.titel, 300);
  if (!url || !titel) return null;
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(b.datum ?? '') ? b.datum : null;
  const beleg = { quelle: b.quelle, titel, url, datum };
  if (b.quelle === 'abstimmung') return STIMMEN.has(b.stimme) ? { ...beleg, stimme: b.stimme } : null;
  const zusammenfassung = text(b.zusammenfassung, 600), auszug = text(b.auszug, 500);
  if (!zusammenfassung || !auszug) return null;
  return { ...beleg, zusammenfassung, auszug, fundstelle: text(b.fundstelle, 120) || null, seite_name: text(b.seite_name, 120) || null };
}

// sofort: ohne Tipp-Pause starten (Frage von der Startseite abgeschickt).
export function tippen(text, zeichnen, sofort = false) {
  clearTimeout(timer);
  const frage = String(text).replace(/\s+/g, ' ').trim().slice(0, MAX_LAENGE);
  if (frage === R.frage && (R.status === 'laeuft' || R.status === 'fertig')) return;
  lauf?.abort(); lauf = null; laufNr += 1;
  R.frage = frage;
  zuruecksetzen('leer');
  zeichnen();
  if (frage.length >= MIN_LAENGE) timer = setTimeout(() => starten(frage, zeichnen), sofort ? 0 : frage.endsWith('?') ? 300 : PAUSE_MS);
}

async function sitzung() {
  const client = sync.getClient();
  if (!client || !SUPABASE_URL) return { aus: true };
  const { data } = await client.auth.getSession();
  return { token: data?.session?.access_token ?? null };
}

export async function starten(frage, zeichnen) {
  const nr = laufNr;
  const s = await sitzung();
  if (nr !== laufNr || frage !== R.frage) return; // inzwischen weitergetippt
  if (s.aus) { zuruecksetzen('aus'); zeichnen(); return; }
  if (!s.token) { zuruecksetzen('anmelden'); zeichnen(); return; }
  const ctrl = new AbortController(); lauf = ctrl;
  zuruecksetzen('laeuft'); zeichnen();
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/thema-recherche`, {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${s.token}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ frage }),
    });
    if (res.status === 401) { zuruecksetzen('anmelden'); zeichnen(); return; }
    if (res.status === 404) { zuruecksetzen('aus'); zeichnen(); return; }
    if (!res.ok || !res.body) { const b = await res.json().catch(() => ({})); throw new Error(b.fehler || `HTTP ${res.status}`); }
    await lesen(res.body, ctrl, zeichnen, nr);
  } catch (err) {
    if (ctrl.signal.aborted || nr !== laufNr) return;
    console.error('Recherche', err);
    zuruecksetzen('fehler', err.message); zeichnen();
  } finally { if (lauf === ctrl) lauf = null; }
}

// NDJSON lesen: jede Zeile ist ein Ereignis. Unvollstaendige Zeilen warten auf das naechste Stueck.
async function lesen(body, ctrl, zeichnen, nr) {
  const reader = body.getReader(), dec = new TextDecoder();
  let rest = '', abgeschlossen = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (ctrl.signal.aborted || nr !== laufNr) { reader.cancel().catch(() => {}); return; }
    rest += dec.decode(value || new Uint8Array(), { stream: !done });
    const zeilen = rest.split('\n'); rest = zeilen.pop();
    zeilen.filter(Boolean).forEach(z => { if (verarbeiten(z) === 'fertig') abgeschlossen = true; });
    zeichnen();
    if (done) break;
  }
  // Ohne Schlusszeile ist die Recherche abgebrochen: nicht als "keine klare Position" ausgeben.
  if (!abgeschlossen) zuruecksetzen('fehler', 'abgebrochen');
  else if (R.status === 'laeuft') R.status = 'fertig';
  zeichnen();
}

function verarbeiten(zeile) {
  let e; try { e = JSON.parse(zeile); } catch { return; }
  if (e.start && e.typ === 'person') {
    R.typ = 'person'; R.gesamt = Number(e.quellen) || 0;
    R.person = { name: text(e.person?.name, 100), partei: text(e.person?.partei, 60) || null, gefunden: e.person?.gefunden !== false };
    return;
  }
  if (e.start) { R.gesamt = Number(e.parteien) || 0; R.typ = e.typ === 'offen' ? 'offen' : 'ja_nein'; return; }
  if (e.fertig) { R.status = 'fertig'; return 'fertig'; }
  if (e.beleg) {
    const b = belegPruefen(e.beleg);
    if (b && !R.belege.some(x => x.url === b.url && x.titel === b.titel)) R.belege = [...R.belege, b];
    return;
  }
  if (e.quelle_fertig) { R.fertig += 1; if (e.fehler) R.fehlgeschlagen += 1; return; }
  R.fertig += 1;
  if (e.fehler) R.fehlgeschlagen += 1;
  const richtungOk = R.typ === 'offen' ? e.haltung == null : e.haltung === 'dafuer' || e.haltung === 'dagegen';
  if (e.ok && richtungOk && e.auszug && e.zusammenfassung && Number.isInteger(e.seite)) {
    if (R.ergebnisse.some(x => x.partei === e.partei)) return;
    R.ergebnisse = [...R.ergebnisse, { partei: e.partei, haltung: e.haltung ?? null, zusammenfassung: String(e.zusammenfassung ?? ''),
      auszug: String(e.auszug), seite: e.seite, quelle_url: e.quelle_url ?? null }];
  }
}

export function abbrechen() { clearTimeout(timer); lauf?.abort(); lauf = null; laufNr += 1; }
