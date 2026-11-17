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
}
