<?php

namespace Tests\Unit;

use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Support\RateQuote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class RateQuoteTest extends TestCase
{
    use RefreshDatabase;

    private function planFor(Facility $facility, string $state = 'courtRental'): RatePlan
    {
        return RatePlan::factory()->{$state}()->create(['facility_id' => $facility->id]);
    }

    private function courtFor(Facility $facility, RatePlan ...$plans): Court
    {
        $court = Court::factory()->flatPricing(999)->create(['facility_id' => $facility->id]);

        foreach ($plans as $plan) {
            $court->ratePlans()->attach($plan->id, ['is_enabled' => true]);
        }

        return $court;
    }

    public function test_court_rental_is_charged_at_the_day_rate(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = $this->courtFor($facility, $plan);

        $quote = (new RateQuote)->forBooking($court, '10:00', '12:00', $plan);

        $this->assertSame('Court Rental', $quote['rate_plan_name']);
        $this->assertSame(300.0, $quote['subtotal']);
        $this->assertSame(300.0, $quote['total']);
        $this->assertSame(2, $quote['court']['day_hours']);
        $this->assertCount(1, $quote['court']['breakdown']);
    }

    public function test_night_hours_use_the_night_rate(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = $this->courtFor($facility, $plan);

        $quote = (new RateQuote)->forBooking($court, '18:00', '20:00', $plan);

        $this->assertSame(500.0, $quote['subtotal']);
        $this->assertSame(2, $quote['court']['night_hours']);
        $this->assertSame(0, $quote['court']['day_hours']);
    }

    public function test_a_booking_crossing_five_pm_is_split_between_day_and_night_rates(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = $this->courtFor($facility, $plan);

        $quote = (new RateQuote)->forBooking($court, '16:00', '18:00', $plan);

        // 16:00-17:00 day (150), 17:00-18:00 night (250)
        $this->assertSame(400.0, $quote['subtotal']);
        $this->assertSame(1, $quote['court']['day_hours']);
        $this->assertSame(1, $quote['court']['night_hours']);
        $this->assertCount(2, $quote['court']['breakdown']);
    }

    public function test_all_in_package_uses_its_own_day_and_night_rates(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'allIn');
        $court = $this->courtFor($facility, $plan);

        $quote = (new RateQuote)->forBooking($court, '19:00', '21:00', $plan);

        $this->assertSame(700.0, $quote['subtotal']);
        $this->assertSame(700.0, $quote['total']);
    }

    public function test_paddle_addons_are_charged_per_paddle_per_hour(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $paddle = $this->planFor($facility, 'paddleAddon');
        $court = $this->courtFor($facility, $plan, $paddle);

        $quote = (new RateQuote)->forBooking($court, '10:00', '13:00', $plan, [
            ['rate_plan_id' => $paddle->id, 'quantity' => 2],
        ]);

        $this->assertSame(450.0, $quote['subtotal']);
        $this->assertSame(300.0, $quote['addons_total']);
        $this->assertSame(750.0, $quote['total']);
        $this->assertCount(1, $quote['addons']);
        $this->assertSame(2, $quote['addons'][0]['quantity']);
        $this->assertSame(50.0, $quote['addons'][0]['rate']);
    }

    public function test_a_court_override_replaces_the_card_rate(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = Court::factory()->flatPricing(999)->create(['facility_id' => $facility->id]);
        $court->ratePlans()->attach($plan->id, [
            'is_enabled' => true,
            'day_rate_override' => 200,
            'night_rate_override' => 300,
        ]);

        $quote = (new RateQuote)->forBooking($court, '10:00', '12:00', $plan);

        $this->assertSame(400.0, $quote['subtotal']);
        $this->assertSame(200.0, $quote['court']['day_rate']);
    }

    public function test_a_plan_that_is_not_assigned_to_a_configured_court_is_rejected(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $otherPlan = RatePlan::factory()->allIn()->create(['facility_id' => $facility->id]);
        $court = $this->courtFor($facility, $otherPlan);

        $this->expectException(InvalidArgumentException::class);

        (new RateQuote)->forBooking($court, '10:00', '12:00', $plan);
    }

    public function test_a_court_without_assignments_inherits_the_facility_rate_card(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = Court::factory()->flatPricing(999)->create(['facility_id' => $facility->id]);

        $quote = (new RateQuote)->forBooking($court, '10:00', '12:00', $plan);

        $this->assertSame(300.0, $quote['subtotal']);
        $this->assertSame(300.0, $quote['total']);
    }

    public function test_a_court_that_opted_out_of_the_rate_card_uses_its_own_rates(): void
    {
        $facility = Facility::factory()->create();
        $plan = $this->planFor($facility, 'courtRental');
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'uses_rate_card' => false,
        ]);

        $legacy = (new RateQuote)->forBooking($court, '10:00', '12:00');
        $this->assertSame(600.0, $legacy['subtotal']);

        $this->expectException(InvalidArgumentException::class);
        (new RateQuote)->forBooking($court, '10:00', '12:00', $plan);
    }

    public function test_the_court_falls_back_to_its_own_rates_without_a_plan(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $quote = (new RateQuote)->forBooking($court, '10:00', '12:00');

        $this->assertNull($quote['rate_plan_id']);
        $this->assertSame(600.0, $quote['subtotal']);
        $this->assertSame(0.0, $quote['addons_total']);
    }

    // -------------------------------------------------------------------------
    // Boundary cases: half-open interval [dayStart, nightStart) → day,
    //                                    [nightStart, dayStart) → night.
    // All tests use day_start_time=05:00, night_start_time=17:00 (factory defaults).
    // -------------------------------------------------------------------------

    #[DataProvider('dayNightBoundaryProvider')]
    public function test_day_night_boundary_hour_splitting(
        string $start,
        string $end,
        int $expectedDayHours,
        int $expectedNightHours,
    ): void {
        [$day, $night] = RateQuote::splitHours($start, $end, '05:00', '17:00');

        $this->assertSame($expectedDayHours, $day, "day hours for {$start}–{$end}");
        $this->assertSame($expectedNightHours, $night, "night hours for {$start}–{$end}");
    }

    /**
     * @return array<string, array{string, string, int, int}>
     */
    public static function dayNightBoundaryProvider(): array
    {
        return [
            '4 PM – 5 PM is 100% day' => ['16:00', '17:00', 1, 0],
            '5 PM – 6 PM is 100% night' => ['17:00', '18:00', 0, 1],
            '4 PM – 6 PM is day + night' => ['16:00', '18:00', 1, 1],
            '3 PM – 5 PM is 100% day' => ['15:00', '17:00', 2, 0],
            '3 PM – 7 PM is day + night' => ['15:00', '19:00', 2, 2],
            '5 PM – 7 PM is 100% night' => ['17:00', '19:00', 0, 2],
            '2 PM – 4 PM is 100% day' => ['14:00', '16:00', 2, 0],
            '10 PM – 11 PM is 100% night' => ['22:00', '23:00', 0, 1],
        ];
    }

    public function test_custom_night_start_time_is_used_when_configured(): void
    {
        $facility = Facility::factory()->create();
        $plan = RatePlan::factory()->courtRental(300, 400)->create([
            'facility_id' => $facility->id,
            'day_start_time' => '06:00:00',
            'night_start_time' => '18:00:00',
        ]);
        $court = $this->courtFor($facility, $plan);

        // 17:00–19:00 with nightStart=18:00 → 1 day hour (17:00–18:00), 1 night hour (18:00–19:00)
        $quote = (new RateQuote)->forBooking($court, '17:00', '19:00', $plan);

        $this->assertSame(1, $quote['court']['day_hours']);
        $this->assertSame(1, $quote['court']['night_hours']);
        $this->assertSame(700.0, $quote['subtotal']); // 300 + 400
    }

    public function test_booking_ending_exactly_at_night_start_is_100_percent_day(): void
    {
        $facility = Facility::factory()->create();
        $plan = RatePlan::factory()->courtRental(300, 500)->create([
            'facility_id' => $facility->id,
            'day_start_time' => '05:00:00',
            'night_start_time' => '17:00:00',
        ]);
        $court = $this->courtFor($facility, $plan);

        $quote = (new RateQuote)->forBooking($court, '16:00', '17:00', $plan);

        $this->assertSame(1, $quote['court']['day_hours']);
        $this->assertSame(0, $quote['court']['night_hours']);
        $this->assertSame(300.0, $quote['subtotal']);
    }
}
