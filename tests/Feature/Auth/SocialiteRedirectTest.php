<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class SocialiteRedirectTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google_player.client_id' => 'test-player-client-id',
            'services.google_player.client_secret' => 'test-player-secret',
            'services.google_player.redirect' => '/auth/google/player/callback',
            'services.google_owner.client_id' => 'test-owner-client-id',
            'services.google_owner.client_secret' => 'test-owner-secret',
            'services.google_owner.redirect' => '/auth/google/owner/callback',
            'services.google_staff.client_id' => 'test-staff-client-id',
            'services.google_staff.client_secret' => 'test-staff-secret',
            'services.google_staff.redirect' => '/auth/google/staff/callback',
        ]);
    }

    public function test_player_google_redirect_generates_valid_redirect_with_state(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'player']));

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('accounts.google.com/o/oauth2/auth', $targetUrl);
        $this->assertStringContainsString('state=', $targetUrl);
        $this->assertStringContainsString('client_id=', $targetUrl);
        $this->assertStringContainsString('redirect_uri=', $targetUrl);
    }

    public function test_owner_google_redirect_generates_valid_redirect_with_state(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'owner']));

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('accounts.google.com/o/oauth2/auth', $targetUrl);
        $this->assertStringContainsString('state=', $targetUrl);
    }
}
