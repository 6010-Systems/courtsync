<?php

namespace Tests\Feature\Auth;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlayerBookingIntentTest extends TestCase
{
    use RefreshDatabase;

    public function test_player_login_returns_to_the_intended_court_booking_page(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();
        $intended = route('facility.book', ['facility' => $facility->slug, 'court' => $court->id]);

        // Clicking "Book court" while signed out lands on this facility's login.
        $this->get($intended)->assertRedirect(route('player.login', $facility->slug));

        // Signing in there returns to that exact booking URL.
        $response = $this->post("/{$facility->slug}/login", [
            'email' => $player->email,
            'password' => 'password',
        ]);

        $response->assertRedirect($intended);
        $this->assertAuthenticatedAs($player);
    }

    public function test_player_login_falls_back_to_the_booking_page_without_an_intended_url(): void
    {
        $facility = Facility::factory()->create();
        $player = User::factory()->player()->create();

        $response = $this->post("/{$facility->slug}/login", [
            'email' => $player->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/'.$facility->slug.'/book');
        $this->assertAuthenticatedAs($player);
    }

    public function test_player_registration_returns_to_the_intended_court_booking_page(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $intended = route('facility.book', ['facility' => $facility->slug, 'court' => $court->id]);

        // Clicking "Book court" while signed out, then choosing "Sign up now".
        $this->get($intended)->assertRedirect(route('player.login', $facility->slug));
        $this->get(route('player.register', $facility->slug))->assertOk();

        $response = $this->post("/{$facility->slug}/register", [
            'name' => 'Court Bound Player',
            'email' => 'court-bound@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect($intended);
        $this->assertAuthenticated();
    }

    public function test_player_registration_falls_back_to_the_booking_page_without_an_intended_url(): void
    {
        $facility = Facility::factory()->create();

        $response = $this->post("/{$facility->slug}/register", [
            'name' => 'Direct Booking Player',
            'email' => 'direct-booking@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect('/'.$facility->slug.'/book');
        $this->assertAuthenticated();
    }
}
