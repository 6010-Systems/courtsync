<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Booking extends Model
{
    /**
     * Bookings that have not finished yet (ongoing sessions count as upcoming).
     *
     * A booking that crosses midnight is stored with an `end_date`; its end time
     * belongs to that later calendar day, so the plain `end_time` on `date`
     * must not be used to decide whether it is over.
     */
    public function scopeUpcoming(Builder $query, CarbonInterface $at): void
    {
        $today = $at->toDateString();
        $now = $at->format('H:i:s');

        $query->whereIn('status', ['pending', 'confirmed'])
            ->where(function (Builder $query) use ($today, $now) {
                $query->whereNotNull('end_date')
                    ->where(function (Builder $query) use ($today, $now) {
                        $query->where('end_date', '>', $today)
                            ->orWhere(function (Builder $query) use ($today, $now) {
                                $query->where('end_date', $today)->where('end_time', '>', $now);
                            });
                    })
                    ->orWhere(function (Builder $query) use ($today, $now) {
                        $query->whereNull('end_date')
                            ->where(function (Builder $query) use ($today, $now) {
                                $query->where('date', '>', $today)
                                    ->orWhere(function (Builder $query) use ($today, $now) {
                                        $query->where('date', $today)->where('end_time', '>', $now);
                                    });
                            });
                    });
            });
    }

    /**
     * Bookings that have already finished.
     */
    public function scopePast(Builder $query, CarbonInterface $at): void
    {
        $today = $at->toDateString();
        $now = $at->format('H:i:s');

        $query->whereIn('status', ['pending', 'confirmed'])
            ->where(function (Builder $query) use ($today, $now) {
                $query->whereNotNull('end_date')
                    ->where(function (Builder $query) use ($today, $now) {
                        $query->where('end_date', '<', $today)
                            ->orWhere(function (Builder $query) use ($today, $now) {
                                $query->where('end_date', $today)->where('end_time', '<=', $now);
                            });
                    })
                    ->orWhere(function (Builder $query) use ($today, $now) {
                        $query->whereNull('end_date')
                            ->where(function (Builder $query) use ($today, $now) {
                                $query->where('date', '<', $today)
                                    ->orWhere(function (Builder $query) use ($today, $now) {
                                        $query->where('date', $today)->where('end_time', '<=', $now);
                                    });
                            });
                    });
            });
    }

    /**
     * Whether this session ends on a later calendar day.
     */
    public function endsNextDay(): bool
    {
        if ($this->end_date !== null) {
            return true;
        }

        return (string) $this->end_time <= (string) $this->start_time;
    }

    /**
     * The exact moment this session starts.
     */
    public function startsAt(): CarbonInterface
    {
        return Carbon::parse($this->date.' '.$this->start_time);
    }

    /**
     * The exact moment this session finishes.
     */
    public function endsAt(): CarbonInterface
    {
        $end = Carbon::parse($this->date.' '.$this->end_time);

        if ($this->end_date !== null) {
            return Carbon::parse($this->end_date.' '.$this->end_time);
        }

        return $this->endsNextDay() ? $end->addDay() : $end;
    }

    protected $fillable = [
        'facility_id', 'user_id', 'guest_name', 'court_id', 'rate_plan_id', 'rate_plan_name', 'date', 'end_date', 'start_time', 'end_time',
        'subtotal', 'addons_total', 'booking_fee', 'total_price', 'price_breakdown', 'status',
    ];

    /**
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'addons_total' => 'decimal:2',
            'booking_fee' => 'decimal:2',
            'total_price' => 'decimal:2',
            'price_breakdown' => 'array',
        ];
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function court()
    {
        return $this->belongsTo(Court::class);
    }

    public function ratePlan()
    {
        return $this->belongsTo(RatePlan::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
