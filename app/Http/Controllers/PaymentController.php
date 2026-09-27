<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Payment;
use App\Models\Facility;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Facility IDs this user is allowed to manage/view
        $facilityIds = collect();
        if ($user->role === 'FACILITY_OWNER') {
            $facilityIds = $user->facilities()->pluck('id');
        } elseif ($user->role === 'FACILITY_STAFF' && $user->facility_id) {
            $facilityIds = collect([$user->facility_id]);
        }

        $payments = Payment::whereHas('booking', function ($query) use ($facilityIds) {
            $query->whereIn('facility_id', $facilityIds);
        })
        ->with(['booking.court', 'booking.facility', 'user'])
        ->latest()
        ->get();

        return Inertia::render('Facility/Payments', [
            'payments' => $payments
        ]);
    }
}
