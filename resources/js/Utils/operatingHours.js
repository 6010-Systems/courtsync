/**
 * Shared operating-hours model for every booking surface.
 *
 * Mirrors App\Support\OperatingHours. Courts keep their hours as free text
 * (e.g. "6:00 AM - 10:00 PM", "24 Hours"). Bookings may always run until at
 * least midnight so a 10:00 PM – 12:00 AM session is bookable everywhere, and
 * a schedule that closes after midnight ("6:00 AM - 2:00 AM") extends the
 * window to 2:00 AM — the night-rate cutoff.
 */

export const MINUTES_PER_DAY = 24 * 60;

/** Bookings are always accepted until 12:00 AM (midnight). */
export const MINIMUM_CLOSE_MINUTES = MINUTES_PER_DAY;

/** Latest supported close: 2:00 AM the next morning. */
export const LATEST_CLOSE_MINUTES = 26 * 60;

/** Fallback opening hour when the schedule is missing or unreadable. */
export const DEFAULT_OPEN_MINUTES = 6 * 60;

/**
 * Read either "7:00 AM" or "19:00" into minutes from midnight.
 */
export function clockToMinutes(value) {
    if (!value) {
        return null;
    }

    const meridiem = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (meridiem) {
        const hour = (Number(meridiem[1]) % 12) + (meridiem[3].toLowerCase() === 'pm' ? 12 : 0);

        return hour * 60 + Number(meridiem[2] ?? 0);
    }

    const twentyFourHour = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourHour) {
        const hour = Number(twentyFourHour[1]);
        const minutes = Number(twentyFourHour[2]);

        if (hour > 24 || minutes > 59) {
            return null;
        }

        return hour * 60 + minutes;
    }

    return null;
}

/**
 * @return {{openMinutes: number, closeMinutes: number, label: string, isOvernight: boolean, earlyCloseMinutes: number}}
 */
export function parseOperatingWindow(timeRange) {
    const normalized = String(timeRange || '').trim();

    if (normalized && /(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i.test(normalized)) {
        return buildWindow(0, LATEST_CLOSE_MINUTES, normalized);
    }

    const parts = normalized.split(/\s*[-–—]\s*/);

    if (parts.length === 2) {
        const open = clockToMinutes(parts[0]);
        const close = clockToMinutes(parts[1]);

        if (open !== null && close !== null) {
            // "10:00 AM - 12:00 AM" closes at midnight; "6:00 AM - 2:00 AM"
            // closes on the next calendar day.
            let normalizedClose = close <= open ? close + MINUTES_PER_DAY : close;
            normalizedClose = Math.max(normalizedClose, MINIMUM_CLOSE_MINUTES);
            normalizedClose = Math.min(normalizedClose, LATEST_CLOSE_MINUTES);
            const normalizedOpen = Math.max(0, Math.min(open, MINUTES_PER_DAY - 60));

            return buildWindow(
                normalizedOpen,
                Math.max(normalizedClose, normalizedOpen + 60),
                normalized,
            );
        }
    }

    return buildWindow(DEFAULT_OPEN_MINUTES, MINIMUM_CLOSE_MINUTES, normalized);
}

function buildWindow(openMinutes, closeMinutes, label) {
    return {
        openMinutes,
        closeMinutes,
        label: label || formatWindowLabel({ openMinutes, closeMinutes }),
        isOvernight: closeMinutes > MINIMUM_CLOSE_MINUTES,
        earlyCloseMinutes: Math.max(0, closeMinutes - MINUTES_PER_DAY),
    };
}

/**
 * 12-hour label for a minute offset from midnight, e.g. 1440 -> "12:00 AM".
 */
export function formatClockLabel(totalMinutes) {
    const hour24 = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
    const minutes = totalMinutes % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function formatWindowLabel(window) {
    if (!window) {
        return '';
    }

    if (window.openMinutes === 0 && window.closeMinutes === LATEST_CLOSE_MINUTES) {
        return '24 hours (until 2:00 AM)';
    }

    const close = formatClockLabel(window.closeMinutes % MINUTES_PER_DAY);
    const suffix = window.closeMinutes > MINUTES_PER_DAY ? ' (next day)' : '';

    return `${formatClockLabel(window.openMinutes)} – ${close}${suffix}`;
}

/**
 * Hourly options for a court, including the closing boundary on the next day.
 *
 * Each option has a unique `key` (the clock value alone repeats for a
 * 24-hour court), `dayOffset` (0 = opening date, 1 = next day) and the
 * absolute `minutes` from the opening date's midnight.
 */
export function buildHourOptions(window, { stepMinutes = 60 } = {}) {
    const { openMinutes, closeMinutes } = window || parseOperatingWindow(null);
    const step = Math.max(30, Math.min(60, Number(stepMinutes) || 60));
    const options = [];

    for (let minutes = openMinutes; minutes <= closeMinutes; minutes += step) {
        const dayOffset = Math.floor(minutes / MINUTES_PER_DAY);
        const hour = Math.floor((minutes % MINUTES_PER_DAY) / 60);
        const minute = minutes % 60;
        const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        options.push({
            key: `${dayOffset}-${value}`,
            value,
            minutes,
            dayOffset,
            label: formatClockLabel(minutes),
            isNextDay: dayOffset > 0,
            isClosing: minutes === closeMinutes,
        });
    }

    return options;
}

/**
 * Add days to a YYYY-MM-DD string without timezone drift.
 */
export function addDays(dateString, days) {
    if (!dateString) {
        return '';
    }

    const [year, month, day] = String(dateString).slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + Number(days || 0));

    return date.toISOString().slice(0, 10);
}

/**
 * Turn a picked date + two options into the payload the server expects.
 */
export function normalizeSelection(baseDate, startOption, endOption) {
    if (!baseDate || !startOption || !endOption) {
        return null;
    }

    const startDate = addDays(baseDate, startOption.dayOffset);
    const endDate = addDays(baseDate, endOption.dayOffset);

    return {
        date: startDate,
        end_date: endDate !== startDate ? endDate : null,
        start_time: startOption.value,
        end_time: endOption.value,
        durationHours: Math.max(0, (endOption.minutes - startOption.minutes) / 60),
    };
}

/**
 * Keys (`YYYY-MM-DD-HH`) of every hour occupied by a court's bookings.
 *
 * Accounts for sessions that spill past midnight, so today's early hours are
 * correctly blocked by last night's booking.
 */
export function occupiedHourKeys(bookings = [], courtId = null) {
    const keys = new Set();

    (bookings || []).forEach((booking) => {
        if (!booking) {
            return;
        }

        if (courtId !== null && String(booking.court_id) !== String(courtId)) {
            return;
        }

        if (!['pending', 'confirmed'].includes(String(booking.status || '').toLowerCase())) {
            return;
        }

        const startDate = String(booking.date || '').slice(0, 10);
        const startHour = parseInt(String(booking.start_time || '00:00').slice(0, 2), 10) || 0;
        const endHour = parseInt(String(booking.end_time || '00:00').slice(0, 2), 10) || 0;

        if (!startDate) {
            return;
        }

        const endDate = booking.end_date
            ? String(booking.end_date).slice(0, 10)
            : (endHour <= startHour ? addDays(startDate, 1) : startDate);

        let cursor = startDate;

        // A booking is at most 24 hours long, so two iterations cover every case.
        for (let guard = 0; guard < 2; guard += 1) {
            const isFirst = cursor === startDate;
            const isLast = cursor === endDate;
            const from = isFirst ? startHour : 0;
            const to = isLast ? endHour : 24;

            for (let hour = from; hour < to; hour += 1) {
                keys.add(`${cursor}-${hour}`);
            }

            if (isLast) {
                break;
            }

            cursor = addDays(cursor, 1);
        }
    });

    return keys;
}

/**
 * "10:00 PM – 12:00 AM (next day)"
 */
export function formatRangeLabel(startValue, endValue, { endsNextDay = false } = {}) {
    const start = clockToMinutes(startValue);
    let end = clockToMinutes(endValue);

    if (start === null || end === null) {
        return '';
    }

    if (end <= start) {
        end += MINUTES_PER_DAY;
    }

    const suffix = endsNextDay || end >= MINUTES_PER_DAY ? ' (next day)' : '';

    return `${formatClockLabel(start)} – ${formatClockLabel(end)}${suffix}`;
}
