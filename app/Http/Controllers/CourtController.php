<?php

namespace App\Http\Controllers;

use App\Models\Court;
use App\Models\Facility;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

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

        if (!$user->hasPermission('view_courts')) {
            abort(403, 'You do not have permission to view courts.');
        }

        $facilityIds = $this->allowedFacilityIds($request);

        $facilities = $facilityIds->isEmpty()
            ? collect()
            : Facility::whereIn('id', $facilityIds)->with('courts')->get();

        return inertia('Facility/Courts', [
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
        if (!$request->user()->hasPermission('create_courts')) {
            abort(403, 'You do not have permission to create courts.');
        }

        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'time_range' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'hourly_rate' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:' . implode(',', Court::STATUSES),
        ]);

        if (!$this->allowedFacilityIds($request)->contains((int) $request->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        Court::create([
            'facility_id' => $request->facility_id,
            'name' => $request->name,
            'type' => $request->type,
            'time_range' => $request->time_range,
            'description' => $request->description,
            'hourly_rate' => $request->hourly_rate,
            'status' => $request->status ?? 'AVAILABLE',
        ]);

        return redirect()->back()->with('success', 'Court added successfully.');
    }

    public function update(Request $request, Court $court)
    {
        if (!$request->user()->hasPermission('edit_courts')) {
            abort(403, 'You do not have permission to edit courts.');
        }

        if (!$this->allowedFacilityIds($request)->contains($court->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'time_range' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'hourly_rate' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:' . implode(',', Court::STATUSES),
        ]);

        $court->update([
            'name' => $request->name,
            'type' => $request->type,
            'time_range' => $request->time_range,
            'description' => $request->description,
            'hourly_rate' => $request->hourly_rate,
            'status' => $request->status ?? $court->status,
        ]);

        return redirect()->back()->with('success', 'Court updated successfully.');
    }

    public function destroy(Request $request, Court $court)
    {
        if (!$request->user()->hasPermission('delete_courts')) {
            abort(403, 'You do not have permission to delete courts.');
        }

        if (!$this->allowedFacilityIds($request)->contains($court->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $court->delete();

        return redirect()->back()->with('success', 'Court removed successfully.');
    }
}
