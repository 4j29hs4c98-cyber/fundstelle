// rss.ts — liest Eintraege aus einem RSS-2.0-Feed: Titel, Link, Datum und Anreisser (nur fuer die KI-Zuordnung,
// wird nie gespeichert). Bewusst ohne XML-Bibliothek: die Feeds sind einfach, und so laeuft kein fremder Code.
export type Meldung = { url: string; quelle: string; titel: string; anreisser: string; datum: string };

const ENTITAETEN: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

// Ungueltige Zeichennummern lassen den Text stehen, statt den ganzen Feed scheitern zu lassen.
const zeichen = (n: number, roh: string) => (Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : roh);

export function klartext(s: string): string {
  // Erst Tags entfernen, dann Entitaeten aufloesen ("Kosten &lt; 5 Mio" bleibt so erhalten).
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => zeichen(parseInt(h, 16), m))
    .replace(/&#(\d+);/g, (m, d) => zeichen(Number(d), m))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITAETEN[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ').trim();
}

const feld = (item: string, name: string) => klartext(item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))?.[1] ?? '');

const TRACKING = /^(utm_|wt_|at_|ref$|xtor$|cid$)/i;

// Nur https-Links; Tracking-Anhaenge (utm_...) entfernen, damit derselbe Artikel nicht doppelt erscheint.
export function sauberLink(roh: string): string | null {
  try {
    const u = new URL(roh.trim());
    if (u.protocol !== 'https:') return null;
    [...u.searchParams.keys()].filter(k => TRACKING.test(k)).forEach(k => u.searchParams.delete(k));
    u.hash = '';
    return u.href;
  } catch { return null; }
}

export function parseRss(xml: string, quelle: string): Meldung[] {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  return items.flatMap(item => {
    const url = sauberLink(feld(item, 'link') || feld(item, 'guid'));
    const titel = feld(item, 'title').slice(0, 400);
    const zeit = Date.parse(feld(item, 'pubDate') || feld(item, 'dc:date'));
    if (!url || !titel || Number.isNaN(zeit)) return [];
    return [{ url, quelle, titel, anreisser: feld(item, 'description').slice(0, 400), datum: new Date(Math.min(zeit, Date.now())).toISOString() }];   // Zukunftsdaten klebten sonst oben
  });
}
