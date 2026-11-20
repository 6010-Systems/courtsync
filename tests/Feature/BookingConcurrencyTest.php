<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use App\Support\BookingSlotGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BookingConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Facility, 1: Court, 2: User, 3: User}
     */
    private function makeSetup(): array
    {
        $facility = Facility::factory()->create([
            'operating_days' => Facility::ALL_OPERATING_DAYS,
            'operational_status' => Facility::OPERATIONAL_OPEN,
        ]);
        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'status' => 'AVAILABLE',
        ]);
        $playerA = User::factory()->player()->create();
        $playerB = User::factory()->player()->create();

        return [$facility, $court, $playerA, $playerB];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Facility $facility, Court $court, array $overrides = []): array
    {
        return array_merge([
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'total_price' => 300,
            'payment_method' => 'gcash',
        ], $overrides);
    }

    public function test_overlapping_booking_from_a_second_player_is_rejected(): void
    {
        [$facility, $court, $playerA, $playerB] = $this->makeSetup();

        $this->actingAs($playerA)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertRedirect();

        $this->actingAs($playerB)
            ->post(route('bookings.store'), $this->payload($facility, $court, [
                'start_time' => '10:30',
                'end_time' => '11:30',
            ]))
            ->assertSessionHasErrors(['conflict' => 'Sorry, this court is already booked for that time.']);

        $this->assertSame(1, Booking::query()->where('court_id', $court->id)->count());
    }

    public function test_non_overlapping_bookings_on_the_same_court_both_succeed(): void
    {
        [$facility, $court, $playerA, $playerB] = $this->makeSetup();

        $this->actingAs($playerA)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertRedirect();

        $this->actingAs($playerB)
            ->post(route('bookings.store'), $this->payload($facility, $court, [
                'start_time' => '11:00',
                'end_time' => '12:00',
            ]))
            ->assertRedirect();

        $this->assertSame(2, Booking::query()->where('court_id', $court->id)->count());
    }

    public function test_slot_guard_rejects_overlap_under_court_lock_without_creating(): void
    {
        [$facility, $court, $playerA] = $this->makeSetup();

        Booking::query()->create([
            'facility_id' => $facility->id,
            'user_id' => $playerA->id,
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

        $createCalled = false;

        try {
            (new BookingSlotGuard)->claim(
                $court,
                '2026-11-20',
                '10:00',
                '11:00',
                function () use (&$createCalled) {
                    $createCalled = true;

                    return new Booking;
                },
            );
            $this->fail('Expected ValidationException for overlapping slot.');
        } catch (ValidationException $exception) {
            $this->assertSame(
                ['Sorry, this court is already booked for that time.'],
                $exception->errors()['conflict'] ?? null,
            );
        }

        $this->assertFalse($createCalled);
        $this->assertSame(1, Booking::query()->where('court_id', $court->id)->count());
    }

    public function test_cancelled_bookings_do_not_block_the_same_slot(): void
    {
        [$facility, $court, $playerA, $playerB] = $this->makeSetup();

        Booking::query()->create([
            'facility_id' => $facility->id,
            'user_id' => $playerA->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'subtotal' => 300,
            'addons_total' => 0,
            'booking_fee' => 0,
            'total_price' => 300,
            'status' => 'cancelled',
        ]);

        $this->actingAs($playerB)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertRedirect();

        $this->assertSame(1, Booking::query()->where('court_id', $court->id)->where('status', '!=', 'cancelled')->count());
    }
}
