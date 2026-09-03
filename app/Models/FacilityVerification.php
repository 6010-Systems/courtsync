<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['facility_id', 'government_id_type', 'government_id_number', 'government_id_image_path', 'business_permit_path', 'business_registration_path', 'proof_of_ownership_path', 'facility_photos'])]
class FacilityVerification extends Model
{
    protected function casts(): array
    {
        return [
            'facility_photos' => 'array',
        ];
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }
}
