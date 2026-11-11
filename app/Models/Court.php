<?php

namespace App\Models;

use Database\Factories\CourtFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

#[Fillable([
    'facility_id',
    'name',
    'type',
    'image_url',
    'time_range',
    'description',
    'hourly_rate',
    'pricing_mode',
    'day_rate',
    'night_rate',
    'day_start_time',
    'night_start_time',
    'status',
])]
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
            'day_rate' => 'decimal:2',
            'night_rate' => 'decimal:2',
        ];
    }

    /**
     * Calculate price and itemized breakdown for a time range.
     *
     * @return array{pricing_mode: string, total: float, duration_hours: int, breakdown: array<int, array<string, mixed>>}
     */
    public function calculatePriceForRange(string $startTime, string $endTime): array
    {
        $start = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);
        $durationHours = max(0, $start->diffInHours($end));

        if ($this->pricing_mode !== 'SPLIT' || empty($this->day_rate) || empty($this->night_rate) || $durationHours === 0) {
            $rate = (float) ($this->hourly_rate ?? 0);
            $total = round($durationHours * $rate, 2);

            return [
                'pricing_mode' => 'FLAT',
                'total' => $total,
                'duration_hours' => $durationHours,
                'breakdown' => [
                    [
                        'label' => 'Standard Rate',
                        'hours' => $durationHours,
                        'rate' => $rate,
                        'subtotal' => $total,
                    ],
                ],
            ];
        }

        $dayStartH = Carbon::parse($this->day_start_time ?: '06:00:00')->format('H:i');
        $nightStartH = Carbon::parse($this->night_start_time ?: '18:00:00')->format('H:i');

        $dayHours = 0;
        $nightHours = 0;
        $cursor = $start->copy();

        while ($cursor->lt($end)) {
            $slotTime = $cursor->format('H:i');
            if ($slotTime >= $nightStartH || $slotTime < $dayStartH) {
                $nightHours++;
            } else {
                $dayHours++;
            }
            $cursor->addHour();
        }

        $dayRate = (float) $this->day_rate;
        $nightRate = (float) $this->night_rate;
        $daySubtotal = round($dayHours * $dayRate, 2);
        $nightSubtotal = round($nightHours * $nightRate, 2);
        $total = round($daySubtotal + $nightSubtotal, 2);

        $breakdown = [];
        if ($dayHours > 0) {
            $breakdown[] = [
                'label' => 'Day Rate',
                'hours' => $dayHours,
                'rate' => $dayRate,
                'subtotal' => $daySubtotal,
            ];
        }
        if ($nightHours > 0) {
            $breakdown[] = [
                'label' => 'Night Rate',
                'hours' => $nightHours,
                'rate' => $nightRate,
                'subtotal' => $nightSubtotal,
            ];
        }

        return [
            'pricing_mode' => 'SPLIT',
            'total' => $total,
            'duration_hours' => $dayHours + $nightHours,
            'day_hours' => $dayHours,
            'night_hours' => $nightHours,
            'day_rate' => $dayRate,
            'night_rate' => $nightRate,
            'breakdown' => $breakdown,
        ];
    }

    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }
}
