<?php

namespace App\Http\Controllers\FacilityOwner;

use App\Http\Controllers\Controller;
use App\Support\BookingFeeReport;
use App\Support\FacilityScope;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Monthly booking-fee report scoped to the owner's facilities.
     */
    public function billing(Request $request, BookingFeeReport $report): Response
    {
        $user = $request->user();

        abort_unless($user->role === 'FACILITY_OWNER', 403, 'Only facility owners can view this report.');

        $validated = $request->validate([
            'month' => ['sometimes', 'nullable', 'date_format:Y-m'],
            'facility_id' => ['sometimes', 'nullable', 'integer'],
        ]);

        $facilityIds = FacilityScope::idsFor($user);
        $facilityId = isset($validated['facility_id']) ? (int) $validated['facility_id'] : null;

        if ($facilityId && ! $facilityIds->contains($facilityId)) {
            abort(403, 'Unauthorized action.');
        }

        $month = $validated['month'] ?? now()->format('Y-m');
        $data = $report->build($facilityIds, $month, $facilityId);

        return Inertia::render('FacilityOwner/Reports', [
            'filters' => [
                'month' => $month,
                'facility_id' => $facilityId,
            ],
            ...$data,
        ]);
    }
}
