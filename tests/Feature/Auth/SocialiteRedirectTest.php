<?php

namespace Tests\Feature\Auth;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SocialiteRedirectTest extends TestCase
{
    /**
     * Fake credentials keep these tests hermetic: they assert the redirect that
     * is sent to Google without depending on real client secrets being present.
     */
    protected function setUp(): void
    {
        parent::setUp();

        foreach (['player', 'owner', 'staff'] as $tenant) {
            config([
                "services.google_{$tenant}.client_id" => "test-{$tenant}-client-id",
                "services.google_{$tenant}.client_secret" => "test-{$tenant}-client-secret",
                "services.google_{$tenant}.redirect" => "/auth/google/{$tenant}/callback",
            ]);
        }
    }

    public function test_player_google_redirect_sends_the_player_to_google_with_the_expected_parameters(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'player']));

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/auth?', $targetUrl);
        $this->assertStringContainsString('client_id=test-player-client-id', $targetUrl);
        $this->assertStringContainsString('state=', $targetUrl);
        $this->assertStringContainsString('prompt=select_account', $targetUrl);
        $this->assertStringContainsString(
            'redirect_uri='.rawurlencode(url('/auth/google/player/callback')),
            $targetUrl,
        );
    }

    public function test_owner_google_redirect_uses_the_owner_client_and_callback(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'owner']));

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/auth?', $targetUrl);
        $this->assertStringContainsString('client_id=test-owner-client-id', $targetUrl);
        $this->assertStringContainsString(
            'redirect_uri='.rawurlencode(url('/auth/google/owner/callback')),
            $targetUrl,
        );
    }

    public function test_staff_google_redirect_uses_the_staff_client_and_callback(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'staff']));

        $response->assertRedirect();
        $targetUrl = $response->headers->get('Location');

        $this->assertStringContainsString('client_id=test-staff-client-id', $targetUrl);
        $this->assertStringContainsString(
            'redirect_uri='.rawurlencode(url('/auth/google/staff/callback')),
            $targetUrl,
        );
    }

    public function test_player_redirect_remembers_the_facility_for_the_callback(): void
    {
        $response = $this->get(route('google.redirect', ['tenant' => 'player', 'facility' => 'court-king']))
            ->assertRedirect()
            ->assertSessionHas('auth_facility_slug', 'court-king');

        parse_str((string) parse_url($response->headers->get('Location'), PHP_URL_QUERY), $query);

        // The slug also rides along in the state so a dropped session (e.g.
        // localhost vs 127.0.0.1) cannot lose the facility.
        $this->assertStringEndsWith('.court-king', $query['state']);
        $this->assertSame($query['state'], session('state'));
    }

    public function test_redirect_returns_a_visible_error_when_credentials_are_missing(): void
    {
        config([
            'services.google_player.client_id' => null,
            'services.google_player.client_secret' => null,
        ]);

        $this->from('/court-king/login')
            ->get(route('google.redirect', ['tenant' => 'player']))
            ->assertRedirect('/court-king/login')
            ->assertSessionHas('error', 'Google authentication is not yet configured on this server.');
    }

    public function test_unknown_tenant_is_not_found(): void
    {
        $this->getJson(route('google.redirect', ['tenant' => 'admin']))->assertNotFound();
    }

    public function test_flash_errors_are_shared_with_inertia_pages(): void
    {
        $this->withSession(['error' => 'Google sign-in failed: invalid_client'])
            ->get(route('login'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Auth/Login')
                ->where('flash.error', 'Google sign-in failed: invalid_client')
            );
    }
}
