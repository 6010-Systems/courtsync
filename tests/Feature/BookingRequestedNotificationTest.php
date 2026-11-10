<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use App\Notifications\BookingRequested;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingRequestedNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_and_staff_receive_a_notification_when_a_booking_is_created(): void
    {
        $facility = Facility::factory()->create();
        $facility->name = 'Riverside Sports Complex';
        $facility->save();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $court->name = 'Court 1';
        $court->save();
        $owner = $facility->owner;
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-07',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 500,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'status' => 'pending',
        ]);

        $this->assertSame(1, $owner->fresh()->notifications()->where('type', BookingRequested::class)->count());
        $this->assertSame(1, $staff->fresh()->notifications()->where('type', BookingRequested::class)->count());

        $notification = $owner->fresh()->notifications()->where('type', BookingRequested::class)->sole();
        $this->assertSame('New booking request', $notification->data['title']);
        $this->assertSame(
            "Booking #{$notification->data['booking_id']} on Saturday, November 7, 2026 from 10:00 AM to 11:00 AM at Riverside Sports Complex on Court 1 awaits confirmation.",
            $notification->data['message'],
        );
        $this->assertSame(route('facility.bookings'), $notification->data['url']);
        $this->assertNull($notification->read_at);
    }

    public function test_staff_receives_a_notification_for_a_guest_booking(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $owner = $facility->owner;
        $staff = User::factory()->facilityStaff()->create(['facility_id' => $facility->id]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-07',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 500,
                'guest_name' => 'Walk-in player',
            ])
            ->assertRedirect();

        $this->assertSame(1, $owner->fresh()->notifications()->where('type', BookingRequested::class)->count());
        $this->assertSame(1, $staff->fresh()->notifications()->where('type', BookingRequested::class)->count());
    }

    public function test_an_unrelated_owner_does_not_receive_a_notification(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $unrelatedOwner = User::factory()->facilityOwner()->create();
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-07',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 500,
            ])
            ->assertRedirect();

        $this->assertSame(0, $unrelatedOwner->fresh()->notifications()->where('type', BookingRequested::class)->count());
    }

    private function makeBooking(array $overrides = []): Booking
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);

        return Booking::query()->create(array_merge([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-07',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'pending',
        ], $overrides));
    }
}
