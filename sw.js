const CACHE_NAME = 'capitoolsappciones-v1';
const urlsToCache = [
  '/central/',
  '/central/index.html',
  '/central/manifest.json'
];

// Instalación del SW
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del SW
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - estrategia Network First con fallback a caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, la guardamos en caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos obtenerlo de la caché
        return caches.match(event.request);
      })
  );
});
```

**📋 Instrucciones para crear los iconos:**

Necesitas crear iconos en estos tamaños a partir de tu logo:
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

Puedes usar herramientas online como:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

**📁 Estructura de archivos en tu repositorio:**
```
vunisal706-droid/central/
├── index.html (el HTML que te he dado)
├── manifest.json
├── sw.js
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png
├── icon-384.png
└── icon-512.png