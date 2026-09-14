# Local Repo Installation (Development)

Get CourtSync running on your own machine for development.

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| PHP | **8.3+** | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| MySQL | 8.x | or MariaDB 10.6+ |

On Windows, [Laragon](https://laragon.org/) bundles PHP, MySQL, and a web server — this repo was built against it. Make sure Laragon's PHP version is 8.3+ (Laragon can install multiple PHP versions side by side; pick 8.3 or newer from its menu, or run the binary directly, e.g. `C:\laragon\bin\php\php-8.3.x\php.exe`).

## 2. Clone the repository

```bash
git clone <your-repo-url> courtsync
cd courtsync
```

## 3. Install dependencies

```bash
composer install
npm install
```

## 4. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set at minimum:

```env
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=courtsync
DB_USERNAME=root
DB_PASSWORD=
```

Create the database (via a GUI like HeidiSQL/phpMyAdmin, or the CLI):

```sql
CREATE DATABASE courtsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Optional: Google login

CourtSync supports Google OAuth for three separate audiences (staff / owner / player). Only needed if you're testing social login locally — leave blank otherwise.

```env
GOOGLE_STAFF_CLIENT_ID=
GOOGLE_STAFF_CLIENT_SECRET=
GOOGLE_STAFF_REDIRECT_URI=/auth/google/staff/callback

GOOGLE_OWNER_CLIENT_ID=
GOOGLE_OWNER_CLIENT_SECRET=
GOOGLE_OWNER_REDIRECT_URI=/auth/google/owner/callback

GOOGLE_PLAYER_CLIENT_ID=
GOOGLE_PLAYER_CLIENT_SECRET=
GOOGLE_PLAYER_REDIRECT_URI=/auth/google/player/callback
```

## 5. Run migrations and seed demo data

```bash
php artisan migrate --seed
```

This creates the schema and seeds demo accounts (see [seeded accounts](#seeded-accounts) below).

## 6. Run the app

Two processes need to run side by side — the Laravel server and the Vite dev server (for hot-reloading React):

```bash
# terminal 1
php artisan serve

# terminal 2
npm run dev
```

Visit **http://127.0.0.1:8000**.

> If Laragon is already serving the folder via Apache/Nginx virtual host, you don't need `php artisan serve` — just visit the Laragon-configured URL (e.g. `http://courtsync.test`) and keep `npm run dev` running for Vite.

## 7. Seeded accounts

All seeded users share the password `password`.

| Role | Email |
|---|---|
| Admin | `admin@example.com` |
| Facility Owner | `owner@example.com` |
| Facility Staff | `staff@example.com` |
| Player | `player@example.com` |

## Common issues

- **"Composer detected issues... requires PHP >= 8.3"** — your default `php` CLI is older than 8.3. Point your terminal/Laragon at a PHP 8.3+ binary, or call it directly: `/path/to/php8.3/php.exe artisan ...`.
- **Vite asset errors in the browser** — make sure `npm run dev` is running, or run `npm run build` for a static production build.
- **Google login redirect fails locally** — the redirect URIs above are relative; Socialite resolves them against `APP_URL`. Make sure `APP_URL` matches the URL you're actually browsing to.

## Resetting your local database

```bash
php artisan migrate:fresh --seed
```

This drops all tables, re-runs every migration, and re-seeds demo data — useful whenever you pull schema changes.
