<?php

namespace Tests\Feature;

use App\Models\Court;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingAccessGateTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: Facility, 1: Court}
     */
    private function makeFacilityWithCourt(array $facilityOverrides = []): array
    {
        $facility = Facility::factory()->create(array_merge([
            'verification_status' => 'APPROVED',
            'operating_days' => Facility::ALL_OPERATING_DAYS,
            'operational_status' => Facility::OPERATIONAL_OPEN,
            'slug' => 'gate-test-venue',
        ], $facilityOverrides));

        $court = Court::factory()->flatPricing(300)->create([
            'facility_id' => $facility->id,
            'status' => 'AVAILABLE',
        ]);

        return [$facility, $court];
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Facility $facility, Court $court): array
    {
        return [
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'date' => '2026-11-20',
            'start_time' => '10:00',
            'end_time' => '11:00',
            'total_price' => 300,
            'payment_method' => 'gcash',
        ];
    }

    public function test_unverified_players_cannot_create_bookings(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt();
        $player = User::factory()->unverified()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertRedirect(route('verification.notice'));
    }

    public function test_unverified_players_cannot_open_the_book_page(): void
    {
        [$facility] = $this->makeFacilityWithCourt();
        $player = User::factory()->unverified()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.book', $facility))
            ->assertRedirect(route('verification.notice'));
    }

    public function test_bookings_are_rejected_when_facility_is_not_approved(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt([
            'verification_status' => 'DRAFT',
            'slug' => 'draft-venue',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertSessionHasErrors([
                'facility_id' => 'This facility is not approved for bookings yet.',
            ]);
    }

    public function test_book_page_is_hidden_for_unapproved_facilities(): void
    {
        [$facility] = $this->makeFacilityWithCourt([
            'verification_status' => 'UNDER_REVIEW',
            'slug' => 'review-venue',
        ]);
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->get(route('facility.book', $facility))
            ->assertNotFound();
    }

    public function test_verified_players_can_book_an_approved_facility(): void
    {
        [$facility, $court] = $this->makeFacilityWithCourt();
        $player = User::factory()->player()->create();

        $this->actingAs($player)
            ->post(route('bookings.store'), $this->payload($facility, $court))
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'facility_id' => $facility->id,
            'court_id' => $court->id,
            'user_id' => $player->id,
        ]);
    }
}
