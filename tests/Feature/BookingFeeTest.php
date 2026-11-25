<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingFeeTest extends TestCase
{
    use RefreshDatabase;

    private function makeFacilityWithCourt(string $feeType, float $feeValue, float $hourlyRate = 300): array
    {
        $facility = Facility::factory()->create([
            'booking_fee_type' => $feeType,
            'booking_fee_value' => $feeValue,
        ]);

        $court = Court::factory()->flatPricing($hourlyRate)->create(['facility_id' => $facility->id]);

        return [$facility, $court];
    }

    private function book(User $player, Facility $facility, Court $court, array $overrides = []): void
    {
        $this->actingAs($player)
            ->post(route('bookings.store'), array_merge([
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ], $overrides))
            ->assertRedirect();
    }

    public function test_fixed_booking_fee_is_added_to_the_booking_total(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 20);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(20.0, (float) $booking->booking_fee);
        $this->assertSame(320.0, (float) $booking->total_price);
        $this->assertSame(320.0, (float) $booking->payment->amount);
    }

    public function test_percentage_booking_fee_is_calculated_from_the_court_subtotal(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('PERCENT', 10);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(30.0, (float) $booking->booking_fee);
        $this->assertSame(330.0, (float) $booking->total_price);
    }

    public function test_booking_without_a_configured_fee_keeps_the_court_total(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 0);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(0.0, (float) $booking->booking_fee);
        $this->assertSame(300.0, (float) $booking->total_price);
    }

    public function test_client_supplied_total_cannot_bypass_the_booking_fee(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 20);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, ['total_price' => 1]);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(320.0, (float) $booking->total_price);
    }

    public function test_booking_fee_is_applied_once_when_a_court_has_no_configured_rate(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 20, 0);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, ['total_price' => 100]);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(100.0, (float) $booking->subtotal);
        $this->assertSame(20.0, (float) $booking->booking_fee);
        $this->assertSame(120.0, (float) $booking->total_price);
    }

    public function test_walk_in_booking_uses_the_owner_controlled_walk_in_fee(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $facility->update(['walk_in_fee_type' => 'FIXED', 'walk_in_fee_value' => 0]);

        $this->deskBooking($facility, $court, [
            'guest_name' => 'Walk-in Juan',
            'booking_type' => 'walk_in',
        ]);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame('walk_in', $booking->source);
        $this->assertNull($booking->user_id);
        $this->assertSame('Walk-in Juan', $booking->guest_name);
        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(0.0, (float) $booking->booking_fee);
        $this->assertSame(300.0, (float) $booking->total_price);
    }

    public function test_walk_in_fee_can_be_a_percentage_of_the_court_rate(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $facility->update(['walk_in_fee_type' => 'PERCENT', 'walk_in_fee_value' => 10]);

        $this->deskBooking($facility, $court, [
            'guest_name' => 'Walk-in Maria',
            'booking_type' => 'walk_in',
        ]);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(30.0, (float) $booking->booking_fee);
        $this->assertSame(330.0, (float) $booking->total_price);
    }

    public function test_court_blocks_have_no_system_fee(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $facility->update(['walk_in_fee_value' => 25]);

        $this->deskBooking($facility, $court, [
            'booking_type' => 'staff_block',
        ]);

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame('staff_block', $booking->source);
        $this->assertSame('Court block', $booking->guest_name);
        $this->assertSame(0.0, (float) $booking->booking_fee);
        $this->assertSame(300.0, (float) $booking->total_price);
    }

    public function test_desk_bookings_do_not_attach_the_owner_as_a_player(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $owner = $facility->owner;

        $this->deskBooking($facility, $court, [
            'guest_name' => 'Walk-in Juan',
            'booking_type' => 'walk_in',
        ]);

        $this->assertFalse($facility->fresh()->players()->whereKey($owner->id)->exists());
    }

    public function test_players_cannot_log_a_walk_in_or_choose_a_channel(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'guest_name' => 'Walk-in Juan',
                'booking_type' => 'walk_in',
            ])
            ->assertSessionHasErrors(['guest_name', 'booking_type']);

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_owner_cannot_log_a_walk_in_for_another_facility(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt('FIXED', 15);
        $otherCourt = Court::factory()->flatPricing(300)->create();

        $this->deskBooking($facility, $otherCourt, [
            'guest_name' => 'Walk-in Juan',
            'booking_type' => 'walk_in',
        ], expectedStatus: 403);

        $this->assertDatabaseCount('bookings', 0);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function deskBooking(Facility $facility, Court $court, array $overrides = [], int $expectedStatus = 302): void
    {
        $this->actingAs($facility->owner)
            ->post(route('bookings.store'), array_merge([
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
            ], $overrides))
            ->assertStatus($expectedStatus);
    }
}
