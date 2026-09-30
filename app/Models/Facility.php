<?php

namespace App\Models;

use Database\Factories\FacilityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'slug', 'name', 'address', 'city', 'province', 'country', 'contact_number', 'description', 'verification_status', 'gcash_name', 'gcash_number', 'gcash_qr_url', 'maya_name', 'maya_number', 'maya_qr_url'])]
class Facility extends Model
{
    /** @use HasFactory<FacilityFactory> */
    use HasFactory;

    /**
     * Build a clean, unique slug from a name, e.g. "Court Sync" -> "court-sync",
     * or "court-sync-2" if that's already taken by another facility.
     */
    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            static::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

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

    public function players(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'facility_player')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function courts()
    {
        return $this->hasMany(Court::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
