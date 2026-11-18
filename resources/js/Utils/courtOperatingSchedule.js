import { ALL_OPERATING_DAYS, WEEKDAY_OPTIONS, isoWeekdayFromDate, normalizedOperatingDays } from '@/Utils/facilityAvailability';

export function emptyScheduleGroup(days = [], start = '08:00', end = '24:00') {
    return {
        days: [...days],
        start,
        end,
    };
}

export function normalizeCourtSchedules(schedules) {
    return (schedules || [])
        .map((group) => {
            const days = normalizedOperatingDays(group?.days || []).filter((day) =>
                (group?.days || []).map(Number).includes(day),
            );

            const start = String(group?.start || '').slice(0, 5);
            const end = String(group?.end || '').slice(0, 5);

            if (days.length === 0 || !isValidStart(start) || !isValidEnd(end)) {
                return null;
            }

            if (clockToMinutes(end) <= clockToMinutes(start)) {
                return null;
            }

            return { days, start, end };
        })
        .filter(Boolean);
}

export function constrainSchedulesToFacilityDays(schedules, facilityDays) {
    const allowed = new Set(normalizedOperatingDays(facilityDays));

    return normalizeCourtSchedules(schedules)
        .map((group) => ({
            ...group,
            days: group.days.filter((day) => allowed.has(day)),
        }))
        .filter((group) => group.days.length > 0);
}

export function schedulesHaveUniqueDays(schedules) {
    const days = normalizeCourtSchedules(schedules).flatMap((group) => group.days);
    return days.length === new Set(days).size;
}

export function scheduleForDate(schedules, dateInput) {
    const weekday = isoWeekdayFromDate(dateInput);
    return normalizeCourtSchedules(schedules).find((group) => group.days.includes(weekday)) || null;
}

export function courtIsOpenOnDate(court, dateInput) {
    const schedules = court?.operating_schedules;
    if (Array.isArray(schedules) && schedules.length > 0) {
        return scheduleForDate(schedules, dateInput) !== null;
    }

    // Legacy courts without schedules stay open on any selected date.
    return true;
}

export function hoursForDate(court, dateInput) {
    const group = scheduleForDate(court?.operating_schedules, dateInput);
    if (group) {
        return { start: group.start, end: group.end };
    }

    return parseLegacyTimeRange(court?.time_range);
}

export function summarizeSchedules(schedules) {
    return normalizeCourtSchedules(schedules)
        .map((group) => `${daysLabel(group.days)} ${formatClockLabel(group.start)} - ${formatClockLabel(group.end)}`)
        .join(' · ');
}

export function daysLabel(days) {
    const normalized = normalizedOperatingDays(days).filter((day) => days.map(Number).includes(day));

    if (normalized.length === 7) {
        return 'All week';
    }

    if (normalized.join(',') === '1,2,3,4,5') {
        return 'Mon–Fri';
    }

    if (normalized.join(',') === '6,7') {
        return 'Sat–Sun';
    }

    return normalized
        .map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label || day)
        .join(', ');
}

export function formatClockLabel(hi) {
    if (hi === '24:00') {
        return '12:00 AM';
    }

    const [hourRaw, minuteRaw] = String(hi).split(':');
    let hour = Number(hourRaw);
    const minute = Number(minuteRaw || 0);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export function clockToMinutes(hi) {
    if (hi === '24:00') {
        return 24 * 60;
    }

    const [h, m] = String(hi).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) {
        return null;
    }

    return h * 60 + m;
}

export function isValidStart(hi) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hi);
}

export function isValidEnd(hi) {
    return hi === '24:00' || isValidStart(hi);
}

export function buildHourOptions({ includeMidnightEnd = false } = {}) {
    const options = [];

    for (let minutes = 0; minutes < 24 * 60; minutes += 60) {
        const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`;
        options.push({ value, label: formatClockLabel(value) });
    }

    if (includeMidnightEnd) {
        options.push({ value: '24:00', label: '12:00 AM (midnight)' });
    }

    return options;
}

export function defaultSchedulesForFacilityDays(facilityDays) {
    const days = normalizedOperatingDays(facilityDays);
    return [emptyScheduleGroup(days, '08:00', '24:00')];
}

export function schedulesFromLegacyTimeRange(timeRange, facilityDays) {
    const bounds = parseLegacyTimeRange(timeRange);
    const days = normalizedOperatingDays(facilityDays);

    if (!bounds) {
        return defaultSchedulesForFacilityDays(days);
    }

    return [emptyScheduleGroup(days, bounds.start, bounds.end)];
}

function parseLegacyTimeRange(timeRange) {
    const normalized = String(timeRange || '').trim();
    if (!normalized) {
        return null;
    }

    if (/(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i.test(normalized)) {
        return { start: '00:00', end: '24:00' };
    }

    const match = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–—]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) {
        return null;
    }

    const start = partsToHi(Number(match[1]), match[2] ? Number(match[2]) : 0, match[3], false);
    const end = partsToHi(Number(match[4]), match[5] ? Number(match[5]) : 0, match[6], true);

    if (!start || !end || clockToMinutes(end) <= clockToMinutes(start)) {
        return null;
    }

    return { start, end };
}

function partsToHi(hour, minute, meridiem, isEnd) {
    if (minute < 0 || minute > 59 || hour < 0 || hour > 24) {
        return null;
    }

    if (meridiem) {
        const upper = String(meridiem).toUpperCase();
        if (isEnd && upper === 'AM' && hour === 12 && minute === 0) {
            return '24:00';
        }
        if (upper === 'PM' && hour < 12) {
            hour += 12;
        }
        if (upper === 'AM' && hour === 12) {
            hour = 0;
        }
    }

    if (hour === 24 && minute === 0) {
        return isEnd ? '24:00' : null;
    }

    if (hour > 23) {
        return null;
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function unionScheduleBounds(schedules) {
    const normalized = normalizeCourtSchedules(schedules);
    if (normalized.length === 0) {
        return null;
    }

    let start = Infinity;
    let end = -Infinity;

    normalized.forEach((group) => {
        start = Math.min(start, clockToMinutes(group.start));
        end = Math.max(end, clockToMinutes(group.end));
    });

    return { startMinutes: start, endMinutes: end };
}

export { ALL_OPERATING_DAYS, WEEKDAY_OPTIONS };
