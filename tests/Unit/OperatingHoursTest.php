<?php

namespace Tests\Unit;

use App\Support\OperatingHours;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class OperatingHoursTest extends TestCase
{
    #[DataProvider('scheduleProvider')]
    public function test_it_parses_supported_schedules(
        ?string $range,
        int $expectedOpen,
        int $expectedClose,
    ): void {
        $hours = OperatingHours::parse($range);

        $this->assertSame($expectedOpen, $hours->openMinutes());
        $this->assertSame($expectedClose, $hours->closeMinutes());
    }

    /**
     * @return array<string, array{string|null, int, int}>
     */
    public static function scheduleProvider(): array
    {
        return [
            'standard evening close is extended to midnight' => ['6:00 AM - 10:00 PM', 360, 1440],
            'closes at midnight' => ['10:00 AM - 12:00 AM', 600, 1440],
            'closes at 2 am' => ['6:00 AM - 2:00 AM', 360, 1560],
            'later than 2 am is capped' => ['6:00 AM - 4:00 AM', 360, 1560],
            '24 hours runs until 2 am' => ['24 Hours', 0, 1560],
            'open daily runs until 2 am' => ['Open daily', 0, 1560],
            '24-hour numeric range' => ['06:00-22:00', 360, 1440],
            'unknown text falls back to 6 am until midnight' => ['Venue standard', 360, 1440],
            'missing schedule falls back to 6 am until midnight' => [null, 360, 1440],
        ];
    }

    #[DataProvider('windowProvider')]
    public function test_it_knows_whether_a_session_fits_the_window(
        string $range,
        int $startMinutes,
        int $endMinutes,
        bool $expected,
    ): void {
        $this->assertSame($expected, OperatingHours::parse($range)->contains($startMinutes, $endMinutes));
    }

    /**
     * @return array<string, array{string, int, int, bool}>
     */
    public static function windowProvider(): array
    {
        return [
            '10 pm until midnight is always allowed' => ['6:00 AM - 10:00 PM', 1320, 0, true],
            '10 pm until 1 am is outside a midnight-close court' => ['6:00 AM - 10:00 PM', 1320, 60, false],
            '10 pm until 2 am is allowed at a 2 am-close court' => ['6:00 AM - 2:00 AM', 1320, 120, true],
            'midnight until 2 am belongs to the 2 am-close tail' => ['6:00 AM - 2:00 AM', 0, 120, true],
            'early hours are closed on a midnight-close court' => ['6:00 AM - 12:00 AM', 0, 120, false],
            'a session before opening is rejected' => ['6:00 AM - 2:00 AM', 180, 300, false],
            'a short session is rejected' => ['6:00 AM - 2:00 AM', 1320, 1330, false],
        ];
    }

    public function test_it_describes_a_midnight_window(): void
    {
        $this->assertSame('10:00 AM – 12:00 AM', OperatingHours::parse('10:00 AM - 12:00 AM')->describe());
        $this->assertSame('6:00 AM – 2:00 AM (next day)', OperatingHours::parse('6:00 AM - 2:00 AM')->describe());
    }

    public function test_it_reads_clock_values(): void
    {
        $this->assertSame(0, OperatingHours::clockToMinutes('12:00 AM'));
        $this->assertSame(720, OperatingHours::clockToMinutes('12:00 PM'));
        $this->assertSame(120, OperatingHours::clockToMinutes('2:00 AM'));
        $this->assertSame(1440, OperatingHours::clockToMinutes('24:00'));
        $this->assertNull(OperatingHours::clockToMinutes('not a time'));
    }
}
