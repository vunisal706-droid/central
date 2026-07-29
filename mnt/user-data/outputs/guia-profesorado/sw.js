const CACHE = 'capiguia-v3';
const ASSETS = ['./', './index.html', './manifest.json',
                './icon-192.png', './icon-512.png', './favicon.png',
                './Como_trabajamos_lectura_y_problemas.docx',
                './Atencion_a_la_diversidad_en_el_aula.docx'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// El HTML va primero a la red, así una guía actualizada llega sin borrar caché.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const esDoc = e.request.mode === 'navigate';
  if (esDoc) {
    e.respondWith(
      fetch(e.request)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
