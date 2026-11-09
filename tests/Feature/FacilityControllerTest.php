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

    public function test_owner_can_update_facility_branding(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->post(route('facility.branding.update', $facility), [
            'cover_photo_url' => 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
            'logo_url' => 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80',
        ]);

        $response->assertSessionHasNoErrors();
        $facility->refresh();
        $this->assertSame('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80', $facility->cover_photo_url);
        $this->assertSame('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80', $facility->logo_url);
    }

    public function test_other_user_cannot_update_facility_branding(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $otherUser = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($otherUser)->post(route('facility.branding.update', $facility), [
            'cover_photo_url' => 'https://example.com/hacked.png',
        ]);

        $response->assertForbidden();
    }
}
