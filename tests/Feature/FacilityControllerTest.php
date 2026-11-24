<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\RatePlan;
use App\Models\User;
use Carbon\Carbon;
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

    public function test_public_facility_page_exposes_only_offered_active_rates(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $rental = RatePlan::factory()->courtRental()->create(['facility_id' => $facility->id]);
        RatePlan::factory()->allIn()->inactive()->create(['facility_id' => $facility->id]);
        RatePlan::factory()->paddleAddon()->create(['facility_id' => $facility->id]);
        $court->ratePlans()->attach($rental->id);

        $this->get(route('facility.show', $facility->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Show')
                ->has('facility.rate_plans', 1)
                ->where('facility.rate_plans.0.name', 'Court Rental')
                ->has('facility.courts.0.rate_plans', 1));
    }

    public function test_guest_is_redirected_to_the_facility_player_login_page(): void
    {
        $facility = Facility::factory()->create();

        $response = $this->get(route('facility.book', $facility->slug));

        $response->assertRedirect(route('player.login', $facility->slug));
        $this->assertSame(
            route('facility.book', $facility->slug),
            session('url.intended'),
        );
    }

    public function test_authenticated_book_page_renders_facility_book(): void
    {
        $facility = Facility::factory()->create();
        $player = User::factory()->player()->create();

        $response = $this->actingAs($player)->get(route('facility.book', $facility->slug));

        $response->assertInertia(fn (Assert $page) => $page->component('Facility/Book'));
    }

    public function test_book_page_includes_last_nights_session_that_runs_into_today(): void
    {
        Carbon::setTestNow('2026-11-26 01:00:00');

        $facility = Facility::factory()->create();
        $court = Court::factory()->flatPricing(400)->create([
            'facility_id' => $facility->id,
            'time_range' => '6:00 AM - 2:00 AM',
        ]);

        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-25',
            'end_date' => '2026-11-26',
            'start_time' => '22:00:00',
            'end_time' => '02:00:00',
            'total_price' => 1600,
            'status' => 'confirmed',
        ]);

        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.book', $facility->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Book')
                ->has('facility.bookings', 1)
                ->where('facility.bookings.0.end_date', '2026-11-26'));

        Carbon::setTestNow();
    }

    public function test_book_page_preselects_the_court_passed_in_the_query_string(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.book', ['facility' => $facility->slug, 'court' => $court->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Book')
                ->where('preselectedCourtId', $court->id));
    }

    public function test_book_page_ignores_a_preselected_court_from_another_facility(): void
    {
        $facility = Facility::factory()->create();
        $otherFacility = Facility::factory()->create();
        $otherCourt = Court::factory()->create(['facility_id' => $otherFacility->id]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.book', ['facility' => $facility->slug, 'court' => $otherCourt->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Book')
                ->where('preselectedCourtId', null));
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

    public function test_owner_can_update_booking_fee_settings(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->post(route('facility.payment-settings.update', $facility), [
            'booking_fee_type' => 'PERCENT',
            'booking_fee_value' => 5,
        ]);

        $response->assertSessionHasNoErrors();
        $facility->refresh();
        $this->assertSame('PERCENT', $facility->booking_fee_type);
        $this->assertSame('5.00', $facility->booking_fee_value);
    }

    public function test_percentage_booking_fee_cannot_exceed_one_hundred(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)->post(route('facility.payment-settings.update', $facility), [
            'booking_fee_type' => 'PERCENT',
            'booking_fee_value' => 150,
        ])->assertSessionHasErrors('booking_fee_value');

        $this->assertSame('0.00', $facility->fresh()->booking_fee_value);
    }

    public function test_other_owner_cannot_update_payment_settings(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $otherUser = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($otherUser)->post(route('facility.payment-settings.update', $facility), [
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 50,
        ])->assertForbidden();
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
