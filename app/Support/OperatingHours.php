<?php

namespace App\Support;

/**
 * Parses a court's free-text operating schedule into a bookable hourly window.
 *
 * Courts keep their hours as free text (e.g. "6:00 AM - 10:00 PM", "24 Hours").
 * A booking may always run until at least midnight so the common
 * 10:00 PM – 12:00 AM session is bookable everywhere, and a schedule that
 * closes after midnight (e.g. "6:00 AM - 2:00 AM") extends the window up to
 * 2:00 AM the next morning (the night-rate cutoff).
 *
 * Minutes are measured from midnight of the booking's calendar date, so the
 * close of an overnight schedule is 1440 (midnight) or up to 1560 (2:00 AM).
 */
class OperatingHours
{
    /** Bookings are always accepted until 12:00 AM (midnight). */
    public const MINIMUM_CLOSE_MINUTES = 1440;

    /** Latest supported close: 2:00 AM the next morning. */
    public const LATEST_CLOSE_MINUTES = 1560;

    /** Fallback opening hour when the schedule is missing or unreadable. */
    public const DEFAULT_OPEN_MINUTES = 360;

    private function __construct(
        private readonly int $openMinutes,
        private readonly int $closeMinutes,
        private readonly ?string $label = null,
    ) {}

    /**
     * Parse a free-text schedule. Unreadable values fall back to 6:00 AM – midnight.
     */
    public static function parse(?string $range): self
    {
        $normalized = trim((string) $range);

        if ($normalized !== '') {
            if (preg_match('/(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i', $normalized)) {
                return new self(0, self::LATEST_CLOSE_MINUTES, $normalized);
            }

            $parts = preg_split('/\s*[-–—]\s*/', $normalized);

            if (is_array($parts) && count($parts) === 2) {
                $open = self::clockToMinutes($parts[0]);
                $close = self::clockToMinutes($parts[1]);

                if ($open !== null && $close !== null) {
                    // "10:00 AM - 12:00 AM" closes at midnight; "6:00 AM - 2:00 AM"
                    // closes on the next calendar day.
                    $close = $close <= $open ? $close + self::MINIMUM_CLOSE_MINUTES : $close;
                    $close = max($close, self::MINIMUM_CLOSE_MINUTES);
                    $close = min($close, self::LATEST_CLOSE_MINUTES);
                    $open = max(0, min($open, self::MINIMUM_CLOSE_MINUTES - 60));

                    return new self($open, max($close, $open + 60), $normalized);
                }
            }
        }

        return new self(self::DEFAULT_OPEN_MINUTES, self::MINIMUM_CLOSE_MINUTES, $normalized ?: null);
    }

    /**
     * Read either "7:00 AM" or "19:00" into minutes from midnight.
     */
    public static function clockToMinutes(string $value): ?int
    {
        $value = trim($value);

        if (preg_match('/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i', $value, $matches)) {
            $hour = ((int) $matches[1]) % 12;

            if (strtolower($matches[3]) === 'pm') {
                $hour += 12;
            }

            return $hour * 60 + (int) ($matches[2] ?? 0);
        }

        if (preg_match('/^(\d{1,2}):(\d{2})$/', $value, $matches)) {
            $hour = (int) $matches[1];
            $minutes = (int) $matches[2];

            if ($hour > 24 || $minutes > 59) {
                return null;
            }

            return $hour * 60 + $minutes;
        }

        return null;
    }

    public function openMinutes(): int
    {
        return $this->openMinutes;
    }

    public function closeMinutes(): int
    {
        return $this->closeMinutes;
    }

    /**
     * The part of the window that falls in the early hours of the booking date
     * (e.g. 12:00 AM – 2:00 AM for a court open "6:00 AM - 2:00 AM").
     */
    public function earlyCloseMinutes(): int
    {
        return max(0, $this->closeMinutes - self::MINIMUM_CLOSE_MINUTES);
    }

    public function isOvernight(): bool
    {
        return $this->closeMinutes > self::MINIMUM_CLOSE_MINUTES;
    }

    public function label(): string
    {
        return $this->label ?? $this->describe();
    }

    /**
     * Human readable window, e.g. "6:00 AM – 12:00 AM" or "6:00 AM – 2:00 AM (next day)".
     */
    public function describe(): string
    {
        if ($this->openMinutes === 0 && $this->closeMinutes === self::LATEST_CLOSE_MINUTES) {
            return '24 hours (until 2:00 AM)';
        }

        $open = self::minutesToLabel($this->openMinutes);
        $close = self::minutesToLabel($this->closeMinutes % self::MINIMUM_CLOSE_MINUTES);
        $suffix = $this->closeMinutes > self::MINIMUM_CLOSE_MINUTES ? ' (next day)' : '';

        return "{$open} – {$close}{$suffix}";
    }

    /**
     * Whether a single-date hourly range fits inside the bookable window.
     *
     * Times are minutes from midnight of the booking's start date. An end that
     * is not after the start spills into the next calendar day.
     */
    public function contains(int $startMinutes, int $endMinutes): bool
    {
        $end = $endMinutes <= $startMinutes ? $endMinutes + self::MINIMUM_CLOSE_MINUTES : $endMinutes;
        $duration = $end - $startMinutes;

        if ($duration < 60 || $duration > self::MINIMUM_CLOSE_MINUTES) {
            return false;
        }

        // Early-morning sessions belong to the tail of an overnight schedule.
        if ($startMinutes < $this->openMinutes) {
            return $startMinutes >= 0 && $end <= $this->earlyCloseMinutes();
        }

        return $end <= $this->closeMinutes;
    }

    public static function minutesToLabel(int $minutes): string
    {
        $hour24 = intdiv($minutes % self::MINIMUM_CLOSE_MINUTES, 60);
        $minute = $minutes % 60;
        $suffix = $hour24 >= 12 ? 'PM' : 'AM';
        $hour12 = $hour24 % 12 === 0 ? 12 : $hour24 % 12;

        return sprintf('%d:%02d %s', $hour12, $minute, $suffix);
    }
}
