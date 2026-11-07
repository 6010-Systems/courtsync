<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\DatabaseNotification;
use Tests\TestCase;

class NotificationControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_lists_only_their_own_confirmation(): void
    {
        $player = User::factory()->player()->create();
        $other = User::factory()->player()->create();
        [$booking, $notification] = $this->confirmationFor($player);
        [, $otherNotification] = $this->confirmationFor($other);

        $this->actingAs($player)->getJson(route('notifications.index'))
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.id', $notification->id)
            ->assertJsonPath('notifications.0.title', 'Booking confirmed')
            ->assertJsonPath('notifications.0.message', "Your booking #{$booking->id} on Saturday, November 7, 2026 from 10:00 AM to 11:00 AM at Riverside Sports Complex on Court 1 has been confirmed.")
            ->assertJsonPath('notifications.0.url', '/player/bookings')
            ->assertJsonPath('notifications.0.read_at', null)
            ->assertJsonMissing(['id' => $otherNotification->id]);
    }

    public function test_notification_list_returns_the_newest_twenty_and_the_full_unread_count(): void
    {
        $player = User::factory()->player()->create();
        $court = $this->court();
        $this->travelTo('2026-11-06 09:00:00');
        [, $oldest] = $this->confirmationFor($player, $court);

        foreach (range(1, 20) as $ignored) {
            $this->travel(1)->seconds();
            $this->confirmationFor($player, $court);
        }

        $this->actingAs($player)->getJson(route('notifications.index'))
            ->assertOk()
            ->assertJsonPath('unread_count', 21)
            ->assertJsonCount(20, 'notifications')
            ->assertJsonMissing(['id' => $oldest->id]);
    }

    public function test_player_marks_their_notification_read(): void
    {
        $player = User::factory()->player()->create();
        [, $notification] = $this->confirmationFor($player);

        $this->actingAs($player)
            ->patchJson(route('notifications.read', $notification))
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_player_marks_only_their_notifications_read(): void
    {
        $player = User::factory()->player()->create();
        $other = User::factory()->player()->create();
        [, $notification] = $this->confirmationFor($player);
        [, $otherNotification] = $this->confirmationFor($other);

        $this->actingAs($player)
            ->postJson(route('notifications.read-all'))
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->assertNotNull($notification->fresh()->read_at);
        $this->assertNull($otherNotification->fresh()->read_at);
    }

    public function test_player_cannot_mark_another_players_notification_read(): void
    {
        $player = User::factory()->player()->create();
        $other = User::factory()->player()->create();
        [, $notification] = $this->confirmationFor($player);

        $this->actingAs($other)
            ->patchJson(route('notifications.read', $notification))
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_guests_cannot_list_notifications(): void
    {
        $this->getJson(route('notifications.index'))->assertUnauthorized();
    }

    public function test_guests_cannot_mark_a_notification_read(): void
    {
        [, $notification] = $this->confirmationFor(User::factory()->player()->create());

        $this->patchJson(route('notifications.read', $notification))->assertUnauthorized();

        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_guests_cannot_mark_all_notifications_read(): void
    {
        [, $notification] = $this->confirmationFor(User::factory()->player()->create());

        $this->postJson(route('notifications.read-all'))->assertUnauthorized();

        $this->assertNull($notification->fresh()->read_at);
    }

    /**
     * @return array{0: Booking, 1: DatabaseNotification}
     */
    private function confirmationFor(User $player, ?Court $court = null): array
    {
        $court ??= $this->court();
        $booking = Booking::create([
            'user_id' => $player->id,
            'court_id' => $court->id,
            'facility_id' => $court->facility_id,
            'date' => '2026-11-07',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);
        $existingIds = $player->notifications()->pluck('id');
        $player->notify(new BookingConfirmed($booking));
        $notifications = $player->notifications();

        if ($existingIds->isNotEmpty()) {
            $notifications->whereNotIn('id', $existingIds);
        }

        return [$booking, $notifications->sole()];
    }

    private function court(): Court
    {
        $court = Court::factory()->create(['name' => 'Court 1']);
        $court->facility->update(['name' => 'Riverside Sports Complex']);

        return $court;
    }
}
