<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Database\Factories\FacilityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'slug', 'name', 'logo_url', 'cover_photo_url', 'address', 'city', 'province', 'country', 'contact_number', 'description', 'operating_days', 'operational_status', 'verification_status', 'gcash_name', 'gcash_number', 'gcash_qr_url', 'maya_name', 'maya_number', 'maya_qr_url', 'booking_fee_type', 'booking_fee_value'])]
class Facility extends Model
{
    /** @use HasFactory<FacilityFactory> */
    use HasFactory;

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['cover_image_url', 'operating_days_label'];

    /**
     * Supported booking fee modes.
     *
     * @var array<int, string>
     */
    public const BOOKING_FEE_TYPES = ['FIXED', 'PERCENT'];

    public const OPERATIONAL_OPEN = 'OPEN';

    public const OPERATIONAL_MAINTENANCE = 'MAINTENANCE';

    public const OPERATIONAL_UNSERVICEABLE = 'UNSERVICEABLE';

    /**
     * @var array<int, string>
     */
    public const OPERATIONAL_STATUSES = [
        self::OPERATIONAL_OPEN,
        self::OPERATIONAL_MAINTENANCE,
        self::OPERATIONAL_UNSERVICEABLE,
    ];

    /**
     * ISO weekdays (1=Mon … 7=Sun).
     *
     * @var array<int, int>
     */
    public const ALL_OPERATING_DAYS = [1, 2, 3, 4, 5, 6, 7];

    /**
     * @var array<int, string>
     */
    public const WEEKDAY_LABELS = [
        1 => 'Mon',
        2 => 'Tue',
        3 => 'Wed',
        4 => 'Thu',
        5 => 'Fri',
        6 => 'Sat',
        7 => 'Sun',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'operational_status' => self::OPERATIONAL_OPEN,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'booking_fee_value' => 'decimal:2',
            'operating_days' => 'array',
        ];
    }

    /**
     * Whether admin verification has approved this facility for public booking.
     */
    public function isApproved(): bool
    {
        return ($this->verification_status ?? '') === 'APPROVED';
    }

    /**
     * Whether the facility operational status allows new bookings right now.
     * Approval is checked separately via isApproved().
     */
    public function isAcceptingBookings(): bool
    {
        return ($this->operational_status ?? self::OPERATIONAL_OPEN) === self::OPERATIONAL_OPEN;
    }

    /**
     * Whether the facility is open on the given calendar date (ISO weekday).
     */
    public function isOpenOnDate(string|CarbonInterface $date): bool
    {
        $carbon = $date instanceof CarbonInterface ? $date->copy() : Carbon::parse($date);
        $days = $this->normalizedOperatingDays();

        return in_array((int) $carbon->isoWeekday(), $days, true);
    }

    /**
     * @return array<int, int>
     */
    public function normalizedOperatingDays(): array
    {
        $days = collect($this->operating_days ?? self::ALL_OPERATING_DAYS)
            ->map(fn ($day) => (int) $day)
            ->filter(fn (int $day) => $day >= 1 && $day <= 7)
            ->unique()
            ->sort()
            ->values()
            ->all();

        return $days === [] ? self::ALL_OPERATING_DAYS : $days;
    }

    public function operatingDaysLabel(): string
    {
        $days = $this->normalizedOperatingDays();

        if ($days === self::ALL_OPERATING_DAYS) {
            return 'All week';
        }

        if ($days === [1, 2, 3, 4, 5]) {
            return 'Mon–Fri';
        }

        if ($days === [6, 7]) {
            return 'Sat–Sun';
        }

        return collect($days)
            ->map(fn (int $day) => self::WEEKDAY_LABELS[$day])
            ->implode(', ');
    }

    public function getOperatingDaysLabelAttribute(): string
    {
        return $this->operatingDaysLabel();
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

    /**
     * The facility's rate card (packages and hourly add-ons).
     */
    public function ratePlans()
    {
        return $this->hasMany(RatePlan::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
