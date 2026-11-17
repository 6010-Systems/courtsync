<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityCustomersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::parse('2026-11-16 10:00:00', config('app.timezone')));
    }

    private function booking(Facility $facility, array $attributes = []): Booking
    {
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        return Booking::query()->create(array_merge([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-10',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'confirmed',
        ], $attributes));
    }

    public function test_customers_are_grouped_with_booking_counts_and_totals(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $alice = User::factory()->player()->create(['name' => 'Alice Player']);
        $bob = User::factory()->player()->create(['name' => 'Bob Player']);

        $this->booking($facility, ['user_id' => $alice->id, 'total_price' => 300]);
        $this->booking($facility, ['user_id' => $alice->id, 'total_price' => 400, 'date' => '2026-11-12']);
        $this->booking($facility, ['user_id' => $alice->id, 'total_price' => 500, 'status' => 'cancelled']);
        $this->booking($facility, ['user_id' => $bob->id, 'total_price' => 300]);
        $this->booking($facility, ['user_id' => null, 'guest_name' => 'Walk-in Juan', 'total_price' => 200]);
        $this->booking($facility, ['user_id' => null, 'guest_name' => 'Walk-in Juan', 'total_price' => 200, 'date' => '2026-11-13']);

        $this->actingAs($owner)
            ->get(route('facility.customers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Customers')
                ->where('summary.customers', 3)
                ->where('summary.registered', 2)
                ->where('summary.walk_ins', 1)
                ->where('summary.bookings', 5)
                ->where('summary.total_spent', 1400)
                ->has('customers.data', 3)
                ->where('customers.data.0.name', 'Alice Player')
                ->where('customers.data.0.type', 'registered')
                ->where('customers.data.0.bookings_count', 2)
                ->where('customers.data.0.total_spent', 700)
                ->where('customers.data.1.name', 'Walk-in Juan')
                ->where('customers.data.1.type', 'walk_in')
                ->where('customers.data.1.bookings_count', 2)
                ->where('customers.data.2.name', 'Bob Player')
                ->where('customers.data.2.bookings_count', 1));
    }

    public function test_cancelled_bookings_do_not_create_customers(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $player = User::factory()->player()->create(['name' => 'Cancelled Carl']);

        $this->booking($facility, ['user_id' => $player->id, 'status' => 'cancelled']);

        $this->actingAs($owner)
            ->get(route('facility.customers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.customers', 0)
                ->has('customers.data', 0));
    }

    public function test_search_filters_the_customer_list(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->booking($facility, ['user_id' => null, 'guest_name' => 'Walk-in Juan']);
        $this->booking($facility, ['user_id' => User::factory()->player()->create(['name' => 'Maria Santos'])->id]);

        $this->actingAs($owner)
            ->get(route('facility.customers', ['search' => 'juan']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.search', 'juan')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Walk-in Juan'));
    }

    public function test_type_filter_segments_registered_and_walk_in_customers(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->booking($facility, ['user_id' => null, 'guest_name' => 'Walk-in Juan']);
        $this->booking($facility, ['user_id' => User::factory()->player()->create(['name' => 'Maria Santos'])->id]);

        $this->actingAs($owner)
            ->get(route('facility.customers', ['type' => 'walk_in']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', 'walk_in')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Walk-in Juan')
                ->where('customers.data.0.type', 'walk_in'));

        $this->actingAs($owner)
            ->get(route('facility.customers', ['type' => 'registered']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.type', 'registered')
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Maria Santos')
                ->where('customers.data.0.type', 'registered'));
    }

    public function test_staff_only_see_customers_from_their_facility(): void
    {
        $facility = Facility::factory()->create(['name' => 'Staff Facility']);
        $otherFacility = Facility::factory()->create(['name' => 'Other Facility']);
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);

        $this->booking($facility, ['user_id' => User::factory()->player()->create(['name' => 'Own Customer'])->id]);
        $this->booking($otherFacility, ['user_id' => User::factory()->player()->create(['name' => 'Other Customer'])->id]);

        $this->actingAs($staff)
            ->get(route('facility.customers'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('customers.data', 1)
                ->where('customers.data.0.name', 'Own Customer'));
    }

    public function test_owner_cannot_filter_by_another_owners_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);
        $foreignFacility = Facility::factory()->create();

        $this->actingAs($owner)
            ->get(route('facility.customers', ['facility_id' => $foreignFacility->id]))
            ->assertForbidden();
    }

    public function test_players_cannot_view_facility_customers(): void
    {
        $this->actingAs(User::factory()->player()->create())
            ->get(route('facility.customers'))
            ->assertForbidden();
    }
}
