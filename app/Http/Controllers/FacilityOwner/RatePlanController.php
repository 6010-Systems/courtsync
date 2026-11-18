<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RatePlanController extends Controller
{
    /**
     * Facility IDs this user may manage a rate card for.
     */
    private function allowedFacilityIds(Request $request): Collection
    {
        $user = $request->user();

        if ($user->role === 'FACILITY_OWNER') {
            return $user->facilities()->pluck('id');
        }

        if ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            return collect([$user->facility_id]);
        }

        return collect();
    }

    public function index(Request $request)
    {
        $user = $request->user();

        if (! $user->hasPermission('view_courts')) {
            abort(403, 'You do not have permission to view rate cards.');
        }

        $facilityIds = $this->allowedFacilityIds($request);

        $facilities = $facilityIds->isEmpty()
            ? collect()
            : Facility::whereIn('id', $facilityIds)
                ->with([
                    'ratePlans' => fn ($query) => $query
                        ->with('courts:id,name')
                        ->orderBy('sort_order')
                        ->orderBy('name'),
                    'courts:id,facility_id,name,status',
                ])
                ->get();

        return Inertia::render('FacilityOwner/Rates', [
            'facilities' => $facilities,
            'can' => [
                'edit' => $user->hasPermission('edit_courts'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->user()->hasPermission('edit_courts')) {
            abort(403, 'You do not have permission to edit rate cards.');
        }

        $validated = $request->validate($this->rules());

        if (! $this->allowedFacilityIds($request)->contains((int) $validated['facility_id'])) {
            abort(403, 'Unauthorized action.');
        }

        $plan = RatePlan::create($this->payload($validated));

        // Honour an explicit "offer on every court" choice; otherwise default to every court.
        if ($request->has('assign_to_all_courts') || $request->has('court_ids')) {
            $this->syncCourts($plan, $request);
        } else {
            $plan->courts()->sync(
                $plan->facility()->firstOrFail()->courts()->pluck('id')
                    ->mapWithKeys(fn ($courtId) => [$courtId => ['is_enabled' => true]])
                    ->all()
            );
        }

        Court::whereIn('id', $plan->courts()->pluck('courts.id'))->update(['uses_rate_card' => true]);

        return redirect()->back()->with('success', 'Rate added successfully.');
    }

    public function update(Request $request, RatePlan $ratePlan)
    {
        if (! $request->user()->hasPermission('edit_courts')) {
            abort(403, 'You do not have permission to edit rate cards.');
        }

        if (! $this->allowedFacilityIds($request)->contains($ratePlan->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate($this->rules($ratePlan));

        $ratePlan->update($this->payload($validated));

        if ($request->has('court_ids') || $request->has('assign_to_all_courts')) {
            $this->syncCourts($ratePlan, $request);
        }

        return redirect()->back()->with('success', 'Rate updated successfully.');
    }

    public function destroy(Request $request, RatePlan $ratePlan)
    {
        if (! $request->user()->hasPermission('edit_courts')) {
            abort(403, 'You do not have permission to edit rate cards.');
        }

        if (! $this->allowedFacilityIds($request)->contains($ratePlan->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $ratePlan->delete();

        return redirect()->back()->with('success', 'Rate removed successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?RatePlan $plan = null): array
    {
        $facilityId = $plan?->facility_id ?? request()->input('facility_id');

        return [
            'facility_id' => 'required|exists:facilities,id',
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('rate_plans', 'name')
                    ->where('facility_id', $facilityId)
                    ->ignore($plan?->id),
            ],
            'kind' => ['required', Rule::in(RatePlan::KINDS)],
            'description' => 'nullable|string|max:255',
            'day_rate' => 'required|numeric|min:0',
            'night_rate' => 'nullable|numeric|min:0',
            'day_start_time' => 'nullable|date_format:H:i',
            'night_start_time' => 'nullable|date_format:H:i',
            'includes_ball' => 'nullable|boolean',
            'included_paddles' => 'nullable|integer|min:0|max:20',
            'max_quantity' => 'nullable|integer|min:1|max:20',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0|max:1000',
            'assign_to_all_courts' => 'nullable|boolean',
            'court_ids' => 'nullable|array',
            'court_ids.*' => 'integer|exists:courts,id',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function payload(array $validated): array
    {
        $isCourtPlan = $validated['kind'] === 'COURT';

        return [
            'facility_id' => $validated['facility_id'],
            'name' => $validated['name'],
            'kind' => $validated['kind'],
            'description' => $validated['description'] ?? null,
            'day_rate' => $validated['day_rate'],
            'night_rate' => $isCourtPlan && isset($validated['night_rate']) ? $validated['night_rate'] : null,
            'day_start_time' => $validated['day_start_time'] ?? '05:00',
            'night_start_time' => $validated['night_start_time'] ?? '17:00',
            'includes_ball' => $isCourtPlan ? (bool) ($validated['includes_ball'] ?? true) : false,
            'included_paddles' => $isCourtPlan ? (int) ($validated['included_paddles'] ?? 0) : 0,
            'max_quantity' => (int) ($validated['max_quantity'] ?? 4),
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'sort_order' => (int) ($validated['sort_order'] ?? 0),
        ];
    }

    /**
     * Assign the plan to the facility's courts (all of them unless court_ids is given).
     */
    private function syncCourts(RatePlan $plan, Request $request): void
    {
        $facilityCourtIds = $plan->facility()->firstOrFail()->courts()->pluck('id');

        $courtIds = $request->boolean('assign_to_all_courts')
            ? $facilityCourtIds
            : collect($request->input('court_ids', []))->map(fn ($id) => (int) $id);

        $courtIds = $courtIds->intersect($facilityCourtIds)->values();

        $plan->courts()->sync(
            $courtIds->mapWithKeys(fn ($courtId) => [$courtId => ['is_enabled' => true]])->all()
        );

        // Assigning a rate from the card puts these courts back on rate-card pricing.
        Court::whereIn('id', $courtIds->all())->update(['uses_rate_card' => true]);
    }
}
