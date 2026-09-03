<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Facility;
use App\Models\FacilityVerification;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function facilities()
    {
        $facilities = Facility::with('owner')->latest()->get();
        $owners = User::where('role', 'FACILITY_OWNER')->get();
        return Inertia::render('Admin/Facilities', [
            'facilities' => $facilities,
            'owners' => $owners
        ]);
    }

    public function storeFacility(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:facilities,slug',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'description' => 'nullable|string',
            'user_id' => 'required|exists:users,id',
            'verification_status' => 'required|string',
        ]);

        $slug = $request->slug ? Str::slug($request->slug) : null;
        if (empty($slug) && $request->verification_status === 'APPROVED') {
            $slug = Str::slug($request->name);
        }

        Facility::create([
            'user_id' => $request->user_id,
            'slug' => $slug,
            'name' => $request->name,
            'address' => $request->address,
            'city' => $request->city,
            'province' => $request->province,
            'country' => $request->country,
            'contact_number' => $request->contact_number,
            'description' => $request->description,
            'verification_status' => $request->verification_status,
        ]);

        return redirect()->back();
    }

    public function updateFacility(Request $request, $id)
    {
        $facility = Facility::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:facilities,slug,' . $id,
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'description' => 'nullable|string',
            'user_id' => 'required|exists:users,id',
            'verification_status' => 'required|string',
        ]);

        $slug = $request->slug ? Str::slug($request->slug) : null;
        if (empty($slug) && $request->verification_status === 'APPROVED') {
            $slug = Str::slug($request->name);
        }

        $facility->update([
            'user_id' => $request->user_id,
            'slug' => $slug,
            'name' => $request->name,
            'address' => $request->address,
            'city' => $request->city,
            'province' => $request->province,
            'country' => $request->country,
            'contact_number' => $request->contact_number,
            'description' => $request->description,
            'verification_status' => $request->verification_status,
        ]);

        return redirect()->back();
    }

    public function owners()
    {
        $users = User::with('facilities')->where('role', 'FACILITY_OWNER')->latest()->get();
        return Inertia::render('Admin/Owners', [
            'users' => $users
        ]);
    }

    public function storeOwner(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email'
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt(Str::password(24)),
            'role' => 'FACILITY_OWNER',
            'status' => 'VERIFIED',
        ]);

        return redirect()->back();
    }

    public function staff()
    {
        $users = User::with('workFacility.owner')->where('role', 'FACILITY_STAFF')->latest()->get();
        $facilities = Facility::all();
        
        return Inertia::render('Admin/Staff', [
            'users' => $users,
            'facilities' => $facilities
        ]);
    }

    public function storeStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'facility_id' => 'required|exists:facilities,id'
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt(Str::password(24)),
            'role' => 'FACILITY_STAFF',
            'status' => 'VERIFIED',
            'facility_id' => $request->facility_id
        ]);

        return redirect()->back();
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'required|string',
            'status' => 'required|string',
        ]);

        $user->update([
            'name' => $request->name,
            'role' => $request->role,
            'status' => $request->status,
        ]);

        return redirect()->back();
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return redirect()->back();
    }

    public function verifications()
    {
        $verifications = FacilityVerification::with('facility.owner')
            ->whereHas('facility', function($query) {
                $query->whereIn('verification_status', ['SUBMITTED', 'UNDER_REVIEW']);
            })
            ->latest()->get();
        return Inertia::render('Admin/Verifications', [
            'verifications' => $verifications
        ]);
    }
    public function updateVerificationStatus(Request $request, $facility_id)
    {
        $request->validate([
            'status' => 'required|string|in:DRAFT,SUBMITTED,UNDER_REVIEW,APPROVED,REJECTED,SUSPENDED'
        ]);

        $facility = Facility::findOrFail($facility_id);
        
        $updateData = ['verification_status' => $request->status];

        if ($request->status === 'APPROVED' && empty($facility->slug)) {
            $updateData['slug'] = Str::slug($facility->name);
        }

        $facility->update($updateData);
        
        if ($request->status === 'APPROVED' && $facility->owner) {
            $facility->owner->update(['status' => 'VERIFIED']);
        }

        return redirect()->back();
    }
}
