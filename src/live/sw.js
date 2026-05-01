/**
 * sw.js — Service Worker do Live Mode
 * Estratégia: stale-while-revalidate para JSON de dados.
 * Zero dependências.
 */

const CACHE_VERSION = 'renderit-data-v1';
const JSON_EXT = /\.json(\?.*)?$/i;

// ─── Install: ativa imediatamente sem esperar ─────────────────────────────
self.addEventListener('install', () => {
  self.skipWaiting();
});

// ─── Activate: remove caches de versões antigas ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(deleteOldCaches());
  self.clients.claim();
});

async function deleteOldCaches() {
  const keys = await caches.keys();
  return Promise.all(
    keys
      .filter(k => k.startsWith('renderit-') && k !== CACHE_VERSION)
      .map(k => caches.delete(k))
  );
}

// ─── Fetch: stale-while-revalidate apenas para JSON ──────────────────────
self.addEventListener('fetch', (event) => {
  if (!JSON_EXT.test(event.request.url)) return;
  event.respondWith(staleWhileRevalidate(event.request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const fetchPromise = fetchAndCache(cache, request);

  if (cached) {
    // Entrega o cache instantaneamente; atualiza em background
    fetchPromise.catch(() => {}); // evitar unhandled rejection
    return cached;
  }

  // Sem cache: aguarda o fetch
  return fetchPromise;
}

async function fetchAndCache(cache, request) {
  const response = await fetch(request.clone());
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}
