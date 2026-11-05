const CACHE='podcastvideo-v7-b2611051921';
const FILES=['./','index.html','app.css','app.js','mp4-muxer.js','capitulin.js','lame.min.js','logo-final.mp4','logo-podcast.mp4','intro-podcastulaciones.mp4','LOGO.jpg','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin)&&!e.request.url.includes('fonts.g'))return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();if(r.ok)caches.open(CACHE).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));});
