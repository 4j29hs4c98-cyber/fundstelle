// sw.js — offline support. RELEASE RULE: bump VERSION on every release, and list every app file in SHELL
// (scripts/check-release.mjs verifies both). A missing file here breaks offline mode for everyone.
const VERSION = 'politik-v3';
const SHELL = ['./', './index.html', './styles.css', './app.js', './core.js', './db.js', './sync.js', './i18n.js', './render.js', './actions.js',
  './content.js', './katalog.js', './profil.js', './views/teile.js', './views/start.js', './views/themen.js', './views/frage.js', './views/parteien.js', './views/pruefen.js',
  './views/auswahl.js', './views/settings.js', './views/vergleich.js', './views/programm.js', './views/wahlen.js',
  './config.js', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) { // pinned libraries + fonts: cache first
    e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(r => { c.put(req, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // app files: network first (updates arrive right away), cache when offline
  e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
    .catch(async () => (await caches.match(req, { ignoreSearch: true })) || caches.match('./index.html')));
});
