// OREL PLAY service worker — push notifications only.
// Intentionally lean: no fetch handler, no caching, no offline page. The app is
// online-first and we only want this SW for Web Push delivery so a phone with
// the screen off still rings.

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let p = {};
  try {
    p = event.data.json();
  } catch {
    /* not JSON — ignore, fall through to defaults */
  }
  const title = p.title || 'אורל פליי';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: p.body,
      tag: p.tag,
      icon: p.icon || '/logo.png',
      badge: p.badge || '/logo.png',
      data: { url: p.url || '/' },
      vibrate: [120, 60, 120],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
