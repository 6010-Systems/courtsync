<?php

namespace Database\Factories;

use App\Models\Court;
use App\Models\Facility;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Court>
 */
class CourtFactory extends Factory
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
            'name' => 'Court ' . fake()->unique()->numberBetween(1, 999),
            'type' => fake()->randomElement(['Badminton', 'Basketball', 'Tennis', 'Futsal', 'Volleyball']),
            'time_range' => fake()->randomElement(['6:00 AM - 10:00 PM', '7:00 AM - 9:00 PM', '24 Hours', '8:00 AM - 11:00 PM']),
            'description' => fake()->optional()->sentence(),
            'hourly_rate' => fake()->randomElement([250, 300, 350, 400, 500]),
            'status' => 'AVAILABLE',
        ];
    }

    public function openPlay(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'OPEN_PLAY']);
    }

    public function blocked(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'BLOCKED']);
    }

    public function notAvailable(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'NOT_AVAILABLE']);
    }
}
