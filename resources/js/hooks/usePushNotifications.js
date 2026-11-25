import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/**
 * Shared Web Push store.
 *
 * One module-level store (instead of per-component state) keeps the bell in
 * PageHeader, the opt-in banner and the install prompt in sync, and prevents
 * two `pushManager.subscribe()` calls racing each other.
 */

const DISMISS_KEY = 'courtsync-push-prompt-dismissed';
const SYNC_KEY = 'courtsync-push-synced-at';
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

const initialState = {
    status: 'unknown',
    permission: 'default',
    endpoint: null,
    dismissed: false,
};

let state = initialState;
const listeners = new Set();
let initialised = false;
let vapidKey = null;

function publish(patch) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
}

function isIosDevice() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneApp() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function currentPermission() {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
}

function supportsPush() {
    return typeof window !== 'undefined'
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && Boolean(vapidKey);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

function readStored(key) {
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStored(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        // Private mode / storage disabled - the prompt simply reappears.
    }
}

async function serviceWorkerRegistration() {
    return navigator.serviceWorker.register('/sw.js');
}

async function persistSubscription(subscription) {
    const payload = subscription.toJSON();

    await window.axios.post(route('push-subscriptions.store'), {
        endpoint: payload.endpoint,
        keys: payload.keys,
        content_encoding: 'aes128gcm',
    });
}

/**
 * Status we can resolve synchronously from platform + permission.
 */
function staticStatus() {
    if (isIosDevice() && !isStandaloneApp()) {
        return 'ios-install';
    }

    if (!supportsPush()) {
        return 'unsupported';
    }

    if (currentPermission() === 'denied') {
        return 'denied';
    }

    return 'default';
}

/**
 * Ensure the browser has a subscription AND the server knows about it.
 */
async function syncSubscription() {
    const registration = await serviceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();
    let createdNow = false;

    // Permission was granted earlier (or in another tab) but the browser lost
    // the subscription: recreate it silently so background alerts keep working.
    if (!subscription && currentPermission() === 'granted') {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        createdNow = true;
    }

    if (!subscription) {
        publish({ status: 'default', permission: currentPermission(), endpoint: null });

        return;
    }

    let lastSyncedAt = 0;

    try {
        lastSyncedAt = Number(window.sessionStorage.getItem(SYNC_KEY) || 0);
    } catch (error) {
        lastSyncedAt = 0;
    }

    if (createdNow || !lastSyncedAt || Date.now() - lastSyncedAt > SYNC_INTERVAL_MS) {
        await persistSubscription(subscription);

        try {
            window.sessionStorage.setItem(SYNC_KEY, String(Date.now()));
        } catch (error) {
            // Ignore storage failures.
        }
    }

    publish({ status: 'enabled', permission: currentPermission(), endpoint: subscription.endpoint });
}

async function boot() {
    const status = staticStatus();

    publish({ status, permission: currentPermission(), dismissed: readStored(DISMISS_KEY) === '1' });

    if (status !== 'default') {
        return;
    }

    try {
        await syncSubscription();
    } catch (error) {
        // Keep the opt-in banner available; retry is one tap away.
        publish({ status: 'default', permission: currentPermission() });
    }
}

async function enable() {
    if (!supportsPush() || (isIosDevice() && !isStandaloneApp())) {
        publish({ status: staticStatus(), permission: currentPermission() });

        return false;
    }

    publish({ status: 'saving', permission: currentPermission() });

    try {
        const permission = await Notification.requestPermission();

        if (permission !== 'granted') {
            publish({ status: permission === 'denied' ? 'denied' : 'default', permission });

            return false;
        }

        await syncSubscription();
        writeStored(DISMISS_KEY, '1');

        return state.status === 'enabled';
    } catch (error) {
        publish({ status: 'error', permission: currentPermission() });

        return false;
    }
}

async function disable() {
    publish({ status: 'saving' });

    try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const subscription = await registration?.pushManager.getSubscription();

        if (subscription) {
            await window.axios.delete(route('push-subscriptions.destroy'), {
                data: { endpoint: subscription.endpoint },
            });
            await subscription.unsubscribe();
        }

        publish({ status: 'default', endpoint: null });
    } catch (error) {
        publish({ status: 'error' });
    }
}

function dismiss() {
    writeStored(DISMISS_KEY, '1');
    publish({ dismissed: true });
}

function refresh() {
    const permission = currentPermission();

    if (state.status === 'enabled' && permission !== 'granted') {
        publish({ status: permission === 'denied' ? 'denied' : 'default', permission, endpoint: null });

        return;
    }

    if (state.status === 'default' && permission === 'granted') {
        syncSubscription().catch(() => publish({ status: 'default', permission }));
    }
}

/**
 * @returns {{
 *   status: string,
 *   permission: string,
 *   endpoint: string|null,
 *   promptVisible: boolean,
 *   enable: () => Promise<boolean>,
 *   disable: () => Promise<void>,
 *   dismiss: () => void,
 *   refresh: () => void,
 * }}
 */
export default function usePushNotifications() {
    const { vapidPublicKey } = usePage().props;
    const [snapshot, setSnapshot] = useState(state);

    useEffect(() => {
        listeners.add(setSnapshot);
        setSnapshot(state);

        vapidKey = vapidPublicKey || null;

        if (!vapidKey) {
            publish({ status: 'unsupported' });
        } else if (!initialised) {
            initialised = true;
            boot();
        } else if (state.status === 'unknown') {
            boot();
        }

        return () => {
            listeners.delete(setSnapshot);
        };
    }, [vapidPublicKey]);

    // Browsers only expose permission changes on focus/visibility, so re-read
    // there - the user may have allowed notifications in site settings.
    useEffect(() => {
        const onFocus = () => {
            if (document.visibilityState === 'visible') {
                refresh();
            }
        };

        document.addEventListener('visibilitychange', onFocus);
        window.addEventListener('focus', onFocus);

        return () => {
            document.removeEventListener('visibilitychange', onFocus);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    const promptVisible = !snapshot.dismissed
        && ['default', 'error', 'saving', 'ios-install', 'denied'].includes(snapshot.status);

    return {
        ...snapshot,
        promptVisible,
        enable,
        disable,
        dismiss,
        refresh,
    };
}
