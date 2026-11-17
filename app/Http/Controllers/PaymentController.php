<?php

namespace App\Http\Controllers;

use App\Models\Facility;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to manage/view.
        // Admins see all payments across all facilities (no facility scoping).
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        } elseif ($user->role === 'ADMIN') {
            $facilityIds = null;
        }

        $query = Payment::with(['booking.court', 'booking.facility', 'booking.user:id,name,email', 'user'])->latest();

        if ($facilityIds !== null) {
            $query->whereHas('booking', function ($query) use ($facilityIds) {
                $query->whereIn('facility_id', $facilityIds);
            });
        }

        $payments = $query->get();

        $facilitiesQuery = Facility::query()->orderBy('name');
        if ($facilityIds !== null) {
            $facilitiesQuery->whereIn('id', $facilityIds);
        }
        $facilities = $facilitiesQuery->get(['id', 'name']);

        return Inertia::render('Facility/Payments', [
            'payments' => $payments,
            'facilities' => $facilities,
        ]);
    }
}
