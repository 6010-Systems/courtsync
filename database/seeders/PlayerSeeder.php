<?php

namespace Database\Seeders;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Seeder;

class PlayerSeeder extends Seeder
{
    /**
     * Seed player accounts and join them to facilities via the facility_player pivot.
     *
     * Access: players authenticate per-facility (guest routes {facility:slug}/login,
     * /register) and, once joined, can only interact with facilities they've joined
     * and aren't banned from (facility_player.status). No access to owner/staff
     * facility-management routes or /admin.
     */
    public function run(): void
    {
        $demoPlayer = User::factory()->player()->create([
            'name' => 'Player Demo',
            'email' => 'player@example.com',
        ]);

        $players = User::factory()->count(10)->player()->create();

        $facilities = Facility::all();

        if ($facilities->isEmpty()) {
            $facilities = collect([Facility::factory()->create()]);
        }

        $demoPlayer->joinedFacilities()->attach($facilities->first()->id, ['status' => 'ACTIVE']);

        $players->each(function (User $player) use ($facilities) {
            $facility = $facilities->random();

            $player->joinedFacilities()->attach($facility->id, [
                'status' => fake()->boolean(10) ? 'BANNED' : 'ACTIVE',
            ]);
        });
    }
}
