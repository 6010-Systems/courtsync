<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingRatePlanTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Facility, 1: Court, 2: RatePlan, 3: RatePlan}
     */
    private function rateCard(): array
    {
        $facility = Facility::factory()->create([
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 20,
        ]);

        $courtRental = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        $allIn = RatePlan::factory()->allIn()->create(['facility_id' => $facility->id]);
        $paddle = RatePlan::factory()->paddleAddon()->create(['facility_id' => $facility->id]);

        $court = Court::factory()->flatPricing(999)->create(['facility_id' => $facility->id]);
        $court->ratePlans()->attach([$courtRental->id, $allIn->id, $paddle->id]);

        return [$facility, $court, $courtRental, $paddle];
    }

    private function book(User $player, Facility $facility, Court $court, array $payload = [])
    {
        return $this->actingAs($player)->post(route('bookings.store'), array_merge([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'total_price' => 1,
            'payment_method' => 'gcash',
        ], $payload));
    }

    public function test_a_package_booking_stores_the_price_snapshot(): void
    {
        [$facility, $court, $plan, $paddle] = $this->rateCard();
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, [
            'rate_plan_id' => $plan->id,
            'addons' => [
                ['rate_plan_id' => $paddle->id, 'quantity' => 2],
            ],
        ])->assertRedirect();

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame($plan->id, $booking->rate_plan_id);
        $this->assertSame('Court Rental', $booking->rate_plan_name);
        $this->assertSame(300.0, (float) $booking->subtotal);
        $this->assertSame(200.0, (float) $booking->addons_total);
        // 300 court + 200 paddles (2 × 2 hr × 50) + 20 fixed fee
        $this->assertSame(520.0, (float) $booking->total_price);
        $this->assertSame(520.0, (float) $booking->payment->amount);
        $this->assertSame('Court Rental', $booking->price_breakdown['court']['rate_plan_name']);
        $this->assertCount(1, $booking->price_breakdown['addons']);
    }

    public function test_the_client_sent_total_is_ignored(): void
    {
        [$facility, $court, $plan] = $this->rateCard();
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, [
            'rate_plan_id' => $plan->id,
            'total_price' => 99999,
        ])->assertRedirect();

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertSame(320.0, (float) $booking->total_price);
    }

    public function test_a_rate_that_is_not_assigned_to_the_court_is_rejected(): void
    {
        [$facility, $court] = $this->rateCard();
        $unassigned = RatePlan::factory()->allIn()->create([
            'facility_id' => $facility->id,
            'name' => 'Unassigned Package',
        ]);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, ['rate_plan_id' => $unassigned->id])
            ->assertSessionHasErrors('rate_plan_id');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_a_rate_from_another_facility_is_rejected(): void
    {
        [$facility, $court] = $this->rateCard();
        $foreign = RatePlan::factory()->courtRental()->create();
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, ['rate_plan_id' => $foreign->id])
            ->assertSessionHasErrors('rate_plan_id');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_an_inactive_rate_is_rejected(): void
    {
        [$facility, $court] = $this->rateCard();
        $inactive = RatePlan::factory()->allIn()->inactive()->create([
            'facility_id' => $facility->id,
            'name' => 'Retired Package',
        ]);
        $court->ratePlans()->attach($inactive->id);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, ['rate_plan_id' => $inactive->id])
            ->assertSessionHasErrors('rate_plan_id');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_paddle_quantity_cannot_exceed_the_plan_limit(): void
    {
        [$facility, $court, $plan, $paddle] = $this->rateCard();
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court, [
            'rate_plan_id' => $plan->id,
            'addons' => [['rate_plan_id' => $paddle->id, 'quantity' => 5]],
        ])->assertSessionHasErrors('rate_plan_id');

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_a_court_without_a_rate_card_still_books_at_its_own_rate(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        $this->book($player, $facility, $court)->assertRedirect();

        $booking = Booking::query()->latest('id')->firstOrFail();

        $this->assertNull($booking->rate_plan_id);
        $this->assertSame(600.0, (float) $booking->subtotal);
        $this->assertSame(600.0, (float) $booking->total_price);
    }
}
