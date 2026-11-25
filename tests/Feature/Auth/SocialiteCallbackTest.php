<?php

namespace Tests\Feature\Auth;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Two\GoogleProvider;
use Mockery;
use Tests\TestCase;

class SocialiteCallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_google_player_callback_returns_to_the_intended_court_booking_page(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $intended = route('facility.book', ['facility' => $facility->slug, 'court' => $court->id]);

        $this->fakeGooglePlayer('google-court-bound@example.com');

        $response = $this->withSession([
            'auth_facility_slug' => $facility->slug,
            'url.intended' => $intended,
        ])->get(route('google.callback', ['tenant' => 'player']));

        $response->assertRedirect($intended);
        $this->assertAuthenticated();
    }

    public function test_google_player_callback_falls_back_to_the_booking_page_without_an_intended_url(): void
    {
        $facility = Facility::factory()->create();

        $this->fakeGooglePlayer('google-facility-only@example.com');

        $response = $this->withSession(['auth_facility_slug' => $facility->slug])
            ->get(route('google.callback', ['tenant' => 'player']));

        $response->assertRedirect('/'.$facility->slug.'/book');
        $this->assertAuthenticated();
    }

    public function test_google_player_callback_recovers_the_facility_from_the_oauth_state_without_a_session(): void
    {
        $facility = Facility::factory()->create();
        $this->fakeGooglePlayer('google-state-only@example.com');

        // Simulates a dropped session (e.g. started on 127.0.0.1, returned to
        // localhost): only the state parameter still carries the facility.
        $response = $this->get(route('google.callback', [
            'tenant' => 'player',
            'state' => Str::random(40).'.'.$facility->slug,
            'code' => 'test-code',
        ]));

        $response->assertRedirect('/'.$facility->slug.'/book');

        $player = User::where('email', 'google-state-only@example.com')->firstOrFail();

        $this->assertAuthenticatedAs($player);
        $this->assertTrue($player->joinedFacilities()->where('facilities.id', $facility->id)->exists());
        $this->assertSame($facility->slug, session('last_facility_slug'));
    }

    public function test_google_player_callback_stores_a_long_avatar_url_for_a_new_player(): void
    {
        $facility = Facility::factory()->create();
        $avatar = $this->longGoogleAvatarUrl();

        $this->fakeGooglePlayer('google-new-player@example.com', $avatar);

        $this->withSession(['auth_facility_slug' => $facility->slug])
            ->get(route('google.callback', ['tenant' => 'player']))
            ->assertRedirect('/'.$facility->slug.'/book');

        $player = User::where('email', 'google-new-player@example.com')->firstOrFail();

        $this->assertSame($avatar, $player->avatar);
    }

    public function test_google_player_callback_updates_an_existing_player_with_a_long_avatar_url(): void
    {
        $facility = Facility::factory()->create();
        $player = User::factory()->player()->create([
            'email' => 'google-existing-player@example.com',
            'avatar' => null,
        ]);
        $avatar = $this->longGoogleAvatarUrl();

        $this->fakeGooglePlayer($player->email, $avatar);

        $this->withSession(['auth_facility_slug' => $facility->slug])
            ->get(route('google.callback', ['tenant' => 'player']))
            ->assertRedirect('/'.$facility->slug.'/book');

        $player->refresh();

        $this->assertSame($avatar, $player->avatar);
        $this->assertSame('google-id-123', $player->google_id);
    }

    /**
     * Google profile photo URLs are far longer than the original 255-char column.
     */
    private function longGoogleAvatarUrl(): string
    {
        return 'https://lh3.googleusercontent.com/a-/'.str_repeat('A', 1200).'=s96-c';
    }

    /**
     * Stub the Google provider so the callback can run without calling Google.
     */
    private function fakeGooglePlayer(string $email, ?string $avatar = null): void
    {
        config([
            'services.google_player.client_id' => 'test-player-client-id',
            'services.google_player.client_secret' => 'test-player-client-secret',
            'services.google_player.redirect' => '/auth/google/player/callback',
        ]);

        $socialiteUser = Mockery::mock(SocialiteUser::class);
        $socialiteUser->shouldReceive('getId')->andReturn('google-id-123');
        $socialiteUser->shouldReceive('getEmail')->andReturn($email);
        $socialiteUser->shouldReceive('getName')->andReturn('Google Player');
        $socialiteUser->shouldReceive('getAvatar')->andReturn($avatar);

        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->andReturn($socialiteUser);

        $this->mock(SocialiteFactory::class, function ($mock) use ($provider) {
            $mock->shouldReceive('buildProvider')->andReturn($provider);
        });
    }
}
