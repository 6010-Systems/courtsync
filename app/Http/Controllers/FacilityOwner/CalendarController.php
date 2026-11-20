<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Facility;
use App\Support\FacilityScope;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    /**
     * Month calendar of bookings for the facilities the user manages.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless(in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF'], true), 403);

        $validated = $request->validate([
            'month' => ['sometimes', 'nullable', 'date_format:Y-m'],
            'facility_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        $facilityIds = FacilityScope::idsFor($user);
        $facilityId = isset($validated['facility_id']) ? (int) $validated['facility_id'] : null;

        if ($facilityId && ! $facilityIds->contains($facilityId)) {
            abort(403, 'Unauthorized action.');
        }

        $month = $validated['month'] ?? now()->format('Y-m');
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $bookings = Booking::query()
            ->whereIn('facility_id', $facilityId ? [$facilityId] : $facilityIds)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->with(['court:id,facility_id,name,type', 'facility:id,name', 'user:id,name,email,avatar', 'payment'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get()
            ->map(fn (Booking $booking) => [
                'id' => $booking->id,
                'court_id' => $booking->court_id,
                'facility_id' => $booking->facility_id,
                'date' => $booking->date,
                'start_time' => $booking->start_time,
                'end_time' => $booking->end_time,
                'court' => $booking->court?->name ?? 'Court',
                'court_type' => $booking->court?->type ?? 'Standard',
                'facility' => $booking->facility?->name ?? '',
                'player' => $booking->user?->name ?? $booking->guest_name ?? 'Walk-in',
                'guest_name' => $booking->guest_name,
                'user' => $booking->user ? [
                    'id' => $booking->user->id,
                    'name' => $booking->user->name,
                    'email' => $booking->user->email,
                    'avatar' => $booking->user->avatar,
                ] : null,
                'payment' => $booking->payment ? [
                    'status' => $booking->payment->status,
                    'payment_method' => $booking->payment->payment_method,
                    'reference_number' => $booking->payment->reference_number,
                ] : null,
                'status' => $booking->status,
                'total_price' => round((float) $booking->total_price, 2),
            ]);

        return Inertia::render('FacilityOwner/Calendar', [
            'filters' => [
                'month' => $month,
                'facility_id' => $facilityId,
            ],
            'monthLabel' => $start->format('F Y'),
            'today' => now()->toDateString(),
            'bookings' => $bookings,
            'facilities' => Facility::query()
                ->whereIn('id', $facilityIds)
                ->with(['courts:id,facility_id,name,type,hourly_rate,day_rate,night_rate,status'])
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
