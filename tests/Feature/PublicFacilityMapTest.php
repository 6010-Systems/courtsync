<?php

namespace Tests\Feature;

use App\Models\Facility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicFacilityMapTest extends TestCase
{
    use RefreshDatabase;

    public function test_discover_lists_every_approved_facility(): void
    {
        $this->withoutVite();

        Facility::factory()->create(['verification_status' => 'APPROVED']);
        Facility::factory()->withMapEmbed()->create(['verification_status' => 'APPROVED']);
        Facility::factory()->draft()->create();

        $this->get(route('facility.discover'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Discover')
                ->has('facilities', 2)
                ->where('filters.city', '')
            );
    }

    public function test_discover_can_be_filtered_by_city(): void
    {
        $this->withoutVite();

        $cebu = Facility::factory()->create([
            'verification_status' => 'APPROVED',
            'city' => 'Cebu City',
        ]);
        Facility::factory()->create([
            'verification_status' => 'APPROVED',
            'city' => 'Manila',
        ]);

        $this->get(route('facility.discover', ['city' => 'Cebu']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Facility/Discover')
                ->has('facilities', 1)
                ->where('facilities.0.id', $cebu->id)
                ->where('filters.city', 'Cebu')
            );
    }

    public function test_discover_is_not_captured_as_a_facility_slug(): void
    {
        $this->withoutVite();

        $this->get('/discover')->assertOk();
    }
}
