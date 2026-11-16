const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CourtSync - Offline</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#101F1A;color:#F5F2EA;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px}main{max-width:360px}h1{color:#D6FF3F;font-size:24px;margin:0 0 12px}p{margin:0 0 20px;opacity:.75;line-height:1.5}a{display:inline-block;background:#D6FF3F;color:#101F1A;padding:12px 20px;border-radius:12px;font-weight:700;text-decoration:none}</style></head><body><main><h1>You're offline</h1><p>CourtSync needs a connection to load bookings. Reconnect and try again.</p><a href="/">Retry</a></main></body></html>`;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = self.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

async function readXsrfToken() {
    try {
        if (!self.cookieStore || typeof self.cookieStore.get !== 'function') {
            return null;
        }

        const cookie = await self.cookieStore.get('XSRF-TOKEN');

        return cookie ? decodeURIComponent(cookie.value) : null;
    } catch (error) {
        return null;
    }
}

async function saveSubscription(subscription) {
    const token = await readXsrfToken();
    const payload = subscription.toJSON();

    await fetch('/push-subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        body: JSON.stringify({
            endpoint: payload.endpoint,
            keys: payload.keys,
            content_encoding: 'aes128gcm',
        }),
    });
}

self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Network-only pass-through with an offline fallback for navigations.
// Pages are intentionally not cached so Inertia never serves stale HTML.
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    if (new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request).catch(() => {
            if (request.mode === 'navigate') {
                return new Response(OFFLINE_HTML, {
                    status: 200,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }

            return Response.error();
        }),
    );
});

self.addEventListener('push', (event) => {
    const fallback = {
        title: 'CourtSync',
        body: 'You have a new notification.',
        data: { url: '/' },
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
        icon: new URL(payload.icon || '/icons/icon-192.png', self.location.origin).href,
        badge: new URL('/icons/favicon-32.png', self.location.origin).href,
        tag: payload.tag || 'courtsync',
        renotify: true,
        requireInteraction: false,
        vibrate: [120, 60, 120],
        data: { url: targetUrl },
    }));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const target = new URL(event.notification.data?.url || '/', self.location.origin);

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

self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil((async () => {
        try {
            const response = await fetch('/push-subscriptions/vapid-public-key', {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });

            if (!response.ok) {
                return;
            }

            const data = await response.json();

            if (!data.public_key) {
                return;
            }

            const subscription = await self.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(data.public_key),
            });

            await saveSubscription(subscription);
        } catch (error) {
            // The next app load re-syncs the subscription.
        }
    })());
});

