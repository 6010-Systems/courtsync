# Booking Reschedule & Payment UX

This guide documents the booking-management work added in this release:

1. **Rescheduling** — facility owners/staff can move an existing booking to another date/time from **Facility → Bookings**.
2. **Booking details drawer** — tabs (Booking / Proof of Payment), an in-place receipt viewer, and a close button.
3. **Payment step** — copyable wallet number and a Payment Instructions **modal** in the player booking flow, plus a compact layout that fits phone screens.

For server setup see [vps-installation.md](vps-installation.md); for pushing the files to a live host see [section 9](#9-deployment-filezilla--ssh) below.

## 1. What shipped

| Area | Capability |
|---|---|
| Backend | `POST /bookings/{booking}/reschedule` re-quotes the price and keeps payments/notifications in sync |
| Facility UI | “Reschedule booking” action in the booking drawer + a dedicated dialog |
| Player UI | GCash/Maya number copy button, “How to pay” instructions modal |
| Booking drawer | Booking / Proof of Payment tabs, in-app (no new tab) receipt preview |
| Mobile | Smaller step indicator, tighter paddings, compact payment header/tabs |

## 2. Rescheduling (backend)

### Route

| Method | URI | Name | Controller |
|---|---|---|---|
| `POST` | `/bookings/{booking}/reschedule` | `bookings.reschedule` | `BookingController@reschedule` |

Registered in `routes/web.php` inside the `auth` + `CheckBanned` group, next to `bookings.verify`
and `bookings.reject`.

### Who can reschedule

The same rule as cancelling/verifying/deleting a booking:

- `FACILITY_OWNER` whose `facilities()` includes the booking's `facility_id`, or
- `FACILITY_STAFF` whose `facility_id` matches the booking's facility.

Anything else gets **403**. Players never reach this route (it lives on the facility side), so a
booking can only be rescheduled by the venue — not by the customer.

### Request body

```json
{
  "date": "2026-12-02",
  "start_time": "14:00",
  "end_time": "16:00"
}
```

### Validation rules

| Field | Rules | Error key |
|---|---|---|
| `date` | `required`, `date`, `after_or_equal:today` | `date` |
| `start_time` | `required`, `date_format:H:i` | `start_time` |
| `end_time` | `required`, `date_format:H:i`, `after:start_time` | `end_time` |
| Booking status | must not be `cancelled` | `booking` |
| Court availability | no overlap with another active booking | `start_time` |

The court itself cannot be changed by a reschedule — the booking keeps its court, and the price is
re-quoted for the new duration.

### Double-booking guard

An existing booking `[C, D]` blocks a requested slot `[A, B]` when `A < D` **and** `B > C` — the same
overlap rule used by `BookingController@store`. The booking being edited is excluded from the check,
and `cancelled` bookings are ignored.

### Price re-quote

`App\Support\RateQuote` is the single source of truth:

1. Re-quote with the booking's snapshot rate plan (`rate_plans` / `rate_plan_id`) and the add-on
   quantities stored in `price_breakdown.addons`.
2. Legacy courts with no rate card keep the court charge they were booked at
   (`subtotal`, else `total_price - booking_fee - addons_total`).
3. Recalculate the platform fee with `Facility::calculateBookingFee(subtotal + addons_total)`.

Updated columns: `subtotal`, `addons_total`, `booking_fee`, `total_price`, `price_breakdown`, plus
`date`, `start_time`, `end_time`. Everything runs inside a `DB::transaction` with `lockForUpdate()`.

> If the snapshot rate plan was disabled since the booking was made, `RateQuote` throws and the
> owner sees the message on the `start_time` field instead of a 500.

### Payments

| Payment status | Behaviour |
|---|---|
| `pending` | `amount` is synced to the new total (still awaiting verification) |
| `verified` | Left untouched; the success flash adds “The new total is ₱X; the verified payment amount was left unchanged.” |

This keeps a verified payment honest: the facility is told to settle any difference with the player
instead of the system silently rewriting a verified amount.

### Notification

`App\Notifications\BookingRescheduled` (database + Web Push, `ShouldQueueAfterCommit`), mirroring
`BookingConfirmed`:

> **Booking rescheduled** — Your booking #12 has been moved to Tuesday, December 2, 2026 from
> 2:00 PM to 4:00 PM at <Venue> on <Court>.

Only registered players are notified (`$booking->user?->notify(...)`); walk-in bookings are not.
Requires a running queue worker, exactly like the other booking notifications.

### Success response

Redirect back with flash `success` (`Booking rescheduled successfully.`). Validation problems return
`back()->withErrors([...])` so Inertia re-renders the dialog with the message.

## 3. Facility bookings UI

### Booking details drawer (`resources/js/Components/BookingDetailDrawer.jsx`)

| Element | Behaviour |
|---|---|
| Close button (✕) | Fixed at the top-right of the dark header; stays visible while the details scroll |
| Tabs | **Booking** (default) and **Proof of Payment**; hidden in the “Booking Added Successfully” view |
| Proof of Payment tab | Payment method, amount and status card + the receipt image (`max-h-[48vh]`) |
| Receipt click | Opens an **in-app lightbox** (`z-[60]`, `cursor-zoom-in`) — no new browser tab |
| Lightbox close | ✕ button, backdrop click, or `Esc` |
| Reschedule button | Bottom of the drawer; hidden for `cancelled` bookings and in success mode |

The old “Open in new tab” link was removed; the receipt is only ever shown inside the app.
`Facility/Payments` reuses the same drawer, so it gets the tabs too (without the reschedule button,
because no `onReschedule` handler is passed there).

### Reschedule dialog (`resources/js/Components/RescheduleBookingModal.jsx`)

| Field | Notes |
|---|---|
| Current slot | Read-only summary of the booking being moved |
| New date | `min` = today (local date) |
| Start time | Hours built from `court.time_range`; hours already taken show “(Booked)” and are disabled |
| End time | Only hours after the start, capped at the next booked hour; disabled until a start is picked |
| Duration chip | Live `N hrs · start – end` summary |
| Footer | Info note above a full-bleed bar with **Cancel** / **Save new schedule** |

- Opening hours are parsed from free text such as `6:00 AM - 10:00 PM` or `24 Hours`; anything
  unparseable falls back to 6 AM – 10 PM.
- Submission posts `date`, `start_time`, `end_time` to `bookings.reschedule` with
  `preserveScroll: true` and closes on success, so the page (and the table) refresh with the new slot.
- Server-side errors render under the matching field; the cancelled-booking error renders above the
  footer as `booking`.
- Availability comes from the `courtBookings` Inertia prop (not the filtered table), so an active
  search/filter can never show a slot as free when it isn’t.

### Page wiring (`resources/js/Pages/Facility/Bookings.jsx`)

```jsx
const [rescheduleBooking, setRescheduleBooking] = useState(null);

const handleReschedule = (booking) => {
    setSelectedBooking(null);      // close the drawer
    setRescheduleBooking(booking); // open the dialog
};

<BookingDetailDrawer ... onReschedule={handleReschedule} />
<RescheduleBookingModal
    show={!!rescheduleBooking}
    booking={rescheduleBooking}
    courtBookings={courtBookings}
    onClose={() => setRescheduleBooking(null)}
/>
```

## 4. Player booking payment step (`Step4Payment.jsx`)

Reached from `/{facility:slug}/book` → step 4 (Payment).

### Copy payment number

- GCash/Maya number pill now ends with a copy button: `Copy` icon → `Check` + “Copied” for 2 s.
- Uses `navigator.clipboard.writeText()` and falls back to an off-screen `<textarea>` +
  `execCommand('copy')` on insecure origins (e.g. `http://courtsync.test`) or older browsers.
- `aria-label`, `title`, and an `aria-live` status cover keyboard/screen-reader users.
- The “Copied” timer is cleared on unmount and whenever the GCash/Maya tab changes.

### Payment Instructions modal

- Triggered by the **“How to pay”** (phones) / **“Payment Instructions”** (≥ `sm`) pill in the step
  header; only shown for wallet methods.
- Content: the QR screenshot guidance paragraph, the **Tips → How to pay** list, and a GCash/Maya
  number row with an inline **Copy/Copied** action.
- Layout: `max-h-[85vh]` flex column → header, scrollable body, pinned `Got it` footer.
- Wording lives in the `PAYMENT_TIPS` constant so copy edits are one place.

### Compact layout for phones

| Element | Before | Now |
|---|---|---|
| Header | Title + amount stacked | One row: smaller title left, **amount right** (`text-base sm:text-xl`) |
| GCash/Maya tabs | `h-16`, `max-w-[340px]` | `h-9 sm:h-10`, `max-w-[200px] sm:max-w-[240px]`, smaller logos |
| QR frame | `250×250` | `190×190` → `250×250` from `sm` |
| Card / upload paddings | `p-8` / `p-6` | `p-5 sm:p-8` / `p-4 sm:p-6` |
| Instructions | Full card below the form (page scroll) | Modal (no extra page height) |

### Step indicator (`Book.jsx`)

Circles `w-6 h-6` with `text-[10px]` on phones (`sm:w-8 sm:h-8`), tighter gaps, progress track `h-1`,
top bar `py-2.5`, wizard padding `py-3`, and smaller `Previous` / `Next` / `Confirm Booking` buttons —
about 60–70 px more vertical room, so the payment step fits a phone screen.

## 5. Inertia props added

`GET /facility/bookings` (`BookingController@index`) now also sends:

| Prop | Shape | Used by |
|---|---|---|
| `courtBookings` | `[{ id, court_id, date, start_time, end_time, status }]` — the facility's future, non-cancelled bookings | Reschedule dialog availability |
| `bookings[].court.time_range` | Court opening hours string | Reschedule dialog time options |

## 6. Files

| File | Role |
|---|---|
| `app/Http/Controllers/BookingController.php` | `reschedule()` + `applyReschedule()`, `courtBookings` prop, `court.time_range` |
| `app/Notifications/BookingRescheduled.php` | **new** database + Web Push notification |
| `routes/web.php` | `bookings.reschedule` route |
| `resources/js/Components/BookingDetailDrawer.jsx` | Close ✕, tabs, receipt lightbox, reschedule action |
| `resources/js/Components/RescheduleBookingModal.jsx` | **new** reschedule dialog |
| `resources/js/Pages/Facility/Bookings.jsx` | Dialog state + wiring, passes `courtBookings` |
| `resources/js/Pages/Facility/BookSteps/Step4Payment.jsx` | Copy number, instructions modal, compact header/tabs |
| `resources/js/Pages/Facility/Book.jsx` | Smaller step indicator and paddings on phones |
| `tests/Feature/BookingRescheduleTest.php` | **new** 8 feature tests |

No migrations, config, or dependency changes — the reschedule feature reuses the existing
`bookings`, `rate_plans`, `payments` tables and the `RateQuote` support class.

## 7. Tests

```bash
# Full file
php artisan test --compact tests/Feature/BookingRescheduleTest.php

# A single case
php artisan test --filter test_owner_can_reschedule_a_booking_and_the_price_is_requoted
```

Covered cases:

| Test | Asserts |
|---|---|
| `test_owner_can_reschedule_a_booking_and_the_price_is_requoted` | date/time saved, 1 h → 2 h re-prices 300 → 600 |
| `test_reschedule_rejects_a_slot_that_overlaps_another_booking` | `start_time` error, booking unchanged |
| `test_owner_cannot_reschedule_a_booking_from_another_facility` | 403 |
| `test_reschedule_requires_the_end_time_to_be_after_the_start_time` | `end_time` error |
| `test_reschedule_cannot_move_a_booking_into_the_past` | `date` error |
| `test_cancelled_bookings_cannot_be_rescheduled` | `booking` error, unchanged |
| `test_pending_payment_amount_follows_the_new_total` | payment amount synced, still `pending` |
| `test_player_is_notified_when_their_booking_is_rescheduled` | `BookingRescheduled` sent to the player |

Related suites (`FacilityBookings`, `BookingFee`, `BookingRatePlan`, notification tests,
`PlayerBookings`, `PaymentController`) still pass: 50 tests / 417 assertions.

> `tests/Feature/Auth/SocialiteRedirectTest` fails on machines without real Google OAuth
> credentials — it is unrelated to these changes.

## 8. Manual QA checklist

Facility side (`/facility/bookings` as a facility owner):

- [ ] Click a booking → drawer shows **Booking** tab and the ✕ button closes it.
- [ ] **Proof of Payment** tab shows the receipt; clicking it opens the in-app preview (no new tab);
      `Esc` and backdrop close it.
- [ ] **Reschedule booking** → pick a date/time; taken hours are marked “(Booked)”.
- [ ] Saving an overlapping slot shows the “already booked” error and nothing changes.
- [ ] Reschedule a 1 h booking to 2 h → total price updates in the table and the drawer.
- [ ] Reschedule a booking with a pending payment → payment amount matches the new total.
- [ ] The player receives the “Booking rescheduled” notification.
- [ ] A cancelled booking has no reschedule button (and the API rejects it anyway).
- [ ] Another facility's booking cannot be rescheduled (403).

Player side (`/{facility-slug}/book` → step 4):

- [ ] GCash/Maya tabs are small; the header shows the amount on the right of the same line.
- [ ] Copy icon copies the number and flips to “Copied” for 2 s.
- [ ] “How to pay” opens the instructions modal; **Got it** / ✕ closes it without page scroll.
- [ ] The step indicator is compact on a phone and the payment card is reachable without hunting.
- [ ] Uploading a receipt and confirming the booking still works end to end.


## 9. Deployment (FileZilla / SSH)

### 9.1 Build first

```powershell
cd C:\laragon\www\courtsync
npm run build
```

`public/build` is gitignored, so it ships by upload (or by running the build on the server).

### 9.2 Connect with FileZilla

1. **File → Site Manager → New Site**
2. Protocol `SFTP - SSH File Transfer Protocol` (or `FTP` + port `21` if the host has no SFTP),
   host `courtsync.page` / server IP, port `22`, logon type `Normal`, user + password (or key file).
3. **Transfer → Transfer type → Binary** (protects hashed `.js`/`.css` from line-ending damage).
4. Remote “Laravel root” = the folder containing `artisan`, `app/`, `routes/`, `public/`
   (e.g. `/var/www/courtsync`, `/home/<user>/courtsync`, or cPanel `/home/<user>/laravel`
   with `public_html` pointing at `laravel/public`).

### 9.3 Upload list

Paths are relative to the Laravel root; choose **Overwrite** on conflicts.

| Upload from | To | Needed live? |
|---|---|---|
| `app/Http/Controllers/BookingController.php` | `app/Http/Controllers/` | ✅ |
| `app/Notifications/BookingRescheduled.php` | `app/Notifications/` | ✅ new file |
| `routes/web.php` | `routes/` | ✅ |
| `public/build/` (whole folder: `manifest.json` + `assets/`) | `public/build/` | ✅ |
| `resources/js/Components/BookingDetailDrawer.jsx` | `resources/js/Components/` | ⚪ source only |
| `resources/js/Components/RescheduleBookingModal.jsx` | `resources/js/Components/` | ⚪ new source |
| `resources/js/Pages/Facility/Bookings.jsx` | `resources/js/Pages/Facility/` | ⚪ source only |
| `resources/js/Pages/Facility/Book.jsx` | `resources/js/Pages/Facility/` | ⚪ source only |
| `resources/js/Pages/Facility/BookSteps/Step4Payment.jsx` | `resources/js/Pages/Facility/BookSteps/` | ⚪ source only |
| `tests/Feature/BookingRescheduleTest.php` | `tests/Feature/` | ⚪ optional |

**Never upload:** `.env`, `vendor/`, `node_modules/`, `storage/`, and especially
`bootstrap/cache/packages.php` / `bootstrap/cache/services.php` (they contain local Windows paths
and are environment-specific — the server generates its own).

Keep file names exactly as written: Linux is case-sensitive.

Old hashed assets may stay in `public/build/assets` (the new `manifest.json` points at the new ones);
delete them later if you want a tidy folder.

### 9.4 After upload — SSH (recommended)

```bash
cd /path/to/courtsync
php artisan optimize:clear      # config/route/view/compiled caches
composer dump-autoload -o       # registers App\Notifications\BookingRescheduled
php artisan route:cache         # REQUIRED if routes were cached (new route was added)
php artisan config:cache        # only if you cache config in production
```

No `php artisan migrate` is required — there are no new migrations.

### 9.5 After upload — no SSH

1. Upload the files above.
2. If the new endpoint 404s or the UI looks stale, delete these through FileZilla so Laravel
   rebuilds them:
   - `bootstrap/cache/routes-v7.php`
   - `bootstrap/cache/config.php`
   - `bootstrap/cache/services.php`, `bootstrap/cache/packages.php` (if present)
   - `storage/framework/views/*.php`
3. Load any page once to regenerate caches. `storage/` and `bootstrap/cache/` must be writable
   (files `644`, folders `755`).
4. Hard refresh (`Ctrl+F5`) and purge the CDN (e.g. Cloudflare) — asset names are hashed, so a cached
   `manifest.json` can serve the old JS.

### 9.6 Git alternative

```bash
git pull
npm ci && npm run build
composer install --no-dev --optimize-autoloader
php artisan optimize:clear && php artisan config:cache && php artisan route:cache
```

## 10. Local environment notes

- **SQLite driver:** this Windows PHP (`C:\laragon\bin\php\php-8.3.16…`) has `pdo_sqlite` disabled, so
  `php artisan test` fails with *“could not find driver”*. Run the suite directly:
  `php -d extension=pdo_sqlite vendor/bin/phpunit tests/Feature/BookingRescheduleTest.php`.
  Enabling `extension=pdo_sqlite` in `php.ini` removes the need for the flag.
- **`bootstrap/cache` quirk:** on this machine `is_writable()` reports `false` for the project tree
  (writes still succeed). If `bootstrap/cache/packages.php` / `services.php` are deleted (for example
  by `composer dump-autoload`), Laravel throws *“The …bootstrap/cache directory must be present and
  writable”*. Regenerate those two files locally; never copy them to the server.
- **Frontend changes** need `npm run build` (or `npm run dev`) before they appear in the browser.

