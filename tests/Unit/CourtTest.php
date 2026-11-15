<?php

namespace Tests\Unit;

use App\Models\Court;
use PHPUnit\Framework\TestCase;

class CourtTest extends TestCase
{
    public function test_flat_rate_pricing_calculation(): void
    {
        $court = new Court([
            'pricing_mode' => 'FLAT',
            'hourly_rate' => 300.00,
        ]);

        $res = $court->calculatePriceForRange('14:00', '17:00');

        $this->assertEquals('FLAT', $res['pricing_mode']);
        $this->assertEquals(3, $res['duration_hours']);
        $this->assertEquals(900.00, $res['total']);
        $this->assertCount(1, $res['breakdown']);
    }

    public function test_split_pricing_calculation_day_only(): void
    {
        $court = new Court([
            'pricing_mode' => 'SPLIT',
            'day_rate' => 250.00,
            'night_rate' => 400.00,
            'day_start_time' => '06:00:00',
            'night_start_time' => '18:00:00',
        ]);

        // 14:00 to 17:00 (3 day hours)
        $res = $court->calculatePriceForRange('14:00', '17:00');

        $this->assertEquals('SPLIT', $res['pricing_mode']);
        $this->assertEquals(3, $res['duration_hours']);
        $this->assertEquals(3, $res['day_hours']);
        $this->assertEquals(0, $res['night_hours']);
        $this->assertEquals(750.00, $res['total']);
        $this->assertCount(1, $res['breakdown']);
    }

    public function test_split_pricing_calculation_night_only(): void
    {
        $court = new Court([
            'pricing_mode' => 'SPLIT',
            'day_rate' => 250.00,
            'night_rate' => 400.00,
            'day_start_time' => '06:00:00',
            'night_start_time' => '18:00:00',
        ]);

        // 19:00 to 22:00 (3 night hours)
        $res = $court->calculatePriceForRange('19:00', '22:00');

        $this->assertEquals('SPLIT', $res['pricing_mode']);
        $this->assertEquals(3, $res['duration_hours']);
        $this->assertEquals(0, $res['day_hours']);
        $this->assertEquals(3, $res['night_hours']);
        $this->assertEquals(1200.00, $res['total']);
        $this->assertCount(1, $res['breakdown']);
    }

    public function test_split_pricing_calculation_crossing_boundary(): void
    {
        $court = new Court([
            'pricing_mode' => 'SPLIT',
            'day_rate' => 300.00,
            'night_rate' => 450.00,
            'day_start_time' => '06:00:00',
            'night_start_time' => '17:00:00',
        ]);

        // 15:00 to 19:00 -> 15-16, 16-17 (2 day hours @ 300 = 600) + 17-18, 18-19 (2 night hours @ 450 = 900) = 1500
        $res = $court->calculatePriceForRange('15:00', '19:00');

        $this->assertEquals('SPLIT', $res['pricing_mode']);
        $this->assertEquals(4, $res['duration_hours']);
        $this->assertEquals(2, $res['day_hours']);
        $this->assertEquals(2, $res['night_hours']);
        $this->assertEquals(1500.00, $res['total']);
        $this->assertCount(2, $res['breakdown']);
        $this->assertEquals(600.00, $res['breakdown'][0]['subtotal']);
        $this->assertEquals(900.00, $res['breakdown'][1]['subtotal']);
    }
}
