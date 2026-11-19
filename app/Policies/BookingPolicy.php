<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN', 'PLAYER'], true);
    }

    public function view(User $user, Booking $booking): bool
    {
        if ($user->role === 'ADMIN') {
            return true;
        }

        if ($user->role === 'PLAYER') {
            return (int) $booking->user_id === (int) $user->id;
        }

        return $user->managesFacility($booking->facility_id);
    }

    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function update(User $user, Booking $booking): bool
    {
        return $user->managesFacility($booking->facility_id);
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $user->managesFacility($booking->facility_id);
    }

    public function verify(User $user, Booking $booking): bool
    {
        return $user->managesFacility($booking->facility_id);
    }

    public function reject(User $user, Booking $booking): bool
    {
        return $user->managesFacility($booking->facility_id);
    }
}
