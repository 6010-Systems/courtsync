<?php

namespace Tests\Feature;

use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityOwnerRatePlanControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function facilityFor(User $owner): Facility
    {
        return Facility::factory()->create(['user_id' => $owner->id]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Facility $facility, array $overrides = []): array
    {
        return array_merge([
            'facility_id' => $facility->id,
            'name' => 'Court Rental',
            'kind' => 'COURT',
            'description' => 'Free use of ball',
            'day_rate' => 150,
            'night_rate' => 250,
            'day_start_time' => '05:00',
            'night_start_time' => '17:00',
            'includes_ball' => true,
            'included_paddles' => 0,
            'is_active' => true,
        ], $overrides);
    }

    public function test_owner_creates_a_rate_and_it_applies_to_every_court(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $courts = Court::factory()->count(2)->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)
            ->post(route('facility.rates.store'), $this->payload($facility))
            ->assertRedirect();

        $plan = RatePlan::where('name', 'Court Rental')->firstOrFail();

        $this->assertSame($facility->id, $plan->facility_id);
        $this->assertSame('COURT', $plan->kind);
        $this->assertSame('17:00', substr((string) $plan->night_start_time, 0, 5));
        $this->assertCount(2, $plan->courts);
        $this->assertSame(
            $courts->pluck('id')->sort()->values()->all(),
            $plan->courts->pluck('id')->sort()->values()->all()
        );
    }

    public function test_rate_names_must_be_unique_per_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)
            ->post(route('facility.rates.store'), $this->payload($facility))
            ->assertSessionHasErrors('name');
    }

    public function test_owner_cannot_manage_another_owners_rate_card(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $this->facilityFor($owner);
        $foreign = Facility::factory()->create();

        $this->actingAs($owner)
            ->post(route('facility.rates.store'), $this->payload($foreign))
            ->assertForbidden();
    }

    public function test_updating_a_rate_changes_the_card_and_court_assignment(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        [$first, $second] = Court::factory()->count(2)->create(['facility_id' => $facility->id]);
        $plan = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        $plan->courts()->attach([$first->id, $second->id]);

        $this->actingAs($owner)
            ->put(route('facility.rates.update', $plan), $this->payload($facility, [
                'day_rate' => 180,
                'night_rate' => 280,
                'court_ids' => [$first->id],
            ]))
            ->assertRedirect();

        $plan->refresh();

        $this->assertEquals(180.0, (float) $plan->day_rate);
        $this->assertEquals(280.0, (float) $plan->night_rate);
        $this->assertSame([$first->id], $plan->courts()->pluck('courts.id')->all());
    }

    public function test_owner_can_delete_a_rate(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $plan = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)
            ->delete(route('facility.rates.destroy', $plan))
            ->assertRedirect();

        $this->assertDatabaseMissing('rate_plans', ['id' => $plan->id]);
        $this->assertDatabaseCount('court_rate_plan', 0);
    }

    public function test_the_rate_card_page_lists_the_facility_plans(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        Court::factory()->create(['facility_id' => $facility->id]);
        RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        RatePlan::factory()->paddleAddon()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)
            ->get(route('facility.rates'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Rates')
                ->has('facilities.0.rate_plans', 2)
                ->has('facilities.0.courts', 1)
                ->where('can.edit', true));
    }
}
