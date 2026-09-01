<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\FacilityVerification;
use Illuminate\Http\Request;

class FacilityController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'contact_number' => 'required|string|max:20',
            'description' => 'nullable|string',
        ]);

        Facility::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'name' => $request->name,
                'address' => $request->address,
                'city' => $request->city,
                'province' => $request->province,
                'country' => $request->country,
                'contact_number' => $request->contact_number,
                'description' => $request->description,
                'verification_status' => 'PENDING',
            ]
        );

        return redirect()->back();
    }

    public function storeVerification(Request $request)
    {
        $request->validate([
            'government_id_type' => 'required|string',
            'government_id_number' => 'required|string',
            'government_id_image_path' => 'required|url',
            'business_permit_path' => 'required|url',
            'business_registration_path' => 'required|url',
            'proof_of_ownership_path' => 'required|url',
        ]);

        $facility = $request->user()->facility;

        if (!$facility) {
            abort(404, 'Facility not found.');
        }

        FacilityVerification::create([
            'facility_id' => $facility->id,
            'government_id_type' => $request->government_id_type,
            'government_id_number' => $request->government_id_number,
            'government_id_image_path' => $request->government_id_image_path,
            'business_permit_path' => $request->business_permit_path,
            'business_registration_path' => $request->business_registration_path,
            'proof_of_ownership_path' => $request->proof_of_ownership_path,
            'facility_photos' => [],
        ]);

        return redirect()->back();
    }

    public function storeStaff(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
        ]);

        $facility = $request->user()->facility;

        if (!$facility) {
            abort(403, 'You must have a facility to invite staff.');
        }

        \App\Models\User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt(\Illuminate\Support\Str::password(24)),
            'role' => 'FACILITY_STAFF',
            'status' => 'VERIFIED',
            'facility_id' => $facility->id,
        ]);

        return redirect()->back()->with('success', 'Staff member invited successfully.');
    }

    public function staff(Request $request)
    {
        return inertia('Owner/Staff', [
            'auth' => [
                'user' => $request->user()->load('facility.staff')
            ]
        ]);
    }
}
