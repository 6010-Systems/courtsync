# Notification & PWA Deployment Notes

CourtSync now delivers **real background Web Push** (service worker + VAPID) and is
installable as a PWA. Notifications are shown by the OS even when the tab is hidden,
the browser is closed, or the phone is locked — subject to the platform rules below.

This guide covers deploying and verifying that feature. For the base server setup see
[vps-installation.md](vps-installation.md).

## What the feature includes

- `public/sw.js` — service worker: receives pushes, shows notifications, handles clicks,
  re-subscribes on `pushsubscriptionchange`, and serves an offline fallback page.
- `public/manifest.webmanifest` + `public/icons/*` — PWA install metadata and icons.
- `resources/js/app.jsx` — registers `/sw.js` on every page load.
- `resources/js/Components/PageHeader.jsx` — push permission UI (bell menu), iOS handling,
  and subscription re-sync. Foreground `new Notification()` popups were removed; OS
  notifications now come only from the service worker.
- `resources/js/Components/InstallPwaPrompt.jsx` — "Install app" prompt (Android/desktop
  native prompt, iOS "Add to Home Screen" instructions).
- `GET /push-subscriptions/vapid-public-key` — used by the service worker to re-subscribe.
- Existing `POST/DELETE /push-subscriptions` endpoints store one subscription per device.

Delivery path: Laravel queued notification → `WebPushChannel` → browser push service →
service worker → OS notification. **No page needs to be open.**

## 1. Requirements

| Requirement | Notes |
|---|---|
| **HTTPS** | Mandatory for service workers/push. `http://localhost` and `127.0.0.1` are the only exceptions (desktop of that machine only). |
| PHP 8.3+ with `openssl` | VAPID JWT signing. Verify with `php -m \| grep openssl`. |
| Queue worker | Notifications implement `ShouldQueueAfterCommit` and `QUEUE_CONNECTION=database`. Without a running `queue:work` process, no push is sent. |
| Stable VAPID keys | Changing them invalidates every existing subscription. |

## 2. Environment variables

Add these to the production `.env` (they already exist in `.env.example` as placeholders):

```env
VAPID_SUBJECT=https://yourdomain.com
VAPID_PUBLIC_KEY=REPLACE_WITH_PUBLIC_KEY
VAPID_PRIVATE_KEY=REPLACE_WITH_PRIVATE_KEY
```

`VAPID_SUBJECT` must be a `https://` URL or a `mailto:` address.

### Generating the keys

On a healthy PHP install:

```bash
php artisan webpush:vapid          # writes VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY to .env
```

If the command fails with `RuntimeException: Unable to create the key` (PHP CLI without a
usable OpenSSL EC config, common on some Windows builds), generate standard P-256 keys with
Node instead and paste them into `.env`:

```bash
node -e "const c=require('crypto');const e=c.createECDH('prime256v1');e.generateKeys();console.log('VAPID_PUBLIC_KEY='+e.getPublicKey().toString('base64url'));console.log('VAPID_PRIVATE_KEY='+e.getPrivateKey().toString('base64url'))"
```

Both formats are compatible with `minishlink/web-push` v11. After editing `.env`:

```bash
php artisan config:clear
php artisan config:cache      # production
```

**Never rotate these keys once devices have subscribed.** If you must, every user has to
re-enable notifications.

## 3. Deploy steps

```bash
cd /var/www/courtsync
git pull origin main
composer install --optimize-autoloader --no-dev
npm install
npm run build                      # ships manifest, icons and new JS
php artisan migrate --force        # creates facility_billings etc.; push_subscriptions already exists
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo supervisorctl restart courtsync-worker:*
```

Notes:

- `composer install` is required — `minishlink/web-push` v11 and
  `laravel-notification-channels/webpush` v13 are already in `composer.lock`.
- `public/icons/` and `public/manifest.webmanifest` must be deployed with the release.
- `public/sw.js` is served from the web root and scripted to `skipWaiting()` /
  `clients.claim()`, so it activates on the next page load without a version bump.

### Local development

- `127.0.0.1` and `localhost` are secure contexts on that machine; a phone hitting
  `http://192.168.x.x:8000` is **not**, so use an HTTPS tunnel for on-device testing.
- After editing `.env`, run `php artisan config:clear` (add `config:cache` on production).
- After JS/SW changes, run `npm run build` (or `npm run dev`), then hard refresh the browser.

## 4. Server configuration (Nginx)

Laravel's `public/` is already the Nginx root, so `sw.js`, `manifest.webmanifest` and
`icons/` are served as static files. Two small additions are recommended.

Serve the manifest with the correct MIME type:

```nginx
location = /manifest.webmanifest {
    default_type application/manifest+json;
    add_header Cache-Control "public, max-age=3600";
}
```

Prevent an aggressively cached service worker (so new pushes/behaviour roll out quickly):

```nginx
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Service-Worker-Allowed "/";
}
```

Apply and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Make sure your existing `location ~ /\.(?!well-known).* { deny all; }` block does not
interfere — `sw.js` and `manifest.webmanifest` are not dotfiles, so they are fine.

## 5. Post-deployment verification

### Static assets

```bash
curl -I https://yourdomain.com/manifest.webmanifest   # 200 application/manifest+json
curl -I https://yourdomain.com/sw.js                   # 200 application/javascript
curl -I https://yourdomain.com/icons/icon-192.png      # 200 image/png
```

### VAPID configuration

```bash
php artisan config:show webpush
```

`vapid.subject`, `vapid.public_key` and `vapid.private_key` must all be populated.

### Browser checks (desktop Chrome)

1. DevTools → **Application → Manifest**: no installability errors, icons resolved.
2. **Application → Service Workers**: `/sw.js` is *activated*.
3. **Application → Push**: send a test payload; a notification should appear immediately.
4. In the app: bell icon → **Enable notifications** → allow the browser prompt.
5. Confirm a row exists:

```sql
SELECT COUNT(*) FROM push_subscriptions;
```

6. Close the browser (or leave the tab hidden), trigger a booking notification, and
   confirm the OS shows it.

### Mobile checks

- **Android Chrome:** open the site over HTTPS → bell → *Enable notifications* → allow.
  Close Chrome, trigger a notification, confirm delivery in the notification tray.
- **iPhone/iPad (iOS/iPadOS 16.4+):** Share → **Add to Home Screen**, open the installed
  app, bell → *Enable notifications*. A normal Safari tab cannot subscribe — the app shows
  install instructions instead of the button.
- Check with `https://` only. A phone opening `http://192.168.x.x:8000` is not a secure
  context, so service worker registration fails; use the real domain or an HTTPS tunnel
  (`ngrok`, `cloudflared`).

## 6. Platform support

| Platform | Background push | Requirements |
|---|---|---|
| Android Chrome / Edge / Firefox | Yes | HTTPS, permission granted; installing the PWA is optional |
| iOS / iPadOS 16.4+ | Yes | Site must be **installed to the Home Screen** (standalone). A Safari tab cannot subscribe. |
| iOS / iPadOS < 16.4 | No | Web Push is not supported |
| Desktop Chrome / Edge / Firefox | Yes | Browser allowed to run background processes |
| Desktop Safari 16.4+ | Yes | Permission granted |
| Any non-HTTPS origin (except localhost) | No | Secure context is required |

Delivery timing is best effort. Aggressive battery optimization (Xiaomi, Oppo, Vivo,
Huawei, Samsung "sleeping apps") can delay notifications until the app is opened again;
ask users to exempt the browser/installed app if that matters.

## 7. How pushes are dispatched

- `App\Notifications\BookingRequested` → facility owner/staff.
- `App\Notifications\BookingConfirmed` → player.
- Both implement `ShouldQueueAfterCommit` and use `['database', WebPushChannel::class]`.
- A running queue worker is mandatory (`QUEUE_CONNECTION=database`); see §15 of
  [vps-installation.md](vps-installation.md) for the Supervisor config.
- Each device gets its own row in `push_subscriptions` (unique `endpoint`). Re-subscribing
  updates the existing row; disabling notifications deletes it.
- The service worker re-registers a rotated subscription automatically via
  `pushsubscriptionchange`, and the app re-syncs at most once every 6 hours.

After changing any notification-related PHP config or code, restart the worker:

```bash
sudo supervisorctl restart courtsync-worker:*
php artisan queue:clear        # optional: drop stale queued jobs during a bad deploy
```

> **Important:** a `queue:work` process keeps the configuration it booted with. If the
> worker was started **before** the `VAPID_*` values were added (or before any config
> change), it keeps sending without VAPID auth — the push service rejects it with 401 and
> the failure is silent (no failed job). Always restart the worker after updating `.env`.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| "Enable notifications" is disabled | `VAPID_PUBLIC_KEY` missing or config cache stale | Set `.env`, run `php artisan config:clear && php artisan config:cache` |
| Notifications only appear while the page is open | Browser still running an old cached bundle (previous `new Notification()` code) | `npm run build`, deploy, hard refresh; confirm `/sw.js` is activated |
| Nothing is delivered when the page/browser is closed | Queue worker not running, permission denied, or no `push_subscriptions` rows | `sudo supervisorctl status`, check `storage/logs/worker.log`, re-enable in the bell menu |
| Works on desktop but not Android | Old bundle, or site opened over HTTP / LAN IP | HTTPS only; update service worker; hard refresh |
| iPhone has no enable button | Safari tab (not installed) or iOS < 16.4 | Add to Home Screen (iOS 16.4+), then enable inside the installed app |
| `GET /sw.js` returns 404 | `public/sw.js` not deployed or Nginx root wrong | Deploy the file, check Nginx `root` |
| Manifest not recognised in DevTools | Wrong MIME or 404 | Apply the `default_type` block in §4, `curl -I` to confirm |
| `POST /push-subscriptions` returns 401/419 | Session expired or CSRF mismatch | Log in again and re-enable notifications |
| Delayed or missing notifications on a phone | OEM battery optimization / data saver | Exempt the browser or installed PWA from battery restrictions |

Useful diagnostics:

```bash
php artisan queue:failed            # failed notification jobs
tail -f storage/logs/worker.log     # webpush delivery errors
php artisan tinker --execute 'dump(\NotificationChannels\WebPush\PushSubscription::count());'
```

## 9. Rollback

1. Redeploy the previous release (`git checkout <previous-tag>` + repeat §3) and
   `sudo supervisorctl restart courtsync-worker:*`.
2. If the rollback removes `sw.js`/manifest, run `npm run build` and clear caches:
   `php artisan optimize:clear`.
3. Existing `push_subscriptions` rows remain valid **as long as the VAPID keys stay the
   same** — no database rollback is required.
4. For testing after a rollback, open DevTools → Application → Service Workers →
   *Unregister*, then hard refresh; otherwise the old worker keeps controlling the page.

## 10. Files added / changed by this feature

```
public/sw.js                              # rewritten: push, fetch, click, resubscribe
public/manifest.webmanifest               # new
public/icons/icon-192.png                 # new
public/icons/icon-512.png                 # new
public/icons/maskable-512.png             # new
public/icons/apple-touch-icon.png         # new
public/icons/favicon-32.png               # new
resources/views/app.blade.php             # manifest/theme/apple meta tags
resources/js/app.jsx                      # registers /sw.js on load
resources/js/Components/PageHeader.jsx    # push UI, iOS handling, subscription sync
resources/js/Components/InstallPwaPrompt.jsx  # new install prompt
app/Http/Controllers/PushSubscriptionController.php  # vapidPublicKey()
routes/web.php                            # GET /push-subscriptions/vapid-public-key
```

No new database tables were added for notifications — `push_subscriptions` already existed.
