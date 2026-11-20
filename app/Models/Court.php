<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\CourtFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

#[Fillable([
    'facility_id',
    'name',
    'type',
    'image_url',
    'time_range',
    'operating_schedules',
    'description',
    'hourly_rate',
    'pricing_mode',
    'uses_rate_card',
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
     * Courts follow the facility rate card unless they opt out.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'uses_rate_card' => true,
    ];

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

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = ['operating_schedules_label'];

    protected function casts(): array
    {
        return [
            'hourly_rate' => 'decimal:2',
            'day_rate' => 'decimal:2',
            'night_rate' => 'decimal:2',
            'uses_rate_card' => 'boolean',
            'operating_schedules' => 'array',
        ];
    }

    /**
     * Normalize schedule groups: days 1–7, start/end as H:i (end may be 24:00).
     *
     * @param  array<int, mixed>|null  $schedules
     * @return array<int, array{days: array<int, int>, start: string, end: string}>
     */
    public static function normalizeOperatingSchedules(?array $schedules): array
    {
        return collect($schedules ?? [])
            ->map(function ($group) {
                $days = collect($group['days'] ?? [])
                    ->map(fn ($day) => (int) $day)
                    ->filter(fn (int $day) => $day >= 1 && $day <= 7)
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $start = self::normalizeClock((string) ($group['start'] ?? ''), false);
                $end = self::normalizeClock((string) ($group['end'] ?? ''), true);

                if ($days === [] || $start === null || $end === null) {
                    return null;
                }

                if (self::clockToMinutes($end) <= self::clockToMinutes($start)) {
                    return null;
                }

                return [
                    'days' => $days,
                    'start' => $start,
                    'end' => $end,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Build a human-readable summary kept in time_range for legacy displays.
     *
     * @param  array<int, array{days: array<int, int>, start: string, end: string}>  $schedules
     */
    public static function summarizeOperatingSchedules(array $schedules): string
    {
        $normalized = self::normalizeOperatingSchedules($schedules);

        if ($normalized === []) {
            return '';
        }

        return collect($normalized)
            ->map(function (array $group) {
                $daysLabel = self::daysLabel($group['days']);
                $hoursLabel = self::formatClockLabel($group['start']).' - '.self::formatClockLabel($group['end']);

                return trim($daysLabel.' '.$hoursLabel);
            })
            ->implode(' · ');
    }

    /**
     * @return array{days: array<int, int>, start: string, end: string}|null
     */
    public function scheduleForDate(string|CarbonInterface $date): ?array
    {
        $carbon = $date instanceof CarbonInterface ? $date->copy() : Carbon::parse($date);
        $weekday = (int) $carbon->isoWeekday();

        foreach ($this->normalizedOperatingSchedules() as $group) {
            if (in_array($weekday, $group['days'], true)) {
                return $group;
            }
        }

        return null;
    }

    public function isOpenOnDate(string|CarbonInterface $date): bool
    {
        return $this->scheduleForDate($date) !== null;
    }

    /**
     * Whether [start, end) falls inside this court's hours for the date.
     */
    public function acceptsBookingWindow(string|CarbonInterface $date, string $startTime, string $endTime): bool
    {
        $group = $this->scheduleForDate($date);

        if ($group === null) {
            return false;
        }

        $startMinutes = self::clockToMinutes(self::normalizeClock($startTime, false) ?? '');
        $endMinutes = self::clockToMinutes(self::normalizeClock($endTime, true) ?? '');

        if ($startMinutes === null || $endMinutes === null || $endMinutes <= $startMinutes) {
            return false;
        }

        return $startMinutes >= self::clockToMinutes($group['start'])
            && $endMinutes <= self::clockToMinutes($group['end']);
    }

    /**
     * @return array<int, array{days: array<int, int>, start: string, end: string}>
     */
    public function normalizedOperatingSchedules(): array
    {
        return self::normalizeOperatingSchedules($this->operating_schedules);
    }

    public function getOperatingSchedulesLabelAttribute(): string
    {
        $label = self::summarizeOperatingSchedules($this->normalizedOperatingSchedules());

        return $label !== '' ? $label : (string) ($this->time_range ?: '');
    }

    /**
     * @param  array<int, int>  $days
     */
    public static function daysLabel(array $days): string
    {
        $days = collect($days)->map(fn ($day) => (int) $day)->unique()->sort()->values()->all();

        if ($days === Facility::ALL_OPERATING_DAYS) {
            return 'All week';
        }

        if ($days === [1, 2, 3, 4, 5]) {
            return 'Mon–Fri';
        }

        if ($days === [6, 7]) {
            return 'Sat–Sun';
        }

        return collect($days)
            ->map(fn (int $day) => Facility::WEEKDAY_LABELS[$day] ?? (string) $day)
            ->implode(', ');
    }

    public static function formatClockLabel(string $hi): string
    {
        if ($hi === '24:00') {
            return '12:00 AM';
        }

        try {
            return Carbon::createFromFormat('H:i', $hi)->format('g:i A');
        } catch (\Throwable) {
            return $hi;
        }
    }

    public static function normalizeClock(string $value, bool $allowMidnightEnd): ?string
    {
        $value = substr(trim($value), 0, 5);

        if ($value === '24:00') {
            return $allowMidnightEnd ? '24:00' : null;
        }

        if (! preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $value)) {
            return null;
        }

        return $value;
    }

    public static function clockToMinutes(?string $hi): ?int
    {
        if ($hi === null || $hi === '') {
            return null;
        }

        if ($hi === '24:00') {
            return 24 * 60;
        }

        if (! preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $hi, $match)) {
            return null;
        }

        return ((int) $match[1] * 60) + (int) $match[2];
    }

    /**
     * Restrict schedule days to the facility's open days and drop empty groups.
     *
     * @param  array<int, mixed>|null  $schedules
     * @param  array<int, int>  $facilityDays
     * @return array<int, array{days: array<int, int>, start: string, end: string}>
     */
    public static function constrainSchedulesToFacilityDays(?array $schedules, array $facilityDays): array
    {
        $allowed = collect($facilityDays)->map(fn ($day) => (int) $day)->all();

        return collect(self::normalizeOperatingSchedules($schedules))
            ->map(function (array $group) use ($allowed) {
                $group['days'] = array_values(array_intersect($group['days'], $allowed));

                return $group['days'] === [] ? null : $group;
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Ensure no weekday appears in more than one group.
     *
     * @param  array<int, array{days: array<int, int>, start: string, end: string}>  $schedules
     */
    public static function schedulesHaveUniqueDays(array $schedules): bool
    {
        /** @var Collection<int, int> $days */
        $days = collect($schedules)->flatMap(fn (array $group) => $group['days']);

        return $days->count() === $days->unique()->count();
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

    /**
     * Rate card packages assigned to this court (see the court_rate_plan pivot).
     * Ordered like the printed rate card (sort_order, then name).
     */
    public function ratePlans(): BelongsToMany
    {
        return $this->belongsToMany(RatePlan::class, 'court_rate_plan')
            ->withPivot('is_enabled', 'day_rate_override', 'night_rate_override')
            ->withTimestamps()
            ->orderBy('rate_plans.sort_order')
            ->orderBy('rate_plans.name');
    }

    /**
     * Only the packages this court currently offers to players.
     */
    public function enabledRatePlans(): BelongsToMany
    {
        return $this->ratePlans()->wherePivot('is_enabled', true);
    }
}
