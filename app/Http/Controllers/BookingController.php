<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
use App\Notifications\BookingRescheduled;
use App\Support\BookingSlotGuard;
use App\Support\FacilityAvailability;
use App\Support\RateCardLoader;
use App\Support\RateQuote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) {
                $query->where('date', '>', now()->toDateString())
                    ->orWhere(function ($sameDay) {
                        $sameDay->where('date', now()->toDateString())
                            ->where('end_time', '>', now()->format('H:i:s'));
                    });
            })
            ->with(['user:id,name', 'court:id,name', 'facility:id,name'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        // Lightweight slot map so the reschedule form can grey out taken hours.
        $courtBookings = Booking::query()
            ->whereIn('facility_id', $facilityIds)
            ->where('status', '!=', 'cancelled')
            ->where('date', '>=', now()->toDateString())
            ->get(['id', 'court_id', 'date', 'start_time', 'end_time', 'status']);

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
            return response()->json(['locked_slots' => []]);
        }

        $locked = [];
        Log::info('getLockedSlots called! URL clientId: '.($clientId ?? 'NULL'));

        for ($i = 0; $i < 24; $i++) {
            $hour = str_pad($i, 2, '0', STR_PAD_LEFT).':00';
            $key = "court_hold_{$courtId}_{$date}_{$hour}";
            if (Cache::has($key)) {
                $heldBy = Cache::get($key);
                Log::info("Slot {$hour} is held by: {$heldBy}. Does it match? ".($heldBy === $clientId ? 'YES' : 'NO'));
                if ($heldBy !== $clientId) {
                    $locked[] = $hour;
                }
            }
        }

        return response()->json([
            'locked_slots' => $locked,
            'debug_clientId' => $clientId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //  Validate the incoming data
        $validated = $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'court_id' => 'required|exists:courts,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            // Kept for older clients; the amount is always recalculated server-side.
            'total_price' => 'required|numeric|min:0',
            'guest_name' => 'nullable|string|max:255',
            'rate_plan_id' => 'nullable|integer|exists:rate_plans,id',
            'addons' => 'nullable|array',
            'addons.*.rate_plan_id' => 'required|integer|exists:rate_plans,id',
            'addons.*.quantity' => 'required|integer|min:0|max:50',
        ]);

        $user = $request->user();

        $court = Court::findOrFail($validated['court_id']);
        $facility = $court->facility()->firstOrFail();

        if ((int) $facility->id !== (int) $validated['facility_id']) {
            throw ValidationException::withMessages([
                'court_id' => 'This court does not belong to the selected facility.',
            ]);
        }

        (new FacilityAvailability)->assertBookable(
            $facility,
            $court,
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
        );

        // Determine user_id based on whether a guest name is provided
        $userId = ! empty($validated['guest_name']) ? null : $user->id;

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

        // Legacy courts with no configured rate still accept the previewed amount.
        if ($plan === null && $subtotal <= 0) {
            $subtotal = round((float) $validated['total_price'], 2);
            $quote['subtotal'] = $subtotal;
        }

        $addonsTotal = $quote['addons_total'];
        // The platform fee is charged on the full booking value (package + add-ons).
        $bookingFee = $facility->calculateBookingFee($subtotal + $addonsTotal);
        $finalPrice = round($subtotal + $addonsTotal + $bookingFee, 2);

        $proofPath = null;
        if ($request->has('payment_method') && $request->hasFile('proof_file')) {
            $proofPath = $request->file('proof_file')->store('payments', 'public');
        }

        $booking = (new BookingSlotGuard)->claim(
            $court,
            $validated['date'],
            $validated['start_time'],
            $validated['end_time'],
            function () use ($facility, $user, $userId, $validated, $quote, $subtotal, $addonsTotal, $bookingFee, $finalPrice, $request, $proofPath) {
                $booking = Booking::create([
                    'facility_id' => $facility->id,
                    'user_id' => $userId,
                    'guest_name' => $validated['guest_name'] ?? null,
                    'court_id' => $validated['court_id'],
                    'rate_plan_id' => $quote['rate_plan_id'],
                    'rate_plan_name' => $quote['rate_plan_name'],
                    'date' => $validated['date'],
                    'start_time' => $validated['start_time'],
                    'end_time' => $validated['end_time'],
                    'subtotal' => $subtotal,
                    'addons_total' => $addonsTotal,
                    'booking_fee' => $bookingFee,
                    'total_price' => $finalPrice,
                    'price_breakdown' => $quote,
                    'status' => 'pending',
                ]);

                if ($request->has('payment_method')) {
                    $booking->payment()->create([
                        'user_id' => $userId,
                        'amount' => $finalPrice,
                        'payment_method' => $request->input('payment_method'),
                        'proof_path' => $proofPath,
                        'status' => 'pending',
                    ]);
                }

                $facility->players()->syncWithoutDetaching([
                    $user->id => ['status' => 'ACTIVE'],
                ]);

                return $booking;
            },
        );

        // Notify after commit so a rolled-back conflict never emails staff.
        $notifiables = collect([$facility->owner])
            ->merge($facility->staff->where('role', 'FACILITY_STAFF'))
            ->unique('id')
            ->filter();

        $notifiables->each(fn ($notifiable) => $notifiable->notify(new BookingRequested($booking)));

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
        $this->authorize('update', $booking);

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
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'rate_plan_id' => ['nullable', 'integer', 'exists:rate_plans,id'],
            'addons' => ['nullable', 'array'],
            'addons.*.rate_plan_id' => ['required_with:addons', 'integer', 'exists:rate_plans,id'],
            'addons.*.quantity' => ['required_with:addons', 'integer', 'min:0', 'max:50'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['pending', 'verified', 'rejected'])],
        ]);

        $conflict = Booking::query()
            ->where('court_id', $booking->court_id)
            ->whereKeyNot($booking->id)
            ->where('date', $validated['date'])
            ->where('status', '!=', 'cancelled')
            ->where(function ($query) use ($validated) {
                // A requested time [A, B] overlaps an existing time [C, D] if A < D and B > C.
                $query->where('start_time', '<', $validated['end_time'])
                    ->where('end_time', '>', $validated['start_time']);
            })
            ->exists();

        if ($conflict) {
            return back()->withErrors(['start_time' => 'This court is already booked for the selected time slot.']);
        }

        $previousTotal = round((float) $booking->total_price, 2);

        try {
            $booking = DB::transaction(fn () => $this->applyReschedule(
                Booking::query()->lockForUpdate()->findOrFail($booking->id),
                $validated['date'],
                $validated['start_time'],
                $validated['end_time'],
                $validated['rate_plan_id'] ?? null,
                $validated['addons'] ?? null,
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

        return redirect()->back()->with('success', $message);
    }

    /**
     * Store a rescheduled date/time (and, optionally, a new rate plan / add-ons)
     * on the booking and re-quote its price.
     *
     * @param  array<int, array{rate_plan_id?: mixed, quantity?: mixed}>|null  $addons
     *
     * @throws InvalidArgumentException when the chosen rate plan is no longer offered by the court
     */
    private function applyReschedule(Booking $booking, string $date, string $startTime, string $endTime, ?int $ratePlanId = null, ?array $addons = null): Booking
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

        // Legacy courts with no configured rate keep the court charge they were booked at.
        if ($plan === null && $subtotal <= 0) {
            $subtotal = round($booking->subtotal !== null
                ? (float) $booking->subtotal
                : max(0, (float) $booking->total_price - (float) $booking->booking_fee - (float) $booking->addons_total), 2);
            $quote['subtotal'] = $subtotal;
        }

        $addonsTotal = $quote['addons_total'];
        $bookingFee = $booking->facility->calculateBookingFee($subtotal + $addonsTotal);
        $totalPrice = round($subtotal + $addonsTotal + $bookingFee, 2);

        $booking->update([
            'date' => $date,
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
        $this->authorize('delete', $booking);

        $booking->delete();

        return redirect()->back()->with('success', 'Booking deleted successfully.');
    }

    public function verifyPayment(Request $request, Booking $booking)
    {
        $this->authorize('verify', $booking);

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
        $this->authorize('reject', $booking);

        $booking->update(['status' => 'cancelled']);
        if ($booking->payment) {
            $booking->payment->update(['status' => 'rejected']);
        }

        return redirect()->back()->with('success', 'Booking rejected. The time slot is now available.');
    }

    public function lockSlot(Request $request)
    {
        Log::info('lockSlot called with payload: ', $request->all());

        $request->validate([
            'court_id' => 'required',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $court = Court::findOrFail($request->court_id);
        $facility = $court->facility()->firstOrFail();
        $startTime = substr((string) $request->start_time, 0, 5);
        $endTime = substr((string) $request->end_time, 0, 5);

        $reason = (new FacilityAvailability)->reason(
            $facility,
            $court,
            $request->date,
            $startTime,
            $endTime,
        );

        if ($reason !== null) {
            return response()->json([
                'locked' => true,
                'code' => $reason['code'],
                'message' => $reason['message'],
            ], 422);
        }

        $startHour = (int) explode(':', $startTime)[0];
        $endHour = (int) explode(':', $endTime)[0];

        $keysToLock = [];
        $clientId = $request->idempotency_key ?? 'unknown';

        // Check if ANY hour in the range is already locked by someone else!
        for ($i = $startHour; $i < $endHour; $i++) {
            $formattedHour = str_pad($i, 2, '0', STR_PAD_LEFT).':00';
            $cacheKey = "court_hold_{$request->court_id}_{$request->date}_{$formattedHour}";

            if (Cache::has($cacheKey)) {
                $heldBy = Cache::get($cacheKey);
                if ($heldBy !== $clientId) {
                    return response()->json(['locked' => true, 'message' => 'Sorry, this court is already booked for that time.'], 423); // 423 means Locked
                }
            }
            $keysToLock[] = $cacheKey;
        }

        // If we made it here, every single hour they requested is completely free (or already held by them)!

        // Prevent Slot Hoarding!
        // Clear any previous times this user was holding that are not in their new selection
        if ($clientId !== 'unknown') {
            $previousLocks = Cache::get("active_locks_{$clientId}", []);
            foreach ($previousLocks as $oldKey) {
                if (! in_array($oldKey, $keysToLock)) {
                    $oldHeldBy = Cache::get($oldKey);
                    if ($oldHeldBy === $clientId) {
                        Cache::forget($oldKey);
                    }
                }
            }
            // Save their new active locks
            Cache::put("active_locks_{$clientId}", $keysToLock, now()->addMinutes(7));
        }

        // If we made it here, every single hour they requested is completely free!
        // Lock all of them for exactly 7 minutes!
        foreach ($keysToLock as $key) {
            Cache::put($key, $clientId, now()->addMinutes(7));
        }

        return response()->json(['locked' => false]);
    }

    public function unlockSlot(Request $request)
    {
        $courtId = $request->court_id;
        $date = $request->date;
        $startHour = (int) explode(':', $request->start_time)[0];
        $endHour = (int) explode(':', $request->end_time)[0];
        $clientId = $request->idempotency_key;

        if (! $clientId) {
            return response()->json(['success' => false], 400);
        }

        for ($i = $startHour; $i < $endHour; $i++) {
            $formattedHour = str_pad($i, 2, '0', STR_PAD_LEFT).':00';
            $cacheKey = "court_hold_{$courtId}_{$date}_{$formattedHour}";
            if (Cache::has($cacheKey)) {
                $heldBy = Cache::get($cacheKey);
                if ($heldBy === $clientId) {
                    Cache::forget($cacheKey);
                }
            }
        }

        return response()->json(['success' => true]);
    }
}
