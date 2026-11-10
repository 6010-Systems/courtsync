<?php

namespace App\Models;

use Database\Factories\CourtFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['facility_id', 'name', 'type', 'image_url', 'time_range', 'description', 'hourly_rate', 'status'])]
class Court extends Model
{
    /** @use HasFactory<CourtFactory> */
    use HasFactory;

    /**
     * Curated sport court mock images matching the exact presets.
     *
     * @var array<string, array<int, string>>
     */
    public const SPORT_IMAGES = [
        'pickleball' => [
            'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1628891890467-b79f2c8ba9dc?auto=format&fit=crop&w=800&q=80',
        ],
        'badminton' => [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
        ],
        'tennis' => [
            'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
        ],
        'basketball' => [
            'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
        ],
        'volleyball' => [
            'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=800&q=80',
        ],
        'futsal' => [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        ],
        'padel' => [
            'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        ],
        'table tennis' => [
            'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
        ],
    ];

    /**
     * Default fallback court images.
     *
     * @var array<int, string>
     */
    public const DEFAULT_IMAGES = [
        'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
    ];

    /**
     * Resolve a default image link based on sport type.
     */
    public static function defaultImageFor(?string $type, int $index = 0): string
    {
        $key = strtolower(trim($type ?? ''));
        foreach (self::SPORT_IMAGES as $sport => $images) {
            if (str_contains($key, $sport)) {
                return $images[$index % count($images)];
            }
        }

        return self::DEFAULT_IMAGES[$index % count(self::DEFAULT_IMAGES)];
    }

    protected static function booted(): void
    {
        static::creating(function (Court $court) {
            if (empty($court->image_url)) {
                $court->image_url = static::defaultImageFor($court->type);
            }
        });
    }

    /**
     * @var array<int, string>
     */
    public const STATUSES = ['AVAILABLE', 'OPEN_PLAY', 'BLOCKED', 'NOT_AVAILABLE'];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
        ];
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }
}
