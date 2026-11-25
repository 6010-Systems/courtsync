<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityQrThemeTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_save_a_qr_design(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->patch(route('facility.qr-theme.update', $facility), [
                'dot_style' => 'dots',
                'corner_style' => 'dot',
                'foreground' => '#112233',
                'background' => '#FFFFFF',
                'caption' => 'Scan to book',
                'logo' => true,
                'error_correction' => 'H',
            ])
            ->assertRedirect();

        $theme = $facility->fresh()->qr_theme;

        $this->assertSame('dots', $theme['dot_style']);
        $this->assertSame('#112233', $theme['foreground']);
        $this->assertSame('Scan to book', $theme['caption']);
        $this->assertSame('H', $theme['error_correction']);
    }

    public function test_a_centre_logo_raises_low_error_correction_to_quartile(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->patch(route('facility.qr-theme.update', $facility), [
                'logo' => true,
                'error_correction' => 'L',
            ])
            ->assertRedirect();

        $this->assertSame('Q', $facility->fresh()->qr_theme['error_correction']);
    }

    public function test_invalid_colours_are_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->patch(route('facility.qr-theme.update', $facility), [
                'foreground' => 'red',
            ])
            ->assertSessionHasErrors(['foreground']);
    }

    public function test_another_owner_cannot_restyle_the_qr(): void
    {
        $facility = Facility::factory()->create();
        $intruder = User::factory()->facilityOwner()->create();

        $this->actingAs($intruder)
            ->patch(route('facility.qr-theme.update', $facility), [
                'dot_style' => 'square',
            ])
            ->assertForbidden();

        $this->assertNull($facility->fresh()->qr_theme);
    }

    public function test_staff_cannot_restyle_another_facility_qr(): void
    {
        $facility = Facility::factory()->create(['slug' => 'qr-arena']);
        $staff = User::factory()->facilityStaff()->create();

        $this->actingAs($staff)
            ->patch(route('facility.qr-theme.update', $facility), [
                'dot_style' => 'square',
            ])
            ->assertForbidden();
    }
}
