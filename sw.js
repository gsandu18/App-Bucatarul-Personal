// sw.js — demo simplu (ține SW activ; poți adăuga ulterior cache/logic)
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// Ex: handler opțional pentru notificări declanșate din pagină
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/')); // deschide home la tap
});
