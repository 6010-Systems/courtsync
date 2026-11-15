<?php

namespace Tests\Feature;

use App\Models\Court;
use App\Models\Facility;
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
