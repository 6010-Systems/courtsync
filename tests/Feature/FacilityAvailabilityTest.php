<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use App\Support\FacilityAvailability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Facility, 1: Court, 2: User}
     */
    private function makeBookableSetup(array $facilityOverrides = [], array $courtOverrides = []): array
    {
        $facility = Facility::factory()->create(array_merge([
            'operating_days' => Facility::ALL_OPERATING_DAYS,
            'operational_status' => Facility::OPERATIONAL_OPEN,
        ], $facilityOverrides));

        $court = Court::factory()->flatPricing(300)->create(array_merge([
            'facility_id' => $facility->id,
            'status' => 'AVAILABLE',
            'time_range' => '6:00 AM - 10:00 PM',
        ], $courtOverrides));

        $player = User::factory()->player()->create();

        return [$facility, $court, $player];
    }

    public function test_booking_is_rejected_when_facility_is_closed_that_weekday(): void
    {
        // 2026-11-21 is a Saturday (ISO 6)
        [$facility, $court, $player] = $this->makeBookableSetup([
            'operating_days' => [1, 2, 3, 4, 5],
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-21',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['date' => 'Facility closed this day.']);

        $this->assertDatabaseCount('bookings', 0);
    }

    public function test_booking_is_rejected_when_facility_is_under_maintenance(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([
            'operational_status' => Facility::OPERATIONAL_MAINTENANCE,
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['facility_id' => 'Facility under maintenance.']);
    }

    public function test_booking_is_rejected_when_facility_is_unserviceable(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([
            'operational_status' => Facility::OPERATIONAL_UNSERVICEABLE,
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['facility_id' => 'Facility currently unserviceable.']);
    }

    public function test_booking_is_rejected_when_court_is_under_maintenance(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([], [
            'status' => 'BLOCKED',
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['court_id' => 'This court is under maintenance.']);
    }

    public function test_booking_is_rejected_outside_court_operating_hours(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([], [
            'time_range' => '8:00 AM - 12:00 PM',
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '18:00',
                'end_time' => '19:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['start_time' => 'Outside operating hours.']);
    }

    public function test_booking_is_rejected_when_slot_is_already_booked(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup();
        $otherPlayer = User::factory()->player()->create();

        Booking::query()->create([
            'facility_id' => $facility->id,
            'user_id' => $otherPlayer->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'subtotal' => 600,
            'addons_total' => 0,
            'booking_fee' => 0,
            'total_price' => 600,
            'status' => 'confirmed',
        ]);

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['conflict']);
    }

    public function test_lock_slot_is_rejected_when_facility_is_closed(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([
            'operating_days' => [1, 2, 3, 4, 5],
        ]);

        $this->actingAs($player)
            ->post(route('bookings.lock'), [
                'court_id' => $court->id,
                'date' => '2026-11-21',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'idempotency_key' => 'test-lock-key',
            ])
            ->assertStatus(422)
            ->assertJson([
                'code' => FacilityAvailability::REASON_FACILITY_CLOSED_DAY,
                'message' => 'Facility closed this day.',
            ]);
    }

    public function test_open_weekday_with_available_court_still_books(): void
    {
        [$facility, $court, $player] = $this->makeBookableSetup([
            'operating_days' => [1, 2, 3, 4, 5],
        ]);

        // 2026-11-20 is a Friday
        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('bookings', 1);
    }
}
