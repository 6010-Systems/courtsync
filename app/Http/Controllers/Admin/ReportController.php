<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\FacilityBilling;
use App\Support\BookingFeeReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Monthly billing report for booking-fee collection, grouped per facility.
     */
    public function billing(Request $request, BookingFeeReport $report): Response
    {
        $validated = $request->validate([
            'month' => ['sometimes', 'nullable', 'date_format:Y-m'],
            'facility_id' => ['sometimes', 'nullable', 'integer', 'exists:facilities,id'],
        ]);

        $month = $validated['month'] ?? now()->format('Y-m');
        $facilityId = isset($validated['facility_id']) ? (int) $validated['facility_id'] : null;

        $data = $report->build(Facility::query()->pluck('id'), $month, $facilityId);

        return Inertia::render('Admin/BillingReport', [
            'filters' => [
                'month' => $month,
                'facility_id' => $facilityId,
            ],
            ...$data,
        ]);
    }

    /**
     * Mark a facility's monthly collection as billed or not billed.
     */
    public function updateBillingStatus(Request $request, Facility $facility): RedirectResponse
    {
        $validated = $request->validate([
            'period' => ['required', 'date_format:Y-m'],
            'status' => ['required', Rule::in(FacilityBilling::STATUSES)],
        ]);

        $isBilled = $validated['status'] === 'BILLED';

        FacilityBilling::updateOrCreate(
            [
                'facility_id' => $facility->id,
                'period' => $validated['period'],
            ],
            [
                'status' => $validated['status'],
                'billed_at' => $isBilled ? now() : null,
                'billed_by' => $isBilled ? $request->user()->id : null,
            ],
        );

        return back()->with('success', $isBilled
            ? "{$facility->name} marked as billed for {$validated['period']}."
            : "{$facility->name} marked as not billed for {$validated['period']}.");
    }
}
