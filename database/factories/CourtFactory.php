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
     * Curated mock court images categorized by sport.
     *
     * @var array<string, array<int, string>>
     */
    public const SPORT_IMAGES = [
        'Badminton' => [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
        ],
        'Basketball' => [
            'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
        ],
        'Tennis' => [
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
        ],
        'Futsal' => [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        ],
        'Volleyball' => [
            'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=800&q=80',
        ],
        'Pickleball' => [
            'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1628891890467-b79f2c8ba9dc?auto=format&fit=crop&w=800&q=80',
        ],
        'Padel' => [
            'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        ],
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['Badminton', 'Basketball', 'Tennis', 'Futsal', 'Volleyball', 'Pickleball', 'Padel', 'Table Tennis']);

        return [
            'facility_id' => Facility::factory(),
            'name' => 'Court '.fake()->unique()->numberBetween(1, 999),
            'type' => $type,
            'image_url' => Court::defaultImageFor($type, fake()->numberBetween(0, 1)),
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
