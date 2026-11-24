# CourtSync Installation Guides

This folder holds the setup and feature guides for this project:

- **[repo-installation.md](repo-installation.md)** — get the project running on a developer machine (Windows/Laragon, macOS, or Linux) for local development.
- **[vps-installation.md](vps-installation.md)** — deploy the app to a production VPS (Ubuntu + Nginx + PHP-FPM + MySQL).
- **[notification-deployment.md](notification-deployment.md)** — deploy and verify background Web Push + PWA notifications (VAPID keys, service worker, queue worker, mobile/iOS checks).
- **[booking-reschedule-and-payments.md](booking-reschedule-and-payments.md)** — reschedule/booking-management feature: API rules, drawer tabs, receipt viewer, payment-step instructions modal and copyable wallet number, tests, QA checklist, and the upload checklist.

Both server guides assume the stack in this repo: Laravel 13 + Inertia (React) + MySQL, built with Vite.
