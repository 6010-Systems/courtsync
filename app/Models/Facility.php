<?php

namespace App\Models;

use Database\Factories\FacilityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'slug', 'name', 'logo_url', 'cover_photo_url', 'address', 'city', 'province', 'country', 'contact_number', 'description', 'verification_status', 'gcash_name', 'gcash_number', 'gcash_qr_url', 'maya_name', 'maya_number', 'maya_qr_url', 'booking_fee_type', 'booking_fee_value'])]
class Facility extends Model
{
    /** @use HasFactory<FacilityFactory> */
    use HasFactory;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['cover_image_url'];

    /**
     * Supported booking fee modes.
     *
     * @var array<int, string>
     */
    public const BOOKING_FEE_TYPES = ['FIXED', 'PERCENT'];

    /**
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'booking_fee_value' => 'decimal:2',
        ];
    }

    /**
     * Amount charged on top of the court subtotal for a booking.
     *
     * A FIXED fee is a flat peso amount, a PERCENT fee is a share of the subtotal.
     */
    public function calculateBookingFee(float $subtotal): float
    {
        $value = (float) ($this->booking_fee_value ?? 0);

        if ($value <= 0) {
            return 0.0;
        }

        if ($this->booking_fee_type === 'PERCENT') {
            return round($subtotal * min($value, 100) / 100, 2);
        }

        return round($value, 2);
    }

    /**
     * Resolved cover image URL (fallback to verification photo if direct cover is null).
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_photo_url ?? ($this->verification?->facility_photos[0] ?? null);
    }

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
