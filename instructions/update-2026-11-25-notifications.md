# Update 2026-11-25 — Notifications Everywhere (all pages, all devices)

**Status:** implemented, built and tested (245 tests / 1,559 assertions passing).
**Scope:** Web Push + in-app notification centre. No migrations, no new packages.
**Related:** [update-2026-11-25-app-update.md](update-2026-11-25-app-update.md),
[notification-deployment.md](notification-deployment.md) (server guide).

---

## 1. What changed

| Area | Before | After |
|---|---|---|
| Push opt-in | buried inside the bell menu on 5 of 14+ pages | **automatic banner** on every authenticated page, for owner, staff and player |
| Pages with live notifications | 5 (owner Dashboard/Bookings, player Dashboard/Bookings, Profile) | **all authenticated pages** (bell defaults to live data) |
| Bell badge | hardcoded "2" plus three fake entries on pages without the flag | real unread count, seeded from the server on first paint |
| Push state | duplicated `useState` per component, races possible | one shared store (`usePushNotifications`) used by bell + banner |
| Permission changes | picked up only after a reload | re-read on `focus` / `visibilitychange` |
| iOS | install instructions in one place, enable button in another | single flow: install -> enable in the same banner |
| Push icon | `/assets/ball.png` (404 on live) | `/icons/icon-192.png` + badge `/icons/favicon-32.png` (both deployed) |
| Installed app start | `/` (platform landing) | `/dashboard` (role-dispatched), orientation `any` |

---

## 2. New files

### `resources/js/hooks/usePushNotifications.js`

A module-level store + hook (single source of truth) exposing:

```js
{ status, permission, endpoint, promptVisible, enable, disable, dismiss, refresh }
```

`status` is one of `unknown | unsupported | ios-install | denied | default | saving | enabled | error`.

Responsibilities:

- registers `/sw.js` and reuses the existing subscription;
- **silently re-subscribes** when permission is already `granted` but the browser lost the subscription;
- POSTs the subscription to `/push-subscriptions` at most once every 6 hours (sessionStorage throttle);
- `enable()` = `Notification.requestPermission()` -> subscribe -> persist (must be a user gesture);
- `disable()` = server delete + `subscription.unsubscribe()`;
- re-evaluates permission on `focus` / `visibilitychange`, so allowing it in browser settings is picked up without a reload;
- keeps state across Inertia page transitions (module store, not component state).

### `resources/js/Components/NotificationPrompt.jsx`

The opt-in banner. Renders only when `promptVisible`:

| Status | Banner |
|---|---|
| `default` / `error` / `saving` | **"Turn on booking alerts"** + Enable button (one tap) |
| `ios-install` | "Install to get alerts on iPhone" + Share -> Add to Home Screen instructions |
| `denied` | "Notifications are blocked" + how to re-allow in site settings |
| `enabled` / `unsupported` | hidden |

Dismissing stores `courtsync-push-prompt-dismissed` in `localStorage`, so the banner does not nag.
Bottom-left on desktop, full width on mobile; `InstallPwaPrompt` is suppressed while it shows so the
two never stack.

---

## 3. Changed files

| File | Change |
|---|---|
| `resources/js/Layouts/AuthenticatedLayout.jsx` | mounts `<NotificationPrompt />`, passes `suppress={push.promptVisible}` to `InstallPwaPrompt` |
| `resources/js/Components/PageHeader.jsx` | uses the hook instead of its own push state; `liveNotifications` defaults to `true`; fake notifications and the hardcoded badge removed; CTA shown in the bell on every page |
| `resources/js/Components/InstallPwaPrompt.jsx` | new `suppress` prop |
| `app/Http/Middleware/HandleInertiaRequests.php` | shares `notifications: { unread_count, has_push_subscription }` (null for guests) |
| `app/Notifications/BookingRequested.php`, `BookingConfirmed.php`, `BookingRescheduled.php` | push `icon` -> `/icons/icon-192.png`, added `badge` -> `/icons/favicon-32.png` |
| `public/manifest.webmanifest` | `start_url: /dashboard`, `orientation: any` |
| `resources/js/types/page-props.d.ts` | typed the shared `notifications` prop |
| `tests/Feature/NotificationControllerTest.php` | 2 new tests (shared props; icons exist in `public/`) |

---

## 4. Important constraint: "auto enable" means auto *prompt*

Browsers do not allow granting notification permission without a user gesture, and a site cannot
re-ask after the user chose **Block**. What is now automatic:

1. the banner appears by itself on any authenticated page (no hunting through the bell);
2. one tap runs permission -> subscribe -> save;
3. subscriptions are created/repaired silently when permission is already granted;
4. permission changes made in browser settings are detected on the next focus.

A genuinely silent grant is impossible on Chrome, Edge, Firefox and Safari.

---

## 5. Server steps still required

These are server/nginx items that code cannot fix - see
[notification-deployment.md](notification-deployment.md) §4 for the exact blocks:

```nginx
location = /manifest.webmanifest {
    default_type application/manifest+json;
    add_header Cache-Control "public, max-age=3600";
}
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Service-Worker-Allowed "/";
}
```
Verified on 2026-11-25: `courtsync.page` still returns `application/octet-stream` for the manifest and
`max-age=315360000` for `sw.js`, so this block is **not applied yet**.

Deploy checklist:

```bash
cd /var/www/courtsync
git pull                     # or upload the changed files
npm ci && npm run build       # REQUIRED - the banner ships in the JS bundle
php artisan optimize:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo systemctl reload php8.3-fpm
sudo supervisorctl restart courtsync-worker:*   # worker keeps the config it booted with
```

`public/assets/ball.png` is **no longer required** by notifications (icons moved to `/icons`).

---

## 6. Verification

**Desktop Chrome** - `DevTools -> Application`
1. Service Workers: `/sw.js` activated.
2. Manifest: no installability errors (proves the nginx MIME block).
3. Push -> *Send test push*: OS notification appears.
4. App: the bottom-left banner appears -> **Enable notifications** -> allow -> the banner disappears
   and the bell menu shows *"Browser notifications are on"*.
5. `SELECT COUNT(*) FROM push_subscriptions;` increases by 1.

**Android Chrome** - log in as a player, enable from the banner, close the browser, book a slot from
another account -> the phone shows "New booking request" (owner) / "Booking confirmed" (player).

**iPhone (iOS 16.4+)** - Safari -> Share -> **Add to Home Screen** -> open the installed app -> the
banner becomes the enable button (a Safari tab shows install instructions instead - expected).

**In-app centre** - the bell now shows real entries and a real unread count on *every* page
(Calendar, Payments, Courts, Admin, etc.), polling every 30 s.

---

## 7. Rollback

Restore the previous `public/build` and the seven JS/PHP files from git, then
`php artisan optimize:clear`. Existing `push_subscriptions` rows stay valid as long as `VAPID_*`
does not change, so users do not need to re-enable anything.
