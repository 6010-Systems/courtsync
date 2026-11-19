<?php

namespace App\Models;

use Database\Factories\RatePlanFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'facility_id',
    'name',
    'kind',
    'description',
    'day_rate',
    'night_rate',
    'day_start_time',
    'night_start_time',
    'includes_ball',
    'included_paddles',
    'max_quantity',
    'is_active',
    'sort_order',
])]
class RatePlan extends Model
{
    /** @use HasFactory<RatePlanFactory> */
    use HasFactory;

    /**
     * Bookable packages vs hourly extras.
     *
     * @var array<int, string>
     */
    public const KINDS = ['COURT', 'ADDON'];

    /**
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'day_rate' => 'decimal:2',
            'night_rate' => 'decimal:2',
            'includes_ball' => 'boolean',
            'included_paddles' => 'integer',
            'max_quantity' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    /**
     * Courts that offer this plan, with their price overrides.
     */
    public function courts(): BelongsToMany
    {
        return $this->belongsToMany(Court::class, 'court_rate_plan')
            ->withPivot('is_enabled', 'day_rate_override', 'night_rate_override')
            ->withTimestamps();
    }

    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function scopeCourtRates(Builder $query): void
    {
        $query->where('kind', 'COURT');
    }

    public function scopeAddons(Builder $query): void
    {
        $query->where('kind', 'ADDON');
    }

    public function isAddon(): bool
    {
        return $this->kind === 'ADDON';
    }

    /**
     * Whether this plan splits its price between day and night hours.
     */
    public function hasNightRate(): bool
    {
        return $this->night_rate !== null;
    }

    /**
     * Inclusion label shown on the public rate card, e.g. "Court, ball & 4 paddles".
     */
    public function inclusionLabel(): string
    {
        if ($this->isAddon()) {
            return 'Per paddle, per hour';
        }

        $items = ['Court'];

        if ($this->includes_ball) {
            $items[] = 'ball';
        }

        if ($this->included_paddles > 0) {
            $items[] = $this->included_paddles.' '.($this->included_paddles === 1 ? 'paddle' : 'paddles');
        }

        return implode(', ', $items);
    }
}
