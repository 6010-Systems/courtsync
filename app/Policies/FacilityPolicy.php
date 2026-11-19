<?php

namespace App\Policies;

use App\Models\Facility;
use App\Models\User;

class FacilityPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'], true);
    }

    public function view(User $user, Facility $facility): bool
    {
        if ($user->role === 'ADMIN') {
            return true;
        }

        return $user->managesFacility($facility);
    }

    public function create(User $user): bool
    {
        return $user->role === 'FACILITY_OWNER' || $user->role === 'ADMIN';
    }

    public function update(User $user, Facility $facility): bool
    {
        if ($user->role === 'ADMIN') {
            return true;
        }

        return $user->role === 'FACILITY_OWNER' && $user->managesFacility($facility);
    }

    public function delete(User $user, Facility $facility): bool
    {
        return $this->update($user, $facility);
    }

    public function managePayments(User $user, Facility $facility): bool
    {
        return $user->role === 'FACILITY_OWNER' && $user->managesFacility($facility);
    }
}
