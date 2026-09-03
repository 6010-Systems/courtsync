# VPS Installation (Production)

Deploy CourtSync to a production VPS. Written for **Ubuntu 22.04/24.04** with **Nginx + PHP-FPM + MySQL**; adjust package manager commands if you're on a different distro.

## 1. Provision the server

- A VPS with at least 1 vCPU / 1GB RAM (2GB+ recommended once traffic grows).
- A domain name pointed at the server's IP (an A record).
- SSH access as a non-root sudo user.

```bash
ssh youruser@your-server-ip
sudo apt update && sudo apt upgrade -y
```

## 2. Install PHP 8.3+

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

sudo apt install -y php8.3 php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-gd php8.3-intl

php -v   # confirm 8.3.x
```

## 3. Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer -V
```

## 4. Install Node.js (for building frontend assets)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 5. Install and secure MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

Create the database and a dedicated user:

```sql
sudo mysql
CREATE DATABASE courtsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'courtsync'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON courtsync.* TO 'courtsync'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

## 7. Get the code onto the server

```bash
sudo mkdir -p /var/www/courtsync
sudo chown -R $USER:$USER /var/www/courtsync
git clone <your-repo-url> /var/www/courtsync
cd /var/www/courtsync
```

## 8. Install dependencies and build assets

```bash
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

`npm run build` compiles the React/Inertia frontend into `public/build` — the server never needs `npm run dev` in production, and `node_modules` isn't required at runtime.

## 9. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` for production:

```env
APP_NAME="CourtSync"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=courtsync
DB_USERNAME=courtsync
DB_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

LOG_CHANNEL=stack
LOG_LEVEL=error
```

Fill in Google OAuth credentials (`GOOGLE_STAFF_*`, `GOOGLE_OWNER_*`, `GOOGLE_PLAYER_*`) if social login is used in production, using the real domain in each redirect URI.

## 10. Run migrations

```bash
php artisan migrate --force
```

Do **not** run `--seed` in production — the seeders create demo accounts with the known password `password`. If you need an initial admin account, create one deliberately:

```bash
php artisan tinker
>>> \App\Models\User::create(['name' => 'Admin', 'email' => 'admin@yourdomain.com', 'password' => bcrypt('a-real-password'), 'role' => 'ADMIN', 'status' => 'VERIFIED']);
>>> exit
```

## 11. File permissions

```bash
sudo chown -R www-data:www-data /var/www/courtsync
sudo find /var/www/courtsync -type d -exec chmod 755 {} \;
sudo find /var/www/courtsync -type f -exec chmod 644 {} \;
sudo chmod -R 775 /var/www/courtsync/storage /var/www/courtsync/bootstrap/cache
```

## 12. Cache config for production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> Re-run these three commands after every deploy that changes `.env`, routes, or views — stale caches are a common source of "it worked locally" bugs.

## 13. Nginx site config

Create `/etc/nginx/sites-available/courtsync`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/courtsync/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/courtsync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 14. HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config to redirect HTTP → HTTPS and auto-renews via a systemd timer.

## 15. Queue worker (Supervisor)

The app queues jobs to the database (`QUEUE_CONNECTION=database`), so a worker process must run continuously.

```bash
sudo apt install -y supervisor
```

Create `/etc/supervisor/conf.d/courtsync-worker.conf`:

```ini
[program:courtsync-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/courtsync/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/courtsync/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start courtsync-worker:*
```

## 16. Scheduler (cron)

If any scheduled tasks are added later (`app/Console/Kernel.php` / `routes/console.php`), wire up Laravel's scheduler once:

```bash
sudo crontab -u www-data -e
```

Add:

```
* * * * * cd /var/www/courtsync && php artisan schedule:run >> /dev/null 2>&1
```

## 17. Deploying updates

```bash
cd /var/www/courtsync
git pull origin main
composer install --optimize-autoloader --no-dev
npm install
npm run build
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo supervisorctl restart courtsync-worker:*
```

Consider scripting the above into a `deploy.sh`, or moving to a proper CI/CD pipeline once the project matures.

## Troubleshooting

- **502 Bad Gateway** — check `sudo systemctl status php8.3-fpm` and that the socket path in the Nginx config matches your PHP-FPM pool (`/etc/php/8.3/fpm/pool.d/www.conf` → `listen = ...`).
- **White screen / 500 error** — check `storage/logs/laravel.log`. Usually a missing `.env` value, a permissions issue on `storage/`, or a stale `config:cache` after an `.env` change (`php artisan config:clear` then re-cache).
- **Assets not loading (blank page, console 404s on `/build/...`)** — `npm run build` wasn't run, or `public/build` wasn't deployed/committed to the server.
- **Queued jobs never run** — confirm the Supervisor worker is actually running (`sudo supervisorctl status`) and check `storage/logs/worker.log`.
