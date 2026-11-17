<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\RatePlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RatePlan>
 */
class RatePlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'facility_id' => Facility::factory(),
            'name' => 'Rate '.fake()->unique()->numberBetween(1, 99999),
            'kind' => 'COURT',
            'description' => null,
            'day_rate' => fake()->randomElement([150, 200, 250]),
            'night_rate' => fake()->randomElement([250, 300, 350]),
            'day_start_time' => '05:00:00',
            'night_start_time' => '17:00:00',
            'includes_ball' => true,
            'included_paddles' => 0,
            'max_quantity' => 4,
            'is_active' => true,
            'sort_order' => 0,
        ];
    }

    /**
     * Court rental only: court + free use of ball.
     */
    public function courtRental(?float $dayRate = 150, ?float $nightRate = 250): static
    {
        return $this->state(fn () => [
            'name' => 'Court Rental',
            'kind' => 'COURT',
            'description' => 'Free use of ball',
            'day_rate' => $dayRate,
            'night_rate' => $nightRate,
            'includes_ball' => true,
            'included_paddles' => 0,
        ]);
    }

    /**
     * All-in package: court, ball and four paddles.
     */
    public function allIn(?float $dayRate = 250, ?float $nightRate = 350): static
    {
        return $this->state(fn () => [
            'name' => 'All-In',
            'kind' => 'COURT',
            'description' => 'Court, ball & 4 paddles',
            'day_rate' => $dayRate,
            'night_rate' => $nightRate,
            'includes_ball' => true,
            'included_paddles' => 4,
        ]);
    }

    /**
     * Hourly paddle rental add-on.
     */
    public function paddleAddon(?float $rate = 50): static
    {
        return $this->state(fn () => [
            'name' => 'Paddle Rental',
            'kind' => 'ADDON',
            'description' => 'Per paddle, per hour',
            'day_rate' => $rate,
            'night_rate' => null,
            'includes_ball' => false,
            'included_paddles' => 0,
            'max_quantity' => 4,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
