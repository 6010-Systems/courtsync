<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Facility;
use App\Models\FacilityVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class FacilityController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Facility/Facilities', [
            'facilities' => $request->user()->facilities()->with('verification')->withCount('courts')->get()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'facility_id' => 'nullable|exists:facilities,id',
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:facilities,slug,' . $request->facility_id,
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

    /**
     * Facility IDs this user is allowed to see/manage: an owner's own
     * facilities, or a staff member's single assigned facility.
     */
    private function allowedFacilityIds(Request $request)
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

    public function storeStaff(Request $request)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff.');
        }

        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(User::STAFF_PERMISSIONS)),
        ]);

        $facility = $request->user()->facilities()->findOrFail($request->facility_id);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt(Str::password(24)),
            'role' => 'FACILITY_STAFF',
            'status' => 'VERIFIED',
            'facility_id' => $facility->id,
            'permissions' => $request->permissions ?? [],
        ]);

        return redirect()->back()->with('success', 'Staff member invited successfully.');
    }

    public function editStaffPermissions(Request $request, User $user)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff permissions.');
        }

        $facilityIds = $request->user()->facilities()->pluck('id');

        if ($user->role !== 'FACILITY_STAFF' || !$facilityIds->contains($user->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        return inertia('Facility/StaffPermissions', [
            'staff' => $user->only(['id', 'name', 'email']),
            'matrix' => User::PERMISSION_MATRIX,
            'permissions' => $user->permissions ?? [],
        ]);
    }

    public function updateStaffPermissions(Request $request, User $user)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff permissions.');
        }

        $facilityIds = $request->user()->facilities()->pluck('id');

        if ($user->role !== 'FACILITY_STAFF' || !$facilityIds->contains($user->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(User::STAFF_PERMISSIONS)),
        ]);

        $user->update(['permissions' => $request->permissions ?? []]);

        return redirect()->back()->with('success', 'Staff permissions updated successfully.');
    }

    public function updateStaffFacility(Request $request, User $user)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff.');
        }

        $facilityIds = $request->user()->facilities()->pluck('id');

        if ($user->role !== 'FACILITY_STAFF' || !$facilityIds->contains($user->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'facility_id' => 'required|exists:facilities,id',
        ]);

        if (!$facilityIds->contains((int) $request->facility_id)) {
            abort(403, 'You can only assign staff to one of your own facilities.');
        }

        $user->update(['facility_id' => $request->facility_id]);

        return redirect()->back()->with('success', 'Staff facility updated successfully.');
    }

    public function staff(Request $request)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff.');
        }

        return inertia('Facility/Staff', [
            'auth' => [
                'user' => $request->user()->load('facilities.staff')
            ],
        ]);
    }

    public function deleteStaff(Request $request, User $user)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff.');
        }

        $facilityIds = $request->user()->facilities()->pluck('id');

        if (!$facilityIds->contains($user->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        $user->delete();

        return redirect()->back()->with('success', 'Staff member removed successfully.');
    }

    public function players(Request $request)
    {
        if (!$request->user()->hasPermission('view_players')) {
            abort(403, 'You do not have permission to view players.');
        }

        $facilityIds = $this->allowedFacilityIds($request);

        $facilities = $facilityIds->isEmpty()
            ? collect()
            : Facility::whereIn('id', $facilityIds)
                ->where('verification_status', 'APPROVED')
                ->with(['players' => function ($query) {
                    $query->select('users.id', 'users.name', 'users.email', 'users.avatar', 'users.created_at');
                }])
                ->get();

        // Flatten players across all facilities, tagging each with the facility name and pivot status
        $players = [];
        foreach ($facilities as $facility) {
            foreach ($facility->players as $player) {
                $players[] = [
                    'id' => $player->id,
                    'name' => $player->name,
                    'email' => $player->email,
                    'avatar' => $player->avatar,
                    'created_at' => $player->created_at,
                    'facility_id' => $facility->id,
                    'facility_name' => $facility->name,
                    'status' => $player->pivot->status,
                ];
            }
        }

        return inertia('Facility/Players', [
            'auth' => [
                'user' => $request->user()->load('facilities')
            ],
            'players' => $players,
            'canManage' => $request->user()->hasPermission('manage_players'),
        ]);
    }

    public function toggleBanPlayer(Request $request, User $user)
    {
        if (!$request->user()->hasPermission('manage_players')) {
            abort(403, 'You do not have permission to manage players.');
        }

        $facilityId = $request->input('facility_id');
        $facilityIds = $this->allowedFacilityIds($request);

        if (!$facilityIds->contains((int) $facilityId)) {
            abort(403, 'Unauthorized action.');
        }

        // Get the current pivot status
        $pivot = $user->joinedFacilities()->where('facility_id', $facilityId)->first();

        if (!$pivot) {
            abort(404, 'Player not found in this facility.');
        }

        $newStatus = $pivot->pivot->status === 'BANNED' ? 'ACTIVE' : 'BANNED';
        $user->joinedFacilities()->updateExistingPivot($facilityId, ['status' => $newStatus]);

        return redirect()->back()->with('success', 'Player status updated successfully.');
    }

    public function show(Facility $facility)
    {
        $facility->load('verification:id,facility_id,facility_photos');
        $facility->load('courts');

        return Inertia::render('Facility/Show', [
            'facility' => $facility
        ]);
    }
}
