<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Notifications\BookingConfirmed;
use App\Notifications\BookingRequested;
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
            ->with(['user:id,name,email', 'court:id,name', 'facility:id,name', 'payment:id,booking_id,amount,status,payment_method,proof_path']);

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
            ->get();

        $countQuery = Booking::query()->whereIn('facility_id', $facilityIds);

        $counts = [
            'all' => (clone $countQuery)->count(),
            'today' => (clone $countQuery)->where('date', now()->toDateString())->count(),
            'upcoming' => (clone $countQuery)->where('date', '>', now()->toDateString())->count(),
            'pending' => (clone $countQuery)->where('status', 'pending')->count(),
        ];

        return inertia('Facility/Bookings', [
            'bookings' => $bookings,
            'facilities' => $facilities,
            'counts' => $counts,
            'filters' => [
                'search' => $search,
                'filter' => $filter,
            ],
        ]);
    }

    public function calendar(Request $request)
    {
        $user = $request->user();

        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        } elseif ($user->role === 'ADMIN') {
            $facilityIds = Facility::pluck('id');
        }

        $facilities = Facility::whereIn('id', $facilityIds)
            ->with(['courts:id,facility_id,name,type,hourly_rate,day_rate,night_rate,status'])
            ->get();

        $bookings = Booking::whereIn('facility_id', $facilityIds)
            ->with(['user:id,name,email,avatar', 'court:id,name,type', 'facility:id,name', 'payment'])
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return inertia('Facility/Calendar', [
            'facilities' => $facilities,
            'bookings' => $bookings,
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

        //  Prevent Double Booking
        $reqStart = strlen($validated['start_time']) === 5 ? $validated['start_time'].':00' : $validated['start_time'];
        $reqEnd = strlen($validated['end_time']) === 5 ? $validated['end_time'].':00' : $validated['end_time'];

        $conflict = Booking::where('court_id', $validated['court_id'])
            ->where('date', $validated['date'])
            ->where(function ($query) use ($reqStart, $reqEnd) {
                // A requested time [A, B] overlaps with an existing time [C, D] if A < D and B > C.
                $query->where('start_time', '<', $reqEnd)
                    ->where('end_time', '>', $reqStart);
            })
            ->whereNotIn(DB::raw('LOWER(status)'), ['cancelled', 'rejected'])
            ->with(['user:id,name', 'court:id,name'])
            ->first();

        if ($conflict) {
            $conflictHost = $conflict->user?->name ?? $conflict->guest_name ?? 'another player';
            $conflictStart = date('g:i A', strtotime($conflict->start_time));
            $conflictEnd = date('g:i A', strtotime($conflict->end_time));

            return back()->withErrors([
                'conflict' => "Sorry, this court is already booked by {$conflictHost} from {$conflictStart} to {$conflictEnd}.",
                'start_time' => 'This time slot overlaps with an existing reservation.',
            ]);
        }

        // Determine user_id based on whether a guest name is provided
        $userId = ! empty($validated['guest_name']) ? null : $user->id;

        $court = Court::findOrFail($validated['court_id']);
        $facility = $court->facility()->firstOrFail();

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

        // Create the booking
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

        //  Register the player to the facility's player list
        $facility->players()->syncWithoutDetaching([
            $user->id => ['status' => 'ACTIVE'],
        ]);

        //  Notify the facility owner and staff that a new booking awaits confirmation
        $notifiables = collect([$facility->owner])
            ->merge($facility->staff->where('role', 'FACILITY_STAFF'))
            ->unique('id')
            ->filter();

        $notifiables->each(fn ($user) => $user->notify(new BookingRequested($booking)));

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

            if ($booking->status === 'confirmed') {
                return;
            }

            abort_unless($booking->status === 'pending', 409, 'Only pending bookings can be confirmed.');

            $booking->update(['status' => 'confirmed']);
            $booking->payment()->update(['status' => 'verified']);
            $booking->loadMissing(['court', 'facility']);
            $booking->user?->notify(new BookingConfirmed($booking));
        });

        return redirect()->back()->with('success', 'Booking and payment verified successfully.');
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

    public function lockSlot(Request $request)
    {
        Log::info('lockSlot called with payload: ', $request->all());

        $request->validate([
            'court_id' => 'required',
            'date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $startHour = (int) explode(':', $request->start_time)[0];
        $endHour = (int) explode(':', $request->end_time)[0];

        $keysToLock = [];
        $clientId = $request->idempotency_key ?? 'unknown';

        // Check if ANY hour in the range is already locked by someone else!
        for ($i = $startHour; $i < $endHour; $i++) {
            $formattedHour = str_pad($i, 2, '0', STR_PAD_LEFT).':00';
            $cacheKey = "court_hold_{$request->court_id}_{$request->date}_{$formattedHour}";

            if (Cache::has($cacheKey)) {
                $heldBy = Cache::get($cacheKey);
                if ($heldBy !== $clientId) {
                    return response()->json(['locked' => true], 423); // 423 means Locked
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
