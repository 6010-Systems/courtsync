<?php

namespace App\Policies;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;

class CourtPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('view_courts') || $user->role === 'ADMIN';
    }

    public function view(User $user, Court $court): bool
    {
        if ($user->role === 'ADMIN') {
            return true;
        }

        return $user->hasPermission('view_courts') && $user->managesFacility($court->facility_id);
    }

    public function create(User $user, ?Facility $facility = null): bool
    {
        if (! $user->hasPermission('create_courts')) {
            return false;
        }

        if ($facility === null) {
            return true;
        }

        return $user->managesFacility($facility);
    }

    public function update(User $user, Court $court): bool
    {
        return $user->hasPermission('edit_courts') && $user->managesFacility($court->facility_id);
    }

    public function delete(User $user, Court $court): bool
    {
        return $user->hasPermission('delete_courts') && $user->managesFacility($court->facility_id);
    }
}
