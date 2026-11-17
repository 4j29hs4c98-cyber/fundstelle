// quellen.ts — die festen RSS-Quellen und das Laden eines Feeds. Genutzt von nachrichten-holen (Schlagzeilen, alle 30 Minuten)
// und nachrichten-themen (Themen des Tages, alle zwei Stunden), damit beide dieselbe Liste haben.
import { parseRss, type Meldung } from './rss.ts';

export type Quelle = { name: string; url: string };

// Bewusst gemischt: oeffentlich-rechtlich, Parlament und Zeitungen von links-liberal bis konservativ.
export const QUELLEN: Quelle[] = [
  { name: 'tagesschau.de', url: 'https://www.tagesschau.de/inland/innenpolitik/index~rss2.xml' },
  { name: 'zdfheute.de', url: 'https://www.zdfheute.de/rss/zdf/nachrichten/politik' },
  { name: 'deutschlandfunk.de', url: 'https://www.deutschlandfunk.de/politikportal-100.rss' },
  { name: 'bundestag.de (hib)', url: 'https://www.bundestag.de/static/appdata/includes/rss/hib.rss' },
  { name: 'spiegel.de', url: 'https://www.spiegel.de/politik/deutschland/index.rss' },
  { name: 'faz.net', url: 'https://www.faz.net/rss/aktuell/politik/inland/' },
  { name: 'zeit.de', url: 'https://newsfeed.zeit.de/politik/index' },
  { name: 'welt.de', url: 'https://www.welt.de/feeds/section/politik.rss' },
  { name: 'sueddeutsche.de', url: 'https://rss.sueddeutsche.de/rss/Politik' },
];

const FEED_MAX_BYTES = 3_000_000;

export async function feedLaden(q: Quelle): Promise<Meldung[]> {
  const r = await fetch(q.url, { headers: { 'User-Agent': 'Fundstelle-Nachrichten/1.0' }, signal: AbortSignal.timeout(10_000) });
  if (!r.ok) throw new Error(`${q.name} ${r.status}`);
  const text = await r.text();
  if (text.length > FEED_MAX_BYTES) throw new Error(`${q.name} zu gross`);
  return parseRss(text, q.name);
}
