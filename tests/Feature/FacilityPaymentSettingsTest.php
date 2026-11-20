<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FacilityPaymentSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_facility_owner_can_view_payment_settings_page(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($owner)->get(route('facility.payment-settings'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Facility/PaymentSettings')
            ->has('auth.user.facilities', 1)
            ->where('auth.user.facilities.0.id', $facility->id)
        );
    }

    public function test_non_owner_cannot_access_payment_settings(): void
    {
        $staff = User::factory()->facilityStaff()->create();
        $player = User::factory()->player()->create();

        $this->actingAs($staff)->get(route('facility.payment-settings'))->assertForbidden();
        $this->actingAs($player)->get(route('facility.payment-settings'))->assertForbidden();
    }

    public function test_facility_owner_can_update_payment_credentials_and_fee(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create([
            'user_id' => $owner->id,
            'gcash_name' => 'Old GCash',
            'gcash_number' => '09170000000',
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 0,
        ]);

        $response = $this->actingAs($owner)->post(route('facility.payment-settings.update', $facility), [
            'gcash_name' => 'John Doe GCash',
            'gcash_number' => '09171234567',
            'maya_name' => 'John Doe Maya',
            'maya_number' => '09181234567',
            'booking_fee_type' => 'PERCENT',
            'booking_fee_value' => 5.5,
        ]);

        $response->assertSessionHas('success', 'Payment settings updated successfully.');

        $facility->refresh();
        $this->assertSame('John Doe GCash', $facility->gcash_name);
        $this->assertSame('09171234567', $facility->gcash_number);
        $this->assertSame('John Doe Maya', $facility->maya_name);
        $this->assertSame('09181234567', $facility->maya_number);
        $this->assertSame('PERCENT', $facility->booking_fee_type);
        $this->assertSame(5.5, (float) $facility->booking_fee_value);
    }

    public function test_facility_owner_can_upload_and_clear_qr_codes(): void
    {
        Storage::fake('public');

        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);

        $gcashFile = UploadedFile::fake()->create('gcash_qr.png', 100, 'image/png');

        $response = $this->actingAs($owner)->post(route('facility.payment-settings.update', $facility), [
            'gcash_name' => 'John Doe',
            'gcash_number' => '09171234567',
            'gcash_qr' => $gcashFile,
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 15,
        ]);

        $response->assertSessionHas('success');

        $facility->refresh();
        $this->assertNotNull($facility->gcash_qr_url);
        $storedPath = str_replace('/storage/', '', $facility->gcash_qr_url);
        Storage::disk('public')->assertExists($storedPath);

        // Now clear QR code
        $clearResponse = $this->actingAs($owner)->post(route('facility.payment-settings.update', $facility), [
            'gcash_name' => 'John Doe',
            'gcash_number' => '09171234567',
            'clear_gcash_qr' => true,
            'booking_fee_type' => 'FIXED',
            'booking_fee_value' => 15,
        ]);

        $clearResponse->assertSessionHas('success');
        $facility->refresh();
        $this->assertNull($facility->gcash_qr_url);
    }

    public function test_owner_cannot_update_another_facilities_payment_settings(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $otherFacility = Facility::factory()->create();

        $this->actingAs($owner)->post(route('facility.payment-settings.update', $otherFacility), [
            'gcash_name' => 'Hacker Name',
            'gcash_number' => '09999999999',
        ])->assertForbidden();
    }
}
