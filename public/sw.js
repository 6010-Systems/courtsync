self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    const fallback = {
        title: 'CourtSync',
        body: 'You have a new notification.',
        data: { url: '/player/bookings' },
    };
    let payload = fallback;

    try {
        if (event.data) {
            payload = { ...fallback, ...event.data.json() };
        }
    } catch (error) {
        payload = fallback;
    }

    const title = payload.title || fallback.title;
    const targetUrl = payload.data?.url || fallback.data.url;

    event.waitUntil(self.registration.showNotification(title, {
        body: payload.body || fallback.body,
        icon: new URL(payload.icon || '/assets/ball.png', self.location.origin).href,
        tag: payload.tag || 'courtsync',
        renotify: true,
        requireInteraction: true,
        data: { url: targetUrl },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const target = new URL(event.notification.data?.url || '/player/bookings', self.location.origin);

    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
            if (new URL(client.url).pathname === target.pathname && 'focus' in client) {
                return client.focus();
            }
        }

        if (self.clients.openWindow) {
            return self.clients.openWindow(target.href);
        }
    }));
});
