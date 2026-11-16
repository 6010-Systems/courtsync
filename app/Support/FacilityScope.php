<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Collection;

class FacilityScope
{
    /**
     * Facility IDs the signed-in user may manage (owners: all their facilities,
     * staff: their assigned facility, everyone else: none).
     *
     * @return Collection<int, int>
     */
    public static function idsFor(?User $user): Collection
    {
        if (! $user) {
            return collect();
        }

        return match ($user->role) {
            'FACILITY_OWNER' => $user->facilities()->pluck('id'),
            'FACILITY_STAFF' => $user->facility_id ? collect([(int) $user->facility_id]) : collect(),
            default => collect(),
        };
    }
}
