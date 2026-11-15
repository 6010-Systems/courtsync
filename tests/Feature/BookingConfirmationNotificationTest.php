<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use App\Notifications\BookingConfirmed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingConfirmationNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_confirmation_saves_an_unread_notification_for_the_player_only(): void
    {
        $player = User::factory()->player()->create();
        $booking = $this->booking($player);
        $booking->facility->update(['name' => 'Riverside Sports Complex']);
        $booking->court->update(['name' => 'Court 1']);
        $owner = $booking->facility->owner;

        $this->actingAs($owner)->post(route('bookings.verify', $booking))->assertRedirect();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
        $this->assertDatabaseHas('payments', ['booking_id' => $booking->id, 'status' => 'verified']);
        $this->assertDatabaseCount('notifications', 1);
        $notification = $player->notifications()->sole();
        $this->assertSame(BookingConfirmed::class, $notification->type);
        $this->assertNull($notification->read_at);
        $this->assertSame([
            'booking_id' => $booking->id,
            'title' => 'Booking confirmed',
            'message' => "Your booking #{$booking->id} on Saturday, November 7, 2026 from 10:00 AM to 11:00 AM at Riverside Sports Complex on Court 1 has been confirmed.",
            'url' => '/player/bookings',
        ], $notification->data);
        $this->assertSame(0, $owner->notifications()->count());
    }

    public function test_repeated_confirmation_does_not_duplicate_the_notification(): void
    {
        $booking = $this->booking(User::factory()->player()->create());
        $this->actingAs($booking->facility->owner);

        $this->post(route('bookings.verify', $booking))->assertRedirect();
        $this->post(route('bookings.verify', $booking))->assertRedirect();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
    }

    public function test_staff_can_confirm_a_guest_booking_without_sending_a_user_notification(): void
    {
        $booking = $this->booking(null);
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $booking->facility_id]);

        $this->actingAs($staff)->post(route('bookings.verify', $booking))->assertRedirect();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
        $this->assertDatabaseHas('payments', ['booking_id' => $booking->id, 'status' => 'verified']);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_an_unrelated_owner_receives_403_without_confirming_or_notifying(): void
    {
        $booking = $this->booking(User::factory()->player()->create());

        $this->actingAs(User::factory()->facilityOwner()->create())
            ->post(route('bookings.verify', $booking))->assertForbidden();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'pending']);
        $this->assertDatabaseHas('payments', ['booking_id' => $booking->id, 'status' => 'pending']);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_guests_cannot_confirm_or_send_notifications(): void
    {
        $booking = $this->booking(User::factory()->player()->create());

        $this->post(route('bookings.verify', $booking))->assertRedirect(route('login'));

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'pending']);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_cancelled_booking_returns_409_without_confirming_or_notifying(): void
    {
        $booking = $this->booking(User::factory()->player()->create());
        $booking->update(['status' => 'cancelled']);

        $this->actingAs($booking->facility->owner)
            ->post(route('bookings.verify', $booking))->assertConflict();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('payments', ['booking_id' => $booking->id, 'status' => 'pending']);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_confirmation_sends_web_push_to_the_players_subscribed_browser(): void
    {
        config([
            'webpush.vapid.subject' => 'mailto:test@courtsync.test',
            'webpush.vapid.public_key' => 'BLbaiyhzX3TXtdPYBlinMXREctWJUDIG1d3vLrIyusk4a57sq2O7JdV3gxcL2Bk6ZPNcFozKsIGOxvamDTvvYrA',
            'webpush.vapid.private_key' => 'HsduBgp672Ck7Su6z9pRekq2xM2X0TQkj6e5DagjZOk',
        ]);
        Http::preventStrayRequests();
        Http::fake([
            'https://push.example.test/*' => Http::response('', 201),
        ]);
        $player = User::factory()->player()->create();
        $booking = $this->booking($player);
        $booking->facility->update(['name' => 'Riverside Sports Complex']);
        $booking->court->update(['name' => 'Court 1']);
        $player->updatePushSubscription(
            'https://push.example.test/laptop',
            'BME-1ZSAv2AyGjENQTzrXDj6vSnhAIdKso4n3NDY0lsd1DUgEzBw7ARMKjrYAm7JmJBPsilV5CWNH0mVPyJEt0Q',
            'hUIGbmiypj9_EQea8AnCKA',
            'aes128gcm',
        );

        $this->actingAs($booking->facility->owner)
            ->post(route('bookings.verify', $booking))
            ->assertRedirect();

        $notification = $player->notifications()->sole();
        $this->assertSame(
            "Your booking #{$booking->id} on Saturday, November 7, 2026 from 10:00 AM to 11:00 AM at Riverside Sports Complex on Court 1 has been confirmed.",
            $notification->data['message'],
        );
        Http::assertSent(fn ($request): bool => $request->url() === 'https://push.example.test/laptop'
            && $request->hasHeader('Urgency', 'high'));
    }

    public function test_confirmation_without_a_push_subscription_does_not_call_a_push_service(): void
    {
        Http::preventStrayRequests();
        Http::fake();
        $booking = $this->booking(User::factory()->player()->create());

        $this->actingAs($booking->facility->owner)
            ->post(route('bookings.verify', $booking))
            ->assertRedirect();

        $this->assertDatabaseCount('notifications', 1);
        Http::assertNothingSent();
    }

    private function booking(?User $player): Booking
    {
        $court = Court::factory()->create();
        $booking = Booking::create([
            'user_id' => $player?->id,
            'guest_name' => $player ? null : 'Walk-in player',
            'court_id' => $court->id,
            'facility_id' => $court->facility_id,
            'date' => '2026-11-07',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'pending',
        ]);
        $booking->payment()->create([
            'user_id' => $player?->id,
            'amount' => 500,
            'payment_method' => 'gcash',
            'status' => 'pending',
        ]);

        return $booking;
    }
}
