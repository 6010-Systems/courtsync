<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
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

    public function test_reschedule_requires_the_end_time_to_be_after_the_start_time(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = $this->bookingFor($facility, $court);

        $this->actingAs($owner)
            ->post(route('bookings.reschedule', $booking), [
                'date' => '2026-12-02',
                'start_time' => '15:00',
                'end_time' => '14:00',
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
}
