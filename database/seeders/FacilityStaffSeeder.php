<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Seeder;

class FacilityStaffSeeder extends Seeder
{
    /**
     * Seed facility staff accounts, attached to an existing facility via facility_id.
     *
     * Access: staff are scoped to the single facility referenced by their
     * facility_id (Facility::staff()/User::workFacility()). Controllers let them
     * manage that facility's players (facility/players routes) alongside the
     * owner, but staff cannot create/edit facilities or access /admin.
     */
    public function run(): void
    {
        $facilities = Facility::all();

        if ($facilities->isEmpty()) {
            $facilities = collect([
                Facility::factory()->create(),
            ]);
        }

        User::factory()
            ->facilityStaff()
            ->create([
                'name' => 'Staff Demo',
                'email' => 'staff@example.com',
                'facility_id' => $facilities->first()->id,
            ]);

        $facilities->each(function (Facility $facility) {
            User::factory()
                ->count(2)
                ->facilityStaff()
                ->create([
                    'facility_id' => $facility->id,
                ]);
        });
    }
}
