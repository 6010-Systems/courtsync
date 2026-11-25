<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Facility;
use App\Models\FacilityBilling;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BookingFeeReport
{
    /**
     * Build the monthly booking-fee report for the given facilities.
     *
     * @param  Collection<int, int>  $facilityIds
     * @return array<string, mixed>
     */
    public function build(Collection $facilityIds, string $month, ?int $facilityId = null): array
    {
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $baseQuery = Booking::query()
            ->leftJoin('payments', 'payments.booking_id', '=', 'bookings.id')
            ->whereIn('bookings.facility_id', $facilityId ? [$facilityId] : $facilityIds)
            ->whereBetween('bookings.date', [$start->toDateString(), $end->toDateString()])
            ->where('bookings.booking_fee', '>', 0)
            ->where('bookings.status', '!=', 'cancelled');

        $summaryRows = (clone $baseQuery)
            ->selectRaw("bookings.facility_id as facility_id,
                COUNT(*) as bookings_count,
                COALESCE(SUM(bookings.subtotal), 0) as subtotal,
                COALESCE(SUM(bookings.booking_fee), 0) as booking_fee,
                COALESCE(SUM(CASE WHEN bookings.source = 'online' THEN bookings.booking_fee ELSE 0 END), 0) as online_fee,
                COALESCE(SUM(CASE WHEN bookings.source = 'walk_in' THEN bookings.booking_fee ELSE 0 END), 0) as walk_in_fee,
                COALESCE(SUM(bookings.total_price), 0) as total_price,
                COALESCE(SUM(CASE WHEN payments.status = 'verified' THEN bookings.booking_fee ELSE 0 END), 0) as collected_fee")
            ->groupBy('bookings.facility_id')
            ->get();

        $facilities = Facility::query()
            ->with('owner:id,name,email')
            ->whereIn('id', $summaryRows->pluck('facility_id'))
            ->get()
            ->keyBy('id');

        $billings = FacilityBilling::query()
            ->where('period', $month)
            ->whereIn('facility_id', $summaryRows->pluck('facility_id'))
            ->get()
            ->keyBy('facility_id');

        $rows = $summaryRows
            ->map(function ($row) use ($facilities, $billings) {
                $facility = $facilities->get($row->facility_id);
                $billing = $billings->get($row->facility_id);
                $bookingFee = round((float) $row->booking_fee, 2);
                $collectedFee = round((float) $row->collected_fee, 2);

                return [
                    'facility_id' => (int) $row->facility_id,
                    'name' => $facility?->name ?? 'Deleted facility',
                    'city' => $facility?->city,
                    'province' => $facility?->province,
                    'owner' => $facility?->owner?->name,
                    'owner_email' => $facility?->owner?->email,
                    'bookings_count' => (int) $row->bookings_count,
                    'subtotal' => round((float) $row->subtotal, 2),
                    'booking_fee' => $bookingFee,
                    'online_fee' => round((float) $row->online_fee, 2),
                    'walk_in_fee' => round((float) $row->walk_in_fee, 2),
                    'collected_fee' => $collectedFee,
                    'pending_fee' => round($bookingFee - $collectedFee, 2),
                    'total_price' => round((float) $row->total_price, 2),
                    'billing_status' => $billing?->status ?? 'UNBILLED',
                    'billed_at' => $billing?->billed_at?->toDateTimeString(),
                ];
            })
            ->sortByDesc('booking_fee')
            ->values();

        $selectedFacility = $facilityId ? Facility::query()->with('owner:id,name')->find($facilityId) : null;

        $breakdown = [];

        if ($selectedFacility) {
            $breakdown = Booking::query()
                ->where('facility_id', $selectedFacility->id)
                ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                ->where('booking_fee', '>', 0)
                ->where('status', '!=', 'cancelled')
                ->with(['court:id,name', 'user:id,name', 'payment:id,booking_id,status,payment_method'])
                ->orderBy('date')
                ->orderBy('start_time')
                ->get()
                ->map(fn (Booking $booking) => [
                    'id' => $booking->id,
                    'date' => $booking->date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'court' => $booking->court?->name ?? 'Unknown court',
                    'player' => $booking->user?->name ?? $booking->guest_name ?? 'Walk-in',
                    'source' => $booking->source ?? 'online',
                    'subtotal' => round((float) $booking->subtotal, 2),
                    'booking_fee' => round((float) $booking->booking_fee, 2),
                    'total_price' => round((float) $booking->total_price, 2),
                    'status' => $booking->status,
                    'payment_status' => $booking->payment?->status ?? 'unpaid',
                ])
                ->all();
        }

        $selectedBilling = $selectedFacility
            ? FacilityBilling::query()
                ->where('facility_id', $selectedFacility->id)
                ->where('period', $month)
                ->first()
            : null;

        return [
            'monthOptions' => $this->monthOptions($facilityIds),
            'facilityOptions' => Facility::query()
                ->whereIn('id', $facilityIds)
                ->orderBy('name')
                ->get(['id', 'name']),
            'summary' => [
                'facilities' => $rows->count(),
                'bookings' => $rows->sum('bookings_count'),
                'subtotal' => round($rows->sum('subtotal'), 2),
                'booking_fee' => round($rows->sum('booking_fee'), 2),
                'online_fee' => round($rows->sum('online_fee'), 2),
                'walk_in_fee' => round($rows->sum('walk_in_fee'), 2),
                'collected_fee' => round($rows->sum('collected_fee'), 2),
                'pending_fee' => round($rows->sum('pending_fee'), 2),
                'total_price' => round($rows->sum('total_price'), 2),
                'billed_facilities' => $rows->where('billing_status', 'BILLED')->count(),
                'unbilled_facilities' => $rows->where('billing_status', 'UNBILLED')->count(),
                'billed_fee' => round($rows->where('billing_status', 'BILLED')->sum('booking_fee'), 2),
                'unbilled_fee' => round($rows->where('billing_status', 'UNBILLED')->sum('booking_fee'), 2),
            ],
            'facilities' => $rows,
            'selectedFacility' => $selectedFacility ? [
                'id' => $selectedFacility->id,
                'name' => $selectedFacility->name,
                'owner' => $selectedFacility->owner?->name,
                'city' => $selectedFacility->city,
                'province' => $selectedFacility->province,
                'billing_status' => $selectedBilling?->status ?? 'UNBILLED',
                'billed_at' => $selectedBilling?->billed_at?->toDateTimeString(),
            ] : null,
            'breakdown' => $breakdown,
        ];
    }

    /**
     * Selectable months (most recent first), including the current month.
     *
     * @param  Collection<int, int>  $facilityIds
     * @return array<int, array{value: string, label: string}>
     */
    private function monthOptions(Collection $facilityIds): array
    {
        $months = Booking::query()
            ->whereIn('facility_id', $facilityIds)
            ->where('booking_fee', '>', 0)
            ->select('date')
            ->distinct()
            ->orderByDesc('date')
            ->pluck('date')
            ->map(fn (string $date) => Carbon::parse($date)->format('Y-m'))
            ->unique()
            ->values();

        $current = now()->format('Y-m');

        if (! $months->contains($current)) {
            $months->push($current);
        }

        return $months
            ->sortDesc()
            ->values()
            ->map(fn (string $value) => [
                'value' => $value,
                'label' => Carbon::createFromFormat('Y-m', $value)->format('F Y'),
            ])
            ->all();
    }
}
