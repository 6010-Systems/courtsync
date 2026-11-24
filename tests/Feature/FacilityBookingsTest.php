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

    public function test_owner_sees_the_nearest_upcoming_booking_regardless_of_the_active_filter(): void
    {
        $this->travelTo(Carbon::parse('2026-11-16 12:00:00', config('app.timezone')));

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        $make = function (string $date, string $start, string $end, string $status) use ($facility, $court, $player) {
            return Booking::query()->create([
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'user_id' => $player->id,
                'date' => $date,
                'start_time' => $start,
                'end_time' => $end,
                'subtotal' => 300,
                'booking_fee' => 0,
                'total_price' => 300,
                'status' => $status,
            ]);
        };

        $make('2026-11-15', '10:00:00', '11:00:00', 'confirmed'); // past day
        $make('2026-11-16', '09:00:00', '10:00:00', 'confirmed'); // today, already ended
        $make('2026-11-17', '08:00:00', '09:00:00', 'cancelled'); // upcoming but cancelled
        $nearest = $make('2026-11-16', '15:00:00', '16:00:00', 'confirmed'); // today, still ahead
        $make('2026-11-18', '10:00:00', '11:00:00', 'pending'); // later this week

        $this->actingAs($owner)
            ->get(route('facility.bookings', ['filter' => 'Pending']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Bookings')
                ->where('nextBooking.id', $nearest->id)
                ->where('nextBooking.court.name', $court->name)
                ->where('nextBooking.user.name', $player->name));
    }

    public function test_next_booking_is_null_when_nothing_is_upcoming(): void
    {
        $this->travelTo(Carbon::parse('2026-11-16 12:00:00', config('app.timezone')));

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-15',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);

        $this->actingAs($owner)
            ->get(route('facility.bookings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Bookings')
                ->where('nextBooking', null));
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

    public function test_owner_can_verify_a_pending_booking_via_the_verify_route(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = $this->bookingWithReceipt($facility, $court, 'payments/receipt.jpg');

        $this->actingAs($owner)
            ->post(route('bookings.verify', $booking))
            ->assertRedirect();

        $this->assertSame('confirmed', $booking->fresh()->status);
        $this->assertSame('verified', $booking->payment->fresh()->status);
    }

    public function test_owner_can_reject_a_pending_booking_via_the_reject_route(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = $this->bookingWithReceipt($facility, $court, 'payments/receipt.jpg');

        $this->actingAs($owner)
            ->post(route('bookings.reject', $booking))
            ->assertRedirect();

        $this->assertSame('cancelled', $booking->fresh()->status);
        $this->assertSame('rejected', $booking->payment->fresh()->status);
    }

    public function test_owner_can_reject_a_confirmed_booking_to_cancel_it(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => now()->addDays(2)->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);
        $booking->payment()->create(['amount' => 500, 'payment_method' => 'cash', 'status' => 'verified']);

        $this->actingAs($owner)
            ->post(route('bookings.reject', $booking))
            ->assertRedirect();

        $this->assertSame('cancelled', $booking->fresh()->status);
        $this->assertSame('rejected', $booking->payment->fresh()->status);
    }

    public function test_overnight_booking_is_accepted_and_stores_end_date(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(400)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-12-01',
                'start_time' => '23:00',
                'end_time' => '01:00',
                'total_price' => 800,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertRedirect();

        $booking = Booking::where('court_id', $court->id)->first();

        $this->assertNotNull($booking, 'Booking was not created.');
        $this->assertSame('2026-12-01', $booking->date);
        $this->assertSame('2026-12-02', $booking->end_date);
    }

    public function test_overnight_booking_conflict_across_midnight_is_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(400)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
        ]);
        $player = User::factory()->player()->create();

        // Existing booking: Nov 25 11 PM → Nov 26 1 AM.
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-25',
            'end_date' => '2026-11-26',
            'start_time' => '23:00:00',
            'end_time' => '01:00:00',
            'total_price' => 800,
            'status' => 'confirmed',
        ]);

        // Attempt: Nov 26 12 AM → 2 AM overlaps the existing booking.
        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-26',
                'start_time' => '00:00',
                'end_time' => '02:00',
                'total_price' => 800,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertSessionHasErrors('conflict');
    }

    public function test_booking_starting_exactly_when_overnight_booking_ends_is_allowed(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(400)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
        ]);
        $player = User::factory()->player()->create();

        // Existing booking ends exactly at Nov 26 01:00.
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-25',
            'end_date' => '2026-11-26',
            'start_time' => '23:00:00',
            'end_time' => '01:00:00',
            'total_price' => 800,
            'status' => 'confirmed',
        ]);

        // New booking starts at exactly 01:00 — no overlap.
        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-26',
                'start_time' => '01:00',
                'end_time' => '02:00',
                'total_price' => 400,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
    }

    public function test_booking_can_end_at_midnight(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->splitPricing(300, 400, '17:00:00')->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
            'day_start_time' => '02:00:00',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-12-01',
                'start_time' => '22:00',
                'end_time' => '00:00',
                'total_price' => 800,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking = Booking::where('court_id', $court->id)->firstOrFail();

        $this->assertSame('2026-12-01', $booking->date);
        $this->assertSame('2026-12-02', $booking->end_date);
        $this->assertSame('00:00:00', $booking->end_time);
        // 10:00 PM – 12:00 AM is two night hours (₱400 each).
        $this->assertSame('800.00', (string) $booking->subtotal);
    }

    public function test_booking_can_end_at_two_am_when_the_court_closes_then(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->splitPricing(300, 400, '17:00:00')->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
            'day_start_time' => '02:00:00',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-12-01',
                'start_time' => '22:00',
                'end_time' => '02:00',
                'total_price' => 1600,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking = Booking::where('court_id', $court->id)->firstOrFail();

        $this->assertSame('2026-12-02', $booking->end_date);
        $this->assertSame('1600.00', (string) $booking->subtotal);
        // 10:00 PM – 2:00 AM is four night hours (night rate until 2 AM).
        $this->assertSame(4, $booking->price_breakdown['court']['night_hours']);
    }

    public function test_booking_ending_after_two_am_is_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(400)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 10:00 PM',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-12-01',
                'start_time' => '22:00',
                'end_time' => '03:00',
                'total_price' => 800,
                'payment_method' => 'pay_at_facility',
            ])
            ->assertSessionHasErrors('start_time');

        $this->assertSame(0, Booking::where('court_id', $court->id)->count());
    }

    public function test_upcoming_scope_keeps_a_booking_that_ends_at_midnight(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->flatPricing(400)->create(['facility_id' => $facility->id]);

        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-25',
            'end_date' => '2026-11-26',
            'start_time' => '22:00:00',
            'end_time' => '00:00:00',
            'total_price' => 800,
            'status' => 'confirmed',
        ]);

        Carbon::setTestNow('2026-11-25 23:30:00');
        $this->assertSame(1, Booking::query()->upcoming(now())->count());
        $this->assertSame(0, Booking::query()->past(now())->count());

        Carbon::setTestNow('2026-11-26 00:30:00');
        $this->assertSame(0, Booking::query()->upcoming(now())->count());
        $this->assertSame(1, Booking::query()->past(now())->count());

        Carbon::setTestNow();
    }

    public function test_owner_cannot_verify_a_booking_from_another_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);
        $foreignFacility = Facility::factory()->create();
        $foreignCourt = Court::factory()->create(['facility_id' => $foreignFacility->id]);

        $booking = $this->bookingWithReceipt($foreignFacility, $foreignCourt, 'payments/other.jpg');

        $this->actingAs($owner)
            ->post(route('bookings.verify', $booking))
            ->assertForbidden();
    }
}
