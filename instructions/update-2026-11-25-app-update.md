# Update 2026-11-25 — Application Changes (Auth Error Handling & Hardening)

**Status:** shipped to local and production.
**Scope:** application code only - no migrations, no new packages, no breaking API changes.
**Related:** [update-2026-11-25-google-auth.md](update-2026-11-25-google-auth.md) (OAuth configuration),
[google-oauth-setup.md](google-oauth-setup.md) (how-to).

---

## 1. Why

While wiring up player Google sign-in, three defects surfaced:

1. **Failures were invisible.** `HandleInertiaRequests` shared no flash data, and the login
   pages only rendered `status`. A failed Google attempt silently dropped the user back on the
   login page (or the home page), with no explanation.
2. **Security downgrade in production.** A missing/mismatched OAuth `state` fell back to a
   **stateless** request in every environment, silently disabling the CSRF protection that the
   `state` parameter exists to provide.
3. **Open redirect.** After a successful player sign-in the controller redirected to
   `'/' . $slug` using the raw session value. A crafted start URL such as
   `?facility=//evil.com` produced `Location: ///evil.com`, which browsers resolve to
   `http://evil.com/` (verified with WHATWG URL parsing) - i.e. an off-site redirect after a
   genuine sign-in.

All three are fixed, and the OAuth test suite was rewritten so regressions are caught without
real Google credentials.

---

## 2. Changes by file

### 2.1 `app/Http/Middleware/HandleInertiaRequests.php` - share flash data

```php
'auth' => [...],
'flash' => [
    'success' => $request->session()->get('success'),
    'error' => $request->session()->get('error'),
    'status' => $request->session()->get('status'),
],
'vapidPublicKey' => config('webpush.vapid.public_key'),
```

Every Inertia page now receives `flash` as a prop (type already existed in
`resources/js/types/page-props.d.ts`). `Admin/Owners.jsx` and `Admin/Staff.jsx` already read
`usePage().props.flash`, which until now was always `undefined`.

### 2.2 `app/Http/Controllers/Auth/SocialiteController.php`

**a) Provider calls extracted** into `retrieveGoogleUser()` / `socialiteUser()` so the
state-check policy lives in one place.

**b) `state` failures are only tolerated locally**

```php
try {
    return $this->socialiteUser($config);
} catch (InvalidStateException $e) {
    if (! app()->environment('local')) {
        throw $e;                       // production: fail closed
    }

    return $this->socialiteUser($config, stateless: true);   // local dev only
}
```

**c) New `authenticationFailed()`**

```php
private function authenticationFailed(string $tenant, \Exception $e): RedirectResponse
{
    report($e);

    $message = app()->environment('local')
        ? 'Google sign-in failed: '.$e->getMessage()
        : 'We could not sign you in with Google. Please try again.';

    if ($tenant === 'player' && $slug = session()->pull('auth_facility_slug')) {
        $facility = Facility::where('slug', $slug)->first();

        if ($facility) {
            return redirect("/{$facility->slug}/login")->with('error', $message);
        }
    }

    return redirect('/login')->with('error', $message);
}
```

The exception is always logged (`report`) and the raw message is only shown in `local`, so
production no longer leaks provider/internal details. Players are returned to **their
facility** login (resolved against `facilities.slug`), everyone else to `/login`.

**d) Open redirect closed** on the success path:

```php
if ($facility) {
    $user->joinedFacilities()->syncWithoutDetaching([$facility->id]);

    return redirect('/'.$facility->slug)      // validated slug, not the raw input
        ->withCookie(cookie('last_login_method', 'google', 60 * 24 * 365));
}

return redirect('/dashboard')->withCookie(...);
```

An unknown or malicious `facility` value can no longer influence the redirect target.

Verified before/after: `redirect('/'.'//evil.com')->getTargetUrl()` returned `///evil.com`
(browsers normalise that to `http://evil.com/`). The new code redirects to the facility only
when a row with that exact slug exists, and otherwise sends the player to `/dashboard`.

### 2.3 Login pages - render the error

| File | Change |
|---|---|
| `resources/js/Pages/Player/Auth/Login.jsx` | accepts a `flash` prop; red banner above the existing status banner |
| `resources/js/Pages/Auth/Login.jsx` | same, wrapped in the existing `AnimatePresence` + `motion` block |

```jsx
{flash?.error && (
    <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200
                    bg-red-50 p-3.5 text-xs font-semibold text-red-700">
        <XCircle className="h-4 w-4 shrink-0" />
        <span>{flash.error}</span>
    </div>
)}
```

`XCircle` was already imported in both files; the styling matches the existing `status`
banner. No other props changed, so existing pages are unaffected.

### 2.4 `tests/Feature/Auth/SocialiteRedirectTest.php` - rewritten

Previously the tests passed with **empty** credentials, because `assertRedirect()` accepts the
`back()` redirect from the "not configured" branch - they could never catch a broken setup.
The suite now injects fake credentials in `setUp()` and asserts the real redirect:

```php
foreach (['player', 'owner', 'staff'] as $tenant) {
    config([
        "services.google_{$tenant}.client_id" => "test-{$tenant}-client-id",
        "services.google_{$tenant}.client_secret" => "test-{$tenant}-client-secret",
        "services.google_{$tenant}.redirect" => "/auth/google/{$tenant}/callback",
    ]);
}
```

| Test | Asserts |
|---|---|
| `test_player_google_redirect_sends_the_player_to_google_with_the_expected_parameters` | URL starts `https://accounts.google.com/o/oauth2/auth?`, contains `client_id`, `state`, `prompt=select_account` and the exact `redirect_uri` |
| `..._owner_google_redirect_uses_the_owner_client_and_callback` | owner client id + `/auth/google/owner/callback` |
| `..._staff_google_redirect_uses_the_staff_client_and_callback` | staff client id + `/auth/google/staff/callback` |
| `test_player_redirect_remembers_the_facility_for_the_callback` | `auth_facility_slug` stored in session |
| `test_redirect_returns_a_visible_error_when_credentials_are_missing` | redirects back + `error` flash |
| `test_unknown_tenant_is_not_found` | `404` for `tenant=admin` |
| `test_flash_errors_are_shared_with_inertia_pages` | `flash.error` present in the Inertia payload |

---

## 3. Behaviour changes

| Scenario | Before | After |
|---|---|---|
| Google not configured | silent bounce to the login page / home | red banner *"Google authentication is not yet configured on this server."* |
| Callback fails (invalid_client, TLS, etc.) | bounced to `/login`, message dropped | logged via `report()`, banner on the correct login page |
| Player callback failure | sent to the **owner** portal | sent back to **their facility** login |
| Wrong/expired OAuth `state` | silently retried statelessly **in production** | production fails closed; retry only when `APP_ENV=local` |
| `?facility=//evil.com` after sign-in | protocol-relative redirect off-site | ignored unless the slug exists; falls back to `/dashboard` |
| `usePage().props.flash` | always `undefined` | populated with `success`, `error`, `status` |

---

## 4. Deploying this update

No migrations, no `composer` change. Upload the four PHP/JS files and a fresh build:

```bash
cd /var/www/courtsync
php artisan optimize:clear
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo systemctl reload php8.3-fpm      # OPcache
npm run build                          # or upload public/build/**
```

`app.blade.php` registers a **per-page Vite entry**
(`@vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])`), so any
missing page in `public/build/manifest.json` makes that page throw a `ViteException` (HTTP
500). Always ship the build together with the JSX.

---

## 5. Verification performed

| Check | Result |
|---|---|
| `vendor/bin/pint --dirty` | formatted (`no_extra_blank_lines`, `single_blank_line_at_eof`) |
| `php artisan test tests/Feature/Auth/SocialiteRedirectTest.php` | **7 passed** (30 assertions) |
| `php artisan test` (full suite) | **243 passed** (1,525 assertions) |
| `npm run build` | built successfully |
| Manual local check | `GET /auth/google/player?facility=SLUG` with the login page as referer returns `302` to `/SLUG/login`, and the next page render contains the error text + `flash` prop |

---

## 6. Risk and rollback

- **Risk:** low. No schema changes, no dependency changes, no route renames. The only
  user-visible difference is that errors are now displayed and players are returned to their
  facility login.
- **Rollback:** restore the four files from git (`git checkout -- <paths>`) and re-upload a
  matching `public/build`. The OAuth configuration does not need to change.

---

## 7. Files touched

```
M app/Http/Controllers/Auth/SocialiteController.php
M app/Http/Middleware/HandleInertiaRequests.php
M resources/js/Pages/Auth/Login.jsx
M resources/js/Pages/Player/Auth/Login.jsx
M tests/Feature/Auth/SocialiteRedirectTest.php
```

Documentation added the same day:

```
?? instructions/google-oauth-setup.md          (player OAuth how-to)
?? instructions/env-production.example         (production .env template, no secrets)
?? instructions/update-2026-11-25-google-auth.md
?? instructions/update-2026-11-25-app-update.md
```
