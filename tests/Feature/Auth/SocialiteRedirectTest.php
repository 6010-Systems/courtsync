<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class SocialiteRedirectTest extends TestCase
{
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

