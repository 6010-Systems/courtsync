<?php

namespace App\Support;

use App\Models\Court;
use App\Models\Facility;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

class FacilityAvailability
{
    public const REASON_FACILITY_NOT_APPROVED = 'facility_not_approved';

    public const REASON_FACILITY_MAINTENANCE = 'facility_maintenance';

    public const REASON_FACILITY_UNSERVICEABLE = 'facility_unserviceable';

    public const REASON_FACILITY_CLOSED_DAY = 'facility_closed_day';

    public const REASON_COURT_MAINTENANCE = 'court_maintenance';

    public const REASON_COURT_UNSERVICEABLE = 'court_unserviceable';

    public const REASON_COURT_NOT_BOOKABLE = 'court_not_bookable';

    public const REASON_OUTSIDE_HOURS = 'outside_hours';

    public const REASON_COURT_CLOSED_DAY = 'court_closed_day';

    /**
     * @return array{code: string, message: string}|null
     */
    public function reason(
        Facility $facility,
        Court $court,
        string|CarbonInterface $date,
        ?string $startTime = null,
        ?string $endTime = null,
    ): ?array {
        if (! $facility->isApproved()) {
            return [
                'code' => self::REASON_FACILITY_NOT_APPROVED,
                'message' => 'This facility is not approved for bookings yet.',
            ];
        }

        if ($facility->operational_status === Facility::OPERATIONAL_MAINTENANCE) {
            return [
                'code' => self::REASON_FACILITY_MAINTENANCE,
                'message' => 'Facility under maintenance.',
            ];
        }

        if ($facility->operational_status === Facility::OPERATIONAL_UNSERVICEABLE) {
            return [
                'code' => self::REASON_FACILITY_UNSERVICEABLE,
                'message' => 'Facility currently unserviceable.',
            ];
        }

        if (! $facility->isOpenOnDate($date)) {
            return [
                'code' => self::REASON_FACILITY_CLOSED_DAY,
                'message' => 'Facility closed this day.',
            ];
        }

        if ($court->status === 'BLOCKED') {
            return [
                'code' => self::REASON_COURT_MAINTENANCE,
                'message' => 'This court is under maintenance.',
            ];
        }

        if ($court->status === 'NOT_AVAILABLE') {
            return [
                'code' => self::REASON_COURT_UNSERVICEABLE,
                'message' => 'This court is currently unserviceable.',
            ];
        }

        if ($court->status !== 'AVAILABLE') {
            return [
                'code' => self::REASON_COURT_NOT_BOOKABLE,
                'message' => 'This court is not available for booking.',
            ];
        }

        $schedule = $court->scheduleForDate($date);

        if ($schedule === null && Court::normalizeOperatingSchedules($court->operating_schedules) !== []) {
            return [
                'code' => self::REASON_COURT_CLOSED_DAY,
                'message' => 'This court is closed on this day.',
            ];
        }

        if ($startTime !== null && $endTime !== null) {
            if ($schedule !== null) {
                if (! $court->acceptsBookingWindow($date, $startTime, $endTime)) {
                    return [
                        'code' => self::REASON_OUTSIDE_HOURS,
                        'message' => 'Outside operating hours.',
                    ];
                }
            } elseif (! $this->timeRangeIsWithinSchedule($court->time_range, $startTime, $endTime)) {
                return [
                    'code' => self::REASON_OUTSIDE_HOURS,
                    'message' => 'Outside operating hours.',
                ];
            }
        }

        return null;
    }

    /**
     * @throws ValidationException
     */
    public function assertBookable(
        Facility $facility,
        Court $court,
        string|CarbonInterface $date,
        string $startTime,
        string $endTime,
    ): void {
        $reason = $this->reason($facility, $court, $date, $startTime, $endTime);

        if ($reason === null) {
            return;
        }

        $field = match ($reason['code']) {
            self::REASON_FACILITY_CLOSED_DAY,
            self::REASON_COURT_CLOSED_DAY => 'date',
            self::REASON_OUTSIDE_HOURS => 'start_time',
            self::REASON_COURT_MAINTENANCE,
            self::REASON_COURT_UNSERVICEABLE,
            self::REASON_COURT_NOT_BOOKABLE => 'court_id',
            self::REASON_FACILITY_NOT_APPROVED,
            self::REASON_FACILITY_MAINTENANCE,
            self::REASON_FACILITY_UNSERVICEABLE => 'facility_id',
            default => 'facility_id',
        };

        throw ValidationException::withMessages([
            $field => $reason['message'],
        ]);
    }

    public function timeRangeIsWithinSchedule(?string $schedule, string $startTime, string $endTime): bool
    {
        $bounds = $this->parseScheduleBounds($schedule);

        if ($bounds === null) {
            return true;
        }

        $startMinutes = $this->clockToMinutes($startTime);
        $endMinutes = $this->clockToMinutes($endTime, allowMidnightEnd: true);

        if ($startMinutes === null || $endMinutes === null || $endMinutes <= $startMinutes) {
            return false;
        }

        return $startMinutes >= $bounds['start'] && $endMinutes <= $bounds['end'];
    }

    /**
     * @return array{start: int, end: int}|null
     */
    public function parseScheduleBounds(?string $schedule): ?array
    {
        $normalized = trim((string) $schedule);

        if ($normalized === '') {
            return null;
        }

        if (preg_match('/(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i', $normalized) === 1) {
            return ['start' => 0, 'end' => 24 * 60];
        }

        if (preg_match('/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i', $normalized, $match) !== 1) {
            return null;
        }

        $startMinutes = $this->partsToMinutes((int) $match[1], isset($match[2]) && $match[2] !== '' ? (int) $match[2] : 0, $match[3] ?? null, false);
        $endMinutes = $this->partsToMinutes((int) $match[4], isset($match[5]) && $match[5] !== '' ? (int) $match[5] : 0, $match[6] ?? null, true);

        if ($startMinutes === null || $endMinutes === null || $endMinutes <= $startMinutes) {
            return null;
        }

        return ['start' => $startMinutes, 'end' => $endMinutes];
    }

    private function clockToMinutes(string $time, bool $allowMidnightEnd = false): ?int
    {
        $normalized = substr(trim($time), 0, 5);

        if ($allowMidnightEnd && $normalized === '24:00') {
            return 24 * 60;
        }

        try {
            $carbon = Carbon::createFromFormat('H:i', $normalized);
        } catch (\Throwable) {
            return null;
        }

        return ((int) $carbon->format('H') * 60) + (int) $carbon->format('i');
    }

    private function partsToMinutes(int $hour, int $minute, ?string $meridiem, bool $isEnd): ?int
    {
        if ($minute < 0 || $minute > 59 || $hour < 0 || $hour > 24) {
            return null;
        }

        if ($meridiem !== null && $meridiem !== '') {
            $upper = strtoupper($meridiem);
            // "12:00 AM" as an end bound means midnight (end of day).
            if ($isEnd && $upper === 'AM' && $hour === 12 && $minute === 0) {
                return 24 * 60;
            }
            if ($upper === 'PM' && $hour < 12) {
                $hour += 12;
            }
            if ($upper === 'AM' && $hour === 12) {
                $hour = 0;
            }
        }

        if ($hour === 24 && $minute === 0) {
            return $isEnd ? 24 * 60 : null;
        }

        if ($hour > 23) {
            return null;
        }

        return ($hour * 60) + $minute;
    }
}
