export const OPERATIONAL_STATUSES = ['OPEN', 'MAINTENANCE', 'UNSERVICEABLE'];

export const OPERATIONAL_STATUS_LABELS = {
    OPEN: 'Open',
    MAINTENANCE: 'Maintenance',
    UNSERVICEABLE: 'Unserviceable',
};

export const OPERATIONAL_STATUS_STYLES = {
    OPEN: 'bg-[#D6FF3F]/20 text-[#10221C] border-[#D6FF3F]/40',
    MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
    UNSERVICEABLE: 'bg-rose-100 text-rose-800 border-rose-200',
};

export const WEEKDAY_OPTIONS = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
];

export const ALL_OPERATING_DAYS = WEEKDAY_OPTIONS.map((day) => day.value);

/**
 * JS Date#getDay() is 0=Sun…6=Sat. Convert to ISO 1=Mon…7=Sun.
 */
export function isoWeekdayFromDate(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(`${dateInput}T00:00:00`);
    const day = date.getDay();
    return day === 0 ? 7 : day;
}

export function normalizedOperatingDays(days) {
    const values = [...new Set((days || ALL_OPERATING_DAYS).map((day) => Number(day)))]
        .filter((day) => day >= 1 && day <= 7)
        .sort((a, b) => a - b);

    return values.length > 0 ? values : ALL_OPERATING_DAYS;
}

export function facilityIsAcceptingBookings(facility) {
    return (facility?.operational_status || 'OPEN') === 'OPEN';
}

export function facilityIsOpenOnDate(facility, dateInput) {
    const days = normalizedOperatingDays(facility?.operating_days);
    return days.includes(isoWeekdayFromDate(dateInput));
}

export function facilityAvailabilityBanner(facility) {
    if (!facility) {
        return null;
    }

    if (facility.operational_status === 'MAINTENANCE') {
        return {
            tone: 'amber',
            title: 'Facility under maintenance',
            body: 'New bookings are paused until the venue is open again.',
        };
    }

    if (facility.operational_status === 'UNSERVICEABLE') {
        return {
            tone: 'rose',
            title: 'Facility currently unserviceable',
            body: 'This venue cannot accept new bookings right now.',
        };
    }

    return null;
}

export function formatOperatingDaysLabel(days) {
    const normalized = normalizedOperatingDays(days);

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
