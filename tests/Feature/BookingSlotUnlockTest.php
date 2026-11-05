<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BookingSlotUnlockTest extends TestCase
{
    use RefreshDatabase;

    public function test_unlock_releases_only_slots_held_by_the_matching_client(): void
    {
        $player = User::factory()->player()->create();
        Cache::put('court_hold_1_2026-11-06_10:00', 'my-client');
        Cache::put('court_hold_1_2026-11-06_11:00', 'other-client');

        $response = $this->actingAs($player)->postJson(route('bookings.unlock'), [
            'court_id' => 1,
            'date' => '2026-11-06',
            'start_time' => '10:00',
            'end_time' => '12:00',
            'idempotency_key' => 'my-client',
        ]);

        $response->assertOk()->assertExactJson(['success' => true]);
        $this->assertNull(Cache::get('court_hold_1_2026-11-06_10:00'));
        $this->assertSame('other-client', Cache::get('court_hold_1_2026-11-06_11:00'));
    }

    public function test_unlock_returns_400_without_a_client_key_and_keeps_the_hold(): void
    {
        $player = User::factory()->player()->create();
        Cache::put('court_hold_1_2026-11-06_10:00', 'my-client');

        $response = $this->actingAs($player)->postJson(route('bookings.unlock'), [
            'court_id' => 1,
            'date' => '2026-11-06',
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]);

        $response->assertBadRequest()->assertExactJson(['success' => false]);
        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-06_10:00'));
    }

    public function test_guests_cannot_unlock_booking_slots(): void
    {
        Cache::put('court_hold_1_2026-11-06_10:00', 'my-client');

        $response = $this->postJson(route('bookings.unlock'), [
            'court_id' => 1,
            'date' => '2026-11-06',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'idempotency_key' => 'my-client',
        ]);

        $response->assertUnauthorized();
        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-06_10:00'));
    }
}
