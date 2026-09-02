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
    public function owners()
    {
        $users = User::with('facility')->where('role', 'FACILITY_OWNER')->latest()->get();
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
                $query->where('verification_status', 'PENDING');
            })
            ->latest()->get();
        return Inertia::render('Admin/Verifications', [
            'verifications' => $verifications
        ]);
    }
    public function approveVerification($facility_id)
    {
        $facility = Facility::findOrFail($facility_id);
        
        $facility->update(['verification_status' => 'VERIFIED']);
        
        if ($facility->owner) {
            $facility->owner->update(['status' => 'VERIFIED']);
        }

        return redirect()->back();
    }
}
