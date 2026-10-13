<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_facility_page_renders_facility_show(): void
    {
        $facility = Facility::factory()->create();

        $response = $this->get(route('facility.show', $facility->slug));

        $response->assertInertia(fn (Assert $page) => $page->component('Facility/Show'));
    }

    public function test_guest_book_page_redirects_to_login(): void
    {
        $facility = Facility::factory()->create();

        $response = $this->get(route('facility.book', $facility->slug));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_book_page_renders_facility_book(): void
    {
        $facility = Facility::factory()->create();
        $player = User::factory()->player()->create();

        $response = $this->actingAs($player)->get(route('facility.book', $facility->slug));

        $response->assertInertia(fn (Assert $page) => $page->component('Facility/Book'));
    }

    public function test_owner_payment_settings_page_renders_facility_payment_settings(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        $response = $this->actingAs($owner)->get(route('facility.payment-settings'));

        $response->assertInertia(fn (Assert $page) => $page->component('Facility/PaymentSettings'));
    }

    public function test_player_payment_settings_page_is_forbidden(): void
    {
        $player = User::factory()->player()->create();

        $response = $this->actingAs($player)->get(route('facility.payment-settings'));

        $response->assertForbidden();
    }
}
