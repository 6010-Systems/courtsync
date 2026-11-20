<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    public function scopeUpcoming(Builder $query, CarbonInterface $at): void
    {
        $query->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($at) {
                $query->where('date', '>', $at->toDateString())
                    ->orWhere(function ($query) use ($at) {
                        $query->where('date', $at->toDateString())->where('end_time', '>', $at->format('H:i:s'));
                    });
            });
    }

    public function scopePast(Builder $query, CarbonInterface $at): void
    {
        $query->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($at) {
                $query->where('date', '<', $at->toDateString())
                    ->orWhere(function ($query) use ($at) {
                        $query->where('date', $at->toDateString())->where('end_time', '<=', $at->format('H:i:s'));
                    });
            });
    }

    /**
     * Active bookings that overlap [startTime, endTime) on the same court/date.
     */
    public function scopeOverlapping(
        Builder $query,
        int $courtId,
        string $date,
        string $startTime,
        string $endTime,
    ): void {
        $startTime = strlen($startTime) === 5 ? $startTime.':00' : $startTime;
        $endTime = strlen($endTime) === 5 ? $endTime.':00' : $endTime;

        $query->where('court_id', $courtId)
            ->where('date', $date)
            ->whereNotIn('status', ['cancelled', 'rejected', 'CANCELLED', 'REJECTED'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);
    }

    protected $fillable = [
        'facility_id', 'user_id', 'guest_name', 'court_id', 'rate_plan_id', 'rate_plan_name', 'date', 'start_time', 'end_time',
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
