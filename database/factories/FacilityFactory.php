<?php

namespace Database\Factories;

use App\Models\Facility;
use App\Models\FacilityVerification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Facility>
 */
class FacilityFactory extends Factory
{
    /**
     * Sequential pointer to ensure unique cover photos across seeded facilities.
     */
    protected static int $coverIndex = 0;

    /**
     * Curated mock facility cover photos (all distinct sports & facility venues).
     *
     * @var array<int, string>
     */
    public const MOCK_COVER_PHOTOS = [
        'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80', // Pickleball / Court
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80', // Clay Tennis Court
        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1600&q=80', // Basketball Arena
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80', // Soccer / Futsal Field
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80', // Badminton Hall
        'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1600&q=80', // Padel Glass Arena
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1600&q=80', // Volleyball Court
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80', // Olympic Pool / Aquatic Complex
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1600&q=80', // Tennis Hard Court Blue
        'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1600&q=80', // Basketball Hardwood Court
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80', // Modern Multi-Sport Gym
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80', // Athletic Stadium Track
        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1600&q=80', // Stadium Lights Pitch
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1600&q=80', // Badminton Court Green
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80', // Squash / Indoor Glass Court
        'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=1600&q=80', // Table Tennis Arena
    ];

    /**
     * Get a guaranteed unique sequential cover photo.
     */
    public static function nextCoverPhoto(): string
    {
        $photo = self::MOCK_COVER_PHOTOS[self::$coverIndex % count(self::MOCK_COVER_PHOTOS)];
        self::$coverIndex++;

        return $photo;
    }

    /**
     * Curated mock facility logo badges.
     *
     * @var array<int, string>
     */
    public const MOCK_LOGOS = [
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company().' Sports Complex';

        return [
            'user_id' => User::factory()->facilityOwner(),
            'slug' => Facility::generateUniqueSlug($name),
            'name' => $name,
            'logo_url' => fake()->boolean(40) ? fake()->randomElement(self::MOCK_LOGOS) : null,
            'cover_photo_url' => self::nextCoverPhoto(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->state(),
            'country' => 'Philippines',
            'contact_number' => fake()->numerify('09#########'),
            'description' => fake()->paragraph(),
            'verification_status' => 'APPROVED',
        ];
    }

    /**
     * Configure the factory to automatically attach verification photos.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Facility $facility) {
            $allPhotos = self::MOCK_COVER_PHOTOS;
            $cover = $facility->cover_photo_url ?? $allPhotos[0];
            $otherPhotos = array_values(array_filter($allPhotos, fn ($p) => $p !== $cover));
            shuffle($otherPhotos);

            // Attach 5 distinct photos total (cover + 4 other photos) to enable Facebook-style collage with +1
            $photos = array_merge([$cover], array_slice($otherPhotos, 0, 4));

            FacilityVerification::updateOrCreate(
                ['facility_id' => $facility->id],
                [
                    'facility_photos' => $photos,
                ]
            );
        });
    }

    /**
     * Explicitly give the facility a logo.
     */
    public function withLogo(): static
    {
        return $this->state(fn () => [
            'logo_url' => fake()->randomElement(self::MOCK_LOGOS),
        ]);
    }

    /**
     * Explicitly ensure the facility has no logo.
     */
    public function withoutLogo(): static
    {
        return $this->state(fn () => [
            'logo_url' => null,
        ]);
    }

    /**
     * The facility is still a draft, not yet submitted for verification.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'DRAFT',
        ]);
    }

    /**
     * The facility has been submitted and is awaiting admin review.
     */
    public function underReview(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'UNDER_REVIEW',
        ]);
    }
}
