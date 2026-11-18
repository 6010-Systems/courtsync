<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CourtController extends Controller
{
    /**
     * Facility IDs this user is allowed to manage courts for:
     * an owner's own facilities, or a staff member's single assigned facility.
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
            abort(403, 'You do not have permission to view courts.');
        }

        $facilityIds = $this->allowedFacilityIds($request);

        $facilities = $facilityIds->isEmpty()
            ? collect()
            : Facility::whereIn('id', $facilityIds)
                ->with([
                    'courts.ratePlans',
                    'ratePlans' => fn ($query) => $query->orderBy('sort_order')->orderBy('name'),
                ])
                ->get();

        // Courts without their own assignment follow the facility rate card,
        // so every court card shows the same prices here and on the public page.
        $facilities->each(function (Facility $facility) {
            $activePlans = $facility->ratePlans
                ->where('is_active', true)
                ->sortBy([['sort_order', 'asc'], ['name', 'asc']])
                ->values();

            $facility->courts->each(function (Court $court) use ($activePlans) {
                if ($court->ratePlans->isEmpty() && $court->uses_rate_card) {
                    $court->setRelation('ratePlans', $activePlans);
                }
            });
        });

        return Inertia::render('FacilityOwner/Courts', [
            'facilities' => $facilities,
            'can' => [
                'create' => $user->hasPermission('create_courts'),
                'edit' => $user->hasPermission('edit_courts'),
                'delete' => $user->hasPermission('delete_courts'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        if (! $request->user()->hasPermission('create_courts')) {
            abort(403, 'You do not have permission to create courts.');
        }

        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'time_range' => 'required|string|max:100',
            'description' => 'nullable|string',
            'pricing_mode' => 'nullable|string|in:FLAT,SPLIT',
            'hourly_rate' => 'nullable|numeric|min:0',
            'day_rate' => 'nullable|numeric|min:0',
            'night_rate' => 'nullable|numeric|min:0',
            'day_start_time' => 'nullable|string|max:20',
            'night_start_time' => 'nullable|string|max:20',
            'image_url' => 'nullable|string|max:2048',
            'status' => 'nullable|string|in:'.implode(',', Court::STATUSES),
            ...$this->ratePlanRules(),
        ]);

        if (! $this->allowedFacilityIds($request)->contains((int) $request->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $pricingMode = $request->pricing_mode === 'SPLIT' ? 'SPLIT' : 'FLAT';
        $hourlyRate = $pricingMode === 'SPLIT' ? ($request->day_rate ?? $request->hourly_rate) : $request->hourly_rate;

        $court = Court::create([
            'facility_id' => $request->facility_id,
            'name' => $request->name,
            'type' => $request->type,
            'image_url' => $request->image_url,
            'time_range' => $request->time_range,
            'description' => $request->description,
            'pricing_mode' => $pricingMode,
            'hourly_rate' => $hourlyRate,
            'day_rate' => $pricingMode === 'SPLIT' ? $request->day_rate : null,
            'night_rate' => $pricingMode === 'SPLIT' ? $request->night_rate : null,
            'day_start_time' => $pricingMode === 'SPLIT' ? ($request->day_start_time ?: '06:00:00') : '06:00:00',
            'night_start_time' => $pricingMode === 'SPLIT' ? ($request->night_start_time ?: '18:00:00') : '18:00:00',
            'status' => $request->status ?? 'AVAILABLE',
        ]);

        $this->syncRatePlans($court, $request);

        return redirect()->back()->with('success', 'Court added successfully.');
    }

    public function update(Request $request, Court $court)
    {
        if (! $request->user()->hasPermission('edit_courts')) {
            abort(403, 'You do not have permission to edit courts.');
        }

        if (! $this->allowedFacilityIds($request)->contains($court->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'time_range' => 'required|string|max:100',
            'description' => 'nullable|string',
            'pricing_mode' => 'nullable|string|in:FLAT,SPLIT',
            'hourly_rate' => 'nullable|numeric|min:0',
            'day_rate' => 'nullable|numeric|min:0',
            'night_rate' => 'nullable|numeric|min:0',
            'day_start_time' => 'nullable|string|max:20',
            'night_start_time' => 'nullable|string|max:20',
            'image_url' => 'nullable|string|max:2048',
            'status' => 'nullable|string|in:'.implode(',', Court::STATUSES),
            ...$this->ratePlanRules(),
        ]);

        $pricingMode = $request->pricing_mode === 'SPLIT' ? 'SPLIT' : 'FLAT';
        $hourlyRate = $pricingMode === 'SPLIT' ? ($request->day_rate ?? $request->hourly_rate) : $request->hourly_rate;

        // Keep the split rates and day/night boundaries when a court is switched
        // to a flat rate so re-enabling split pricing restores the saved setup.
        $court->update([
            'name' => $request->name,
            'type' => $request->type,
            'image_url' => $request->has('image_url') ? $request->image_url : $court->image_url,
            'time_range' => $request->time_range,
            'description' => $request->description,
            'pricing_mode' => $pricingMode,
            'hourly_rate' => $hourlyRate,
            'day_rate' => $pricingMode === 'SPLIT' ? $request->day_rate : $court->day_rate,
            'night_rate' => $pricingMode === 'SPLIT' ? $request->night_rate : $court->night_rate,
            'day_start_time' => $pricingMode === 'SPLIT'
                ? ($request->day_start_time ?: $court->day_start_time ?: '06:00:00')
                : $court->day_start_time,
            'night_start_time' => $pricingMode === 'SPLIT'
                ? ($request->night_start_time ?: $court->night_start_time ?: '18:00:00')
                : $court->night_start_time,
            'status' => $request->status ?? $court->status,
        ]);

        $this->syncRatePlans($court, $request);

        return redirect()->back()->with('success', 'Court updated successfully.');
    }

    public function destroy(Request $request, Court $court)
    {
        if (! $request->user()->hasPermission('delete_courts')) {
            abort(403, 'You do not have permission to delete courts.');
        }

        if (! $this->allowedFacilityIds($request)->contains($court->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $court->delete();

        return redirect()->back()->with('success', 'Court removed successfully.');
    }

    /**
     * Validation rules for the per-court rate plan assignment payload.
     *
     * @return array<string, string>
     */
    private function ratePlanRules(): array
    {
        return [
            'rate_plans' => 'nullable|array',
            'rate_plans.*.id' => 'required|integer|exists:rate_plans,id',
            'rate_plans.*.is_enabled' => 'nullable|boolean',
            'rate_plans.*.day_rate_override' => 'nullable|numeric|min:0',
            'rate_plans.*.night_rate_override' => 'nullable|numeric|min:0',
        ];
    }

    /**
     * Persist which rate-card packages this court offers, with optional overrides.
     */
    private function syncRatePlans(Court $court, Request $request): void
    {
        $facilityPlanIds = RatePlan::query()
            ->where('facility_id', $court->facility_id)
            ->pluck('id');

        if ($request->has('rate_plans')) {
            $assignments = collect($request->input('rate_plans', []))
                ->filter(fn ($row) => isset($row['id']))
                ->mapWithKeys(function ($row) use ($facilityPlanIds) {
                    $planId = (int) $row['id'];

                    if (! $facilityPlanIds->contains($planId)) {
                        throw ValidationException::withMessages([
                            'rate_plans' => 'One of the selected rates belongs to another facility.',
                        ]);
                    }

                    return [
                        $planId => [
                            'is_enabled' => (bool) ($row['is_enabled'] ?? true),
                            'day_rate_override' => $row['day_rate_override'] ?? null,
                            'night_rate_override' => $row['night_rate_override'] ?? null,
                        ],
                    ];
                })
                ->all();

            $court->ratePlans()->sync($assignments);

            // Unticking every plan opts this court out of the rate card and back to its
            // own flat / day-night pricing.
            $court->forceFill([
                'uses_rate_card' => collect($assignments)->contains(fn ($row) => (bool) $row['is_enabled']),
            ])->save();

            return;
        }

        if ($court->wasRecentlyCreated) {
            // New courts inherit the facility's whole active rate card by default.
            $defaults = RatePlan::query()
                ->where('facility_id', $court->facility_id)
                ->active()
                ->pluck('id')
                ->mapWithKeys(fn ($planId) => [$planId => ['is_enabled' => true]])
                ->all();

            $court->ratePlans()->sync($defaults);
        }
    }
}
