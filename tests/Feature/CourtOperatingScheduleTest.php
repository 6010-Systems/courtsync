<?php

namespace Tests\Feature;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourtOperatingScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_custom_day_group_hours_per_court(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'operating_days' => [1, 2, 3, 4, 5, 6, 7],
        ]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
        ]);

        $schedules = [
            ['days' => [1, 2, 3, 4, 5], 'start' => '08:00', 'end' => '24:00'],
            ['days' => [6, 7], 'start' => '12:00', 'end' => '24:00'],
        ];

        $this->actingAs($owner)
            ->put(route('facility.courts.update', $court), [
                'name' => $court->name,
                'type' => $court->type,
                'operating_schedules' => $schedules,
                'pricing_mode' => 'FLAT',
                'hourly_rate' => 300,
                'status' => 'AVAILABLE',
            ])
            ->assertRedirect();

        $court->refresh();

        $this->assertSame($schedules, $court->normalizedOperatingSchedules());
        $this->assertSame('08:00', $court->scheduleForDate('2026-11-20')['start']); // Friday
        $this->assertSame('12:00', $court->scheduleForDate('2026-11-21')['start']); // Saturday
        $this->assertStringContainsString('Mon–Fri', $court->time_range);
        $this->assertStringContainsString('Sat–Sun', $court->time_range);
    }

    public function test_schedule_days_outside_facility_open_days_are_stripped(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->weekdaysOnly()->create([
            'user_id' => $owner->id,
        ]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
        ]);

        $this->actingAs($owner)
            ->put(route('facility.courts.update', $court), [
                'name' => $court->name,
                'type' => $court->type,
                'operating_schedules' => [
                    ['days' => [1, 2, 3, 4, 5, 6, 7], 'start' => '08:00', 'end' => '22:00'],
                ],
                'pricing_mode' => 'FLAT',
                'hourly_rate' => 300,
                'status' => 'AVAILABLE',
            ])
            ->assertRedirect();

        $court->refresh();

        $this->assertSame([1, 2, 3, 4, 5], $court->normalizedOperatingSchedules()[0]['days']);
        $this->assertNull($court->scheduleForDate('2026-11-21')); // Saturday
    }

    public function test_booking_uses_weekday_specific_court_hours(): void
    {
        $facility = Facility::factory()->create([
            'operating_days' => [1, 2, 3, 4, 5, 6, 7],
        ]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'operating_schedules' => [
                ['days' => [1, 2, 3, 4, 5], 'start' => '08:00', 'end' => '24:00'],
                ['days' => [6, 7], 'start' => '12:00', 'end' => '24:00'],
            ],
            'time_range' => 'Mon–Fri 8:00 AM - 12:00 AM · Sat–Sun 12:00 PM - 12:00 AM',
        ]);
        $player = User::factory()->player()->create();

        // Saturday morning should fail (opens at noon).
        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-21',
                'start_time' => '09:00',
                'end_time' => '10:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertSessionHasErrors(['start_time' => 'Outside operating hours.']);

        // Saturday afternoon should succeed.
        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-21',
                'start_time' => '12:00',
                'end_time' => '13:00',
                'total_price' => 300,
                'payment_method' => 'gcash',
            ])
            ->assertRedirect();
    }

    public function test_overlapping_day_groups_are_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'operating_days' => [1, 2, 3, 4, 5, 6, 7],
        ]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
        ]);

        $this->actingAs($owner)
            ->put(route('facility.courts.update', $court), [
                'name' => $court->name,
                'type' => $court->type,
                'operating_schedules' => [
                    ['days' => [1, 2, 3], 'start' => '08:00', 'end' => '22:00'],
                    ['days' => [3, 4, 5], 'start' => '10:00', 'end' => '24:00'],
                ],
                'pricing_mode' => 'FLAT',
                'hourly_rate' => 300,
                'status' => 'AVAILABLE',
            ])
            ->assertSessionHasErrors(['operating_schedules']);
    }
}
