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

    protected $fillable = [
        'facility_id', 'user_id', 'guest_name', 'court_id', 'date', 'start_time', 'end_time', 'subtotal', 'booking_fee', 'total_price', 'status',
    ];

    /**
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'booking_fee' => 'decimal:2',
            'total_price' => 'decimal:2',
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

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
