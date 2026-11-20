// tiefe.js — "Tiefensuche" unter den Ergebnissen der Startfrage: Sonnet sucht zusaetzlich im Netz (Edge Function
// tiefensuche). Startet nur auf Knopfdruck, weil jede Tiefensuche Geld kostet. Alles vom Server wird wie Nutzereingabe
// behandelt: nur bekannte Werte, nur https-Links, Laengen begrenzt. Das Ergebnis gehoert zur Frage, fuer die es startete.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import * as sync from './sync.js';

// status: leer | laeuft | fertig | anmelden | aus | fehler. schritt: suchen | belege
export const T = { frage: '', status: 'leer', schritt: null, ergebnis: null, fehler: null };
const RICHTUNGEN = new Set(['dafuer', 'dagegen', 'kontext']);
const SCHRITTE = new Set(['suchen', 'belege']);
const FEHLER = new Set(['zu_wenig', 'grenze', 'nicht_verfuegbar', 'keine_antwort', 'abgebrochen']);
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = v => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
let lauf = null, laufNr = 0;

export function ergebnisPruefen(e) {
  if (!e || typeof e !== 'object') return null;
  const befunde = (Array.isArray(e.befunde) ? e.befunde : []).slice(0, 8).map(b => ({
    url: httpsUrl(b?.url), richtung: RICHTUNGEN.has(b?.richtung) ? b.richtung : null, aussage: text(b?.aussage, 400),
    auszug: text(b?.auszug, 400), seite: text(b?.seite, 80), titel: text(b?.titel, 300),
  })).filter(b => b.url && b.richtung && b.auszug);
  return { zusammenfassung: text(e.zusammenfassung, 1200), offen: text(e.offen, 600), wenigBelege: e.wenig_belege !== false,
    teilfragen: (Array.isArray(e.teilfragen) ? e.teilfragen : []).map(t => text(t, 200)).filter(Boolean).slice(0, 4), befunde };
}

const setzen = (status, mehr = {}) => Object.assign(T, { status, schritt: null, ergebnis: null, fehler: null }, mehr);

async function sitzung() {
  const client = sync.getClient();
  if (!client || !SUPABASE_URL) return { aus: true };
  const { data } = await client.auth.getSession();
  return { token: data?.session?.access_token ?? null };
}

// Ein abgebrochener Lauf darf nicht als "laeuft" stehen bleiben, sonst haengt der Block, wenn man zur Frage zurueckkehrt.
export function tiefeAbbrechen() { lauf?.abort(); lauf = null; laufNr += 1; if (T.status === 'laeuft') setzen('leer'); }

export async function tiefeStarten(frage, zeichnen) {
  if (T.status === 'laeuft' && T.frage === frage) return;
  tiefeAbbrechen();
  const nr = laufNr, ctrl = new AbortController(); lauf = ctrl;
  T.frage = frage; setzen('laeuft', { schritt: 'suchen' }); zeichnen();
  const s = await sitzung();
  if (nr !== laufNr) return;
  if (s.aus) { setzen('aus'); zeichnen(); return; }
  if (!s.token) { setzen('anmelden'); zeichnen(); return; }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/tiefensuche`, {
      method: 'POST', signal: ctrl.signal,
      headers: { Authorization: `Bearer ${s.token}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ frage }),
    });
    if (res.status === 401) { setzen('anmelden'); zeichnen(); return; }
    if (res.status === 404) { setzen('aus'); zeichnen(); return; }
    if (!res.ok || !res.body) { const b = await res.json().catch(() => ({})); if (ctrl.signal.aborted || nr !== laufNr) return; setzen('fehler', { fehler: FEHLER.has(b.fehler) ? b.fehler : 'abgebrochen' }); zeichnen(); return; }
    await lesen(res.body, ctrl, nr, zeichnen);
  } catch (err) {
    if (ctrl.signal.aborted || nr !== laufNr) return;
    console.error('Tiefensuche', err);
    setzen('fehler', { fehler: 'abgebrochen' }); zeichnen();
  } finally { if (lauf === ctrl) lauf = null; }
}

async function lesen(body, ctrl, nr, zeichnen) {
  const reader = body.getReader(), dec = new TextDecoder();
  let rest = '', fertig = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (ctrl.signal.aborted || nr !== laufNr) { reader.cancel().catch(() => {}); return; }
    rest += dec.decode(value || new Uint8Array(), { stream: !done });
    const zeilen = rest.split('\n'); rest = zeilen.pop();
    for (const z of zeilen.filter(Boolean)) {
      let e; try { e = JSON.parse(z); } catch { continue; }
      if (e.fertig) fertig = true;
      else if (e.fehler) setzen('fehler', { fehler: FEHLER.has(e.fehler) ? e.fehler : 'abgebrochen' });
      else if (e.ergebnis) { const r = ergebnisPruefen(e.ergebnis); r ? setzen('fertig', { ergebnis: r }) : setzen('fehler', { fehler: 'keine_antwort' }); }
      else if (SCHRITTE.has(e.schritt) && T.status === 'laeuft') T.schritt = e.schritt;
    }
    zeichnen();
    if (done) break;
  }
  // Ohne Schlusszeile ist die Tiefensuche abgebrochen: nie ein halbes Ergebnis als fertig zeigen.
  if (!fertig || T.status === 'laeuft') { setzen('fehler', { fehler: 'abgebrochen' }); zeichnen(); }
}
