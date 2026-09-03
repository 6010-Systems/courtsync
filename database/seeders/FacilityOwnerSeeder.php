<?php

namespace Database\Seeders;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Seeder;

class FacilityOwnerSeeder extends Seeder
{
    /**
     * Seed facility owner accounts, each with an approved facility and a
     * handful of courts.
     *
     * Access: can manage their own facility/facilities (create, edit, verification
     * submission, courts), manage staff and players within those facilities, and
     * control which of those permissions their staff are granted. Cannot access
     * the /admin panel (CheckAdmin blocks anyone whose role isn't 'ADMIN').
     */
    public function run(): void
    {
        $demoOwner = User::factory()
            ->facilityOwner()
            ->has(Facility::factory()->count(2), 'facilities')
            ->create([
                'name' => 'Owner Demo',
                'email' => 'owner@example.com',
            ]);

        $demoOwner->facilities->each(function (Facility $facility) {
            Court::factory()->count(2)->create(['facility_id' => $facility->id]);
            Court::factory()->openPlay()->create(['facility_id' => $facility->id]);
            Court::factory()->blocked()->create(['facility_id' => $facility->id]);
        });

        User::factory()
            ->count(3)
            ->facilityOwner()
            ->has(Facility::factory(), 'facilities')
            ->create()
            ->each(function (User $owner) {
                Court::factory()->count(3)->create(['facility_id' => $owner->facilities()->first()->id]);
            });
    }
}
