<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Seed admin accounts.
     *
     * Access: role === 'ADMIN' is checked by the CheckAdmin middleware, which
     * gates the whole /admin route group (approve facility owners/staff,
     * review facility verifications). No facility scoping applies to admins.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin Demo',
            'email' => 'admin@example.com',
        ]);
    }
}
