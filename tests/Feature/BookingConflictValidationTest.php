<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingConflictValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_book_an_overlapping_time_slot_on_the_same_court(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player1 = User::factory()->player()->create();
        $player2 = User::factory()->player()->create();

        // Existing booking from 10:00 to 11:30
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player1->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:30:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);

        // Attempt overlapping booking from 11:00 to 12:00
        $response = $this->actingAs($player2)
            ->from(route('facility.calendar'))
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '11:00',
                'end_time' => '12:00',
                'total_price' => 400,
            ]);

        $response->assertSessionHasErrors(['conflict', 'start_time']);

        // Assert second booking was NOT saved to the database
        $this->assertSame(1, Booking::where('court_id', $court->id)->count());
    }

    public function test_can_book_adjacent_non_overlapping_time_slot(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player1 = User::factory()->player()->create();
        $player2 = User::factory()->player()->create();

        // Existing booking from 10:00 to 11:00
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player1->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);

        // Adjacent booking immediately following from 11:00 to 12:00
        $response = $this->actingAs($player2)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '11:00',
                'end_time' => '12:00',
                'total_price' => 400,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(2, Booking::where('court_id', $court->id)->count());
    }

    public function test_can_book_same_time_on_a_different_court(): void
    {
        $facility = Facility::factory()->create();
        $court1 = Court::factory()->create(['facility_id' => $facility->id]);
        $court2 = Court::factory()->create(['facility_id' => $facility->id]);
        $player1 = User::factory()->player()->create();
        $player2 = User::factory()->player()->create();

        // Booking on Court 1 from 10:00 to 11:00
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court1->id,
            'user_id' => $player1->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'confirmed',
        ]);

        // Booking on Court 2 at the exact same time
        $response = $this->actingAs($player2)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court2->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 500,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(1, Booking::where('court_id', $court1->id)->count());
        $this->assertSame(1, Booking::where('court_id', $court2->id)->count());
    }

    public function test_can_book_same_time_if_previous_booking_was_cancelled(): void
    {
        $facility = Facility::factory()->create();
        $court = Court::factory()->create(['facility_id' => $facility->id]);
        $player1 = User::factory()->player()->create();
        $player2 = User::factory()->player()->create();

        // Cancelled booking from 10:00 to 11:00
        Booking::create([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player1->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'total_price' => 500,
            'status' => 'cancelled',
        ]);

        // New booking covering the same time slot
        $response = $this->actingAs($player2)
            ->post(route('bookings.store'), [
                'facility_id' => $facility->id,
                'court_id' => $court->id,
                'date' => '2026-11-20',
                'start_time' => '10:00',
                'end_time' => '11:00',
                'total_price' => 500,
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(1, Booking::where('court_id', $court->id)->where('status', 'pending')->count());
    }
}
