<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlayerBookingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->travelTo(Carbon::parse('2026-11-05 12:00:00', config('app.timezone')));
    }

    private function booking(User $player, array $attributes = []): Booking
    {
        $court = Court::factory()->create();

        return Booking::create(array_merge([
            'user_id' => $player->id,
            'court_id' => $court->id,
            'facility_id' => $court->facility_id,
            'date' => '2026-11-06',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'pending',
        ], $attributes));
    }

    public function test_player_dashboard_shows_only_their_own_reservations_and_separate_payment_status(): void
    {
        $player = User::factory()->player()->create();
        $next = $this->booking($player);
        $next->payment()->create(['user_id' => $player->id, 'amount' => 500, 'payment_method' => 'gcash', 'status' => 'pending', 'proof_path' => 'private-proof.jpg']);
        $this->booking($player, ['date' => '2026-11-04', 'status' => 'confirmed']);
        $this->booking(User::factory()->player()->create());

        $this->actingAs($player)->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Players/Dashboard')
            ->where('stats.upcoming', 1)->where('stats.awaitingConfirmation', 1)->where('stats.past', 1)
            ->where('nextBooking.id', $next->id)->where('nextBooking.payment.status', 'pending')
            ->missing('nextBooking.payment.proof_path')->missing('nextBooking.user_id')
            ->has('recentBookings', 2)->where('timezone', config('app.timezone')));
    }

    public function test_filters_classify_today_by_end_time_and_keep_cancelled_bookings_separate(): void
    {
        $player = User::factory()->player()->create();
        $ongoing = $this->booking($player, ['date' => '2026-11-05', 'start_time' => '11:00:00', 'end_time' => '13:00:00']);
        $ended = $this->booking($player, ['date' => '2026-11-05', 'end_time' => '12:00:00']);
        $cancelled = $this->booking($player, ['status' => 'cancelled']);
        $this->booking(User::factory()->player()->create());

        foreach (['upcoming' => $ongoing, 'past' => $ended, 'cancelled' => $cancelled] as $filter => $expected) {
            $this->actingAs($player)->get(route('player.bookings', ['filter' => $filter]))->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('Players/Bookings')
                    ->where('filter', $filter)->has('bookings.data', 1)->where('bookings.data.0.id', $expected->id));
        }

        $this->get(route('player.bookings', ['filter' => 'all']))->assertInertia(fn (Assert $page) => $page->where('bookings.total', 3));
    }

    public function test_bookings_paginate_and_keep_the_selected_filter(): void
    {
        $player = User::factory()->player()->create();
        $first = $this->booking($player);
        for ($i = 0; $i < 10; $i++) {
            $this->booking($player, ['court_id' => $first->court_id, 'facility_id' => $first->facility_id]);
        }

        $this->actingAs($player)->get(route('player.bookings', ['filter' => 'all']))->assertInertia(fn (Assert $page) => $page
            ->has('bookings.data', 10)->where('bookings.total', 11)
            ->where('bookings.next_page_url', fn ($url) => str_contains($url, 'filter=all') && str_contains($url, 'page=2')));
        $this->get(route('player.bookings', ['filter' => 'all', 'page' => 2]))->assertInertia(fn (Assert $page) => $page
            ->has('bookings.data', 1)->where('bookings.current_page', 2));
    }

    public function test_new_player_has_empty_dashboard_and_booking_list(): void
    {
        $this->actingAs(User::factory()->player()->create())->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('nextBooking', null)->has('recentBookings', 0)->where('stats.upcoming', 0)->where('stats.past', 0));
        $this->get(route('player.bookings'))->assertInertia(fn (Assert $page) => $page
            ->where('filter', 'upcoming')->has('bookings.data', 0));
    }

    public function test_guests_and_other_roles_cannot_access_player_bookings(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
        $this->get(route('player.bookings'))->assertRedirect(route('login'));
        foreach (['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role, 'status' => 'VERIFIED']))
                ->get(route('player.bookings'))->assertForbidden();
        }
    }

    public function test_banned_players_are_redirected_to_login(): void
    {
        $this->actingAs(User::factory()->player()->create(['status' => 'BANNED']))
            ->get(route('player.bookings'))->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_invalid_filter_and_page_are_rejected(): void
    {
        $this->actingAs(User::factory()->player()->create())
            ->getJson(route('player.bookings', ['filter' => 'invalid', 'page' => 0]))
            ->assertUnprocessable()->assertJsonValidationErrors(['filter', 'page']);
    }

    public function test_other_roles_keep_the_existing_dashboard(): void
    {
        foreach (['FACILITY_OWNER' => 'FacilityOwner/Dashboard', 'FACILITY_STAFF' => 'FacilityOwner/Dashboard', 'ADMIN' => 'Admin/Dashboard'] as $role => $component) {
            $this->actingAs(User::factory()->create(['role' => $role, 'status' => 'VERIFIED']))
                ->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }
}
