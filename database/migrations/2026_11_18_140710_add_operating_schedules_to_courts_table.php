<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->json('operating_schedules')->nullable()->after('time_range');
        });

        $courts = DB::table('courts')->select('id', 'time_range')->get();

        foreach ($courts as $court) {
            $bounds = $this->parseBounds($court->time_range);

            DB::table('courts')->where('id', $court->id)->update([
                'operating_schedules' => json_encode([
                    [
                        'days' => [1, 2, 3, 4, 5, 6, 7],
                        'start' => $bounds['start'],
                        'end' => $bounds['end'],
                    ],
                ]),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courts', function (Blueprint $table) {
            $table->dropColumn('operating_schedules');
        });
    }

    /**
     * @return array{start: string, end: string}
     */
    private function parseBounds(?string $schedule): array
    {
        $normalized = trim((string) $schedule);

        if ($normalized === '' || preg_match('/(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i', $normalized) === 1) {
            return ['start' => '00:00', 'end' => '24:00'];
        }

        if (preg_match('/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i', $normalized, $match) !== 1) {
            return ['start' => '06:00', 'end' => '22:00'];
        }

        $start = $this->toHi((int) $match[1], isset($match[2]) && $match[2] !== '' ? (int) $match[2] : 0, $match[3] ?? null, false);
        $end = $this->toHi((int) $match[4], isset($match[5]) && $match[5] !== '' ? (int) $match[5] : 0, $match[6] ?? null, true);

        if ($start === null || $end === null || $this->toMinutes($end) <= $this->toMinutes($start)) {
            return ['start' => '06:00', 'end' => '22:00'];
        }

        return ['start' => $start, 'end' => $end];
    }

    private function toHi(int $hour, int $minute, ?string $meridiem, bool $isEnd): ?string
    {
        if ($minute < 0 || $minute > 59 || $hour < 0 || $hour > 24) {
            return null;
        }

        if ($meridiem !== null && $meridiem !== '') {
            $upper = strtoupper($meridiem);
            if ($isEnd && $upper === 'AM' && $hour === 12 && $minute === 0) {
                return '24:00';
            }
            if ($upper === 'PM' && $hour < 12) {
                $hour += 12;
            }
            if ($upper === 'AM' && $hour === 12) {
                $hour = 0;
            }
        }

        if ($hour === 24 && $minute === 0) {
            return '24:00';
        }

        if ($hour > 23) {
            return null;
        }

        return sprintf('%02d:%02d', $hour, $minute);
    }

    private function toMinutes(string $hi): int
    {
        if ($hi === '24:00') {
            return 24 * 60;
        }

        [$h, $m] = array_map('intval', explode(':', $hi));

        return ($h * 60) + $m;
    }
};
