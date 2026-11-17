<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityPlayersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_owner_can_view_players_page_with_correct_props(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'verification_status' => 'APPROVED',
        ]);

        $player = User::factory()->player()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
        $facility->players()->attach($player->id, ['status' => 'ACTIVE']);

        $this->actingAs($owner)
            ->get(route('facility.players'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Players')
                ->has('players', 1)
                ->where('players.0.name', 'John Doe')
                ->where('players.0.email', 'john@example.com')
                ->where('players.0.facility_name', $facility->name)
                ->where('players.0.facility_slug', $facility->slug)
                ->where('players.0.status', 'ACTIVE')
                ->where('canManage', true)
            );
    }

    public function test_owner_can_toggle_ban_status_of_player(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'verification_status' => 'APPROVED',
        ]);

        $player = User::factory()->player()->create();
        $facility->players()->attach($player->id, ['status' => 'ACTIVE']);

        $response = $this->actingAs($owner)
            ->post(route('facility.players.toggle-ban', $player->id), [
                'facility_id' => $facility->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('facility_player', [
            'facility_id' => $facility->id,
            'user_id' => $player->id,
            'status' => 'BANNED',
        ]);

        // Toggle back to ACTIVE
        $this->actingAs($owner)
            ->post(route('facility.players.toggle-ban', $player->id), [
                'facility_id' => $facility->id,
            ]);

        $this->assertDatabaseHas('facility_player', [
            'facility_id' => $facility->id,
            'user_id' => $player->id,
            'status' => 'ACTIVE',
        ]);
    }
}
