# Google OAuth Setup — Player Login

Configure **"Continue with Google"** on the facility player pages
(`/{facility}/login` and `/{facility}/register`).

The identical steps cover the owner and staff audiences — you only swap the env prefix and
the callback path (see [§12](#12-other-audiences-owner--staff)).

> **This guide fixes**
> `Google authentication is not yet configured on this server.`
>
> That banner is produced by
> `app/Http/Controllers/Auth/SocialiteController.php` → `redirect()` when
> `services.google_player.client_id` or `client_secret` is empty. Only two things cause it:
>
> 1. `GOOGLE_PLAYER_*` is missing from the server `.env`, or
> 2. `bootstrap/cache/config.php` is stale and still serving the old blank values.
>
> It is now rendered as a red banner on the login page (`flash.error`), so if you see it
> right after editing `.env`, it is almost certainly cause 2.

---

## 1. Scope

| Audience | Pages | Env prefix | Callback path | Status |
|---|---|---|---|---|
| **Player** | `/{facility}/login`, `/{facility}/register` | `GOOGLE_PLAYER_*` | `/auth/google/player/callback` | **configured** |
| Facility owner | `/login`, `/register` | `GOOGLE_OWNER_*` | `/auth/google/owner/callback` | not configured |
| Facility staff | — (no Google button in the UI) | `GOOGLE_STAFF_*` | `/auth/google/staff/callback` | not configured |

The player buttons live in:

- `resources/js/Pages/Player/Auth/Login.jsx` → `/auth/google/player?facility={slug}`
- `resources/js/Pages/Player/Auth/Register.jsx` → `/auth/google/player?facility={slug}`

Leaving `GOOGLE_OWNER_*` / `GOOGLE_STAFF_*` blank is fine: those buttons then show the
"not configured" banner instead of sending anyone to Google.

---

## 2. How the player flow works

| Step | What happens |
|---|---|
| 1 | Player clicks **Continue with Google** → `GET /auth/google/player?facility={slug}` |
| 2 | The controller remembers `facility` in the session as `auth_facility_slug`, loads `config('services.google_player')`, turns a relative `redirect` into an absolute URL with `url()`, and sends the browser to `https://accounts.google.com/o/oauth2/auth?...&prompt=select_account&state=…` |
| 3 | Google returns to `{APP_URL}/auth/google/player/callback?code=…&state=…` |
| 4 | The controller verifies `state`, exchanges the code for the Google profile |
| 5 | Matched by **email**: existing users get `google_id` + `avatar` linked; a new email creates `role = PLAYER` with `status = VERIFIED` |
| 6 | `BANNED` accounts are rejected |
| 7 | The player is attached to the facility (`facility_player`), a `last_login_method=google` cookie is set, and the browser is redirected to `/{facility-slug}` |

Relevant route and config:

```php
// routes/web.php
Route::get('/auth/google/{tenant}', [SocialiteController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/{tenant}/callback', [SocialiteController::class, 'callback'])->name('google.callback');

// config/services.php
'google_player' => [
    'client_id' => env('GOOGLE_PLAYER_CLIENT_ID'),
    'client_secret' => env('GOOGLE_PLAYER_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_PLAYER_REDIRECT_URI', '/auth/google/player/callback'),
],
```

So the **exact** redirect URI sent to Google is:

```text
{APP_URL}/auth/google/player/callback
```

## 3. Step 1 — Create / verify the OAuth client

Open <https://console.cloud.google.com> → **Google Auth Platform**.

### 3.1 Branding (consent screen)

| Field | Value |
|---|---|
| App name | `CourtSync` |
| User support email | your support inbox |
| App logo | optional — uploading one can require verification; skip for now |
| Application home page | `https://YOUR_DOMAIN` |
| Application privacy policy link | `https://YOUR_DOMAIN/privacy` (any public page you own) |
| Application terms of service link | `https://YOUR_DOMAIN/terms` |
| Authorised domains | `YOUR_DOMAIN` — apex host only, no scheme/path/`www.` |
| Developer contact information | your email |

Home page / privacy / ToS are only **required to publish** the app; they are optional
while it stays in *Testing*.

### 3.2 Audience

| Setting | Value | Effect |
|---|---|---|
| User type | `External` | — |
| Publishing status | `Testing` | **only test users can sign in** (cap 100); everyone else gets `Error 403: access_denied` |
| Test users | every Gmail address you test with | required while *Testing* |

To let real players sign in, complete Branding and click **Publish app**. CourtSync only
requests `openid`, `email`, `profile` (non-sensitive), so publishing normally does not
require Google verification.

### 3.3 Client

**Clients → Create client → Web application** (name it e.g. `courtsync_player`).

**Authorised redirect URIs** — add one line per environment, exactly:

```text
https://YOUR_DOMAIN/auth/google/player/callback
http://localhost:8000/auth/google/player/callback
```

**Authorised JavaScript origins** — not needed for this server-side flow. Add
`https://YOUR_DOMAIN` only if you later call Google APIs from the browser.

Copy the **Client ID** and **Client secret** right after creating the client (the secret is
shown once). If it is lost, use **Add secret** on the client page.

Google's rules — the cause of most OAuth errors:

- the URI must match **character for character** (no trailing slash, no typo);
- the scheme must be `https`, **except** for `localhost` / `127.0.0.1`;
- `localhost` and `127.0.0.1` are **different** origins — pick one and use it everywhere;
- a custom local host such as `http://courtsync.test` is **rejected**;
  see [§8](#8-local-development) and the `invalid_request` row in [§10](#10-troubleshooting).

---

## 4. Step 2 — Server `.env`

Only the player keys are needed for this guide. A fully commented production template lives
in [`env-production.example`](env-production.example) — copy values from it, and **never
overwrite the server's live `.env`** (you would lose `APP_KEY` and the VAPID keys).

```env
APP_NAME="CourtSync"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://YOUR_DOMAIN

GOOGLE_PLAYER_CLIENT_ID=1234567890-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_PLAYER_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_PLAYER_REDIRECT_URI="${APP_URL}/auth/google/player/callback"
```

Notes:

- `APP_URL` must be the **exact origin the browser uses** — scheme, host and port. If
  players reach the site at `https://www.example.com`, that must be `APP_URL` too, and the
  Google redirect URI must match.
- `${APP_URL}` is Laravel's `.env` interpolation, so the redirect URI follows `APP_URL`.
  A hard-coded absolute URL also works.
- Leave `GOOGLE_OWNER_*` and `GOOGLE_STAFF_*` blank unless you want those audiences too.
- Never commit the secret — `.env` is git-ignored; keep a copy in your password manager.

## 5. Step 3 — Clear the config cache

Laravel only reads `.env` when it builds the config cache. If `bootstrap/cache/config.php`
exists, editing `.env` has **no effect** until you clear it — this is the single most common
reason the "not configured" banner survives a correct `.env`.

```bash
php artisan optimize:clear        # config + route + view + event caches
```

If your deploy runs `php artisan config:cache`, re-run it **after** clearing:

```bash
php artisan config:cache
```

---

## 6. Step 4 — Verify from the CLI

```bash
# 1. Are the credentials visible to the app?
php artisan config:show services.google_player
```

Expected:

```text
  client_id      ......... 1234567890-…apps.googleusercontent.com
  client_secret  ......... GOCSPX-…
  redirect       ......... https://YOUR_DOMAIN/auth/google/player/callback
```

Blank values → the `.env` is wrong or still cached (§4, §5).

```bash
# 2. Does the route exist?
php artisan route:list --name=google
```

```text
GET|HEAD  auth/google/{tenant}             google.redirect
GET|HEAD  auth/google/{tenant}/callback    google.callback
```

```bash
# 3. Where does the player button actually send the browser?
curl -sS -o /dev/null -D - "https://YOUR_DOMAIN/auth/google/player?facility=SLUG" | grep -i '^location:'
```

PowerShell:

```powershell
curl.exe -sS -o NUL -D - "https://YOUR_DOMAIN/auth/google/player?facility=SLUG" | Select-String -Pattern '^location:'
```

| `location:` value | Meaning |
|---|---|
| `https://accounts.google.com/o/oauth2/auth?...` | ✅ configured correctly |
| `https://YOUR_DOMAIN` | ❌ "not configured" — credentials missing or cached |
| `https://YOUR_DOMAIN/…` (a login page) | ❌ the controller threw — read `storage/logs/laravel.log` |

To print the URI Google will see, decode `redirect_uri` from that `location` value; it must
match the console entry exactly.

---

## 7. Step 5 — Test the login end to end

1. Open `https://YOUR_DOMAIN/{facility-slug}/login`.
2. Click **Continue with Google**.
3. Choose a Google account (only **test users** work while the app is in *Testing*).
4. Google returns to `/auth/google/player/callback`, and you land back on
   `/{facility-slug}` — signed in, joined to that facility, with a "LAST USED" marker on
   the Google button next time.

### What happens to the account

| Situation | Result |
|---|---|
| Email already exists (email/password account) | `google_id` + `avatar` linked; you are logged in as that existing user |
| Email does not exist | New `PLAYER` created with `status = VERIFIED` |
| Account status is `BANNED` | Blocked with "Your account has been banned. Please contact support." |
| No `?facility=` in the start URL | Signs in, then redirects to `/dashboard` instead of a facility page |

## 8. Local development

**`http://courtsync.test` cannot be used for Google sign-in.** Google only allows plain
`http` for `localhost` / `127.0.0.1`; any other host must be `https`. Sending
`redirect_uri=http://courtsync.test/auth/google/player/callback` produces:

```text
Access blocked: Authorisation error
Error 400: invalid_request
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy…
```

### Option A — `php artisan serve` (recommended)

```env
APP_URL=http://localhost:8000
GOOGLE_PLAYER_CLIENT_ID=…apps.googleusercontent.com
GOOGLE_PLAYER_CLIENT_SECRET=…
GOOGLE_PLAYER_REDIRECT_URI="${APP_URL}/auth/google/player/callback"
```

```bash
php artisan config:clear
php artisan serve --port=8000
```

Register this exact URI (if it is not already in the client):

```text
http://localhost:8000/auth/google/player/callback
```

Browse **http://localhost:8000/{facility-slug}/login**. `localhost` and `127.0.0.1` are
different origins to Google — register and browse the same one.

### Option B — Laragon over HTTPS

1. Enable **SSL** on the `courtsync.test` vhost.
2. Add `https://courtsync.test/auth/google/player/callback` to the client.
3. `.env`: `APP_URL=https://courtsync.test` and the same derived redirect URI.
4. `php artisan config:clear`, then browse **https://courtsync.test/{facility-slug}/login**
   (accept the self-signed certificate; the controller already skips TLS verification
   locally for the token exchange).

### Local-only behaviour

- A failed `state` check (`InvalidStateException`) is retried **stateless** only when
  `APP_ENV=local`. In production it fails with *"We could not sign you in with Google."*
  and the exception is logged.
- Locally the banner shows the raw exception message, e.g.
  `Google sign-in failed: invalid_client`; production shows a generic message.

---

## 9. Deployment checklist

```bash
git pull
composer install --no-dev --optimize-autoloader
npm ci && npm run build            # REQUIRED after resources/js changes
php artisan migrate --force
php artisan optimize:clear
# if you cache config/routes/views in production:
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

`npm run build` matters here because the login pages render the `flash.error` banner — a
stale `public/build` keeps the error invisible.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Google authentication is not yet configured on this server.` | `GOOGLE_PLAYER_CLIENT_ID`/`_SECRET` empty, **or** cached config | set `.env`, then `php artisan optimize:clear` |
| `Error 400: invalid_request` — *"doesn't comply with Google's OAuth 2.0 policy"* | `redirect_uri` is plain **http on a non-localhost host** (e.g. `http://courtsync.test/...`) | use `http://localhost:8000` or HTTPS — see [§8](#8-local-development); the error page's *"see error details"* shows the URI |
| `Error 400: redirect_uri_mismatch` | URI not registered, or scheme/host/trailing-slash differs | compare `php artisan config:show services.google_player` → `redirect` with the console entry |
| `Error 401: invalid_client` | wrong client ID, or secret rotated/deleted | paste the current secret (**Clients → Add secret** if lost) |
| `Error 403: access_denied` | app is in *Testing* and the Gmail is not a test user | add it under **Audience → Test users**, or publish the app |
| `Error 403: org_internal` | client is `Internal` but the account is outside the Workspace org | switch user type to `External` |
| Back on the login page with *"We could not sign you in with Google."* | state mismatch, token exchange failure, TLS/proxy problem | `tail -f storage/logs/laravel.log` — the exception is logged |
| Owner/staff button shows the "not configured" banner | those env keys are blank (expected while only players use Google) | configure that audience, see [§12](#12-other-audiences-owner--staff) |
| Works on `example.com`, fails on `www.example.com` | origin/host mismatch | make `APP_URL`, the console URI and the browser host identical |
| `cURL error 60: SSL certificate problem` in production | server CA bundle missing | install/refresh `ca-certificates`; never disable verification outside `local` |

```bash
tail -n 100 storage/logs/laravel.log
```

## 11. Security notes

- **Never commit the client secret.** It lives in the server `.env` only (git-ignored). If it
  is exposed, rotate it: **Clients → Add secret**, update `.env`, `php artisan optimize:clear`.
- **State parameter:** the callback verifies the OAuth `state`; it is only bypassed in
  `local`. Keep it that way — it protects the callback from CSRF/impersonation.
- **Email matching:** sign-in links to an existing account by verified Google email. Keep
  `users.email` unique (it is, by migration) so one Google identity cannot map to two accounts.
- **`prompt=select_account`** is always sent, so a shared browser never silently reuses
  someone else's Google session.
- **HTTPS in production.** Session cookies are marked `secure` automatically; a mixed
  http/https setup breaks the login state.
- Only the `openid`, `email` and `profile` scopes are requested.

---

## 12. Other audiences (owner / staff)

Same steps, different prefix and callback path:

| Audience | Env keys | Callback path | Where the button is |
|---|---|---|---|
| Player | `GOOGLE_PLAYER_CLIENT_ID`, `GOOGLE_PLAYER_CLIENT_SECRET`, `GOOGLE_PLAYER_REDIRECT_URI` | `/auth/google/player/callback` | `Player/Auth/Login.jsx`, `Player/Auth/Register.jsx` |
| Owner | `GOOGLE_OWNER_CLIENT_ID`, `GOOGLE_OWNER_CLIENT_SECRET`, `GOOGLE_OWNER_REDIRECT_URI` | `/auth/google/owner/callback` | `Auth/Login.jsx`, `Auth/Register.jsx` |
| Staff | `GOOGLE_STAFF_CLIENT_ID`, `GOOGLE_STAFF_CLIENT_SECRET`, `GOOGLE_STAFF_REDIRECT_URI` | `/auth/google/staff/callback` | none in the UI |

You can reuse one Google client for all three (register all three callback URIs on it) or
create a client per audience.

Two owner-specific differences once you enable it:

1. A **new owner** created through Google gets `status = PENDING_VERIFICATION` (players get
   `VERIFIED`). Until an admin sets **Admin → Owners → Edit → Status = VERIFIED**,
   the owner dashboard renders without metrics.
2. Owners have no facility slug in the start URL, so they land on `/dashboard` after signing in.

---

## 13. Final verification checklist

- [ ] Client exists (e.g. `courtsync_player`), type *Web application*
- [ ] Authorised redirect URIs contain `https://YOUR_DOMAIN/auth/google/player/callback`
- [ ] Local URI added if you test locally (`http://localhost:8000/auth/google/player/callback`)
- [ ] Branding: app name, support email, authorised domain
- [ ] Audience: test Gmail accounts added, or app published
- [ ] `.env`: `APP_URL`, `GOOGLE_PLAYER_CLIENT_ID`, `GOOGLE_PLAYER_CLIENT_SECRET`,
      `GOOGLE_PLAYER_REDIRECT_URI`
- [ ] `php artisan optimize:clear` run **after** the last `.env` edit
- [ ] `php artisan config:show services.google_player` shows non-empty values + `https` redirect
- [ ] `curl … /auth/google/player?facility=SLUG` returns a `location:` on `accounts.google.com`
- [ ] `npm run build` run on the server after deploying login-page changes
- [ ] **Continue with Google** on `/{facility-slug}/login` signs in and returns to the facility page
