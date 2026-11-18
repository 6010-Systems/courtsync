<?php

namespace Tests\Feature;

use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityOwnerCourtControllerTest extends TestCase
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

    public function test_owner_creates_a_split_priced_court_with_its_operating_schedule(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);

        $this->actingAs($owner)->post(route('facility.courts.store'), [
            'facility_id' => $facility->id,
            'name' => 'Court 1',
            'type' => 'Badminton',
            'time_range' => '7:00 AM - 11:00 PM',
            'pricing_mode' => 'SPLIT',
            'day_rate' => 250,
            'night_rate' => 400,
            'day_start_time' => '07:00',
            'night_start_time' => '19:00',
            'status' => 'AVAILABLE',
        ])->assertRedirect();

        $court = Court::where('name', 'Court 1')->firstOrFail();

        $this->assertSame($facility->id, $court->facility_id);
        $this->assertSame('7:00 AM - 11:00 PM', $court->time_range);
        $this->assertSame('SPLIT', $court->pricing_mode);
        $this->assertEquals(250.0, (float) $court->day_rate);
        $this->assertEquals(400.0, (float) $court->night_rate);
        $this->assertSame('07:00', substr((string) $court->day_start_time, 0, 5));
        $this->assertSame('19:00', substr((string) $court->night_start_time, 0, 5));
    }

    public function test_operating_schedule_is_required_before_a_court_can_be_saved(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $court = Court::factory()->flatPricing(350)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
        ]);

        $this->actingAs($owner)->post(route('facility.courts.store'), [
            'facility_id' => $facility->id,
            'name' => 'Court Without Hours',
            'type' => 'Tennis',
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 300,
        ])->assertSessionHasErrors('time_range');

        $this->assertDatabaseMissing('courts', ['name' => 'Court Without Hours']);

        $this->actingAs($owner)->put(route('facility.courts.update', $court), [
            'name' => 'Renamed Court',
            'type' => 'Tennis',
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 350,
        ])->assertSessionHasErrors('time_range');

        $this->assertSame('6:00 AM - 10:00 PM', $court->fresh()->time_range);
        $this->assertSame($court->name, $court->fresh()->name);
    }

    public function test_updating_keeps_saved_schedule_and_split_setup_when_switching_to_flat_rate(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $court = Court::factory()->splitPricing(300, 450, '19:00:00')->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
        ]);

        $this->actingAs($owner)->put(route('facility.courts.update', $court), [
            'name' => 'Court A',
            'type' => 'Badminton',
            'time_range' => '7:00 AM - 11:00 PM',
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 350,
            'status' => 'AVAILABLE',
        ])->assertRedirect();

        $court->refresh();

        $this->assertSame('FLAT', $court->pricing_mode);
        $this->assertSame('7:00 AM - 11:00 PM', $court->time_range);
        $this->assertEquals(350.0, (float) $court->hourly_rate);
        $this->assertEquals(300.0, (float) $court->day_rate);
        $this->assertEquals(450.0, (float) $court->night_rate);
        $this->assertSame('19:00', substr((string) $court->night_start_time, 0, 5));

        $this->actingAs($owner)->put(route('facility.courts.update', $court), [
            'name' => 'Court A',
            'type' => 'Badminton',
            'time_range' => '7:00 AM - 11:00 PM',
            'pricing_mode' => 'SPLIT',
            'day_rate' => 300,
            'night_rate' => 450,
            'day_start_time' => '06:00',
            'night_start_time' => '19:00',
            'status' => 'AVAILABLE',
        ])->assertRedirect();

        $court->refresh();

        $this->assertSame('SPLIT', $court->pricing_mode);
        $this->assertEquals(450.0, (float) $court->night_rate);
        $this->assertSame('19:00', substr((string) $court->night_start_time, 0, 5));
    }

    public function test_court_list_exposes_the_saved_schedule_and_pricing_mode_for_editing(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        Court::factory()->splitPricing(300, 450)->create([
            'facility_id' => $facility->id,
            'time_range' => '8:00 AM - 9:00 PM',
        ]);

        $this->actingAs($owner)->get(route('facility.courts'))->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Courts')
                ->where('facilities.0.courts.0.time_range', '8:00 AM - 9:00 PM')
                ->where('facilities.0.courts.0.pricing_mode', 'SPLIT')
                ->where('facilities.0.courts.0.day_rate', fn ($rate) => (float) $rate === 300.0));
    }

    public function test_owner_assigns_rate_plans_to_a_court_with_overrides(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
        ]);

        $rental = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        $allIn = RatePlan::factory()->allIn()->create(['facility_id' => $facility->id]);
        $paddle = RatePlan::factory()->paddleAddon()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)->put(route('facility.courts.update', $court), [
            'name' => $court->name,
            'type' => $court->type,
            'time_range' => $court->time_range,
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 300,
            'status' => 'AVAILABLE',
            'rate_plans' => [
                ['id' => $rental->id, 'is_enabled' => true],
                ['id' => $allIn->id, 'is_enabled' => true, 'day_rate_override' => 275, 'night_rate_override' => 375],
                ['id' => $paddle->id, 'is_enabled' => false],
            ],
        ])->assertRedirect();

        $assignments = $court->ratePlans()->get()->keyBy('id');

        $this->assertCount(3, $assignments);
        $this->assertTrue((bool) $assignments[$rental->id]->pivot->is_enabled);
        $this->assertEquals(275.0, (float) $assignments[$allIn->id]->pivot->day_rate_override);
        $this->assertEquals(375.0, (float) $assignments[$allIn->id]->pivot->night_rate_override);
        $this->assertFalse((bool) $assignments[$paddle->id]->pivot->is_enabled);
    }

    public function test_a_new_court_inherits_the_active_rate_card(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $rental = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        $paddle = RatePlan::factory()->paddleAddon()->create(['facility_id' => $facility->id]);
        RatePlan::factory()->allIn()->inactive()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)->post(route('facility.courts.store'), [
            'facility_id' => $facility->id,
            'name' => 'Court With Card',
            'type' => 'Pickleball',
            'time_range' => '6:00 AM - 10:00 PM',
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 300,
            'status' => 'AVAILABLE',
        ])->assertRedirect();

        $court = Court::where('name', 'Court With Card')->firstOrFail();

        $this->assertEqualsCanonicalizing(
            [$rental->id, $paddle->id],
            $court->ratePlans()->pluck('rate_plans.id')->all(),
        );
    }

    public function test_rate_plans_are_listed_in_rate_card_order(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $allIn = RatePlan::factory()->allIn()->create(['facility_id' => $facility->id, 'sort_order' => 2]);
        $rental = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id, 'sort_order' => 1]);

        // Attach out of order on purpose.
        $court->ratePlans()->attach([$allIn->id, $rental->id]);

        $this->actingAs($owner)->get(route('facility.courts'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('facilities.0.courts.0.rate_plans.0.name', 'Court Rental')
                ->where('facilities.0.courts.0.rate_plans.1.name', 'All-In'));
    }

    public function test_court_list_shows_the_rate_card_on_unassigned_courts(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        Court::factory()->flatPricing(1000)->create(['facility_id' => $facility->id]);
        RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id, 'sort_order' => 1]);

        $this->actingAs($owner)->get(route('facility.courts'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('facilities.0.courts.0.rate_plans.0.name', 'Court Rental'));
    }

    public function test_unticking_every_rate_plan_switches_the_court_to_its_own_rates(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = $this->facilityFor($owner);
        $plan = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
        ]);
        $court->ratePlans()->attach($plan->id);

        $this->actingAs($owner)->put(route('facility.courts.update', $court), [
            'name' => $court->name,
            'type' => $court->type,
            'time_range' => $court->time_range,
            'pricing_mode' => 'SPLIT',
            'day_rate' => 300,
            'night_rate' => 450,
            'day_start_time' => '06:00',
            'night_start_time' => '18:00',
            'status' => 'AVAILABLE',
            'rate_plans' => [],
        ])->assertRedirect();

        $court->refresh();

        $this->assertFalse($court->uses_rate_card);
        $this->assertSame(0, $court->ratePlans()->count());
        $this->assertSame('SPLIT', $court->pricing_mode);

        $this->actingAs($owner)->get(route('facility.courts'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('facilities.0.courts.0.rate_plans', 0));
    }

    public function test_owner_cannot_update_a_court_inside_another_owners_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $this->facilityFor($owner);
        $foreignCourt = Court::factory()->create();

        $this->actingAs($owner)->put(route('facility.courts.update', $foreignCourt), [
            'name' => 'Hijacked Court',
            'type' => 'Tennis',
            'time_range' => '6:00 AM - 10:00 PM',
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 300,
        ])->assertForbidden();

        $this->assertNotSame('Hijacked Court', $foreignCourt->fresh()->name);
    }
}
