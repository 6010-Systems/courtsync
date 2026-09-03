<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'slug', 'name', 'address', 'city', 'province', 'country', 'contact_number', 'description', 'verification_status'])]
class Facility extends Model
{
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function verification()
    {
        return $this->hasOne(FacilityVerification::class);
    }

    public function staff()
    {
        return $this->hasMany(User::class, 'facility_id');
    }

    public function players(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'facility_player')
                    ->withPivot('status')
                    ->withTimestamps();
    }
}
