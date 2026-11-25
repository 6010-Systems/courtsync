# CourtSync Installation Guides

This folder holds the setup and feature guides for this project:

- **[repo-installation.md](repo-installation.md)** — get the project running on a developer machine (Windows/Laragon, macOS, or Linux) for local development.
- **[vps-installation.md](vps-installation.md)** — deploy the app to a production VPS (Ubuntu + Nginx + PHP-FPM + MySQL).
- **[google-oauth-setup.md](google-oauth-setup.md)** — configure Google sign-in for the **player** pages (`/{facility}/login`, `/{facility}/register`): Google Cloud client, redirect URIs, server `.env`, cache clearing, verification steps and troubleshooting for *"Google authentication is not yet configured on this server."*
- **[notification-deployment.md](notification-deployment.md)** — deploy and verify background Web Push + PWA notifications (VAPID keys, service worker, queue worker, mobile/iOS checks).
- **[booking-reschedule-and-payments.md](booking-reschedule-and-payments.md)** — reschedule/booking-management feature: API rules, drawer tabs, receipt viewer, payment-step instructions modal and copyable wallet number, tests, QA checklist, and the upload checklist.

Both server guides assume the stack in this repo: Laravel 13 + Inertia (React) + MySQL, built with Vite.

## Updates

Dated records of what changed, newest first:

- **[update-2026-11-25-google-auth.md](update-2026-11-25-google-auth.md)** — Google authentication go-live: cloud client and redirect URIs, per-environment `.env`, the 7 issues found and fixed, verification, deployment steps, rollback and open items.
- **[update-2026-11-25-app-update.md](update-2026-11-25-app-update.md)** — application changes shipped that day: shared `flash` props, OAuth `state` hardening (local-only stateless fallback), per-audience failure redirects, open-redirect fix, login-page error banners, rewritten OAuth tests.
- **[update-2026-11-25-notifications.md](update-2026-11-25-notifications.md)** — notifications everywhere: shared push store + hook, automatic opt-in banner on every authenticated page, real notification centre (no fake badges), iOS install→enable flow, icon fixes, manifest updates, verification matrix.

Supporting files:

- **[google-oauth-setup.md](google-oauth-setup.md)** — step-by-step player OAuth guide plus troubleshooting table.
- **[env-production.example](env-production.example)** — commented production `.env` template (secrets replaced with placeholders).
