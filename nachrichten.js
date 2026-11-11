// nachrichten.js — Schlagzeilen aus der Tabelle nachrichten (gesammelt von der Edge Function nachrichten-holen).
// Lesbar ohne Konto. Nur fluechtig im Speicher: Nachrichten veralten schnell, offline zeigt die App sie nicht an.
// Zwei Fassungen: alle Schlagzeilen (Startseite) und nur die, deren Partei oder Person im Text gefunden wurde.
const MAX_ZEILEN = 300;
const NEU_LADEN_MS = 10 * 60_000;

export const N = { liste: [], stand: 0 };

const text = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
// Nur gueltige Zeilen uebernehmen: https-Link, Titel, Datum.
const zeile = r => {
  const url = text(r?.url, 2000), titel = text(r?.titel, 400), datum = text(r?.datum, 40);
  if (!/^https:\/\//.test(url) || !titel || Number.isNaN(Date.parse(datum))) return null;
  return { url, titel, datum, quelle: text(r.quelle, 60), parteien: Array.isArray(r.parteien) ? r.parteien.filter(x => typeof x === 'string') : [],
    personen: Array.isArray(r.personen) ? r.personen.filter(x => typeof x === 'string') : [] };
};

export async function nachrichtenLaden(client) {
  if (!client || Date.now() - N.stand < NEU_LADEN_MS) return false;
  const { data, error } = await client.from('nachrichten').select('url,quelle,titel,datum,parteien,personen').order('datum', { ascending: false }).limit(MAX_ZEILEN);
  if (error) { console.error('Nachrichten', error.message); return false; }
  N.liste = (data ?? []).map(zeile).filter(Boolean);
  N.stand = Date.now();
  return true;
}

export const zuPartei = id => N.liste.filter(n => n.parteien.includes(id));
// Personen per Nachname vergleichen, damit "Merz" und "Friedrich Merz" zusammenfinden; der Vorname muss passen, wenn beide einen haben.
export function zuPerson(name) {
  const teile = String(name ?? '').toLowerCase().replace(/\b(dr|prof)\.\s*/g, '').trim().split(/\s+/);
  const nach = teile.at(-1), vor = teile.length > 1 ? teile[0] : '';
  if (!nach) return [];
  return N.liste.filter(n => n.personen.some(p => {
    const t = p.toLowerCase().split(/\s+/);
    return t.at(-1) === nach && (!vor || t.length < 2 || t[0] === vor);
  }));
}
