<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FacilityVerification;
use App\Models\User;
use App\Support\FacilityDashboardMetrics;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacilityController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        $user->load([
            'facilities' => fn ($query) => $query->withCount(['staff', 'players'])->with('verification'),
            'workFacility' => fn ($query) => $query->withCount(['staff', 'players']),
        ]);

        return Inertia::render('FacilityOwner/Dashboard', [
            'user' => $user,
            'metrics' => $this->dashboardMetrics($user),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function dashboardMetrics(User $user): ?array
    {
        $metrics = new FacilityDashboardMetrics;

        if ($user->role === 'FACILITY_OWNER' && $user->status === 'VERIFIED') {
            $approved = $user->facilities->where('verification_status', 'APPROVED');

            if ($approved->isEmpty()) {
                return null;
            }

            return $metrics->summarize(
                $approved->pluck('id')->all(),
                (int) $approved->sum('players_count'),
            );
        }

        if ($user->role === 'FACILITY_STAFF' && $user->workFacility) {
            return $metrics->summarize(
                [$user->workFacility->id],
                (int) $user->workFacility->players_count,
            );
        }

        return null;
    }

    public function index(Request $request)
    {
        return Inertia::render('FacilityOwner/Facilities', [
            'facilities' => $request->user()->facilities()->with('verification')->withCount('courts')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'facility_id' => 'nullable|exists:facilities,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:facilities,slug,'.$request->facility_id,
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'description' => 'nullable|string',
        ]);

        if ($request->facility_id) {
            $facility = $request->user()->facilities()->findOrFail($request->facility_id);

            $updateData = [
                'name' => $request->name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_number' => $request->contact_number,
                'description' => $request->description,
            ];

            if ($facility->verification_status === 'APPROVED' && $request->filled('slug')) {
                $updateData['slug'] = Facility::generateUniqueSlug($request->slug, $facility->id);
            }

            $facility->update($updateData);
        } else {
            $facility = $request->user()->facilities()->create([
                'slug' => null, // Slug is null until approved
                'name' => $request->name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_number' => $request->contact_number,
                'description' => $request->description,
                'verification_status' => 'DRAFT',
            ]);
        }

        return redirect()->back();
    }

    public function destroy(Request $request, $id)
    {
        $facility = $request->user()->facilities()->findOrFail($id);
        $facility->delete();

        return redirect()->back();
    }

    public function storeVerification(Request $request)
    {
        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'government_id_type' => 'required|string',
            'government_id_number' => 'required|string',
            'government_id_image_path' => 'required|url',
            'business_permit_path' => 'required|url',
            'business_registration_path' => 'required|url',
            'proof_of_ownership_path' => 'required|url',
            'facility_photos' => 'required|array',
            'facility_photos.*' => 'required|url',
        ]);

        $facility = $request->user()->facilities()->findOrFail($request->facility_id);

        FacilityVerification::updateOrCreate(
            ['facility_id' => $facility->id],
            [
                'government_id_type' => $request->government_id_type,
                'government_id_number' => $request->government_id_number,
                'government_id_image_path' => $request->government_id_image_path,
                'business_permit_path' => $request->business_permit_path,
                'business_registration_path' => $request->business_registration_path,
                'proof_of_ownership_path' => $request->proof_of_ownership_path,
                'facility_photos' => $request->facility_photos,
            ]
        );

        // Update status to SUBMITTED since new documents were uploaded
        $facility->update(['verification_status' => 'SUBMITTED']);

        return redirect()->back();
    }
}
