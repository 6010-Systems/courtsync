<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityStaffTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_owner_can_view_staff_page(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'verification_status' => 'APPROVED',
        ]);

        $staff = User::factory()->facilityStaff()->create([
            'facility_id' => $facility->id,
            'name' => 'Staff Member',
            'email' => 'staff@example.com',
        ]);

        $this->actingAs($owner)
            ->get(route('facility.staff'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Staff/Index')
                ->has('auth.user.facilities', 1)
                ->where('auth.user.facilities.0.staff.0.name', 'Staff Member')
            );
    }

    public function test_owner_can_invite_staff_member(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'verification_status' => 'APPROVED',
        ]);

        $response = $this->actingAs($owner)
            ->post(route('facility.staff.store'), [
                'facility_id' => $facility->id,
                'name' => 'New Staff',
                'email' => 'newstaff@example.com',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'name' => 'New Staff',
            'email' => 'newstaff@example.com',
            'role' => 'FACILITY_STAFF',
            'facility_id' => $facility->id,
        ]);
    }

    public function test_owner_can_reassign_staff_to_another_owned_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility1 = Facility::factory()->create(['user_id' => $owner->id, 'verification_status' => 'APPROVED']);
        $facility2 = Facility::factory()->create(['user_id' => $owner->id, 'verification_status' => 'APPROVED']);

        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility1->id]);

        $response = $this->actingAs($owner)
            ->put(route('facility.staff.facility.update', $staff->id), [
                'facility_id' => $facility2->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'facility_id' => $facility2->id,
        ]);
    }

    public function test_owner_can_update_staff_permissions(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'verification_status' => 'APPROVED']);
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);

        $this->actingAs($owner)
            ->get(route('facility.staff.permissions.edit', $staff->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('FacilityOwner/Staff/Permissions')
                ->where('staff.id', $staff->id)
            );

        $response = $this->actingAs($owner)
            ->put(route('facility.staff.permissions.update', $staff->id), [
                'permissions' => ['view_players', 'view_courts'],
            ]);

        $response->assertRedirect();
        $this->assertEquals(['view_players', 'view_courts'], $staff->fresh()->permissions);
    }

    public function test_owner_can_delete_staff_member(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id, 'verification_status' => 'APPROVED']);
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);

        $response = $this->actingAs($owner)
            ->delete(route('facility.staff.destroy', $staff->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }
}
