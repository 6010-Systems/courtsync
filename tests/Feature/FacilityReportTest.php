<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\FacilityBilling;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityReportTest extends TestCase
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
            'booking_fee' => 20,
            'total_price' => 320,
            'status' => 'confirmed',
        ], $attributes));
    }

    public function test_owner_sees_only_their_facilities_in_the_report(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'name' => 'Alpha Courts']);
        $otherFacility = Facility::factory()->create(['name' => 'Beta Arena']);

        $paid = $this->booking($facility, ['booking_fee' => 20, 'total_price' => 320]);
        Payment::query()->create([
            'booking_id' => $paid->id,
            'amount' => 320,
            'payment_method' => 'gcash',
            'status' => 'verified',
        ]);

        $this->booking($facility, ['booking_fee' => 30, 'total_price' => 330, 'date' => '2026-11-12']);
        $this->booking($otherFacility, ['booking_fee' => 99, 'total_price' => 399]);

        $this->actingAs($owner)
            ->get(route('facility.reports'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Reports')
                ->where('filters.month', '2026-11')
                ->where('summary.facilities', 1)
                ->where('summary.bookings', 2)
                ->where('summary.booking_fee', 50)
                ->where('summary.collected_fee', 20)
                ->where('summary.pending_fee', 30)
                ->where('facilities.0.name', 'Alpha Courts')
                ->where('facilities.0.booking_fee', 50));
    }

    public function test_month_filter_scopes_the_report(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->booking($facility, ['date' => '2026-10-05', 'booking_fee' => 15, 'total_price' => 315]);
        $this->booking($facility, ['date' => '2026-11-05', 'booking_fee' => 25, 'total_price' => 325]);

        $this->actingAs($owner)
            ->get(route('facility.reports', ['month' => '2026-10']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.month', '2026-10')
                ->where('summary.bookings', 1)
                ->where('summary.booking_fee', 15));
    }

    public function test_owner_can_open_their_facility_breakdown_with_billing_status(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->booking($facility, ['booking_fee' => 20, 'total_price' => 320]);
        $this->booking($facility, ['booking_fee' => 25, 'total_price' => 325, 'date' => '2026-11-11']);

        FacilityBilling::query()->create([
            'facility_id' => $facility->id,
            'period' => '2026-11',
            'status' => 'BILLED',
            'billed_at' => now(),
            'billed_by' => User::factory()->admin()->create()->id,
        ]);

        $this->actingAs($owner)
            ->get(route('facility.reports', ['month' => '2026-11', 'facility_id' => $facility->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.facility_id', $facility->id)
                ->where('selectedFacility.id', $facility->id)
                ->where('selectedFacility.billing_status', 'BILLED')
                ->where('facilities.0.billing_status', 'BILLED')
                ->has('breakdown', 2));
    }

    public function test_owner_cannot_open_another_facility_breakdown(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);
        $foreignFacility = Facility::factory()->create();

        $this->actingAs($owner)
            ->get(route('facility.reports', ['facility_id' => $foreignFacility->id]))
            ->assertForbidden();
    }

    public function test_staff_and_players_cannot_view_the_owner_report(): void
    {
        $facility = Facility::factory()->create();
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);

        $this->actingAs($staff)->get(route('facility.reports'))->assertForbidden();

        $this->actingAs(User::factory()->player()->create())
            ->get(route('facility.reports'))
            ->assertForbidden();
    }
}
