// pruefung.js — "Link pruefen" im Reiter Pruefen: schickt Link und/oder Text an die Edge Function behauptung-pruefen
// und liest die Antwort als Strom (NDJSON). Jede Pruefung kostet Geld (Sonnet 5.5), deshalb nur auf Knopfdruck.
// Alles vom Server wird wie Nutzereingabe behandelt: nur bekannte Werte, nur https-Links, Laengen begrenzt.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import * as sync from './sync.js';

// status: leer | laeuft | fertig | anmelden | aus | fehler. schritt: lesen | suchen | belege | gegenprobe
export const P = { url: '', text: '', status: 'leer', schritt: null, ergebnis: null, fehler: null };
const URTEILE = new Set(['stimmt', 'stimmt_nicht', 'teilweise', 'nicht_belegbar']);
const RICHTUNGEN = new Set(['stuetzt', 'widerlegt', 'ergaenzt']);
const GRUENDE = new Set(['keine_belege', 'zu_wenig_belege', 'gegenprobe']);
const SCHRITTE = new Set(['lesen', 'suchen', 'belege', 'gegenprobe']);
const FEHLER = new Set(['zu_lang', 'link_ungueltig', 'zu_wenig', 'grenze', 'nicht_verfuegbar', 'link_nicht_lesbar', 'keine_antwort', 'behauptung_unklar', 'abgebrochen']);
const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = v => { try { const u = new URL(v); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };

export function ergebnisPruefen(e) {
  if (!e || !URTEILE.has(e.urteil)) return null;
  const behauptung = text(e.behauptung, 300);
  if (!behauptung) return null;
  const befunde = (Array.isArray(e.befunde) ? e.befunde : []).slice(0, 8).map(b => ({
    url: httpsUrl(b?.url), richtung: RICHTUNGEN.has(b?.richtung) ? b.richtung : null, aussage: text(b?.aussage, 400),
    auszug: text(b?.auszug, 400), seite: text(b?.seite, 80), titel: text(b?.titel, 300),
  })).filter(b => b.url && b.richtung && b.auszug);
  return { behauptung, urteil: e.urteil, linkGelesen: e.link_gelesen === true, grund: GRUENDE.has(e.grund) ? e.grund : null,
    begruendung: text(e.begruendung, 1200), offen: text(e.offen, 600), einwand: text(e.einwand, 400),
    teilfragen: (Array.isArray(e.teilfragen) ? e.teilfragen : []).map(t => text(t, 200)).filter(Boolean).slice(0, 4), befunde };
}

const setzen = (status, mehr = {}) => Object.assign(P, { status, schritt: null, ergebnis: null, fehler: null }, mehr);

async function sitzung() {
  const client = sync.getClient();
  if (!client || !SUPABASE_URL) return { aus: true };
  const { data } = await client.auth.getSession();
  return { token: data?.session?.access_token ?? null };
}

export async function pruefen(url, eingabeText, zeichnen) {
  if (P.status === 'laeuft') return;
  Object.assign(P, { url, text: eingabeText });
  setzen('laeuft', { schritt: 'lesen' }); zeichnen();
  const s = await sitzung();
  if (s.aus) { setzen('aus'); zeichnen(); return; }
  if (!s.token) { setzen('anmelden'); zeichnen(); return; }
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/behauptung-pruefen`, {
      method: 'POST', headers: { Authorization: `Bearer ${s.token}`, apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url || undefined, text: eingabeText || undefined }),
    });
    if (res.status === 401) { setzen('anmelden'); zeichnen(); return; }
    if (res.status === 404) { setzen('aus'); zeichnen(); return; }
    if (!res.ok || !res.body) { const b = await res.json().catch(() => ({})); setzen('fehler', { fehler: FEHLER.has(b.fehler) ? b.fehler : 'abgebrochen' }); zeichnen(); return; }
    await lesen(res.body, zeichnen);
  } catch (err) {
    console.error('Link pruefen', err);
    setzen('fehler', { fehler: 'abgebrochen' }); zeichnen();
  }
}

async function lesen(body, zeichnen) {
  const reader = body.getReader(), dec = new TextDecoder();
  let rest = '', fertig = false;
  for (;;) {
    const { value, done } = await reader.read();
    rest += dec.decode(value || new Uint8Array(), { stream: !done });
    const zeilen = rest.split('\n'); rest = zeilen.pop();
    for (const z of zeilen.filter(Boolean)) {
      let e; try { e = JSON.parse(z); } catch { continue; }
      if (e.fertig) fertig = true;
      else if (e.fehler) setzen('fehler', { fehler: FEHLER.has(e.fehler) ? e.fehler : 'abgebrochen' });
      else if (e.ergebnis) { const r = ergebnisPruefen(e.ergebnis); r ? setzen('fertig', { ergebnis: r }) : setzen('fehler', { fehler: 'keine_antwort' }); }
      else if (SCHRITTE.has(e.schritt) && P.status === 'laeuft') P.schritt = e.schritt;
    }
    zeichnen();
    if (done) break;
  }
  // Ohne Schlusszeile ist die Pruefung abgebrochen: nie ein halbes Ergebnis als fertig zeigen.
  if (!fertig || P.status === 'laeuft') { setzen('fehler', { fehler: 'abgebrochen' }); zeichnen(); }
}
