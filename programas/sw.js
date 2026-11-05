// versión automática: b2611051917
// Programas del cole se ha mudado a https://vunisal706-droid.github.io/programas/
// Este service worker borra la versión antigua y lleva a la nueva dirección.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('programas-')) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate('https://vunisal706-droid.github.io/programas/');
})()));
