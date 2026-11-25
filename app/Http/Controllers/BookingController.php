<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\FacilityBilling;
use App\Models\RatePlan;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use App\Notifications\BookingRescheduled;
use App\Support\OperatingHours;
use App\Support\RateCardLoader;
use App\Support\RateQuote;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to view bookings for
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        $search = $request->input('search');
        $filter = $request->input('filter', 'All');

        $query = Booking::whereIn('facility_id', $facilityIds)
            ->with(['user:id,name,email', 'court:id,name,time_range', 'facility:id,name', 'payment:id,booking_id,amount,status,payment_method,proof_path']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhereHas('court', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%");
                })->orWhere('guest_name', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        if ($filter === 'Today') {
            $query->where('date', now()->toDateString());
        } elseif ($filter === 'Upcoming') {
            $query->where('date', '>', now()->toDateString());
        } elseif ($filter === 'Pending') {
            $query->where('status', 'pending');
        }

        $bookings = $query->orderBy('date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();

        $facilities = Facility::whereIn('id', $facilityIds)
            ->with('courts')
            ->get()
            ->each(fn (Facility $facility) => RateCardLoader::load($facility));

        $countQuery = Booking::query()->whereIn('facility_id', $facilityIds);

        $counts = [
            'all' => (clone $countQuery)->count(),
            'today' => (clone $countQuery)->where('date', now()->toDateString())->count(),
            'upcoming' => (clone $countQuery)->where('date', '>', now()->toDateString())->count(),
            'pending' => (clone $countQuery)->where('status', 'pending')->count(),
        ];

        // Nearest upcoming booking, independent of the active search and filter.
        $nextBooking = Booking::query()
            ->whereIn('facility_id', $facilityIds)
            ->upcoming(now())
            ->with(['user:id,name', 'court:id,name', 'facility:id,name'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        // Lightweight slot map so the reschedule form can grey out taken hours.
        // Yesterday's overnight sessions can still occupy today's early hours.
        $courtBookings = Booking::query()
            ->whereIn('facility_id', $facilityIds)
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) {
                $query->where('date', '>=', now()->subDay()->toDateString())
                    ->orWhere('end_date', '>=', now()->toDateString());
            })
            ->get(['id', 'court_id', 'date', 'end_date', 'start_time', 'end_time', 'status']);

        return inertia('Facility/Bookings', [
            'bookings' => $bookings,
            'nextBooking' => $nextBooking,
            'courtBookings' => $courtBookings,
            'facilities' => $facilities,
            'counts' => $counts,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ],
        ]);
    }

    public function getLockedSlots(Request $request, $courtId)
    {
        $date = $request->query('date');
        $clientId = $request->query('idempotency_key');
        if (! $date) {
            return response()->json(['locked_slots' => [], 'next_day_locked_slots' => []]);
        }

        $nextDate = Carbon::parse($date)->addDay()->toDateString();

        return response()->json([
            'locked_slots' => $this->heldHours($courtId, $date, $clientId),
            // A session that runs past midnight holds hours on the next calendar day.
            'next_day_locked_slots' => $this->heldHours($courtId, $nextDate, $clientId),
        ]);
    }

    /**
     * Hold keys for one court/date that belong to another client.
     *
     * @return array<int, string>
     */
    private function heldHours(int|string $courtId, string $date, ?string $clientId): array
    {
        $locked = [];

        for ($i = 0; $i < 24; $i++) {
            $hour = str_pad((string) $i, 2, '0', STR_PAD_LEFT).':00';
            $key = "court_hold_{$courtId}_{$date}_{$hour}";

            if (Cache::has($key) && Cache::get($key) !== $clientId) {
                $locked[] = $hour;
            }
        }

        return $locked;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $isDeskBooking = in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF'], true);

        //  Validate the incoming data
        $validated = $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'court_id' => 'required|exists:courts,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            // `after:start_time` is intentionally omitted — overnight bookings have end < start.
            'end_time' => 'required|date_format:H:i|different:start_time',
            // Kept for older clients; the amount is always recalculated server-side.
            'total_price' => 'required|numeric|min:0',
            // Only owners/staff logging a desk booking may name a walk-in player.
            'guest_name' => ['nullable', 'string', 'max:255', Rule::prohibitedIf(! $isDeskBooking)],
            'booking_type' => ['nullable', Rule::in(['walk_in', 'staff_block']), Rule::prohibitedIf(! $isDeskBooking)],
            'rate_plan_id' => 'nullable|integer|exists:rate_plans,id',
            'addons' => 'nullable|array',
            'addons.*.rate_plan_id' => 'required|integer|exists:rate_plans,id',
            'addons.*.quantity' => 'required|integer|min:0|max:50',
        ]);

        // Resolve the session into real datetimes (an end before the start means
        // the booking runs past midnight, e.g. 10:00 PM → 12:00 AM).
        $range = $this->resolveTimeRange($validated['date'], $validated['start_time'], $validated['end_time']);

        // Prevent Double Booking — works across calendar-date boundaries.
        if ($this->hasConflict($validated['court_id'], null, $range['start'], $range['end'])) {
            return back()->withErrors(['conflict' => 'Sorry, this court is already booked for that time.']);
        }

        $court = Court::findOrFail($validated['court_id']);
        $facility = $court->facility()->firstOrFail();

        // The booking channel decides which system fee applies. Players always
        // book online; owners/staff log walk-ins or fee-free court blocks.
        if ($isDeskBooking) {
            $managedFacilityIds = $user->role === 'FACILITY_OWNER'
                ? $user->facilities()->pluck('id')
                : collect([$user->facility_id]);

            if (! $managedFacilityIds->contains($facility->id)) {
                abort(403, 'You can only log walk-ins for your own facility.');
            }

            $bookingType = $validated['booking_type']
                ?? (! empty($validated['guest_name']) ? 'walk_in' : 'staff_block');

            $source = $bookingType === 'staff_block' ? 'staff_block' : 'walk_in';
            $userId = null;
            $guestName = ($validated['guest_name'] ?? null) ?: ($source === 'staff_block' ? 'Court block' : 'Walk-in');
        } else {
            $source = 'online';
            $userId = $user->id;
            $guestName = null;
        }

        // The court's operating schedule is authoritative: sessions must finish
        // inside its window (always at least until midnight, up to 2:00 AM).
        $this->assertWithinOperatingHours($court, $range);

        $plan = ! empty($validated['rate_plan_id'])
            ? RatePlan::findOrFail($validated['rate_plan_id'])
            : null;

        try {
            $quote = (new RateQuote)->forBooking(
                $court,
                $validated['start_time'],
                $validated['end_time'],
                $plan,
                $validated['addons'] ?? [],
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'rate_plan_id' => $exception->getMessage(),
            ]);
        }

        $subtotal = $quote['subtotal'];

        // Only courts with no configured rate at all (legacy rows) accept the
        // previewed amount; every configured court is priced server-side.
        if ($plan === null && $subtotal <= 0 && $this->courtHasNoConfiguredRate($court)) {
            $subtotal = round((float) $validated['total_price'], 2);
            $quote['subtotal'] = $subtotal;
        }

        $addonsTotal = $quote['addons_total'];
        // The platform fee is charged on the full booking value (package + add-ons)
        // and depends on the channel: online, walk-in, or a fee-free court block.
        $bookingFee = $facility->calculateBookingFee($subtotal + $addonsTotal, $source);
        $finalPrice = round($subtotal + $addonsTotal + $bookingFee, 2);

        // Create the booking
        $booking = Booking::create([
            'facility_id' => $facility->id,
            'user_id' => $userId,
            'guest_name' => $guestName,
            'court_id' => $validated['court_id'],
            'rate_plan_id' => $quote['rate_plan_id'],
            'rate_plan_name' => $quote['rate_plan_name'],
            'date' => $validated['date'],
            'end_date' => $range['end_date'],
            'start_time' => $this->normalizeTime($validated['start_time']),
            'end_time' => $this->normalizeTime($validated['end_time']),
            'subtotal' => $subtotal,
            'addons_total' => $addonsTotal,
            'booking_fee' => $bookingFee,
            'total_price' => $finalPrice,
            'price_breakdown' => $quote,
            'status' => 'pending',
            'source' => $source,
        ]);

        // Handle Payment if present
        if ($request->has('payment_method')) {
            $proofPath = null;
            if ($request->hasFile('proof_file')) {
                $proofPath = $request->file('proof_file')->store('payments', 'public');
            }

            $booking->payment()->create([
                'user_id' => $userId,
                'amount' => $finalPrice,
                'payment_method' => $request->input('payment_method'),
                'proof_path' => $proofPath,
                'status' => 'pending',
            ]);
        }

        //  Register the player to the facility's player list (online bookings only)
        if (! $isDeskBooking) {
            $facility->players()->syncWithoutDetaching([
                $user->id => ['status' => 'ACTIVE'],
            ]);
        }

        //  Notify the facility's owner and staff (not the person logging it)
        $notifiables = collect([$facility->owner])
            ->merge($facility->staff->where('role', 'FACILITY_STAFF'))
            ->unique('id')
            ->filter()
            ->reject(fn ($notifiable) => $notifiable->id === $user->id);

        $notifiables->each(fn ($notifiable) => $notifiable->notify(new BookingRequested($booking)));

        //  Return success
        return back()->with('success', 'Booking submitted successfully. Awaiting confirmation.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Booking $booking)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Booking $booking)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booking $booking)
    {
        $user = $request->user();

        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (! $facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'cancelled'])],
        ]);

        $booking->update(['status' => $validated['status']]);

        if ($validated['status'] === 'cancelled' && $booking->payment?->status === 'pending') {
            $booking->payment->update(['status' => 'rejected']);
        }

        return redirect()->back()->with('success', 'Booking updated successfully.');
    }

    /**
     * Move an existing booking to a different date and/or time slot.
     *
     * The court and the player stay the same; only the schedule changes, and the
     * price is re-quoted from the court's current rate card for the new duration.
     */
    public function reschedule(Request $request, Booking $booking)
    {
        $user = $request->user();

        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (! $facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        if ($booking->status === 'cancelled') {
            return back()->withErrors(['booking' => 'Cancelled bookings can no longer be rescheduled.']);
        }

        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            // `after:start_time` omitted — overnight bookings have end < start.
            'end_time' => ['required', 'date_format:H:i', 'different:start_time'],
            'rate_plan_id' => ['nullable', 'integer', 'exists:rate_plans,id'],
            'addons' => ['nullable', 'array'],
            'addons.*.rate_plan_id' => ['required_with:addons', 'integer', 'exists:rate_plans,id'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:0', 'max:50'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['pending', 'verified', 'rejected'])],
            // Owners may correct the system fee on a walk-in (including 0).
            'booking_fee' => ['nullable', 'numeric', 'min:0', 'max:100000'],
        ]);

        $range = $this->resolveTimeRange($validated['date'], $validated['start_time'], $validated['end_time']);

        if ($this->hasConflict($booking->court_id, $booking->id, $range['start'], $range['end'])) {
            return back()->withErrors(['start_time' => 'This court is already booked for the selected time slot.']);
        }

        // Re-quote and re-open the session on the same court, so the court's
        // operating window still applies after a move.
        $booking->loadMissing('court');
        $this->assertWithinOperatingHours($booking->court, $range);

        $previousTotal = round((float) $booking->total_price, 2);
        $previousFee = round((float) $booking->booking_fee, 2);

        $feeOverride = ($booking->source ?? 'online') !== 'online'
            && array_key_exists('booking_fee', $validated) && $validated['booking_fee'] !== null
            ? round((float) $validated['booking_fee'], 2)
            : null;

        // Re-saving the same amount is not an override — keep the fee's origin.
        if ($feeOverride !== null && $feeOverride === $previousFee) {
            $feeOverride = null;
        }

        // Booked amounts are frozen once the facility's month is billed.
        if ($feeOverride !== null && $feeOverride !== $previousFee
            && $this->monthIsBilled($booking)) {
            return back()->withErrors([
                'booking_fee' => 'This booking belongs to a month that is already billed; its system fee can no longer be changed.',
            ]);
        }

        try {
            $booking = DB::transaction(fn () => $this->applyReschedule(
                Booking::query()->lockForUpdate()->findOrFail($booking->id),
                $validated['date'],
                $range['end_date'],
                $validated['start_time'],
                $validated['end_time'],
                $validated['rate_plan_id'] ?? null,
                $validated['addons'] ?? null,
                $feeOverride,
            ));
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['start_time' => $exception->getMessage()]);
        }

        $booking->loadMissing(['court', 'facility', 'user', 'payment']);
        $booking->user?->notify(new BookingRescheduled($booking));

        $message = 'Booking rescheduled successfully.';

        if (round((float) $booking->total_price, 2) !== $previousTotal && $booking->payment?->status === 'verified') {
            $message .= ' The new total is ₱'.number_format((float) $booking->total_price, 2)
                .'; the verified payment amount was left unchanged.';
        }

        $paymentEdits = array_filter([
            'payment_method' => $validated['payment_method'] ?? null,
            'amount' => $validated['payment_amount'] ?? null,
            'status' => $validated['payment_status'] ?? null,
        ], fn ($value) => $value !== null);

        if ($paymentEdits !== []) {
            if ($booking->payment) {
                $booking->payment->update($paymentEdits);
            } else {
                $booking->payment()->create(array_merge([
                    'user_id' => $booking->user_id,
                    'amount' => $booking->total_price,
                    'payment_method' => 'cash',
                    'status' => 'pending',
                ], $paymentEdits));
            }

            $message = 'Booking updated successfully.';
        }

        if ($feeOverride !== null && $feeOverride !== $previousFee) {
            $message .= ' The system fee is now ₱'.number_format($feeOverride, 2).'.';
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Store a rescheduled date/time (and, optionally, a new rate plan / add-ons,
     * or a corrected system fee) on the booking and re-quote its price.
     *
     * @param  array<int, array{rate_plan_id?: mixed, quantity?: mixed}>|null  $addons
     *
     * @throws InvalidArgumentException when the chosen rate plan is no longer offered by the court
     */
    private function applyReschedule(Booking $booking, string $date, ?string $endDate, string $startTime, string $endTime, ?int $ratePlanId = null, ?array $addons = null, ?float $feeOverride = null): Booking
    {
        $startTime = strlen($startTime) === 5 ? $startTime.':00' : $startTime;
        $endTime = strlen($endTime) === 5 ? $endTime.':00' : $endTime;

        $booking->loadMissing(['court', 'facility', 'ratePlan', 'payment']);

        $plan = $ratePlanId !== null
            ? RatePlan::findOrFail($ratePlanId)
            : $booking->ratePlan;

        $addonLines = $addons !== null
            ? collect($addons)
            : collect($booking->price_breakdown['addons'] ?? []);

        $addonLines = $addonLines
            ->map(fn ($line) => [
                'rate_plan_id' => $line['rate_plan_id'] ?? null,
                'quantity' => $line['quantity'] ?? 0,
            ])
            ->filter(fn ($line) => ! empty($line['rate_plan_id']))
            ->values()
            ->all();

        $quote = (new RateQuote)->forBooking($booking->court, $startTime, $endTime, $plan, $addonLines);

        $subtotal = $quote['subtotal'];

        // Courts with no configured rate at all keep the court charge they were booked at.
        if ($plan === null && $subtotal <= 0 && $this->courtHasNoConfiguredRate($booking->court)) {
            $subtotal = round($booking->subtotal !== null
                ? (float) $booking->subtotal
                : max(0, (float) $booking->total_price - (float) $booking->booking_fee - (float) $booking->addons_total), 2);
            $quote['subtotal'] = $subtotal;
        }

        $addonsTotal = $quote['addons_total'];
        $previousFee = round((float) $booking->booking_fee, 2);
        $channel = $booking->source ?: 'online';

        if ($feeOverride !== null) {
            // The owner explicitly corrected the fee for this booking.
            $bookingFee = $feeOverride;
            $feeSource = 'manual_override';
        } elseif ($channel !== 'online') {
            // Walk-ins keep the fee they were logged with; changing the fee is an
            // explicit action from the Edit Booking screen.
            $bookingFee = $previousFee;
            $feeSource = $channel;
        } else {
            $bookingFee = $booking->facility->calculateBookingFee($subtotal + $addonsTotal, 'online');
            $feeSource = 'online';
        }

        $totalPrice = round($subtotal + $addonsTotal + $bookingFee, 2);

        // Keep an audit trail of fee changes inside the existing price snapshot.
        $quote['fee'] = ['amount' => $bookingFee, 'source' => $feeSource];
        if ($feeOverride !== null && $bookingFee !== $previousFee) {
            $quote['fee']['previous'] = $previousFee;
        }

        $booking->update([
            'date' => $date,
            'end_date' => $endDate,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'rate_plan_id' => $quote['rate_plan_id'],
            'rate_plan_name' => $quote['rate_plan_name'],
            'subtotal' => $subtotal,
            'addons_total' => $addonsTotal,
            'booking_fee' => $bookingFee,
            'total_price' => $totalPrice,
            'price_breakdown' => $quote,
        ]);

        // A payment that has not been verified yet still owes the new total.
        if ($booking->payment && $booking->payment->status !== 'verified') {
            $booking->payment->update(['amount' => $totalPrice]);
        }

        return $booking;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Booking $booking)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to manage bookings for
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (! $facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $booking->delete();

        return redirect()->back()->with('success', 'Booking deleted successfully.');
    }

    public function verifyPayment(Request $request, Booking $booking)
    {
        $user = $request->user();

        // Check permissions
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (! $facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        DB::transaction(function () use ($booking): void {
            $booking = Booking::query()->lockForUpdate()->findOrFail($booking->id);

            abort_if($booking->status === 'cancelled', 409, 'Cancelled bookings cannot be verified.');

            $wasAlreadyConfirmed = $booking->status === 'confirmed';

            if (! $wasAlreadyConfirmed) {
                $booking->update(['status' => 'confirmed']);
                $booking->loadMissing(['court', 'facility']);
                $booking->user?->notify(new BookingConfirmed($booking));
            }

            // Update existing payment or create one (walk-in bookings may have no payment record).
            if ($booking->payment) {
                $booking->payment->update(['status' => 'verified']);
            } else {
                $booking->payment()->create([
                    'amount' => $booking->total_price,
                    'payment_method' => 'cash',
                    'status' => 'verified',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Payment verified successfully.');
    }

    public function rejectPayment(Request $request, Booking $booking)
    {
        $user = $request->user();

        // Check permissions
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        if (! $facilityIds->contains($booking->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $booking->update(['status' => 'cancelled']);
        if ($booking->payment) {
            $booking->payment->update(['status' => 'rejected']);
        }

        return redirect()->back()->with('success', 'Booking rejected. The time slot is now available.');
    }

    /**
     * Check whether a proposed time range conflicts with any existing active booking
     * on the given court, optionally excluding one booking (for reschedule checks).
     *
     * Existing sessions are compared as full datetimes, so an overnight booking
     * (stored with an `end_date`) overlaps correctly with the next calendar day.
     */
    private function hasConflict(int|string $courtId, ?int $excludeBookingId, Carbon $newStart, Carbon $newEnd): bool
    {
        return Booking::query()
            ->where('court_id', $courtId)
            ->where('status', '!=', 'cancelled')
            ->when($excludeBookingId, fn ($query) => $query->whereKeyNot($excludeBookingId))
            ->whereBetween('date', [
                $newStart->copy()->subDay()->toDateString(),
                $newEnd->toDateString(),
            ])
            ->get(['id', 'date', 'end_date', 'start_time', 'end_time'])
            ->some(function (Booking $booking) use ($newStart, $newEnd) {
                return $newStart->lt($booking->endsAt()) && $newEnd->gt($booking->startsAt());
            });
    }

    /**
     * Resolve a booking date + start/end times into concrete datetimes.
     *
     * @return array{start: Carbon, end: Carbon, end_date: string|null, duration_hours: int}
     */
    private function resolveTimeRange(string $date, string $startTime, string $endTime): array
    {
        $start = Carbon::parse($date.' '.$this->normalizeTime($startTime));
        $end = Carbon::parse($date.' '.$this->normalizeTime($endTime));

        if ($end->lte($start)) {
            $end->addDay();
        }

        return [
            'start' => $start,
            'end' => $end,
            'end_date' => $end->toDateString() !== $start->toDateString() ? $end->toDateString() : null,
            'duration_hours' => max(0, (int) $start->diffInHours($end)),
        ];
    }

    private function normalizeTime(string $time): string
    {
        return strlen($time) === 5 ? $time.':00' : $time;
    }

    /**
     * Reject sessions outside the court's bookable window.
     *
     * @param  array{start: Carbon, end: Carbon, duration_hours: int}  $range
     *
     * @throws ValidationException
     */
    private function assertWithinOperatingHours(Court $court, array $range, string $errorKey = 'start_time'): void
    {
        if ($range['duration_hours'] < 1) {
            throw ValidationException::withMessages([$errorKey => 'A booking must last at least one hour.']);
        }

        if ($range['duration_hours'] > 24) {
            throw ValidationException::withMessages([$errorKey => 'A booking cannot be longer than 24 hours.']);
        }

        $hours = $court->operatingHours();
        $startMinutes = $range['start']->hour * 60 + $range['start']->minute;
        $endMinutes = $range['end']->hour * 60 + $range['end']->minute;

        if (! $hours->contains($startMinutes, $endMinutes)) {
            throw ValidationException::withMessages([
                $errorKey => "This court can only be booked between {$hours->describe()}.",
            ]);
        }
    }

    /**
     * True when a court has no hourly, day or night rate configured at all.
     */
    private function courtHasNoConfiguredRate(Court $court): bool
    {
        return (float) ($court->hourly_rate ?? 0) <= 0
            && (float) ($court->day_rate ?? 0) <= 0
            && (float) ($court->night_rate ?? 0) <= 0;
    }

    /**
     * Whether the facility's monthly booking-fee collection for this booking's
     * month has already been marked as billed.
     */
    private function monthIsBilled(Booking $booking): bool
    {
        return FacilityBilling::query()
            ->where('facility_id', $booking->facility_id)
            ->where('period', Carbon::parse($booking->date)->format('Y-m'))
            ->where('status', 'BILLED')
            ->exists();
    }

    public function lockSlot(Request $request)
    {
        $request->validate([
            'court_id' => 'required',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $clientId = $request->idempotency_key ?? 'unknown';
        $keysToLock = $this->holdKeys($request->court_id, $request->date, $request->start_time, $request->end_time);

        // Check if ANY hour in the range is already locked by someone else!
        foreach ($keysToLock as $cacheKey) {
            if (Cache::has($cacheKey) && Cache::get($cacheKey) !== $clientId) {
                return response()->json(['locked' => true], 423); // 423 means Locked
            }
        }

        // Prevent Slot Hoarding: release hours this client held before but no longer needs.
        if ($clientId !== 'unknown') {
            $previousLocks = Cache::get("active_locks_{$clientId}", []);

            foreach ($previousLocks as $oldKey) {
                if (! in_array($oldKey, $keysToLock, true) && Cache::get($oldKey) === $clientId) {
                    Cache::forget($oldKey);
                }
            }

            Cache::put("active_locks_{$clientId}", $keysToLock, now()->addMinutes(7));
        }

        // Every requested hour is free — hold all of them for 7 minutes.
        foreach ($keysToLock as $key) {
            Cache::put($key, $clientId, now()->addMinutes(7));
        }

        return response()->json(['locked' => false]);
    }

    public function unlockSlot(Request $request)
    {
        $clientId = $request->idempotency_key;

        if (! $clientId) {
            return response()->json(['success' => false], 400);
        }

        $keys = $this->holdKeys($request->court_id, (string) $request->date, (string) $request->start_time, (string) $request->end_time);

        foreach ($keys as $cacheKey) {
            if (Cache::get($cacheKey) === $clientId) {
                Cache::forget($cacheKey);
            }
        }

        Cache::forget("active_locks_{$clientId}");

        return response()->json(['success' => true]);
    }

    /**
     * Cache keys covering every hour a session occupies, including hours on the
     * next calendar day when the session runs past midnight.
     *
     * @return array<int, string>
     */
    private function holdKeys(int|string $courtId, string $date, string $startTime, string $endTime): array
    {
        $start = OperatingHours::clockToMinutes(substr($startTime, 0, 5)) ?? 0;
        $end = OperatingHours::clockToMinutes(substr($endTime, 0, 5)) ?? 0;

        if ($end <= $start) {
            $end += OperatingHours::MINIMUM_CLOSE_MINUTES;
        }

        $keys = [];

        for ($minutes = $start; $minutes < $end; $minutes += 60) {
            $dayOffset = intdiv($minutes, OperatingHours::MINIMUM_CLOSE_MINUTES);
            $slotDate = $dayOffset === 0
                ? $date
                : Carbon::parse($date)->addDays($dayOffset)->toDateString();
            $hour = intdiv($minutes % OperatingHours::MINIMUM_CLOSE_MINUTES, 60);

            $keys[] = "court_hold_{$courtId}_{$slotDate}_".str_pad((string) $hour, 2, '0', STR_PAD_LEFT).':00';
        }

        return $keys;
    }
}
