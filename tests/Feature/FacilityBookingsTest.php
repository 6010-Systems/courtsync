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

class FacilityBookingsTest extends TestCase
{
    use RefreshDatabase;

    private function bookingWithReceipt(Facility $facility, Court $court, string $proofPath): Booking
    {
        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'pending',
        ]);

        $booking->payment()->create([
            'amount' => 500,
            'payment_method' => 'gcash',
            'status' => 'pending',
            'proof_path' => $proofPath,
        ]);

        return $booking;
    }

    public function test_owner_bookings_page_exposes_the_payment_receipt_path(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $this->bookingWithReceipt($facility, $court, 'payments/receipt.jpg');

        $this->actingAs($owner)->get(route('facility.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Bookings')
                ->where('bookings.0.payment.proof_path', 'payments/receipt.jpg'));
    }

    public function test_owner_does_not_see_receipts_from_another_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $otherOwner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $otherFacility = Facility::factory()->create(['user_id' => $otherOwner->id]);
        $otherCourt = Court::factory()->create(['facility_id' => $otherFacility->id]);

        $this->bookingWithReceipt($otherFacility, $otherCourt, 'payments/other.jpg');

        $this->actingAs($owner)->get(route('facility.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Bookings')
                ->has('bookings', 0));
    }

    public function test_owner_sees_filter_counts_scoped_to_their_facilities(): void
    {
        $this->travelTo(Carbon::parse('2026-11-16 10:00:00', config('app.timezone')));

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $foreignFacility = Facility::factory()->create();
        $foreignCourt = Court::factory()->create(['facility_id' => $foreignFacility->id]);
        $player = User::factory()->player()->create();

        $make = function (Facility $facility, Court $court, string $date, string $status) use ($player) {
            return Booking::query()->create([
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'user_id' => $player->id,
                'date' => $date,
                'start_time' => '10:00:00',
                'end_time' => '11:00:00',
                'subtotal' => 300,
                'booking_fee' => 0,
                'total_price' => 300,
                'status' => $status,
            ]);
        };

        $make($facility, $court, '2026-11-16', 'pending');
        $make($facility, $court, '2026-11-16', 'confirmed');
        $make($facility, $court, '2026-11-17', 'pending');
        $make($foreignFacility, $foreignCourt, '2026-11-16', 'pending');

        $this->actingAs($owner)
            ->get(route('facility.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Bookings')
                ->where('counts.all', 3)
                ->where('counts.today', 2)
                ->where('counts.upcoming', 1)
                ->where('counts.pending', 2));
    }

    public function test_owner_can_cancel_a_booking_and_reject_its_pending_payment(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = $this->bookingWithReceipt($facility, $court, 'payments/receipt.jpg');

        $this->actingAs($owner)
            ->patch(route('bookings.update', $booking), ['status' => 'cancelled'])
            ->assertRedirect();

        $this->assertSame('cancelled', $booking->fresh()->status);
        $this->assertSame('rejected', $booking->payment->fresh()->status);
    }

    public function test_owner_cannot_update_a_booking_from_another_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);
        $foreignFacility = Facility::factory()->create();
        $foreignCourt = Court::factory()->create(['facility_id' => $foreignFacility->id]);

        $booking = $this->bookingWithReceipt($foreignFacility, $foreignCourt, 'payments/other.jpg');

        $this->actingAs($owner)
            ->patch(route('bookings.update', $booking), ['status' => 'cancelled'])
            ->assertForbidden();
    }

    public function test_booking_status_must_be_a_supported_value(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = $this->bookingWithReceipt($facility, $court, 'payments/receipt.jpg');

        $this->actingAs($owner)
            ->patch(route('bookings.update', $booking), ['status' => 'completed'])
            ->assertSessionHasErrors('status');
    }
}
