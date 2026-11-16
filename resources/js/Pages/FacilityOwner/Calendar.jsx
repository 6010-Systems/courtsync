import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { formatPeso } from '@/Components/MetricCard';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, LayoutList, MapPin, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS = {
    pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
    confirmed: { label: 'Confirmed', badge: 'bg-[#D6FF3F]/40 text-[#101F1A]', dot: 'bg-[#D6FF3F]' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
};

function formatTime(value) {
    if (!value) return '—';

    return new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });
}

function formatDayLong(value) {
    if (!value) return '';

    return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function defaultDayFor(month, today) {
    const [year, monthNumber] = month.split('-').map(Number);
    const todayDate = new Date(`${today}T12:00:00`);

    if (todayDate.getFullYear() === year && todayDate.getMonth() + 1 === monthNumber) {
        return today;
    }

    return `${month}-01`;
}

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">{label}</p>
            <p className="mt-2 text-2xl font-black text-[#101F1A]">{value}</p>
            {hint ? <p className="mt-1 text-xs text-[#101F1A]/60">{hint}</p> : null}
        </div>
    );
}

export default function Calendar({ filters, monthLabel, today, bookings = [], facilities = [] }) {
    const [selectedDay, setSelectedDay] = useState(() => defaultDayFor(filters.month, today));

    useEffect(() => {
        setSelectedDay(defaultDayFor(filters.month, today));
    }, [filters.month, today]);

    const bookingsByDate = useMemo(() => {
        const map = new Map();

        bookings.forEach((booking) => {
            const date = String(booking.date).slice(0, 10);

            if (!map.has(date)) {
                map.set(date, []);
            }

            map.get(date).push(booking);
        });

        return map;
    }, [bookings]);

    const [year, monthNumber] = filters.month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();

    const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    const stats = useMemo(() => ({
        total: bookings.length,
        confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
        pending: bookings.filter((booking) => booking.status === 'pending').length,
        revenue: bookings
            .filter((booking) => booking.status !== 'cancelled')
            .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
    }), [bookings]);

    const selectedBookings = bookingsByDate.get(selectedDay) ?? [];
    const selectedRevenue = selectedBookings
        .filter((booking) => booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);

    const navigate = (month, facilityId = filters.facility_id) => {
        router.get(route('facility.calendar'), {
            month,
            ...(facilityId ? { facility_id: facilityId } : {}),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const shiftMonth = (delta) => {
        const next = new Date(year, monthNumber - 1 + delta, 1);
        navigate(monthKey(next));
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Calendar"
                    subtitle="Every booking across your courts in one monthly view"
                    actions={
                        <Link
                            href={route('facility.bookings')}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#101F1A]/15 bg-white px-3.5 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                        >
                            <LayoutList size={14} strokeWidth={2.4} />
                            <span>List view</span>
                        </Link>
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Calendar" />

            <div className="w-full space-y-4 pb-2">
                {/* Toolbar */}
                <div className="flex flex-col gap-3 rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => shiftMonth(-1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#101F1A]/15 bg-white text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                            aria-label="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="min-w-[140px] text-center text-sm font-black text-[#101F1A]">{monthLabel}</span>
                        <button
                            type="button"
                            onClick={() => shiftMonth(1)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#101F1A]/15 bg-white text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                            aria-label="Next month"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(monthKey(new Date()))}
                            className="ml-1 inline-flex h-9 items-center rounded-lg bg-[#101F1A] px-3 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923]"
                        >
                            Today
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {facilities.length > 1 && (
                            <select
                                value={filters.facility_id ?? ''}
                                onChange={(event) => navigate(filters.month, event.target.value || null)}
                                className="h-9 max-w-[240px] rounded-lg border border-[#101F1A]/15 bg-white px-3 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer"
                            >
                                <option value="">All facilities</option>
                                {facilities.map((facility) => (
                                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                                ))}
                            </select>
                        )}

                        <div className="flex items-center gap-3 text-[11px] font-bold text-[#101F1A]/60">
                            {Object.entries(STATUS).map(([key, status]) => (
                                <span key={key} className="inline-flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                    {status.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Bookings" value={stats.total} hint={monthLabel} />
                    <StatCard label="Confirmed" value={stats.confirmed} hint={`${stats.pending} awaiting confirmation`} />
                    <StatCard label="Pending" value={stats.pending} hint="Needs review" />
                    <StatCard label="Booking value" value={formatPeso(stats.revenue)} hint="Excludes cancelled bookings" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-3">
                    {/* Month grid */}
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card xl:col-span-2">
                        <div className="grid grid-cols-7 border-b border-[#101F1A]/10 bg-[#101F1A]/[0.02]">
                            {WEEKDAYS.map((day) => (
                                <div key={day} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {cells.map((day, index) => {
                                if (day === null) {
                                    return (
                                        <div
                                            key={`empty-${index}`}
                                            className="min-h-[104px] border-b border-r border-[#101F1A]/5 bg-[#101F1A]/[0.015]"
                                        />
                                    );
                                }

                                const dateKey = `${filters.month}-${String(day).padStart(2, '0')}`;
                                const dayBookings = bookingsByDate.get(dateKey) ?? [];
                                const dayRevenue = dayBookings
                                    .filter((booking) => booking.status !== 'cancelled')
                                    .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);

                                return (
                                    <button
                                        key={dateKey}
                                        type="button"
                                        onClick={() => setSelectedDay(dateKey)}
                                        className={`min-h-[104px] border-b border-r border-[#101F1A]/5 p-2 text-left transition-colors ${
                                            dateKey === selectedDay
                                                ? 'bg-[#D6FF3F]/15 ring-1 ring-inset ring-[#D6FF3F]'
                                                : 'hover:bg-[#101F1A]/[0.02]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                                                    dateKey === today ? 'bg-[#101F1A] text-[#D6FF3F]' : 'text-[#101F1A]'
                                                }`}
                                            >
                                                {day}
                                            </span>
                                            {dayBookings.length > 0 && (
                                                <span className="text-[10px] font-bold text-[#101F1A]/50">{dayBookings.length}</span>
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-1">
                                            {dayBookings.slice(0, 2).map((booking) => (
                                                <div key={booking.id} className="flex items-center gap-1 truncate text-[10px] text-[#101F1A]/70">
                                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS[booking.status]?.dot ?? 'bg-gray-300'}`} />
                                                    <span className="truncate">{formatTime(booking.start_time)} · {booking.court}</span>
                                                </div>
                                            ))}
                                            {dayBookings.length > 2 && (
                                                <p className="text-[10px] font-bold text-[#101F1A]/50">+{dayBookings.length - 2} more</p>
                                            )}
                                        </div>

                                        {dayBookings.length > 0 && (
                                            <p className="mt-1 text-[10px] font-bold text-[#101F1A]/40">{formatPeso(dayRevenue)}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected day panel */}
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        <div className="border-b border-[#101F1A]/10 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50">Selected day</p>
                            <h2 className="mt-0.5 text-base font-black text-[#101F1A]">{formatDayLong(selectedDay)}</h2>
                            <p className="text-xs text-[#101F1A]/60">
                                {selectedBookings.length} booking{selectedBookings.length === 1 ? '' : 's'} · {formatPeso(selectedRevenue)}
                            </p>
                        </div>

                        <div className="max-h-[520px] divide-y divide-[#101F1A]/5 overflow-y-auto">
                            {selectedBookings.length === 0 ? (
                                <div className="p-6 text-center">
                                    <CalendarDays className="mx-auto text-[#101F1A]/25" size={28} />
                                    <p className="mt-2 text-sm font-bold text-[#101F1A]">No bookings this day</p>
                                    <p className="mt-1 text-xs text-[#101F1A]/60">Pick another date or open the list view to add a booking.</p>
                                </div>
                            ) : (
                                selectedBookings.map((booking) => (
                                    <div key={booking.id} className="p-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101F1A]">
                                                <Clock size={12} />
                                                {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                                            </span>
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS[booking.status]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
                                                {STATUS[booking.status]?.label ?? booking.status}
                                            </span>
                                        </div>

                                        <p className="mt-1.5 text-sm font-bold text-[#101F1A]">{booking.court}</p>

                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#101F1A]/60">
                                            <span className="inline-flex items-center gap-1">
                                                <User size={11} /> {booking.player}
                                            </span>
                                            {facilities.length > 1 && (
                                                <span className="inline-flex items-center gap-1">
                                                    <MapPin size={11} /> {booking.facility}
                                                </span>
                                            )}
                                            <span className="font-bold text-[#101F1A]">{formatPeso(booking.total_price)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

