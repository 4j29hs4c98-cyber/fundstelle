// text.ts — Textwerkzeuge fuer den Recherche-Agenten: Normalisierung fuer den Zitat-Abgleich, HTML zu Text, Kuerzen.

// Gleiche Normalisierung wie scripts/zitate-pruefen.mjs, damit Trennstriche und Ligaturen den Abgleich nicht stoeren.
export const norm = (s: string) => String(s).normalize('NFKC').replace(/₂/g, '2').replace(/­/g, '').replace(/-\s*\n\s*/g, '')
  .replace(/[„“”"«»]/g, '"').replace(/[‚‘’']/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').toLowerCase().trim();

// HTML oder XML zu reinem Text. &amp; zuletzt, damit "&amp;lt;" nicht doppelt entschluesselt wird.
export const htmlText = (html: string) => String(html)
  .replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// Nach ganzen Saetzen kuerzen, nie mitten im Satz: ein abgeschnittener Satz saehe aus wie eine Aussage.
export const kuerzen = (t: string, max: number) => {
  if (t.length <= max) return t;
  const saetze = t.match(/[^.!?]+[.!?]+/g) ?? [];
  let out = '';
  for (const x of saetze) { if (out.length + x.length > max) break; out += x; }
  return out.trim();
};

// Ein Zitat zaehlt nur, wenn es lang genug ist, um etwas zu belegen, und woertlich im Quelltext steht.
export const ZITAT_MIN = 40, ZITAT_MAX = 400;
export function zitatOk(auszug: unknown, quelltext: string): auszug is string {
  if (typeof auszug !== 'string') return false;
  const z = norm(auszug);
  return z.length >= ZITAT_MIN && z.length <= ZITAT_MAX && z.split(' ').length >= 6 && norm(quelltext).includes(z);
}

// Steht ein Wort (etwa der Nachname) hoechstens `abstand` Zeichen vor oder nach dem Zitat? Fuer Webseiten: ein Zitat, das
// irgendwo auf der Seite steht, stammt nicht automatisch von der Person (Navigation, Kommentare, Gegenstimmen).
export function naheBei(auszug: string, quelltext: string, wort: string, abstand: number): boolean {
  const t = norm(quelltext), z = norm(auszug), w = norm(wort);
  if (!w) return false;
  for (let i = t.indexOf(z); i >= 0; i = t.indexOf(z, i + 1)) {
    if (t.slice(Math.max(0, i - abstand), i + z.length + abstand).includes(w)) return true;
  }
  return false;
}
