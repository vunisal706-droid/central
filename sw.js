const CACHE_NAME = 'capitoolsapp-v3';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar: cachear recursos y activar de inmediato
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activar: borrar caches antiguas y tomar el control ya
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch:
//  - HTML / navegación -> RED PRIMERO (así siempre ves las tarjetas nuevas)
//  - resto -> cache primero
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const esHTML = req.mode === 'navigate' ||
                 (req.headers.get('accept') || '').includes('text/html');

  if (esHTML) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', copia));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
