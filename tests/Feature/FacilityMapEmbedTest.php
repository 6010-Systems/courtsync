<?php

namespace Tests\Feature;

use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityMapEmbedTest extends TestCase
{
    use RefreshDatabase;

    private const EMBED_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7831.866720995307';

    public function test_owner_can_store_a_google_maps_embed_url_when_creating_a_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        $this->actingAs($owner)
            ->post(route('facility.store'), $this->payload(['map_embed_url' => self::EMBED_URL]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(self::EMBED_URL, $owner->facilities()->firstOrFail()->map_embed_url);
    }

    public function test_owner_can_replace_the_embed_url_of_an_existing_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $facility = Facility::factory()->withMapEmbed()->create(['user_id' => $owner->id]);

        $this->actingAs($owner)
            ->post(route('facility.store'), $this->payload([
                'facility_id' => $facility->id,
                'map_embed_url' => 'https://maps.google.com/maps/embed?pb=replacement',
            ]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame('https://maps.google.com/maps/embed?pb=replacement', $facility->fresh()->map_embed_url);
    }

    public function test_pasting_the_full_iframe_markup_stores_only_the_url(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        $this->actingAs($owner)
            ->post(route('facility.store'), $this->payload([
                'map_embed_url' => '<iframe src="'.self::EMBED_URL.'" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>',
            ]))
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(self::EMBED_URL, $owner->facilities()->firstOrFail()->map_embed_url);
    }

    public function test_non_google_embed_urls_are_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        foreach (['javascript:alert(1)', 'https://evil.example/maps/embed?x=1', 'https://www.google.com/maps/place/x'] as $value) {
            $this->actingAs($owner)
                ->post(route('facility.store'), $this->payload(['map_embed_url' => $value]))
                ->assertSessionHasErrors(['map_embed_url']);
        }

        $this->assertSame(0, Facility::query()->count());
    }

    public function test_embed_urls_longer_than_2048_characters_are_rejected(): void
    {
        $owner = User::factory()->facilityOwner()->create();

        $this->actingAs($owner)
            ->post(route('facility.store'), $this->payload([
                'map_embed_url' => 'https://www.google.com/maps/embed?pb='.str_repeat('a', 2100),
            ]))
            ->assertSessionHasErrors(['map_embed_url']);
    }

    public function test_owner_cannot_set_the_embed_url_of_another_owners_facility(): void
    {
        $owner = User::factory()->facilityOwner()->create();
        $stranger = Facility::factory()->create();

        $this->actingAs($owner)
            ->post(route('facility.store'), $this->payload([
                'facility_id' => $stranger->id,
                'map_embed_url' => self::EMBED_URL,
            ]))
            ->assertNotFound();

        $this->assertNull($stranger->fresh()->map_embed_url);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Cebu Pickleball Hub',
            'address' => '123 Mango Avenue',
            'city' => 'Cebu City',
            'province' => 'Cebu',
            'country' => 'Philippines',
            'contact_number' => '09171234567',
            'description' => 'Indoor pickleball courts.',
            'operating_days' => [1, 2, 3, 4, 5, 6, 7],
            'operational_status' => Facility::OPERATIONAL_OPEN,
        ], $overrides);
    }
}
