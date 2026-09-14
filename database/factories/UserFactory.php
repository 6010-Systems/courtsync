<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * A player account, verified and free to join facilities.
     */
    public function player(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'PLAYER',
            'status' => 'VERIFIED',
            'mobile_number' => fake()->numerify('09#########'),
        ]);
    }

    /**
     * A facility owner account.
     */
    public function facilityOwner(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'FACILITY_OWNER',
            'status' => 'VERIFIED',
            'mobile_number' => fake()->numerify('09#########'),
        ]);
    }

    /**
     * A facility staff account, tied to a facility via facility_id.
     */
    public function facilityStaff(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'FACILITY_STAFF',
            'status' => 'VERIFIED',
            'mobile_number' => fake()->numerify('09#########'),
        ]);
    }

    /**
     * An admin account.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'ADMIN',
            'status' => 'VERIFIED',
        ]);
    }
}
