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
        $this->authorize('viewAny', Payment::class);

        $user = $request->user();

        // Facility IDs this user is allowed to manage/view.
        // Admins see all payments across all facilities (no facility scoping).
        $facilityIds = $user->role === 'ADMIN' ? null : $user->managedFacilityIds();

        $query = Payment::with(['booking.court', 'booking.facility', 'booking.user:id,name,email', 'user'])->latest();

        if ($facilityIds !== null) {
            $query->whereHas('booking', function ($query) use ($facilityIds) {
                $query->whereIn('facility_id', $facilityIds);
            });
        }

        $payments = $query->get();

        return Inertia::render('Facility/Payments', [
            'payments' => $payments,
        ]);
    }
}
