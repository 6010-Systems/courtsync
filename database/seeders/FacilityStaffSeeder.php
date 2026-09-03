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
     * facility_id (Facility::staff()/User::workFacility()). Their access to
     * that facility's players/courts is gated by the `permissions` column
     * (see User::STAFF_PERMISSIONS) which the facility owner controls from
     * the Team Management page. Staff cannot create/edit facilities, manage
     * other staff, or access /admin.
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
                'permissions' => ['view_players', 'manage_players', 'view_courts', 'create_courts', 'edit_courts', 'delete_courts'],
            ]);

        $facilities->each(function (Facility $facility) {
            User::factory()
                ->facilityStaff()
                ->create([
                    'facility_id' => $facility->id,
                    'permissions' => ['view_players', 'manage_players', 'view_courts'],
                ]);

            User::factory()
                ->facilityStaff()
                ->create([
                    'facility_id' => $facility->id,
                    'permissions' => [],
                ]);
        });
    }
}
