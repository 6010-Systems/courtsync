<?php

namespace App\Support;

use App\Models\Facility;

/**
 * Loads a facility's rate card and the packages each of its courts offers,
 * so the frontend can show rate-card pricing instead of a free-form amount.
 */
class RateCardLoader
{
    public static function load(Facility $facility): void
    {
        $facility->load([
            'courts',
            'ratePlans' => fn ($query) => $query->active()->orderBy('sort_order')->orderBy('name'),
            'courts.ratePlans' => fn ($query) => $query->wherePivot('is_enabled', true),
        ]);

        // Only expose rates that at least one court actually offers.
        $offeredPlanIds = $facility->courts
            ->flatMap(fn ($court) => $court->ratePlans->pluck('id'))
            ->unique();

        // A card that has not been assigned to any court yet applies to all of them.
        if ($offeredPlanIds->isEmpty()) {
            $offeredPlanIds = $facility->ratePlans->pluck('id');
        }

        $facility->setRelation(
            'ratePlans',
            $facility->ratePlans->whereIn('id', $offeredPlanIds)->values(),
        );

        // Courts without their own assignment follow the facility rate card.
        $facility->courts->each(function ($court) use ($facility) {
            if ($court->ratePlans->isEmpty() && $court->uses_rate_card) {
                $court->setRelation('ratePlans', $facility->ratePlans->values());
            }
        });
    }
}
