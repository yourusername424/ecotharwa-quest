const CACHE = 'ecotharwa-v6';
const ASSETS = [
  '/ecotharwa-quest/',
  '/ecotharwa-quest/index.html',
  '/ecotharwa-quest/manifest.json'
];

// Install: cache assets and activate immediately
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Skip non-GET, chrome-extension, Supabase API, and Anthropic API requests
  if (
    e.request.method !== 'GET' ||
    url.startsWith('chrome-extension') ||
    url.includes('supabase.co') ||
    url.includes('anthropic.com')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Only cache valid responses
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Tell all open tabs to reload when new SW takes over
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
