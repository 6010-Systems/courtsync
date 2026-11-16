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

class FacilityCalendarTest extends TestCase
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
            'user_id' => User::factory()->player()->create()->id,
            'date' => '2026-11-10',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'confirmed',
        ], $attributes));
    }

    public function test_owner_sees_only_their_facility_bookings_for_the_month(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'name' => 'Alpha Courts']);
        $otherFacility = Facility::factory()->create(['name' => 'Beta Arena']);

        $this->booking($facility, ['date' => '2026-11-10']);
        $this->booking($facility, ['date' => '2026-11-12', 'status' => 'pending', 'start_time' => '14:00:00', 'end_time' => '15:00:00']);
        $this->booking($otherFacility, ['date' => '2026-11-11']);

        $this->actingAs($owner)
            ->get(route('facility.calendar', ['month' => '2026-11']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Calendar')
                ->where('filters.month', '2026-11')
                ->where('filters.facility_id', null)
                ->where('monthLabel', 'November 2026')
                ->has('bookings', 2)
                ->where('bookings.0.facility', 'Alpha Courts')
                ->where('bookings.0.status', 'confirmed')
                ->has('facilities', 1)
                ->where('facilities.0.name', 'Alpha Courts'));
    }

    public function test_staff_only_see_their_assigned_facility(): void
    {
        $facility = Facility::factory()->create(['name' => 'Staff Facility']);
        $otherFacility = Facility::factory()->create(['name' => 'Other Facility']);
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);

        $this->booking($facility);
        $this->booking($otherFacility);

        $this->actingAs($staff)
            ->get(route('facility.calendar'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('bookings', 1)
                ->where('bookings.0.facility', 'Staff Facility'));
    }

    public function test_month_filter_excludes_bookings_from_other_months(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->booking($facility, ['date' => '2026-10-31']);
        $this->booking($facility, ['date' => '2026-11-01']);

        $this->actingAs($owner)
            ->get(route('facility.calendar', ['month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('monthLabel', 'October 2026')
                ->has('bookings', 1)
                ->where('bookings.0.date', '2026-10-31'));
    }

    public function test_owner_cannot_filter_by_another_owners_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);
        $foreignFacility = Facility::factory()->create();

        $this->actingAs($owner)
            ->get(route('facility.calendar', ['facility_id' => $foreignFacility->id]))
            ->assertForbidden();
    }

    public function test_players_cannot_view_the_facility_calendar(): void
    {
        $this->actingAs(User::factory()->player()->create())
            ->get(route('facility.calendar'))
            ->assertForbidden();
    }
}
