<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Seeder;

class FacilityOwnerSeeder extends Seeder
{
    /**
     * Seed facility owner accounts, each with an approved facility.
     *
     * Access: can manage their own facility/facilities (create, edit, verification
     * submission), manage staff and players within those facilities. Cannot access
     * the /admin panel (CheckAdmin blocks anyone whose role isn't 'ADMIN').
     */
    public function run(): void
    {
        User::factory()
            ->facilityOwner()
            ->has(Facility::factory(), 'facilities')
            ->create([
                'name' => 'Owner Demo',
                'email' => 'owner@example.com',
            ]);

        User::factory()
            ->count(3)
            ->facilityOwner()
            ->has(Facility::factory(), 'facilities')
            ->create();
    }
}
