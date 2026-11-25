# Update 2026-11-25 — Google Authentication (Player Login)

**Status:** done — Google sign-in works on local and on `https://courtsync.page`.
**Scope:** configuration only (Google Cloud + `.env`). The code changes made the same day are
documented separately in [update-2026-11-25-app-update.md](update-2026-11-25-app-update.md).
**How-to guide:** [google-oauth-setup.md](google-oauth-setup.md) · **template:** [env-production.example](env-production.example)

---

## 1. Summary

| Environment | URL | Player Google login |
|---|---|---|
| Local | `http://localhost:8000/{facility}/login` | working |
| Production | `https://courtsync.page/{facility}/login` | working |

Audiences in scope: **player only**. `GOOGLE_OWNER_*` and `GOOGLE_STAFF_*` remain blank on
both environments; their buttons show the "not configured" banner by design.

Flow implemented by `SocialiteController`: `GET /auth/google/player?facility={slug}` stores
the slug in the session, redirects to Google with `prompt=select_account` and a `state`
token, then `GET /auth/google/player/callback` verifies `state`, matches or creates the
`PLAYER` account, joins it to the facility and redirects to `/{slug}`.

---

## 2. Google Cloud configuration (project "6010 Systems")

| Item | Value |
|---|---|
| Client name | `courtsync_player` |
| Client type | Web application |
| Client ID | `836179080897-iagr6is50s866c9m1bs55gnc06s0g2d0.apps.googleusercontent.com` |
| Client secret | ends in `CqqF`, created 2026-11-25 (rotate with **Add secret**) |
| Authorised JavaScript origins | `http://localhost:8000`, `https://courtsync.page` |
| Authorised redirect URIs | `http://localhost:8000/auth/google/player/callback`, `https://courtsync.page/auth/google/player/callback` |
| Authorised domain (Branding) | `courtsync.page` |
| App name | `CourtSync` |
| User type / publishing status | External / **Testing** (test users only) |

JavaScript origins are not required for this server-side flow; they are kept for parity.

---

## 3. Environment variables

Identical key names in both environments; only `APP_URL` and the secret differ.

```env
GOOGLE_PLAYER_CLIENT_ID=836179080897-iagr6is50s866c9m1bs55gnc06s0g2d0.apps.googleusercontent.com
GOOGLE_PLAYER_CLIENT_SECRET=GOCSPX-...(secret ending CqqF)
GOOGLE_PLAYER_REDIRECT_URI="${APP_URL}/auth/google/player/callback"

# unchanged, intentionally blank
GOOGLE_OWNER_CLIENT_ID=
GOOGLE_OWNER_CLIENT_SECRET=
GOOGLE_OWNER_REDIRECT_URI="${APP_URL}/auth/google/owner/callback"
GOOGLE_STAFF_CLIENT_ID=
GOOGLE_STAFF_CLIENT_SECRET=
GOOGLE_STAFF_REDIRECT_URI="${APP_URL}/auth/google/staff/callback"
```

| Environment | `APP_URL` | Resulting redirect URI |
|---|---|---|
| Local | `http://localhost:8000` | `http://localhost:8000/auth/google/player/callback` |
| Production | `https://courtsync.page` | `https://courtsync.page/auth/google/player/callback` |

`${APP_URL}` is Laravel's `.env` interpolation, so the redirect URI follows `APP_URL`
automatically. Local previously used `http://courtsync.test`; that was changed to
`http://localhost:8000` because Google rejects non-HTTPS hosts other than `localhost` /
`127.0.0.1`.

---

## 4. Issues found and fixed

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Red banner *"Google authentication is not yet configured on this server."* | `GOOGLE_PLAYER_CLIENT_ID` / `_SECRET` empty in `.env` | filled both keys |
| 2 | Same banner after filling `.env` | `bootstrap/cache/config.php` still serving the old blanks | `php artisan optimize:clear` after every `.env` edit |
| 3 | `Error 400: invalid_request` — *"doesn't comply with Google's OAuth 2.0 policy for keeping apps secure"* | `redirect_uri` was `http://courtsync.test/...`: plain HTTP on a non-localhost host | serve on `http://localhost:8000` and set `APP_URL` to match (or use HTTPS) |
| 4 | Same error while browsing `localhost:8000` | `APP_URL` still said `http://courtsync.test`, and `APP_URL` - not the browser URL - builds the `redirect_uri` | changed `APP_URL` to `http://localhost:8000` |
| 5 | Would fail after credentials were live | production `GOOGLE_PLAYER_REDIRECT_URI` pointed at `/auth/google/owner/callback` (copy/paste) | changed to `/auth/google/player/callback` |
| 6 | `Error 403: access_denied` for a non-listed Gmail | consent screen is in **Testing** | add the address under **Audience -> Test users**, or publish the app |
| 7 | Player credentials staged on the wrong audience | keys were moved to `GOOGLE_OWNER_*` during troubleshooting | reverted to `GOOGLE_PLAYER_*`; owner/staff stay blank |

Notable behaviour: a custom local host (`courtsync.test`) can never be used over plain HTTP
with Google. Options are `http://localhost:8000` (recommended) or an HTTPS virtual host.

---

## 5. Verification

```bash
php artisan config:show services.google_player
```
Expected `redirect` = `https://courtsync.page/auth/google/player/callback` (or the
`localhost:8000` equivalent locally). Blank values mean the `.env` is wrong or cached.

```bash
curl -sS -o /dev/null -D - 'https://courtsync.page/auth/google/player?facility=SLUG' | grep -i '^location:'
```
Expected `location: https://accounts.google.com/o/oauth2/auth?...` containing
`redirect_uri=https%3A%2F%2Fcourtsync.page%2Fauth%2Fgoogle%2Fplayer%2Fcallback`.

A `location:` pointing back at the site (home page or login) means the controller bailed;
a `location:` on `/login` means it threw - check `storage/logs/laravel.log`.

Browser check: `https://courtsync.page/SLUG/login` -> **Continue with Google** -> land back on
`/SLUG` signed in, joined to the facility, with a "LAST USED" badge on the button.

---

## 6. Deployment performed

Uploaded (identical on local and live):

| Path | Reason |
|---|---|
| `app/Http/Controllers/Auth/SocialiteController.php` | state handling + failure redirect (see app-update doc) |
| `app/Http/Middleware/HandleInertiaRequests.php` | shares `flash`, so the error banner renders |
| `resources/js/Pages/Auth/Login.jsx` | error banner |
| `resources/js/Pages/Player/Auth/Login.jsx` | error banner |
| `public/build/**` | compiled assets - without a rebuild the banner does not ship |

SSH after upload:

```bash
cd /var/www/courtsync
php artisan optimize:clear
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan view:cache
sudo chown -R www-data:www-data storage bootstrap/cache public/build
sudo systemctl reload php8.3-fpm     # drops OPcache so the new PHP is served
sudo supervisorctl restart all       # if a queue worker is configured
```

`.env` was edited in place (never uploaded) and backed up first:
`cp -a .env .env.backup-$(date +%F)`.

---

## 7. Rollback

| Goal | Action |
|---|---|
| Disable player Google login only | blank `GOOGLE_PLAYER_CLIENT_ID` / `_SECRET`, run `php artisan optimize:clear`. The button shows the red "not configured" banner; email/password login is unaffected |
| Revert the whole deployment | `cp -a .env.backup-<date> .env`, restore the previous `public/build`, `php artisan optimize:clear` |
| Rotate a leaked secret | Google console -> client -> **Add secret**; update `GOOGLE_PLAYER_CLIENT_SECRET`; `php artisan optimize:clear` |

---

## 8. Open items

1. **Publish the app** (Branding: home page, privacy policy, ToS) so players outside the test
   list can sign in - otherwise only **Audience -> Test users** (max 100) work.
2. **Rotate** the Google client secret: it was shared in plain text during this session.
3. **Rotate** the production database password (`courtsyncpass` is weak and was also shared).
4. Add the **owner** and **staff** audiences later if needed - see
   [google-oauth-setup.md](google-oauth-setup.md) section 12. Remember new owners are created
   with `status = PENDING_VERIFICATION` and need **Admin -> Owners -> Edit -> VERIFIED**.
5. Any future `.env` change on the server requires `php artisan optimize:clear`
   (plus `config:cache` if you cache config).
