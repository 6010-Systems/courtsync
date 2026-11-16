<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\User;
use App\Support\FacilityScope;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Customers (registered players + walk-ins) with their booking counts.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless(in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF'], true), 403);

        $validated = $request->validate([
            'facility_id' => ['sometimes', 'nullable', 'integer'],
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $facilityIds = FacilityScope::idsFor($user);
        $facilityId = isset($validated['facility_id']) ? (int) $validated['facility_id'] : null;

        if ($facilityId && ! $facilityIds->contains($facilityId)) {
            abort(403, 'Unauthorized action.');
        }

        $selectedFacilityIds = $facilityId ? collect([$facilityId]) : $facilityIds;

        $baseQuery = Booking::query()
            ->whereIn('facility_id', $selectedFacilityIds)
            ->where('status', '!=', 'cancelled');

        $registeredRows = (clone $baseQuery)
            ->whereNotNull('user_id')
            ->selectRaw('user_id, COUNT(*) as bookings_count, COALESCE(SUM(total_price), 0) as total_spent, MAX(date) as last_booking, MIN(date) as first_booking')
            ->groupBy('user_id')
            ->get();

        $accounts = User::query()
            ->whereIn('id', $registeredRows->pluck('user_id'))
            ->get(['id', 'name', 'email', 'mobile_number', 'avatar'])
            ->keyBy('id');

        $guestRows = (clone $baseQuery)
            ->whereNull('user_id')
            ->whereNotNull('guest_name')
            ->where('guest_name', '!=', '')
            ->selectRaw('guest_name, COUNT(*) as bookings_count, COALESCE(SUM(total_price), 0) as total_spent, MAX(date) as last_booking, MIN(date) as first_booking')
            ->groupBy('guest_name')
            ->get();

        $customers = collect();

        foreach ($registeredRows as $row) {
            $account = $accounts->get($row->user_id);

            $customers->push([
                'key' => 'user-'.$row->user_id,
                'type' => 'registered',
                'name' => $account?->name ?? 'Deleted player',
                'email' => $account?->email,
                'mobile_number' => $account?->mobile_number,
                'avatar' => $account?->avatar,
                'bookings_count' => (int) $row->bookings_count,
                'total_spent' => round((float) $row->total_spent, 2),
                'first_booking' => $row->first_booking,
                'last_booking' => $row->last_booking,
            ]);
        }

        foreach ($guestRows as $row) {
            $customers->push([
                'key' => 'guest-'.mb_strtolower((string) $row->guest_name),
                'type' => 'walk_in',
                'name' => $row->guest_name,
                'email' => null,
                'mobile_number' => null,
                'avatar' => null,
                'bookings_count' => (int) $row->bookings_count,
                'total_spent' => round((float) $row->total_spent, 2),
                'first_booking' => $row->first_booking,
                'last_booking' => $row->last_booking,
            ]);
        }

        $summary = [
            'customers' => $customers->count(),
            'registered' => $customers->where('type', 'registered')->count(),
            'walk_ins' => $customers->where('type', 'walk_in')->count(),
            'bookings' => (int) $customers->sum('bookings_count'),
            'total_spent' => round((float) $customers->sum('total_spent'), 2),
        ];

        $search = trim((string) ($validated['search'] ?? ''));

        if ($search !== '') {
            $needle = mb_strtolower($search);

            $customers = $customers
                ->filter(fn (array $customer) => str_contains(mb_strtolower((string) $customer['name']), $needle)
                    || str_contains(mb_strtolower((string) ($customer['email'] ?? '')), $needle)
                    || str_contains((string) ($customer['mobile_number'] ?? ''), $search))
                ->values();
        }

        $customers = $customers
            ->sortBy([
                ['bookings_count', 'desc'],
                ['total_spent', 'desc'],
                ['name', 'asc'],
            ])
            ->values();

        $perPage = 20;
        $page = (int) ($validated['page'] ?? 1);

        $customersPaginator = new LengthAwarePaginator(
            $customers->forPage($page, $perPage)->values(),
            $customers->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('FacilityOwner/Customers', [
            'filters' => [
                'facility_id' => $facilityId,
                'search' => $search !== '' ? $search : null,
            ],
            'customers' => $customersPaginator->withQueryString(),
            'summary' => $summary,
            'facilities' => Facility::query()
                ->whereIn('id', $facilityIds)
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
