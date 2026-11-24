<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_owner_dashboard_summarizes_only_their_facilitys_non_cancelled_booking_value(): void
    {
        Carbon::setTestNow('2026-09-27 12:00:00');

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $otherFacility = Facility::factory()->create();
        $otherCourt = Court::factory()->create(['facility_id' => $otherFacility->id]);

        $this->makeBooking($facility, $court, '2026-09-27', 'confirmed');
        $pending = $this->makeBooking($facility, $court, '2026-09-27', 'pending');
        $this->makeBooking($facility, $court, '2026-09-27', 'cancelled');
        $this->makeBooking($facility, $court, '2026-08-01', 'confirmed');
        $this->makeBooking($otherFacility, $otherCourt, '2026-09-27', 'confirmed');

        // A booking's payment stays "pending" forever for cash/walk-in players,
        // so revenue must not depend on it having been separately verified.
        $pending->payment()->create([
            'amount' => 999.00,
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($owner)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('FacilityOwner/Dashboard')
            ->where('metrics.bookings.current', 2)
            ->where('metrics.bookings.previous', 1)
            ->where('metrics.collected.current', '200.00')
            ->where('metrics.collected.previous', '100.00')
            ->where('metrics.pending.total', 1)
            ->where('metrics.weekdays.6.count', 2)
            ->where('metrics.heatmap.days', function ($days) {
                $today = collect($days)->firstWhere('date', '2026-09-27');

                return $today !== null && $today['count'] === 2;
            }));
    }

    public function test_bookings_made_by_staff_or_owner_accounts_count_as_staff_not_online(): void
    {
        Carbon::setTestNow('2026-09-27 12:00:00');

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $staff = User::factory()->create(['role' => 'FACILITY_STAFF', 'facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $staff->id,
            'date' => '2026-09-27',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);

        Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player->id,
            'date' => '2026-09-27',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);

        Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'guest_name' => 'Walk-in Player',
            'date' => '2026-09-27',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($owner)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('FacilityOwner/Dashboard')
            ->where('metrics.sources.staff', 1)
            ->where('metrics.sources.online', 1)
            ->where('metrics.sources.walkIn', 1));
    }

    public function test_owner_can_filter_the_dashboard_by_payment_status(): void
    {
        Carbon::setTestNow('2026-09-27 12:00:00');

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $verified = $this->makeBooking($facility, $court, '2026-09-27', 'confirmed');
        $verified->payment()->create(['amount' => 100, 'payment_method' => 'gcash', 'status' => 'verified']);

        $pending = $this->makeBooking($facility, $court, '2026-09-27', 'confirmed');
        $pending->payment()->create(['amount' => 100, 'payment_method' => 'cash', 'status' => 'pending']);

        // No payment record at all — a manual booking logged before cash is collected.
        $this->makeBooking($facility, $court, '2026-09-27', 'confirmed');

        $this->actingAs($owner)
            ->get(route('dashboard', ['payment_status' => 'verified']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.payment_status', 'verified')
                ->where('metrics.bookings.current', 1)
                ->where('metrics.collected.current', '100.00'));

        $this->actingAs($owner)
            ->get(route('dashboard', ['payment_status' => 'unpaid']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('metrics.bookings.current', 1)
                ->where('metrics.collected.current', '100.00'));

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.payment_status', 'all')
                ->where('metrics.bookings.current', 3)
                ->where('metrics.collected.current', '300.00'));
    }

    public function test_owner_without_a_facility_does_not_receive_metrics(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        $response = $this->actingAs($owner)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('FacilityOwner/Dashboard')
            ->where('metrics', null));
    }

    private function makeBooking(Facility $facility, Court $court, string $date, string $status): Booking
    {
        return Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => $date,
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'total_price' => 100,
            'status' => $status,
        ]);
    }
}
