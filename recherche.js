// recherche.js — "Eigenes Thema": schon waehrend man die Frage tippt, startet der Recherche-Agent
// (Edge Function thema-recherche). Ergebnisse kommen Partei fuer Partei als Strom an und erscheinen sofort.
// Wer weitertippt, bricht die laufende Recherche ab; nach einer kurzen Pause startet eine neue.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import * as sync from './sync.js';

export const MIN_LAENGE = 12, MAX_LAENGE = 200;
const PAUSE_MS = 900;

// Zustand der aktuellen Recherche. status: leer | laeuft | fertig | anmelden | aus | fehler
export const R = { frage: '', status: 'leer', ergebnisse: [], fertig: 0, gesamt: 0, fehler: null };
let lauf = null, timer = null;

const zuruecksetzen = (status, fehler = null) => Object.assign(R, { status, ergebnisse: [], fertig: 0, gesamt: 0, fehler });

export function tippen(text, zeichnen) {
  clearTimeout(timer);
  const frage = String(text).replace(/\s+/g, ' ').trim().slice(0, MAX_LAENGE);
  if (frage === R.frage && R.status !== 'leer') return;
  lauf?.abort(); lauf = null;
  R.frage = frage;
  zuruecksetzen('leer');
  zeichnen();
  if (frage.length >= MIN_LAENGE) timer = setTimeout(() => starten(frage, zeichnen), PAUSE_MS);
}

async function sitzung() {
  const client = sync.getClient();
  if (!client || !SUPABASE_URL) return { aus: true };
  const { data } = await client.auth.getSession();
  return { token: data?.session?.access_token ?? null };
}

export async function starten(frage, zeichnen) {
  const s = await sitzung();
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
    await lesen(res.body, ctrl, zeichnen);
  } catch (err) {
    if (ctrl.signal.aborted) return;
    console.error('Recherche', err);
    zuruecksetzen('fehler', err.message); zeichnen();
  } finally { if (lauf === ctrl) lauf = null; }
}

// NDJSON lesen: jede Zeile ist ein Ereignis. Unvollstaendige Zeilen warten auf das naechste Stueck.
async function lesen(body, ctrl, zeichnen) {
  const reader = body.getReader(), dec = new TextDecoder();
  let rest = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (ctrl.signal.aborted) { reader.cancel().catch(() => {}); return; }
    rest += dec.decode(value || new Uint8Array(), { stream: !done });
    const zeilen = rest.split('\n'); rest = zeilen.pop();
    zeilen.filter(Boolean).forEach(z => verarbeiten(z));
    zeichnen();
    if (done) break;
  }
  if (R.status === 'laeuft') R.status = 'fertig';
  zeichnen();
}

function verarbeiten(zeile) {
  let e; try { e = JSON.parse(zeile); } catch { return; }
  if (e.start) { R.gesamt = Number(e.parteien) || 0; return; }
  if (e.fertig) { R.status = 'fertig'; return; }
  R.fertig += 1;
  if (e.ok && (e.haltung === 'dafuer' || e.haltung === 'dagegen') && e.auszug && Number.isInteger(e.seite)) {
    R.ergebnisse = [...R.ergebnisse, { partei: e.partei, haltung: e.haltung, zusammenfassung: String(e.zusammenfassung ?? ''),
      auszug: String(e.auszug), seite: e.seite, quelle_url: e.quelle_url ?? null }];
  }
}

export function abbrechen() { clearTimeout(timer); lauf?.abort(); lauf = null; }
