<?php

namespace App\Http\Controllers\Player;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use Inertia\Inertia;

class FacilityShowController extends Controller
{
    public function show(Facility $facility)
    {
        $facility->load('verification:id,facility_id,facility_photos');
        $facility->load('courts');

        return Inertia::render('Player/Show', [
            'facility' => $facility,
        ]);
    }
}
