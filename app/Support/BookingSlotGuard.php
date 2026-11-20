<?php

namespace App\Support;

use App\Models\Booking;
use App\Models\Court;
use Closure;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingSlotGuard
{
    /**
     * Serialize bookings for a court, then create only if the window is free.
     *
     * @template TReturn of Booking
     *
     * @param  Closure(): TReturn  $create
     * @return TReturn
     */
    public function claim(
        Court $court,
        string $date,
        string $startTime,
        string $endTime,
        Closure $create,
    ): Booking {
        return DB::transaction(function () use ($court, $date, $startTime, $endTime, $create) {
            Court::query()->whereKey($court->id)->lockForUpdate()->firstOrFail();

            if ($this->hasConflict($court->id, $date, $startTime, $endTime)) {
                throw ValidationException::withMessages([
                    'conflict' => 'Sorry, this court is already booked for that time.',
                    'start_time' => 'This time slot overlaps with an existing reservation.',
                ]);
            }

            return $create();
        });
    }

    public function hasConflict(int $courtId, string $date, string $startTime, string $endTime): bool
    {
        return Booking::query()
            ->overlapping($courtId, $date, $startTime, $endTime)
            ->exists();
    }
}
