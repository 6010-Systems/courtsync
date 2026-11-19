<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_booking_in_their_facility_but_not_another(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);
        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'user_id' => User::factory()->player()->create()->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'addons_total' => 0,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->patch(route('bookings.update', $booking), ['status' => 'cancelled'])
            ->assertRedirect();

        $foreign = Booking::query()->create([
            'facility_id' => Facility::factory()->create()->id,
            'user_id' => User::factory()->player()->create()->id,
            'court_id' => Court::factory()->create()->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'addons_total' => 0,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'pending',
        ]);

        $this->actingAs($owner)
            ->patch(route('bookings.update', $foreign), ['status' => 'cancelled'])
            ->assertForbidden();
    }

    public function test_staff_without_edit_courts_cannot_update_a_court(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $staff = User::factory()->facilityStaff()->create([
            'facility_id' => $facility->id,
            'permissions' => ['view_courts'],
        ]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $this->actingAs($staff)
            ->put(route('facility.courts.update', $court), [
                'name' => 'Hijacked',
                'type' => 'Badminton',
                'operating_schedules' => [[
                    'days' => [1, 2, 3, 4, 5, 6, 7],
                    'start' => '08:00',
                    'end' => '22:00',
                ]],
                'pricing_mode' => 'FLAT',
                'hourly_rate' => 300,
                'status' => 'AVAILABLE',
            ])
            ->assertForbidden();
    }

    public function test_staff_with_edit_courts_can_update_a_court(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $staff = User::factory()->facilityStaff()->create([
            'facility_id' => $facility->id,
            'permissions' => ['view_courts', 'edit_courts'],
        ]);
        $court = Court::factory()->flatPricing(300)->create(['facility_id' => $facility->id]);

        $this->actingAs($staff)
            ->put(route('facility.courts.update', $court), [
                'name' => 'Renamed Court',
                'type' => 'Badminton',
                'operating_schedules' => [[
                    'days' => [1, 2, 3, 4, 5, 6, 7],
                    'start' => '08:00',
                    'end' => '22:00',
                ]],
                'pricing_mode' => 'FLAT',
                'hourly_rate' => 300,
                'status' => 'AVAILABLE',
            ])
            ->assertRedirect();

        $this->assertSame('Renamed Court', $court->fresh()->name);
    }

    public function test_players_cannot_view_facility_payments_index(): void
    {
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.payments'))
            ->assertForbidden();
    }

    public function test_owner_can_view_facility_payments_index(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->get(route('facility.payments'))
            ->assertOk();
    }

    public function test_facility_policy_allows_owner_and_denies_foreign_owner(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $other = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->assertTrue($owner->can('update', $facility));
        $this->assertFalse($other->can('update', $facility));
        $this->assertTrue($owner->can('managePayments', $facility));
        $this->assertFalse($other->can('managePayments', $facility));
    }
}
