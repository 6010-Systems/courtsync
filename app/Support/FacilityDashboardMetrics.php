<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class FacilityDashboardMetrics
{
    /**
     * @param  array<int, int>  $facilityIds
     * @return array{
     *     bookings: array{current: int, previous: int},
     *     collected: array{current: string, previous: string},
     *     players: array{total: int},
     *     pending: array{total: int},
     *     weekdays: array<int, array{key: string, label: string, name: string, count: int}>,
     *     heatmap: array{days: array<int, array{date: string, count: int}>},
     *     sources: array{online: int, walkIn: int, staff: int},
     *     revenue_trend: array<int, array{time: string, v: float, label: string}>
     * }
     */
    public function summarize(array $facilityIds, int $playerTotal): array
    {
        $today = now()->startOfDay();
        $currentStart = $today->copy()->subDays(29);
        $previousStart = $today->copy()->subDays(59);
        $previousEnd = $today->copy()->subDays(30);
        $heatmapStart = $today->copy()->subWeeks(16)->startOfWeek(Carbon::MONDAY);

        $days = $this->heatmapDays($facilityIds, $heatmapStart, $today);

        return [
            'bookings' => [
                'current' => $this->bookingCount($facilityIds, $currentStart, $today),
                'previous' => $this->bookingCount($facilityIds, $previousStart, $previousEnd),
            ],
            'collected' => [
                'current' => $this->collected($facilityIds, $currentStart, $today->copy()->endOfDay()),
                'previous' => $this->collected($facilityIds, $previousStart, $previousEnd->copy()->endOfDay()),
            ],
            'players' => [
                'total' => $playerTotal,
            ],
            'pending' => [
                'total' => $this->bookings($facilityIds)->where('status', 'pending')->count(),
            ],
            'weekdays' => $this->weekdays($days),
            'heatmap' => [
                'days' => $days,
            ],
            'sources' => $this->bookingSources($facilityIds, $currentStart, $today),
            'revenue_trend' => $this->revenueTrend($facilityIds, $today->copy()->subDays(6)->startOfDay(), $today->copy()->endOfDay()),
        ];
    }

    /**
     * @param  array<int, int>  $facilityIds
     */
    private function bookings(array $facilityIds): Builder
    {
        return Booking::query()->whereIn('facility_id', $facilityIds);
    }

    /**
     * @param  array<int, int>  $facilityIds
     */
    private function bookingCount(array $facilityIds, CarbonInterface $start, CarbonInterface $end): int
    {
        return $this->bookings($facilityIds)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->count();
    }

    /**
     * @param  array<int, int>  $facilityIds
     */
    private function collected(array $facilityIds, CarbonInterface $start, CarbonInterface $end): string
    {
        $amount = Payment::query()
            ->where('status', 'verified')
            ->whereBetween('created_at', [$start, $end])
            ->whereHas('booking', function (Builder $query) use ($facilityIds): void {
                $query->whereIn('facility_id', $facilityIds);
            })
            ->sum('amount');

        return number_format((float) $amount, 2, '.', '');
    }

    /**
     * @param  array<int, int>  $facilityIds
     * @return array<int, array{date: string, count: int}>
     */
    private function heatmapDays(array $facilityIds, CarbonInterface $start, CarbonInterface $end): array
    {
        $counts = $this->bookings($facilityIds)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('date, COUNT(*) as aggregate')
            ->groupBy('date')
            ->pluck('aggregate', 'date');

        $byDate = [];
        foreach ($counts as $date => $aggregate) {
            $byDate[Carbon::parse($date)->toDateString()] = (int) $aggregate;
        }

        $days = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();

        while ($cursor->lte($last)) {
            $date = $cursor->toDateString();
            $days[] = [
                'date' => $date,
                'count' => $byDate[$date] ?? 0,
            ];
            $cursor->addDay();
        }

        return $days;
    }

    /**
     * @param  array<int, array{date: string, count: int}>  $days
     * @return array<int, array{key: string, label: string, name: string, count: int}>
     */
    private function weekdays(array $days): array
    {
        $names = [
            1 => ['key' => 'mon', 'label' => 'Mon', 'name' => 'Monday'],
            2 => ['key' => 'tue', 'label' => 'Tue', 'name' => 'Tuesday'],
            3 => ['key' => 'wed', 'label' => 'Wed', 'name' => 'Wednesday'],
            4 => ['key' => 'thu', 'label' => 'Thu', 'name' => 'Thursday'],
            5 => ['key' => 'fri', 'label' => 'Fri', 'name' => 'Friday'],
            6 => ['key' => 'sat', 'label' => 'Sat', 'name' => 'Saturday'],
            7 => ['key' => 'sun', 'label' => 'Sun', 'name' => 'Sunday'],
        ];

        $counts = array_fill(1, 7, 0);
        foreach ($days as $day) {
            $counts[Carbon::parse($day['date'])->dayOfWeekIso] += $day['count'];
        }

        $weekdays = [];
        foreach ($names as $iso => $name) {
            $weekdays[] = [
                'key' => $name['key'],
                'label' => $name['label'],
                'name' => $name['name'],
                'count' => $counts[$iso],
            ];
        }

        return $weekdays;
    }

    /**
     * @param  array<int, int>  $facilityIds
     * @return array{online: int, walkIn: int, staff: int}
     */
    private function bookingSources(array $facilityIds, CarbonInterface $start, CarbonInterface $end): array
    {
        $bookings = $this->bookings($facilityIds)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get(['user_id', 'guest_name']);

        $online = 0;
        $walkIn = 0;
        $staff = 0;

        // In a real app we might load the user relation to check their role if user_id is present.
        // For efficiency without N+1, we can do a quick check:
        // Actually, let's load users if we have them to check roles.
        $userIds = $bookings->pluck('user_id')->filter()->unique();
        $userRoles = User::whereIn('id', $userIds)->pluck('role', 'id');

        foreach ($bookings as $booking) {
            if ($booking->user_id) {
                $role = $userRoles[$booking->user_id] ?? 'player';
                if (in_array($role, ['staff', 'owner'])) {
                    $staff++;
                } else {
                    $online++;
                }
            } else {
                $walkIn++;
            }
        }

        return [
            'online' => $online,
            'walkIn' => $walkIn,
            'staff' => $staff,
        ];
    }

    /**
     * @param  array<int, int>  $facilityIds
     * @return array<int, array{time: string, v: float, label: string}>
     */
    private function revenueTrend(array $facilityIds, CarbonInterface $start, CarbonInterface $end): array
    {
        $payments = Payment::query()
            ->where('status', 'verified')
            ->whereBetween('created_at', [$start, $end])
            ->whereHas('booking', function (Builder $query) use ($facilityIds): void {
                $query->whereIn('facility_id', $facilityIds);
            })
            ->get(['amount', 'created_at']);

        $byDate = [];
        foreach ($payments as $payment) {
            $dateStr = $payment->created_at->toDateString();
            if (! isset($byDate[$dateStr])) {
                $byDate[$dateStr] = 0;
            }
            $byDate[$dateStr] += (float) $payment->amount;
        }

        $trend = [];
        $cursor = $start->copy()->startOfDay();
        $last = $end->copy()->startOfDay();

        while ($cursor->lte($last)) {
            $dateStr = $cursor->toDateString();
            $val = $byDate[$dateStr] ?? 0.0;

            // Format to PHP integer/float for the chart
            $trend[] = [
                'time' => $cursor->format('D'), // Mon, Tue...
                'v' => $val,
                'label' => '₱'.number_format($val, 0),
            ];
            $cursor->addDay();
        }

        return $trend;
    }
}
