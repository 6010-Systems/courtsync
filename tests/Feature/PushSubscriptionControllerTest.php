<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushSubscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_can_save_subscriptions_for_more_than_one_device(): void
    {
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->postJson(route('push-subscriptions.store'), $this->subscription('https://push.example.test/laptop'))
            ->assertOk()
            ->assertJsonStructure(['id']);
        $this->actingAs($player)
            ->postJson(route('push-subscriptions.store'), $this->subscription('https://push.example.test/phone'))
            ->assertOk();

        $this->assertDatabaseCount('push_subscriptions', 2);
        $this->assertSame(2, $player->pushSubscriptions()->count());
    }

    public function test_saving_the_same_endpoint_updates_that_subscription(): void
    {
        $player = User::factory()->player()->create();
        $payload = $this->subscription('https://push.example.test/laptop');

        $this->actingAs($player)->postJson(route('push-subscriptions.store'), $payload)->assertOk();
        $payload['keys']['auth'] = 'updated-auth-token';
        $this->actingAs($player)->postJson(route('push-subscriptions.store'), $payload)->assertOk();

        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', [
            'endpoint' => 'https://push.example.test/laptop',
            'auth_token' => 'updated-auth-token',
            'subscribable_id' => $player->id,
        ]);
    }

    public function test_player_cannot_assign_a_subscription_to_another_user(): void
    {
        $player = User::factory()->player()->create();
        $other = User::factory()->player()->create();
        $payload = $this->subscription('https://push.example.test/laptop');
        $payload['subscribable_id'] = $other->id;

        $this->actingAs($player)->postJson(route('push-subscriptions.store'), $payload)->assertOk();

        $this->assertDatabaseHas('push_subscriptions', [
            'endpoint' => 'https://push.example.test/laptop',
            'subscribable_id' => $player->id,
            'subscribable_type' => User::class,
        ]);
        $this->assertSame(0, $other->pushSubscriptions()->count());
    }

    public function test_player_cannot_delete_another_players_subscription(): void
    {
        $player = User::factory()->player()->create();
        $other = User::factory()->player()->create();
        $player->updatePushSubscription(
            'https://push.example.test/laptop',
            'public-key',
            'auth-token',
            'aes128gcm',
        );

        $this->actingAs($other)
            ->deleteJson(route('push-subscriptions.destroy'), ['endpoint' => 'https://push.example.test/laptop'])
            ->assertNoContent();

        $this->assertSame(1, $player->pushSubscriptions()->count());
        $this->assertSame(0, $other->pushSubscriptions()->count());
    }

    public function test_player_can_delete_their_own_subscription(): void
    {
        $player = User::factory()->player()->create();
        $player->updatePushSubscription(
            'https://push.example.test/laptop',
            'public-key',
            'auth-token',
            'aes128gcm',
        );

        $this->actingAs($player)
            ->deleteJson(route('push-subscriptions.destroy'), ['endpoint' => 'https://push.example.test/laptop'])
            ->assertNoContent();

        $this->assertSame(0, $player->pushSubscriptions()->count());
    }

    public function test_missing_subscription_fields_are_rejected(): void
    {
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->postJson(route('push-subscriptions.store'), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'endpoint' => 'The endpoint field is required.',
                'keys' => 'The keys field is required.',
                'keys.p256dh' => 'The keys.p256dh field is required.',
                'keys.auth' => 'The keys.auth field is required.',
            ]);

        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_unsupported_content_encoding_is_rejected(): void
    {
        $player = User::factory()->player()->create();
        $payload = $this->subscription('https://push.example.test/laptop');
        $payload['content_encoding'] = 'plain';

        $this->actingAs($player)
            ->postJson(route('push-subscriptions.store'), $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'content_encoding' => 'The selected content encoding is invalid.',
            ]);

        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_guests_cannot_save_a_push_subscription(): void
    {
        $this->postJson(route('push-subscriptions.store'), $this->subscription('https://push.example.test/phone'))
            ->assertUnauthorized();

        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_guests_cannot_delete_a_push_subscription(): void
    {
        $player = User::factory()->player()->create();
        $player->updatePushSubscription(
            'https://push.example.test/laptop',
            'public-key',
            'auth-token',
            'aes128gcm',
        );

        $this->deleteJson(route('push-subscriptions.destroy'), ['endpoint' => 'https://push.example.test/laptop'])
            ->assertUnauthorized();

        $this->assertSame(1, $player->pushSubscriptions()->count());
    }

    /**
     * @return array{endpoint: string, keys: array{p256dh: string, auth: string}, content_encoding: string}
     */
    private function subscription(string $endpoint): array
    {
        return [
            'endpoint' => $endpoint,
            'keys' => [
                'p256dh' => 'BME-1ZSAv2AyGjENQTzrXDj6vSnhAIdKso4n3NDY0lsd1DUgEzBw7ARMKjrYAm7JmJBPsilV5CWNH0mVPyJEt0Q',
                'auth' => 'hUIGbmiypj9_EQea8AnCKA',
            ],
            'content_encoding' => 'aes128gcm',
        ];
    }
}
