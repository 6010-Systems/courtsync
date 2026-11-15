<?php

namespace Tests\Unit;

use App\Models\Court;
use App\Models\Facility;
use PHPUnit\Framework\TestCase;

class FacilityTest extends TestCase
{
    public function test_logo_url_and_cover_photo_url_are_fillable(): void
    {
        $facility = new Facility([
            'name' => 'Metro Sports Club',
            'logo_url' => 'https://example.com/logo.png',
            'cover_photo_url' => 'https://example.com/cover.png',
        ]);

        $this->assertSame('https://example.com/logo.png', $facility->logo_url);
        $this->assertSame('https://example.com/cover.png', $facility->cover_photo_url);
        $this->assertSame('https://example.com/cover.png', $facility->cover_image_url);
    }

    public function test_court_image_url_is_fillable(): void
    {
        $court = new Court([
            'name' => 'Court 1',
            'type' => 'Tennis',
            'image_url' => 'https://example.com/court1.jpg',
        ]);

        $this->assertSame('https://example.com/court1.jpg', $court->image_url);
    }

    public function test_court_default_image_for_sport_returns_valid_url(): void
    {
        $tennisImage = Court::defaultImageFor('Tennis Clay Court');
        $this->assertNotEmpty($tennisImage);
        $this->assertStringStartsWith('https://images.unsplash.com/', $tennisImage);

        $badmintonImage = Court::defaultImageFor('Badminton Indoor');
        $this->assertNotEmpty($badmintonImage);
        $this->assertStringStartsWith('https://images.unsplash.com/', $badmintonImage);
    }
}
