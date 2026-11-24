/**
 * Client-side mirror of App\Support\RateQuote.
 *
 * The server recalculates every booking amount, so this module exists only to
 * preview prices in the UI. Keep the rules in sync with the backend.
 */

export function planRates(plan) {
    if (!plan) {
        return { day: 0, night: null };
    }

    const pivot = plan.pivot || {};
    const day = Number(pivot.day_rate_override ?? plan.day_rate ?? 0);
    const night = plan.night_rate === null || plan.night_rate === undefined
        ? null
        : Number(pivot.night_rate_override ?? plan.night_rate);

    return { day, night };
}

export function hoursBetween(startTime, endTime) {
    if (!startTime || !endTime) {
        return 0;
    }

    const [startHour, startMinute] = String(startTime).split(':').map(Number);
    const [endHour, endMinute] = String(endTime).split(':').map(Number);

    if ([startHour, endHour].some((value) => Number.isNaN(value))) {
        return 0;
    }

    let startMinutes = startHour * 60 + (startMinute || 0);
    let endMinutes = endHour * 60 + (endMinute || 0);

    // Cross-midnight booking: end time is earlier in the day than start time.
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
    }

    return Math.max(0, (endMinutes - startMinutes) / 60);
}

export function splitHours(startTime, endTime, dayStartTime, nightStartTime) {
    const startHour = parseInt(String(startTime).split(':')[0], 10);
    const endHour = parseInt(String(endTime).split(':')[0], 10);
    const dayStart = dayStartTime ? parseInt(String(dayStartTime).split(':')[0], 10) : 5;
    const nightStart = nightStartTime ? parseInt(String(nightStartTime).split(':')[0], 10) : 17;

    // For cross-midnight bookings the end hour is numerically less than start hour.
    // Normalise by adding 24 to bring the end past midnight in a linear scale (0–47).
    const normalEnd = endHour <= startHour ? endHour + 24 : endHour;

    let dayHours = 0;
    let nightHours = 0;

    for (let h = startHour; h < normalEnd; h++) {
        const hour = h % 24; // wrap back to 0-23 for period classification
        if (hour >= nightStart || hour < dayStart) {
            nightHours++;
        } else {
            dayHours++;
        }
    }

    return [dayHours, nightHours];
}

function buildBreakdown(dayHours, nightHours, dayRate, nightRate) {
    const breakdown = [];

    if (dayHours > 0) {
        breakdown.push({ label: 'Day rate', hours: dayHours, rate: dayRate, subtotal: dayHours * dayRate });
    }

    if (nightHours > 0) {
        breakdown.push({ label: 'Night rate', hours: nightHours, rate: nightRate, subtotal: nightHours * nightRate });
    }

    return breakdown;
}

function quotePlan(plan, startTime, endTime, durationHours) {
    const { day, night } = planRates(plan);

    if (durationHours <= 0) {
        return {
            ratePlanId: plan.id,
            ratePlanName: plan.name,
            isSplit: night !== null,
            durationHours: 0,
            dayHours: 0,
            nightHours: 0,
            dayRate: day,
            nightRate: night,
            courtTotal: 0,
            breakdown: [],
        };
    }

    if (night === null) {
        return {
            ratePlanId: plan.id,
            ratePlanName: plan.name,
            isSplit: false,
            durationHours,
            dayHours: durationHours,
            nightHours: 0,
            dayRate: day,
            nightRate: null,
            courtTotal: durationHours * day,
            breakdown: [{ label: 'Standard rate', hours: durationHours, rate: day, subtotal: durationHours * day }],
        };
    }

    const [dayHours, nightHours] = splitHours(startTime, endTime, plan.day_start_time, plan.night_start_time);

    return {
        ratePlanId: plan.id,
        ratePlanName: plan.name,
        isSplit: true,
        durationHours: dayHours + nightHours,
        dayHours,
        nightHours,
        dayRate: day,
        nightRate: night,
        courtTotal: dayHours * day + nightHours * night,
        breakdown: buildBreakdown(dayHours, nightHours, day, night),
    };
}

function quoteLegacy(court, startTime, endTime, durationHours) {
    if (!court) {
        return {
            ratePlanId: null,
            ratePlanName: null,
            isSplit: false,
            durationHours: 0,
            dayHours: 0,
            nightHours: 0,
            dayRate: 0,
            nightRate: null,
            courtTotal: 0,
            breakdown: [],
        };
    }

    const isSplit = court.pricing_mode === 'SPLIT' && Boolean(court.day_rate && court.night_rate);

    if (!isSplit) {
        const rate = Number(court.hourly_rate || 0);

        return {
            ratePlanId: null,
            ratePlanName: null,
            isSplit: false,
            durationHours,
            dayHours: durationHours,
            nightHours: 0,
            dayRate: rate,
            nightRate: null,
            courtTotal: durationHours * rate,
            breakdown: [{ label: 'Standard rate', hours: durationHours, rate, subtotal: durationHours * rate }],
        };
    }

    const dayRate = Number(court.day_rate);
    const nightRate = Number(court.night_rate);
    const [dayHours, nightHours] = splitHours(startTime, endTime, court.day_start_time, court.night_start_time);

    return {
        ratePlanId: null,
        ratePlanName: null,
        isSplit: true,
        durationHours: dayHours + nightHours,
        dayHours,
        nightHours,
        dayRate,
        nightRate,
        courtTotal: dayHours * dayRate + nightHours * nightRate,
        breakdown: buildBreakdown(dayHours, nightHours, dayRate, nightRate),
    };
}

function addonLine(plan, quantity, durationHours) {
    if (!plan || quantity <= 0 || durationHours <= 0) {
        return null;
    }

    const rate = planRates(plan).day;
    const max = Math.max(1, Number(plan.max_quantity || 1));
    const capped = Math.min(quantity, max);

    return {
        ratePlanId: plan.id,
        name: plan.name,
        quantity: capped,
        hours: durationHours,
        rate,
        subtotal: capped * durationHours * rate,
    };
}

/**
 * Preview the full price of a booking (the server has the final say).
 *
 * @param {object} options
 * @param {object|null} options.court
 * @param {object|null} options.ratePlan
 * @param {Array<{plan: object, quantity: number}>} options.addons
 */
export function quoteBooking({ court = null, ratePlan = null, addons = [], startTime = '', endTime = '' }) {
    const durationHours = hoursBetween(startTime, endTime);
    const courtQuote = ratePlan
        ? quotePlan(ratePlan, startTime, endTime, durationHours)
        : quoteLegacy(court, startTime, endTime, durationHours);

    const addonLines = addons
        .map(({ plan, quantity }) => addonLine(plan, Number(quantity) || 0, courtQuote.durationHours))
        .filter(Boolean);

    const addonsTotal = addonLines.reduce((sum, line) => sum + line.subtotal, 0);
    const subtotal = courtQuote.courtTotal;

    return {
        ...courtQuote,
        addonLines,
        addonsTotal,
        subtotal,
        total: subtotal + addonsTotal,
    };
}

function pivotEnabled(plan) {
    if (!plan?.pivot) {
        return true;
    }

    return Boolean(Number(plan.pivot.is_enabled));
}

function planPool(court, facility) {
    // Courts opted out of the rate card use their own flat / day-night rates.
    if (court && (court.uses_rate_card === false || court.uses_rate_card === 0)) {
        return [];
    }

    const assigned = (court?.rate_plans || []).filter(pivotEnabled);

    if (assigned.length > 0) {
        return assigned;
    }

    // No per-court assignment → the court follows the facility rate card.
    return (facility?.rate_plans || []).filter((plan) => plan.is_active !== false);
}

/**
 * Packages a court currently offers (falls back to the facility card).
 */
export function offeredCourtPlans(court, facility = null) {
    return planPool(court, facility).filter(
        (plan) => plan.kind !== 'ADDON' && plan.is_active !== false,
    );
}

export function offeredAddons(court, facility = null) {
    return planPool(court, facility).filter(
        (plan) => plan.kind === 'ADDON' && plan.is_active !== false,
    );
}

/**
 * Preview of Facility::calculateBookingFee() — the server has the final say.
 */
export function estimateBookingFee(facility, subtotal) {
    const value = Number(facility?.booking_fee_value || 0);

    if (value <= 0) {
        return 0;
    }

    if (facility?.booking_fee_type === 'PERCENT') {
        return Math.round(subtotal * Math.min(value, 100)) / 100;
    }

    return Math.round(value * 100) / 100;
}

/**
 * Lowest effective hourly price, used for "from ₱X/hr" labels.
 */
export function startingRate(court, facility = null) {
    const plans = offeredCourtPlans(court, facility);

    if (plans.length === 0) {
        return Number(court?.hourly_rate || court?.day_rate || 0);
    }

    return Math.min(
        ...plans.map((plan) => {
            const { day, night } = planRates(plan);

            return night === null ? day : Math.min(day, night);
        }),
    );
}

