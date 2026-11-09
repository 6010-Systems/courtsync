<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\Payment;
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

    public function test_owner_dashboard_summarizes_only_their_facility_bookings_and_payments(): void
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
        $previous = $this->makeBooking($facility, $court, '2026-08-01', 'confirmed');
        $this->makeBooking($otherFacility, $otherCourt, '2026-09-27', 'confirmed');

        $this->makePayment($pending, '150.50', 'verified', '2026-09-27 11:00:00');
        $this->makePayment($previous, '50.00', 'verified', '2026-08-01 10:00:00');
        $this->makePayment($pending, '999.00', 'pending', '2026-09-27 11:30:00');

        $response = $this->actingAs($owner)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('FacilityOwner/Dashboard')
            ->where('metrics.bookings.current', 2)
            ->where('metrics.bookings.previous', 1)
            ->where('metrics.collected.current', '150.50')
            ->where('metrics.collected.previous', '50.00')
            ->where('metrics.pending.total', 1)
            ->where('metrics.weekdays.6.count', 2)
            ->where('metrics.heatmap.days', function ($days) {
                $today = collect($days)->firstWhere('date', '2026-09-27');

                return $today !== null && $today['count'] === 2;
            }));
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

    private function makePayment(Booking $booking, string $amount, string $status, string $createdAt): void
    {
        $payment = Payment::query()->create([
            'booking_id' => $booking->id,
            'amount' => $amount,
            'payment_method' => 'gcash',
            'status' => $status,
        ]);

        $payment->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();
    }
}
