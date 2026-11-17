<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PaymentControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_sees_all_payments_across_all_facilities(): void
    {
        $admin = User::factory()->admin()->create();

        $facilityA = Facility::factory()->create();
        $courtA = Court::factory()->create(['facility_id' => $facilityA->id]);
        $bookingA = Booking::query()->create([
            'facility_id' => $facilityA->id,
            'court_id' => $courtA->id,
            'date' => '2026-09-27',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $bookingA->id,
            'amount' => '150.00',
            'payment_method' => 'gcash',
            'status' => 'verified',
        ]);

        $facilityB = Facility::factory()->create();
        $courtB = Court::factory()->create(['facility_id' => $facilityB->id]);
        $bookingB = Booking::query()->create([
            'facility_id' => $facilityB->id,
            'court_id' => $courtB->id,
            'date' => '2026-09-28',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 200,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $bookingB->id,
            'amount' => '250.00',
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)->get(route('facility.payments'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Facility/Payments')
            ->where('payments', fn ($payments) => count($payments) === 2));
    }

    public function test_facility_owner_sees_only_their_facility_payments(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->create(['user_id' => $owner->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-09-27',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $booking->id,
            'amount' => '150.00',
            'payment_method' => 'gcash',
            'status' => 'verified',
        ]);

        $otherFacility = Facility::factory()->create();
        $otherCourt = Court::factory()->create(['facility_id' => $otherFacility->id]);
        $otherBooking = Booking::query()->create([
            'facility_id' => $otherFacility->id,
            'court_id' => $otherCourt->id,
            'date' => '2026-09-27',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 200,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $otherBooking->id,
            'amount' => '999.00',
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($owner)->get(route('facility.payments'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Facility/Payments')
            ->where('payments', fn ($payments) => count($payments) === 1));
    }

    public function test_facility_staff_sees_only_their_facility_payments(): void
    {
        $facility = Facility::factory()->create();
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        // staff's facility payment
        $staffBooking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-09-27',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 100,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $staffBooking->id,
            'amount' => '150.00',
            'payment_method' => 'gcash',
            'status' => 'verified',
        ]);

        $otherFacility = Facility::factory()->create();
        $otherCourt = Court::factory()->create(['facility_id' => $otherFacility->id]);
        $otherBooking = Booking::query()->create([
            'facility_id' => $otherFacility->id,
            'court_id' => $otherCourt->id,
            'date' => '2026-09-27',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 200,
            'status' => 'confirmed',
        ]);
        Payment::query()->create([
            'booking_id' => $otherBooking->id,
            'amount' => '999.00',
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($staff)->get(route('facility.payments'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Facility/Payments')
            ->where('payments', fn ($payments) => count($payments) === 1));
    }

    public function test_payment_records_expose_the_booking_fee_breakdown(): void
    {
        $admin = User::factory()->admin()->create();
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        $booking = Booking::query()->create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-09-27',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'subtotal' => 300,
            'booking_fee' => 25,
            'total_price' => 325,
            'status' => 'confirmed',
        ]);

        Payment::query()->create([
            'booking_id' => $booking->id,
            'amount' => '325.00',
            'payment_method' => 'gcash',
            'status' => 'verified',
        ]);

        $this->actingAs($admin)
            ->get(route('facility.payments'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Payments')
                ->where('payments.0.booking.subtotal', fn ($value) => (float) $value === 300.0)
                ->where('payments.0.booking.booking_fee', fn ($value) => (float) $value === 25.0)
                ->where('payments.0.amount', fn ($value) => (float) $value === 325.0));
    }
}
