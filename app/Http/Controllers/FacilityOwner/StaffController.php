<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Facility;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff.');
        }

        return Inertia::render('FacilityOwner/Staff/Index', [
            'auth' => [
                'user' => $request->user()->load('facilities.staff')
            ],
        ]);
    }

    public function store(Request $request)
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

    public function editPermissions(Request $request, User $user)
    {
        if ($request->user()->role !== 'FACILITY_OWNER') {
            abort(403, 'Only facility owners can manage staff permissions.');
        }

        $facilityIds = $request->user()->facilities()->pluck('id');

        if ($user->role !== 'FACILITY_STAFF' || !$facilityIds->contains($user->facility_id)) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('FacilityOwner/Staff/Permissions', [
            'staff' => $user->only(['id', 'name', 'email']),
            'matrix' => User::PERMISSION_MATRIX,
            'permissions' => $user->permissions ?? [],
        ]);
    }

    public function updatePermissions(Request $request, User $user)
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

    public function updateFacility(Request $request, User $user)
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

    public function destroy(Request $request, User $user)
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
}
