<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Facility>
 */
class FacilityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company().' Sports Complex';

        return [
            'user_id' => User::factory()->facilityOwner(),
            'slug' => Str::slug($name).'-'.Str::random(5),
            'name' => $name,
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->state(),
            'country' => 'Philippines',
            'contact_number' => fake()->numerify('09#########'),
            'description' => fake()->paragraph(),
            'verification_status' => 'APPROVED',
        ];
    }

    /**
     * The facility is still a draft, not yet submitted for verification.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'DRAFT',
        ]);
    }

    /**
     * The facility has been submitted and is awaiting admin review.
     */
    public function underReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'UNDER_REVIEW',
        ]);
    }
}
