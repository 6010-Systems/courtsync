<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityOperatingScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_operating_days_and_operational_status(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'verification_status' => 'APPROVED',
            'operating_days' => Facility::ALL_OPERATING_DAYS,
            'operational_status' => Facility::OPERATIONAL_OPEN,
        ]);

        $this->actingAs($owner)
            ->post(route('facility.store'), [
                'facility_id' => $facility->id,
                'name' => $facility->name,
                'slug' => $facility->slug,
                'address' => $facility->address,
                'city' => $facility->city,
                'province' => $facility->province,
                'country' => $facility->country,
                'contact_number' => $facility->contact_number,
                'description' => $facility->description,
                'operating_days' => [1, 2, 3, 4, 5],
                'operational_status' => Facility::OPERATIONAL_MAINTENANCE,
            ])
            ->assertRedirect();

        $facility->refresh();

        $this->assertSame([1, 2, 3, 4, 5], $facility->normalizedOperatingDays());
        $this->assertSame(Facility::OPERATIONAL_MAINTENANCE, $facility->operational_status);
        $this->assertSame('Mon–Fri', $facility->operating_days_label);
        $this->assertFalse($facility->isAcceptingBookings());
        $this->assertFalse($facility->isOpenOnDate('2026-11-21'));
        $this->assertTrue($facility->isOpenOnDate('2026-11-20'));
    }

    public function test_operating_days_require_at_least_one_weekday(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
        ]);

        $this->actingAs($owner)
            ->post(route('facility.store'), [
                'facility_id' => $facility->id,
                'name' => $facility->name,
                'address' => $facility->address,
                'city' => $facility->city,
                'province' => $facility->province,
                'country' => $facility->country,
                'contact_number' => $facility->contact_number,
                'description' => $facility->description,
                'operating_days' => [],
                'operational_status' => Facility::OPERATIONAL_OPEN,
            ])
            ->assertSessionHasErrors(['operating_days']);
    }
}
