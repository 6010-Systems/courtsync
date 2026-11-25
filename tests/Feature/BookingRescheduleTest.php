<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\FacilityBilling;
use App\Models\RatePlan;
use App\Models\User;
use App\Notifications\BookingRescheduled;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookingRescheduleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(Carbon::parse('2026-12-01 09:00:00', config('app.timezone')));
    }

    private function bookingFor(Facility $facility, Court $court, ?User $player = null): Booking
    {
        return Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player?->id,
            'guest_name' => $player ? null : 'Walk-in Player',
            'date' => '2026-12-01',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'confirmed',
        ]);
    }

    public function test_owner_can_reschedule_a_booking_to_end_at_midnight(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->splitPricing(300, 400, '17:00:00')->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
            'day_start_time' => '02:00:00',
        ]);

        $booking = $this->bookingFor($facility, $court);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '22:00',
                'end_time' => '00:00',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame('2026-12-02', $booking->date);
        $this->assertSame('2026-12-03', $booking->end_date);
        $this->assertSame(800.0, (float) $booking->subtotal);
    }

    public function test_rescheduling_back_to_the_same_day_clears_the_end_date(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->splitPricing(300, 400, '17:00:00')->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
            'day_start_time' => '02:00:00',
        ]);

        $booking = $this->bookingFor($facility, $court);
        $booking->update([
            'date' => '2026-12-02',
            'end_date' => '2026-12-03',
            'start_time' => '22:00:00',
            'end_time' => '02:00:00',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '10:00',
                'end_time' => '12:00',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertNull($booking->fresh()->end_date);
    }

    public function test_owner_can_reschedule_a_booking_and_the_price_is_requoted(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $booking = $this->bookingFor($facility, $court);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:00',
                'end_time' => '16:00',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame('2026-12-02', $booking->date);
        $this->assertSame('14:00:00', $booking->start_time);
        $this->assertSame('16:00:00', $booking->end_time);
        $this->assertSame(600.0, (float) $booking->subtotal);
        $this->assertSame(600.0, (float) $booking->total_price);
    }

    public function test_reschedule_rejects_a_slot_that_overlaps_another_booking(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $booking = $this->bookingFor($facility, $court);

        Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-12-02',
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'total_price' => 300,
            'status' => 'confirmed',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:30',
                'end_time' => '15:30',
            ])
            ->assertSessionHasErrors('start_time');

        $booking->refresh();

        $this->assertSame('2026-12-01', $booking->date);
        $this->assertSame('10:00:00', $booking->start_time);
    }

    public function test_owner_cannot_reschedule_a_booking_from_another_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);

        $foreignFacility = Facility::factory()->create();
        $foreignCourt = Court::factory()->flatPricing(300)->create(['facility_id' => $foreignFacility->id]);
        $booking = $this->bookingFor($foreignFacility, $foreignCourt);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:00',
                'end_time' => '15:00',
            ])
            ->assertForbidden();

        $this->assertSame('2026-12-01', $booking->fresh()->date);
    }

    public function test_reschedule_rejects_identical_start_and_end_times(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        // start_time === end_time is always invalid (zero-duration booking).
        // Note: end_time < start_time is now accepted as a cross-midnight booking.
        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '15:00',
                'end_time' => '15:00',
            ])
            ->assertSessionHasErrors('end_time');
    }

    public function test_reschedule_cannot_move_a_booking_into_the_past(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-11-30',
                'start_time' => '14:00',
                'end_time' => '15:00',
            ])
            ->assertSessionHasErrors('date');
    }

    public function test_cancelled_bookings_cannot_be_rescheduled(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);
        $booking->update(['status' => 'cancelled']);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:00',
                'end_time' => '15:00',
            ])
            ->assertSessionHasErrors('booking');

        $this->assertSame('2026-12-01', $booking->fresh()->date);
    }

    public function test_pending_payment_amount_follows_the_new_total(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        $payment = $booking->payment()->create([
            'amount' => 300,
            'payment_method' => 'gcash',
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:00',
                'end_time' => '16:00',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(600.0, (float) $payment->fresh()->amount);
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_owner_can_edit_the_payment_amount_method_and_status_alongside_the_schedule(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        $payment = $booking->payment()->create([
            'amount' => 300,
            'payment_method' => 'gcash',
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-01',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'payment_method' => 'cash',
                'payment_amount' => 250,
                'payment_status' => 'verified',
            ])
            ->assertSessionHasNoErrors();

        $payment->refresh();

        $this->assertSame('cash', $payment->payment_method);
        $this->assertSame(250.0, (float) $payment->amount);
        $this->assertSame('verified', $payment->status);
    }

    public function test_editing_payment_on_a_booking_without_one_creates_it(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        $this->assertNull($booking->payment);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-01',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'payment_method' => 'cash',
                'payment_status' => 'verified',
            ])
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertNotNull($booking->payment);
        $this->assertSame('cash', $booking->payment->payment_method);
        $this->assertSame('verified', $booking->payment->status);
    }

    public function test_owner_can_switch_the_rate_plan_while_editing_a_booking(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(999)->create(['facility_id' => $facility->id]);

        $courtRental = RatePlan::factory()->courtRental(150, null)->create(['facility_id' => $facility->id]);
        $allIn = RatePlan::factory()->allIn(250, null)->create(['facility_id' => $facility->id]);
        $court->ratePlans()->attach([$courtRental->id, $allIn->id]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'guest_name' => 'Walk-in Player',
            'rate_plan_id' => $courtRental->id,
            'rate_plan_name' => $courtRental->name,
            'date' => '2026-12-01',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 150,
            'booking_fee' => 0,
            'total_price' => 150,
            'status' => 'confirmed',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-01',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'rate_plan_id' => $allIn->id,
            ])
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame($allIn->id, $booking->rate_plan_id);
        $this->assertSame($allIn->name, $booking->rate_plan_name);
        $this->assertSame(250.0, (float) $booking->subtotal);
        $this->assertSame(250.0, (float) $booking->total_price);
    }

    public function test_player_is_notified_when_their_booking_is_rescheduled(): void
    {
        Notification::fake();

        $owner = User::factory()->facilityOwner()->create();
        $player = User::factory()->player()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court, $player);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '14:00',
                'end_time' => '15:00',
            ])
            ->assertSessionHasNoErrors();

        Notification::assertSentTo($player, BookingRescheduled::class);
    }

    public function test_owner_can_waive_the_system_fee_on_a_walk_in_booking(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'booking_fee_type' => 'FIXED', 'booking_fee_value' => 15]);
        $court = Court::factory()->flatPricing(250)->create([
            'facility_id' => $facility->id,
            'time_range' => '24 Hours',
        ]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => null,
            'guest_name' => 'Emily Gelig',
            'source' => 'walk_in',
            'date' => '2026-12-01',
            'start_time' => '19:00:00',
            'end_time' => '20:00:00',
            'subtotal' => 250,
            'booking_fee' => 15,
            'total_price' => 265,
            'status' => 'confirmed',
        ]);
        $booking->payment()->create(['amount' => 265, 'payment_method' => 'cash', 'status' => 'pending']);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-01',
                'start_time' => '19:00',
                'end_time' => '20:00',
                'booking_fee' => 0,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(0.0, (float) $booking->booking_fee);
        $this->assertSame(250.0, (float) $booking->total_price);
        $this->assertSame('manual_override', $booking->price_breakdown['fee']['source']);
        $this->assertSame(15.0, (float) $booking->price_breakdown['fee']['previous']);
        $this->assertSame(250.0, (float) $booking->payment->amount);
    }

    public function test_rescheduling_a_walk_in_without_editing_the_fee_keeps_the_stored_fee(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 15,
            'walk_in_fee_type' => 'FIXED',
            'walk_in_fee_value' => 0,
        ]);
        $court = Court::factory()->flatPricing(250)->create([
            'facility_id' => $facility->id,
            'time_range' => '24 Hours',
        ]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => null,
            'guest_name' => 'Emily Gelig',
            'source' => 'walk_in',
            'date' => '2026-12-01',
            'start_time' => '19:00:00',
            'end_time' => '20:00:00',
            'subtotal' => 250,
            'booking_fee' => 15,
            'total_price' => 265,
            'status' => 'confirmed',
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '19:00',
                'end_time' => '20:00',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $booking->refresh();

        $this->assertSame(15.0, (float) $booking->booking_fee);
        $this->assertSame(265.0, (float) $booking->total_price);
    }

    public function test_online_bookings_ignore_a_supplied_system_fee(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $player = User::factory()->player()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'booking_fee_type' => 'FIXED', 'booking_fee_value' => 15]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'time_range' => '24 Hours',
        ]);
        $booking = $this->bookingFor($facility, $court, $player);
        $booking->update(['source' => 'online']);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '09:00',
                'end_time' => '10:00',
                'booking_fee' => 0,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(15.0, (float) $booking->fresh()->booking_fee);
    }

    public function test_system_fee_cannot_be_changed_after_the_month_is_billed(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(250)->create([
            'facility_id' => $facility->id,
            'time_range' => '24 Hours',
        ]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => null,
            'guest_name' => 'Emily Gelig',
            'source' => 'walk_in',
            'date' => '2026-12-01',
            'start_time' => '19:00:00',
            'end_time' => '20:00:00',
            'subtotal' => 250,
            'booking_fee' => 15,
            'total_price' => 265,
            'status' => 'confirmed',
        ]);

        FacilityBilling::query()->create([
            'facility_id' => $facility->id,
            'period' => '2026-12',
            'status' => 'BILLED',
            'billed_at' => now(),
            'billed_by' => $owner->id,
        ]);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-01',
                'start_time' => '19:00',
                'end_time' => '20:00',
                'booking_fee' => 0,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('booking_fee');

        $this->assertSame(15.0, (float) $booking->fresh()->booking_fee);
    }
}
