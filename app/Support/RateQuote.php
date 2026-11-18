<?php

namespace App\Support;

use App\Models\Court;
use App\Models\RatePlan;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * Authoritative price calculation for court bookings.
 *
 * A booking is priced from a rate-card package (RatePlan) when one is chosen,
 * and falls back to the court's own flat / day-night rates for facilities that
 * have not configured a rate card yet.
 */
class RateQuote
{
    /**
     * Build the full quote for a court booking, including hourly add-ons.
     *
     * @param  array<int, array{rate_plan_id?: mixed, quantity?: mixed}>  $addons
     * @return array{
     *     court: array<string, mixed>,
     *     addons: array<int, array<string, mixed>>,
     *     addons_total: float,
     *     subtotal: float,
     *     total: float,
     *     rate_plan_id: int|null,
     *     rate_plan_name: string|null
     * }
     *
     * @throws InvalidArgumentException when the plan or an add-on is not offered by the court
     */
    public function forBooking(Court $court, string $startTime, string $endTime, ?RatePlan $plan = null, array $addons = []): array
    {
        $durationHours = max(0, Carbon::parse($startTime)->diffInHours(Carbon::parse($endTime)));

        $courtQuote = $plan
            ? $this->quoteWithPlan($court, $plan, $startTime, $endTime, $durationHours)
            : $this->quoteLegacy($court, $startTime, $endTime);

        $addonLines = [];
        $addonsTotal = 0.0;

        foreach ($addons as $addon) {
            $line = $this->quoteAddon(
                $court,
                (int) ($addon['rate_plan_id'] ?? 0),
                (int) ($addon['quantity'] ?? 0),
                $durationHours,
            );

            if ($line === null) {
                continue;
            }

            $addonLines[] = $line;
            $addonsTotal += $line['subtotal'];
        }

        $subtotal = round((float) $courtQuote['total'], 2);
        $addonsTotal = round($addonsTotal, 2);

        return [
            'court' => $courtQuote,
            'addons' => $addonLines,
            'addons_total' => $addonsTotal,
            'subtotal' => $subtotal,
            'total' => round($subtotal + $addonsTotal, 2),
            'rate_plan_id' => $plan?->id,
            'rate_plan_name' => $plan?->name,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function quoteWithPlan(Court $court, RatePlan $plan, string $startTime, string $endTime, int $durationHours): array
    {
        if ((int) $plan->facility_id !== (int) $court->facility_id) {
            throw new InvalidArgumentException('The selected rate does not belong to this facility.');
        }

        if ($plan->kind !== 'COURT' || ! $plan->is_active) {
            throw new InvalidArgumentException('The selected rate is not available for booking.');
        }

        $assignment = $court->ratePlans()
            ->where('rate_plans.id', $plan->id)
            ->wherePivot('is_enabled', true)
            ->first();

        if (! $assignment && ! $this->planIsInherited($court, $plan)) {
            throw new InvalidArgumentException('This court does not offer the selected rate.');
        }

        $dayRate = $this->effectiveRate($assignment?->pivot?->day_rate_override, $plan->day_rate);
        $nightRate = $plan->night_rate === null
            ? null
            : $this->effectiveRate($assignment?->pivot?->night_rate_override, $plan->night_rate);

        if ($durationHours === 0) {
            return $this->emptyQuote($plan, $dayRate, $nightRate);
        }

        if ($nightRate === null) {
            $total = round($durationHours * $dayRate, 2);

            return [
                'rate_plan_id' => $plan->id,
                'rate_plan_name' => $plan->name,
                'pricing_mode' => 'FLAT',
                'duration_hours' => $durationHours,
                'day_hours' => $durationHours,
                'night_hours' => 0,
                'day_rate' => $dayRate,
                'night_rate' => null,
                'total' => $total,
                'breakdown' => [
                    [
                        'label' => 'Standard rate',
                        'hours' => $durationHours,
                        'rate' => $dayRate,
                        'subtotal' => $total,
                    ],
                ],
            ];
        }

        [$dayHours, $nightHours] = $this->splitHours(
            $startTime,
            $endTime,
            Carbon::parse($plan->day_start_time ?: '05:00:00')->format('H:i'),
            Carbon::parse($plan->night_start_time ?: '17:00:00')->format('H:i'),
        );

        return $this->splitQuote($plan, $dayRate, $nightRate, $dayHours, $nightHours);
    }

    /**
     * @return array<string, mixed>
     */
    private function quoteLegacy(Court $court, string $startTime, string $endTime): array
    {
        return array_merge([
            'rate_plan_id' => null,
            'rate_plan_name' => null,
        ], $court->calculatePriceForRange($startTime, $endTime));
    }

    /**
     * Price one hourly add-on (e.g. paddle rental) for the booked duration.
     *
     * @return array{rate_plan_id: int, name: string, quantity: int, hours: int, rate: float, subtotal: float}|null
     */
    private function quoteAddon(Court $court, int $planId, int $quantity, int $durationHours): ?array
    {
        if ($planId <= 0 || $quantity <= 0) {
            return null;
        }

        $plan = RatePlan::query()
            ->whereKey($planId)
            ->where('facility_id', $court->facility_id)
            ->addons()
            ->active()
            ->first();

        if (! $plan) {
            throw new InvalidArgumentException('The selected add-on is not available at this facility.');
        }

        $maxQuantity = max(1, (int) $plan->max_quantity);

        if ($quantity > $maxQuantity) {
            throw new InvalidArgumentException("A booking can include at most {$maxQuantity} × {$plan->name}.");
        }

        $assignment = $court->ratePlans()
            ->where('rate_plans.id', $plan->id)
            ->wherePivot('is_enabled', true)
            ->first();

        if (! $assignment && ! $this->planIsInherited($court, $plan)) {
            throw new InvalidArgumentException('This court does not offer the selected add-on.');
        }

        if ($durationHours === 0) {
            return null;
        }

        $rate = $this->effectiveRate($assignment?->pivot?->day_rate_override, $plan->day_rate);
        $subtotal = round($quantity * $durationHours * $rate, 2);

        return [
            'rate_plan_id' => $plan->id,
            'name' => $plan->name,
            'quantity' => $quantity,
            'hours' => $durationHours,
            'rate' => $rate,
            'subtotal' => $subtotal,
        ];
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function splitHours(string $startTime, string $endTime, string $dayStart, string $nightStart): array
    {
        $dayHours = 0;
        $nightHours = 0;
        $cursor = Carbon::parse($startTime)->copy();
        $end = Carbon::parse($endTime);

        while ($cursor->lt($end)) {
            $slotTime = $cursor->format('H:i');

            if ($slotTime >= $nightStart || $slotTime < $dayStart) {
                $nightHours++;
            } else {
                $dayHours++;
            }

            $cursor->addHour();
        }

        return [$dayHours, $nightHours];
    }

    /**
     * @return array<string, mixed>
     */
    private function splitQuote(RatePlan $plan, float $dayRate, float $nightRate, int $dayHours, int $nightHours): array
    {
        $daySubtotal = round($dayHours * $dayRate, 2);
        $nightSubtotal = round($nightHours * $nightRate, 2);
        $breakdown = [];

        if ($dayHours > 0) {
            $breakdown[] = [
                'label' => 'Day rate',
                'hours' => $dayHours,
                'rate' => $dayRate,
                'subtotal' => $daySubtotal,
            ];
        }

        if ($nightHours > 0) {
            $breakdown[] = [
                'label' => 'Night rate',
                'hours' => $nightHours,
                'rate' => $nightRate,
                'subtotal' => $nightSubtotal,
            ];
        }

        return [
            'rate_plan_id' => $plan->id,
            'rate_plan_name' => $plan->name,
            'pricing_mode' => 'SPLIT',
            'duration_hours' => $dayHours + $nightHours,
            'day_hours' => $dayHours,
            'night_hours' => $nightHours,
            'day_rate' => $dayRate,
            'night_rate' => $nightRate,
            'total' => round($daySubtotal + $nightSubtotal, 2),
            'breakdown' => $breakdown,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function emptyQuote(RatePlan $plan, float $dayRate, ?float $nightRate): array
    {
        return [
            'rate_plan_id' => $plan->id,
            'rate_plan_name' => $plan->name,
            'pricing_mode' => $nightRate === null ? 'FLAT' : 'SPLIT',
            'duration_hours' => 0,
            'day_hours' => 0,
            'night_hours' => 0,
            'day_rate' => $dayRate,
            'night_rate' => $nightRate,
            'total' => 0.0,
            'breakdown' => [],
        ];
    }

    /**
     * A court with no assigned plans follows the facility's active rate card.
     */
    private function planIsInherited(Court $court, RatePlan $plan): bool
    {
        $hasAssignments = $court->ratePlans()
            ->wherePivot('is_enabled', true)
            ->exists();

        return ! $hasAssignments
            && (bool) $court->uses_rate_card
            && (int) $plan->facility_id === (int) $court->facility_id
            && (bool) $plan->is_active;
    }

    private function effectiveRate(mixed $override, mixed $fallback): float
    {
        return (float) ($override !== null && $override !== '' ? $override : $fallback);
    }
}
