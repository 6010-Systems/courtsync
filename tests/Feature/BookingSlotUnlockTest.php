<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class BookingSlotUnlockTest extends TestCase
{
    use RefreshDatabase;

    public function test_lock_holds_every_hour_of_a_session_that_crosses_midnight(): void
    {
        $player = User::factory()->player()->create();

        $this->actingAs($player)->postJson(route('bookings.lock'), [
            'court_id' => 1,
            'date' => '2026-11-06',
            'start_time' => '22:00',
            'end_time' => '02:00',
            'idempotency_key' => 'my-client',
        ])->assertOk()->assertExactJson(['locked' => false]);

        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-06_22:00'));
        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-06_23:00'));
        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-07_00:00'));
        $this->assertSame('my-client', Cache::get('court_hold_1_2026-11-07_01:00'));
        // The end time is a boundary, so 2:00 AM itself is not held.
        $this->assertNull(Cache::get('court_hold_1_2026-11-07_02:00'));
    }

    public function test_locked_slots_include_holds_on_the_next_calendar_day(): void
    {
        $player = User::factory()->player()->create();
        Cache::put('court_hold_1_2026-11-07_01:00', 'other-client');

        $this->actingAs($player)
            ->getJson('/api/courts/1/locked-slots?date=2026-11-06&idempotency_key=my-client')
            ->assertOk()
            ->assertJsonPath('locked_slots', [])
            ->assertJsonPath('next_day_locked_slots', ['01:00']);
    }

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
