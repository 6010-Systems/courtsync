<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'], true);
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->role === 'ADMIN') {
            return true;
        }

        $facilityId = $payment->booking?->facility_id;

        return $facilityId !== null && $user->managesFacility($facilityId);
    }
}
