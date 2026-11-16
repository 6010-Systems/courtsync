import React, { useState, useMemo, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { formatPeso } from '@/Components/MetricCard';
import { Head, Link, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    CalendarDays,
    Clock,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    X,
    Building2,
    CalendarCheck,
    Layers,
    AlertCircle,
    LayoutList,
    User,
    MapPin,
    ArrowUpRight,
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOUR_HEIGHT = 72; // px per hour in grid
const START_HOUR = 6;   // 6:00 AM
const END_HOUR = 23;    // 11:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

/**
 * Status color system:
 * - CONFIRMED: Emerald Green
 * - PENDING: Warm Amber
 * - OPEN_PLAY: Sky Blue
 * - CANCELLED: Soft Rose
 * - COMPLETED: Cool Slate
 */
const STATUS_THEMES = {
    CONFIRMED: {
        cardBg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
        border: 'border-emerald-300 hover:border-emerald-500',
        activeRing: 'border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/20',
        titleColor: 'text-emerald-950',
        timeColor: 'text-emerald-700 font-medium',
        avatarBg: 'bg-emerald-600 text-white',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'Confirmed',
        dot: 'bg-emerald-500',
    },
    PENDING: {
        cardBg: 'bg-amber-50/90 hover:bg-amber-100/90',
        border: 'border-amber-300 hover:border-amber-500',
        activeRing: 'border-2 border-amber-500 shadow-md ring-4 ring-amber-500/20',
        titleColor: 'text-amber-950',
        timeColor: 'text-amber-800 font-medium',
        avatarBg: 'bg-amber-600 text-white',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        label: 'Pending',
        dot: 'bg-amber-400',
    },
    OPEN_PLAY: {
        cardBg: 'bg-sky-50/90 hover:bg-sky-100/90',
        border: 'border-sky-300 hover:border-sky-500',
        activeRing: 'border-2 border-sky-500 shadow-md ring-4 ring-sky-500/20',
        titleColor: 'text-sky-950',
        timeColor: 'text-sky-700 font-medium',
        avatarBg: 'bg-sky-600 text-white',
        badge: 'bg-sky-100 text-sky-900 border-sky-300',
        label: 'Open Play',
        dot: 'bg-sky-500',
    },
    CANCELLED: {
        cardBg: 'bg-rose-50/90 hover:bg-rose-100/90',
        border: 'border-rose-300 hover:border-rose-400',
        activeRing: 'border-2 border-rose-400 shadow-md ring-4 ring-rose-400/20',
        titleColor: 'text-rose-950',
        timeColor: 'text-rose-700 font-medium',
        avatarBg: 'bg-rose-600 text-white',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'Cancelled',
        dot: 'bg-red-400',
    },
    COMPLETED: {
        cardBg: 'bg-slate-100/90 hover:bg-slate-200/90',
        border: 'border-slate-300 hover:border-slate-400',
        activeRing: 'border-2 border-slate-500 shadow-md ring-4 ring-slate-500/20',
        titleColor: 'text-slate-900',
        timeColor: 'text-slate-600 font-medium',
        avatarBg: 'bg-slate-600 text-white',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        label: 'Completed',
        dot: 'bg-slate-400',
    },
};

const getBookingThemeByStatus = (booking) => {
    if (!booking) return STATUS_THEMES.CONFIRMED;
    const rawStatus = (booking.status || '').toUpperCase();
    if (STATUS_THEMES[rawStatus]) {
        return STATUS_THEMES[rawStatus];
    }
    const payStatus = (booking.payment?.status || '').toUpperCase();
    if (payStatus === 'VERIFIED') return STATUS_THEMES.CONFIRMED;
    if (payStatus === 'PENDING') return STATUS_THEMES.PENDING;
    if (payStatus === 'REJECTED') return STATUS_THEMES.CANCELLED;
    return STATUS_THEMES.CONFIRMED;
};

const cleanCourtName = (name) => {
    if (!name) return 'Court';
    return name.replace(/\s*\(.*?\)\s*/g, '').trim();
};

const formatTimeRange = (start, end) => {
    if (!start || !end) return '';
    const [sh, sm] = String(start).split(':');
    const [eh, em] = String(end).split(':');
    const sHour = parseInt(sh, 10);
    const eHour = parseInt(eh, 10);
    const sSuffix = sHour >= 12 ? 'PM' : 'AM';
    const eSuffix = eHour >= 12 ? 'PM' : 'AM';
    const sDisplay = sHour % 12 === 0 ? 12 : sHour % 12;
    const eDisplay = eHour % 12 === 0 ? 12 : eHour % 12;

    if (sSuffix === eSuffix) {
        return `${sDisplay}:${sm} – ${eDisplay}:${em} ${eSuffix}`;
    }
    return `${sDisplay}:${sm} ${sSuffix} – ${eDisplay}:${em} ${eSuffix}`;
};

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Custom Dropdown / Select Component with elevated stacking context
 */
function CustomSelect({
    value,
    onChange,
    options = [],
    icon: Icon,
    className = '',
    align = 'right',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const activeOption = options.find(opt => String(opt.value) === String(value)) || options[0];

    return (
        <div ref={dropdownRef} className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex items-center gap-2 h-8 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 hover:bg-[#F5F2EA] px-2.5 text-xs font-bold text-[#101F1A] shadow-2xs transition-all focus:outline-none cursor-pointer ${
                    isOpen ? 'ring-2 ring-[#101F1A]/10 border-[#101F1A]/30 bg-white' : ''
                }`}
            >
                {Icon && <Icon size={14} className="text-[#101F1A]/60 shrink-0" />}
                <span className="truncate max-w-[130px] sm:max-w-[170px]">
                    {activeOption?.label || 'Select...'}
                </span>
                <ChevronDown
                    size={13}
                    className={`text-[#101F1A]/50 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#101F1A]' : ''
                    }`}
                />
            </button>

            {isOpen && (
                <div
                    className={`absolute z-50 mt-1.5 w-60 max-h-72 overflow-y-auto rounded-xl border border-[#101F1A]/15 bg-white p-1.5 shadow-2xl transition-all dark-scrollbar ${
                        align === 'right' ? 'right-0' : 'left-0'
                    }`}
                >
                    <div className="space-y-0.5">
                        {options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-bold transition-colors cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#101F1A] text-[#D6FF3F]'
                                            : 'text-[#101F1A] hover:bg-[#F5F2EA]'
                                    }`}
                                >
                                    <div className="min-w-0 pr-2">
                                        <div className="truncate">{opt.label}</div>
                                        {opt.hint && (
                                            <div className={`text-[10px] font-normal truncate ${
                                                isSelected ? 'text-[#D6FF3F]/80' : 'text-[#101F1A]/50'
                                            }`}>
                                                {opt.hint}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <Check size={14} className="shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Calendar collision layout algorithm:
 * Distributes overlapping events into non-overlapping sub-column slices.
 */
const layoutDayBookings = (bookings) => {
    if (!bookings || bookings.length === 0) return [];

    const events = bookings.map(b => {
        const [sh, sm] = String(b.start_time).split(':').map(Number);
        const [eh, em] = String(b.end_time).split(':').map(Number);
        return {
            ...b,
            startMin: (sh || 0) * 60 + (sm || 0),
            endMin: (eh || 0) * 60 + (em || 0),
        };
    }).sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    for (const event of events) {
        if (currentCluster.length === 0) {
            currentCluster.push(event);
            clusterEnd = event.endMin;
        } else if (event.startMin < clusterEnd) {
            currentCluster.push(event);
            clusterEnd = Math.max(clusterEnd, event.endMin);
        } else {
            clusters.push(currentCluster);
            currentCluster = [event];
            clusterEnd = event.endMin;
        }
    }
    if (currentCluster.length > 0) {
        clusters.push(currentCluster);
    }

    const laidOutEvents = [];
    for (const cluster of clusters) {
        const columns = [];

        for (const event of cluster) {
            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                if (event.startMin >= columns[i]) {
                    columns[i] = event.endMin;
                    event.colIndex = i;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                event.colIndex = columns.length;
                columns.push(event.endMin);
            }
        }

        const totalCols = columns.length;
        for (const event of cluster) {
            laidOutEvents.push({
                ...event,
                colIndex: event.colIndex,
                totalCols: totalCols,
                styleLeft: `${(event.colIndex / totalCols) * 100}%`,
                styleWidth: `calc(${100 / totalCols}% - 3px)`,
            });
        }
    }

    return laidOutEvents;
};

function StatCard({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-3.5 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">{label}</p>
            <p className="mt-1.5 text-2xl font-black text-[#101F1A]">{value}</p>
            {hint ? <p className="mt-0.5 text-xs text-[#101F1A]/60 truncate">{hint}</p> : null}
        </div>
    );
}

export default function Calendar({ filters = {}, monthLabel, today, bookings = [], facilities = [] }) {
    // Current focused date for calendar
    const [selectedDate, setSelectedDate] = useState(() => (
        today ? new Date(`${today}T12:00:00`) : new Date()
    ));

    // View mode: 'Weekly View', 'Daily View', or 'Month Grid'
    const [viewMode, setViewMode] = useState('Weekly View');
    const [scopeFilter, setScopeFilter] = useState('ALL'); // ALL, CONFIRMED, PENDING
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState(filters?.facility_id || 'ALL');
    
    // In Weekly View, court focus selector
    const [selectedCourtId, setSelectedCourtId] = useState(() => {
        return facilities[0]?.courts?.[0]?.id || 'ALL';
    });
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);
    const [isSidebarExpandedMobile, setIsSidebarExpandedMobile] = useState(false);

    // Live time tracker
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const gridScrollRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (gridScrollRef.current) {
            const nowH = new Date().getHours();
            const targetHour = Math.max(0, Math.min(nowH - START_HOUR - 1, TOTAL_HOURS - 6));
            gridScrollRef.current.scrollTop = targetHour * HOUR_HEIGHT;
        }
    }, [viewMode]);

    // Active facility object and courts
    const activeFacility = useMemo(() => {
        if (selectedFacilityId === 'ALL') {
            return facilities[0] || null;
        }
        return facilities.find(f => String(f.id) === String(selectedFacilityId)) || facilities[0] || null;
    }, [facilities, selectedFacilityId]);

    const activeCourts = useMemo(() => {
        if (selectedFacilityId === 'ALL') {
            return facilities.flatMap(f => f.courts || []);
        }
        return activeFacility?.courts || [];
    }, [facilities, activeFacility, selectedFacilityId]);

    // Week boundaries (Monday through Sunday)
    const weekDays = useMemo(() => {
        const curr = new Date(selectedDate);
        const day = curr.getDay();
        const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(curr.setDate(diff));

        const days = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            days.push(nextDay);
        }
        return days;
    }, [selectedDate]);

    // Mini month matrix calculation
    const miniMonth = useMemo(() => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay();
        const totalDays = lastDayOfMonth.getDate();

        const weeks = [];
        let currentWeek = [];

        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            currentWeek.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i),
            });
        }

        for (let d = 1; d <= totalDays; d++) {
            currentWeek.push({
                day: d,
                isCurrentMonth: true,
                date: new Date(year, month, d),
            });

            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }

        if (currentWeek.length > 0) {
            let nextMonthDay = 1;
            while (currentWeek.length < 7) {
                currentWeek.push({
                    day: nextMonthDay,
                    isCurrentMonth: false,
                    date: new Date(year, month + 1, nextMonthDay),
                });
                nextMonthDay++;
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }, [selectedDate]);

    // Month grid cells for "Month Grid" view
    const [monthGridYear, monthGridMonthNumber] = useMemo(() => {
        if (filters?.month) {
            return filters.month.split('-').map(Number);
        }
        return [selectedDate.getFullYear(), selectedDate.getMonth() + 1];
    }, [filters?.month, selectedDate]);

    const monthGridCells = useMemo(() => {
        const daysInMonth = new Date(monthGridYear, monthGridMonthNumber, 0).getDate();
        const firstWeekday = new Date(monthGridYear, monthGridMonthNumber - 1, 1).getDay();
        const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }
        return cells;
    }, [monthGridYear, monthGridMonthNumber]);

    const bookingsByDate = useMemo(() => {
        const map = new Map();
        bookings.forEach((booking) => {
            const date = String(booking.date).slice(0, 10);
            if (!map.has(date)) map.set(date, []);
            map.get(date).push(booking);
        });
        return map;
    }, [bookings]);

    // Overall month statistics
    const stats = useMemo(() => ({
        total: bookings.length,
        confirmed: bookings.filter((b) => String(b.status).toLowerCase() === 'confirmed').length,
        pending: bookings.filter((b) => String(b.status).toLowerCase() === 'pending').length,
        revenue: bookings
            .filter((b) => String(b.status).toLowerCase() !== 'cancelled')
            .reduce((sum, b) => sum + Number(b.total_price || 0), 0),
    }), [bookings]);

    // Filter bookings based on selections
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (selectedFacilityId !== 'ALL' && String(b.facility_id) !== String(selectedFacilityId)) {
                return false;
            }
            if (viewMode === 'Weekly View' && selectedCourtId !== 'ALL' && String(b.court_id) !== String(selectedCourtId)) {
                return false;
            }
            if (scopeFilter !== 'ALL') {
                const bStatus = (b.status || '').toUpperCase();
                if (scopeFilter === 'CONFIRMED' && bStatus !== 'CONFIRMED') return false;
                if (scopeFilter === 'PENDING' && bStatus !== 'PENDING') return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const userName = b.user?.name?.toLowerCase() || '';
                const guestName = (b.guest_name || b.player || '').toLowerCase();
                const courtName = (b.court?.name || b.court || '').toLowerCase();
                if (!userName.includes(q) && !guestName.includes(q) && !courtName.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [bookings, selectedFacilityId, selectedCourtId, scopeFilter, searchQuery, viewMode]);

    // Selected date ISO string
    const selectedDateIso = selectedDate.toISOString().split('T')[0];
    const selectedDayBookings = useMemo(() => {
        return bookingsByDate.get(selectedDateIso) || [];
    }, [bookingsByDate, selectedDateIso]);

    // Automatically synchronize active booking when selected date changes
    useEffect(() => {
        if (selectedDayBookings.length > 0) {
            setActiveBooking(selectedDayBookings[0]);
        } else {
            setActiveBooking(null);
        }
    }, [selectedDateIso, selectedDayBookings]);

    // Navigation helpers
    const handlePrev = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'Weekly View') {
            next.setDate(next.getDate() - 7);
        } else if (viewMode === 'Daily View') {
            next.setDate(next.getDate() - 1);
        } else {
            next.setMonth(next.getMonth() - 1);
        }
        setSelectedDate(next);
        if (viewMode === 'Month Grid') {
            shiftMonth(-1);
        }
    };

    const handleNext = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'Weekly View') {
            next.setDate(next.getDate() + 7);
        } else if (viewMode === 'Daily View') {
            next.setDate(next.getDate() + 1);
        } else {
            next.setMonth(next.getMonth() + 1);
        }
        setSelectedDate(next);
        if (viewMode === 'Month Grid') {
            shiftMonth(1);
        }
    };

    const handleToday = () => {
        const now = new Date();
        setSelectedDate(now);
        if (viewMode === 'Month Grid') {
            navigateMonth(monthKey(now));
        }
    };

    const navigateMonth = (month, facilityId = selectedFacilityId === 'ALL' ? null : selectedFacilityId) => {
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
        const next = new Date(monthGridYear, monthGridMonthNumber - 1 + delta, 1);
        navigateMonth(monthKey(next));
    };

    const timeToTop = (timeString) => {
        if (!timeString) return 0;
        const [h, m] = String(timeString).split(':').map(Number);
        const minutesFromStart = (h - START_HOUR) * 60 + (m || 0);
        return Math.max(0, (minutesFromStart / 60) * HOUR_HEIGHT);
    };

    const durationToHeight = (startTime, endTime) => {
        if (!startTime || !endTime) return HOUR_HEIGHT;
        const [sh, sm] = String(startTime).split(':').map(Number);
        const [eh, em] = String(endTime).split(':').map(Number);
        const diffMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
        return Math.max(34, (diffMinutes / 60) * HOUR_HEIGHT - 4);
    };

    const formatHourLabel = (h) => {
        const suffix = h >= 12 ? 'PM' : 'AM';
        const display = h % 12 === 0 ? 12 : h % 12;
        return `${display} ${suffix}`;
    };

    const liveTimeTop = useMemo(() => {
        const h = currentTime.getHours();
        const m = currentTime.getMinutes();
        if (h < START_HOUR || h > END_HOUR) return null;
        const mins = (h - START_HOUR) * 60 + m;
        return (mins / 60) * HOUR_HEIGHT;
    }, [currentTime]);

    const liveTimeString = useMemo(() => {
        return currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }, [currentTime]);

    // Add booking form state & real-time collision detection
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        facility_id: facilities[0]?.id || '',
        court_id: facilities[0]?.courts?.[0]?.id || '',
        date: selectedDate.toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '15:00',
        total_price: 350,
        guest_name: '',
    });

    const courtsForSelectedFacility = useMemo(() => {
        const f = facilities.find(fac => String(fac.id) === String(data.facility_id));
        return f?.courts || [];
    }, [facilities, data.facility_id]);

    const conflictBooking = useMemo(() => {
        if (!data.court_id || !data.date || !data.start_time || !data.end_time) {
            return null;
        }

        const normTime = (t) => {
            if (!t) return '00:00:00';
            const parts = String(t).split(':');
            const h = (parts[0] || '00').padStart(2, '0');
            const m = (parts[1] || '00').padStart(2, '0');
            const s = (parts[2] || '00').padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        const reqStart = normTime(data.start_time);
        const reqEnd = normTime(data.end_time);

        if (reqStart >= reqEnd) return null;

        return bookings.find(b => {
            if (String(b.court_id) !== String(data.court_id)) return false;
            if (b.date !== data.date) return false;

            const status = (b.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'rejected') return false;

            const bStart = normTime(b.start_time);
            const bEnd = normTime(b.end_time);

            return reqStart < bEnd && reqEnd > bStart;
        }) || null;
    }, [bookings, data.court_id, data.date, data.start_time, data.end_time]);

    const isTimeOrderInvalid = useMemo(() => {
        if (!data.start_time || !data.end_time) return false;
        return data.start_time >= data.end_time;
    }, [data.start_time, data.end_time]);

    const submitAddBooking = (e) => {
        e.preventDefault();
        if (conflictBooking || isTimeOrderInvalid) return;
        post(route('bookings.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    // Dropdown options
    const facilityOptions = useMemo(() => {
        return [
            { value: 'ALL', label: 'All Venues', hint: `${facilities.length} locations` },
            ...facilities.map(f => ({
                value: f.id,
                label: f.name,
                hint: `${f.courts?.length || 0} courts available`,
            })),
        ];
    }, [facilities]);

    const viewOptions = [
        { value: 'Weekly View', label: 'Weekly View', hint: '7-day court schedule grid' },
        { value: 'Daily View', label: 'Daily View', hint: 'All courts side-by-side' },
        { value: 'Month Grid', label: 'Month Grid', hint: 'Full month overview' },
    ];

    const activeTheme = activeBooking ? getBookingThemeByStatus(activeBooking) : STATUS_THEMES.CONFIRMED;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Calendar"
                    subtitle="Interactive court schedules with multi-view timetable and conflict prevention"
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

            <div className="w-full space-y-3.5 pb-6">

                {/* ── KPI Strip (Aligned with Current Layout) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                    <StatCard label="Bookings" value={stats.total} hint={monthLabel || 'All active'} />
                    <StatCard label="Confirmed" value={stats.confirmed} hint={`${stats.pending} awaiting review`} />
                    <StatCard label="Pending" value={stats.pending} hint="Requires verification" />
                    <StatCard label="Booking Value" value={formatPeso(stats.revenue)} hint="Excludes cancellations" />
                </div>

                {/* ── Action Toolbar: Cockpit Controls (Elevated Stacking Context over Grid) ── */}
                <div className="relative z-50 rounded-xl border border-[#101F1A]/10 bg-white/95 p-3 sm:p-3.5 shadow-card backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    
                    {/* Left: Month / Date Title & Navigation */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] shadow-2xs">
                            <CalendarIcon size={16} strokeWidth={2.4} />
                        </div>
                        <div className="min-w-0 pr-2">
                            <h2 className="text-sm sm:text-base font-black tracking-tight text-[#101F1A] truncate">
                                {viewMode === 'Month Grid'
                                    ? (monthLabel || selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
                                    : selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                }
                            </h2>
                            <p className="text-[11px] font-medium text-[#101F1A]/60 truncate">
                                {viewMode === 'Weekly View' && '7-Day Court Schedule'}
                                {viewMode === 'Daily View' && selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                {viewMode === 'Month Grid' && 'Full Month Matrix View'}
                            </p>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center gap-1 border-l border-[#101F1A]/10 pl-2 ml-1">
                            <button
                                onClick={handlePrev}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#101F1A]/10 bg-white text-[#101F1A] shadow-2xs transition-all hover:bg-[#F5F2EA] focus:outline-none cursor-pointer"
                                title="Previous"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="inline-flex h-8 items-center px-2.5 rounded-lg border border-[#101F1A]/10 bg-white text-xs font-bold text-[#101F1A] shadow-2xs transition-all hover:bg-[#F5F2EA] focus:outline-none cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#101F1A]/10 bg-white text-[#101F1A] shadow-2xs transition-all hover:bg-[#F5F2EA] focus:outline-none cursor-pointer"
                                title="Next"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>

                    {/* Right Controls: Facility Filter, Scope Filter, View Switcher & Add Button */}
                    <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Venue selector */}
                        {facilities.length > 1 && (
                            <CustomSelect
                                value={selectedFacilityId}
                                onChange={setSelectedFacilityId}
                                options={facilityOptions}
                                icon={Building2}
                                align="left"
                            />
                        )}

                        {/* Court filter (Weekly View) */}
                        {viewMode === 'Weekly View' && activeCourts.length > 1 && (
                            <CustomSelect
                                value={selectedCourtId}
                                onChange={setSelectedCourtId}
                                options={[
                                    { value: 'ALL', label: 'All Courts', hint: 'Merged stack' },
                                    ...activeCourts.map(c => ({
                                        value: c.id,
                                        label: c.name,
                                        hint: c.type || 'Court',
                                    })),
                                ]}
                                align="left"
                            />
                        )}

                        {/* Status Legend / Quick Filter (Consistent Height, Background & Stacking) */}
                        <div className="hidden sm:inline-flex items-center h-8 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 p-0.5 text-xs font-bold shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setScopeFilter('ALL')}
                                className={`h-7 px-2.5 rounded-md text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                                    scopeFilter === 'ALL'
                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-2xs'
                                        : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-[#101F1A]/5'
                                }`}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                onClick={() => setScopeFilter(scopeFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
                                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                                    scopeFilter === 'CONFIRMED'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'text-emerald-800 hover:bg-emerald-500/10'
                                }`}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Confirmed
                            </button>
                            <button
                                type="button"
                                onClick={() => setScopeFilter(scopeFilter === 'PENDING' ? 'ALL' : 'PENDING')}
                                className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-bold transition-all focus:outline-none cursor-pointer ${
                                    scopeFilter === 'PENDING'
                                        ? 'bg-amber-500 text-white shadow-2xs'
                                        : 'text-amber-800 hover:bg-amber-500/10'
                                }`}
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                Pending
                            </button>
                        </div>

                        {/* View Switcher: Toggle between Weekly, Daily, and Month Grid */}
                        <CustomSelect
                            value={viewMode}
                            onChange={setViewMode}
                            options={viewOptions}
                            icon={Layers}
                        />

                        {/* Add Event Primary Action Button */}
                        <button
                            onClick={() => {
                                clearErrors();
                                setIsAddModalOpen(true);
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-all hover:bg-[#162923] focus:outline-none cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={2.4} />
                            <span>Add Event</span>
                        </button>
                    </div>
                </div>

                {/* ── UNIFIED 2-COLUMN LAYOUT: Left Sidebar Always Anchored on the Left ── */}
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch lg:h-[calc(100vh-250px)] min-h-[580px]">
                    
                    {/* ── LEFT SIDEBAR (Mini Calendar + Active Booking Inspector Card) ── */}
                    <div className={`lg:col-span-4 xl:col-span-3 lg:h-full lg:flex lg:flex-col gap-3.5 min-h-0 ${
                        isSidebarExpandedMobile ? 'block' : 'hidden lg:flex'
                    }`}>
                        {/* 1. Mini Month Calendar (Always on the Left) */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md shrink-0">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <button
                                    onClick={() => {
                                        const next = new Date(selectedDate);
                                        next.setMonth(next.getMonth() - 1);
                                        setSelectedDate(next);
                                    }}
                                    className="p-1 rounded-md text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-[#F5F2EA] transition-colors cursor-pointer"
                                    title="Previous Month"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="font-bold text-xs sm:text-sm text-[#101F1A]">
                                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button
                                    onClick={() => {
                                        const next = new Date(selectedDate);
                                        next.setMonth(next.getMonth() + 1);
                                        setSelectedDate(next);
                                    }}
                                    className="p-1 rounded-md text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-[#F5F2EA] transition-colors cursor-pointer"
                                    title="Next Month"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-7 text-center mb-1.5 text-[11px] font-bold text-[#101F1A]/50">
                                <span>Su</span>
                                <span>Mo</span>
                                <span>Tu</span>
                                <span>We</span>
                                <span>Th</span>
                                <span>Fr</span>
                                <span>Sa</span>
                            </div>

                            <div className="space-y-1">
                                {miniMonth.map((week, wIndex) => (
                                    <div key={wIndex} className="grid grid-cols-7 text-center gap-1">
                                        {week.map((dayObj, dIndex) => {
                                            const isSelected =
                                                dayObj.isCurrentMonth &&
                                                dayObj.date.toDateString() === selectedDate.toDateString();
                                            const isToday =
                                                dayObj.date.toDateString() === new Date().toDateString();
                                            const dateString = dayObj.date.toISOString().split('T')[0];
                                            const hasBookings = filteredBookings.some(b => b.date === dateString);

                                            return (
                                                <button
                                                    key={dIndex}
                                                    onClick={() => setSelectedDate(dayObj.date)}
                                                    className={`h-7 w-7 sm:h-8 sm:w-8 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative ${
                                                        isSelected
                                                            ? 'bg-[#101F1A] text-white shadow-xs'
                                                            : isToday
                                                            ? 'border-2 border-[#101F1A] text-[#101F1A]'
                                                            : dayObj.isCurrentMonth
                                                            ? 'text-[#101F1A] hover:bg-[#F5F2EA]'
                                                            : 'text-[#101F1A]/20 pointer-events-none'
                                                    }`}
                                                >
                                                    <span>{dayObj.day}</span>
                                                    {hasBookings && !isSelected && (
                                                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#101F1A]/60" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Active Event Inspector Card (Matching Image & Design Reference) */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-4 shadow-card backdrop-blur-md">
                            <AnimatePresence mode="wait" initial={false}>
                                {activeBooking ? (
                                    <motion.div
                                        key={activeBooking.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.16, ease: 'easeOut' }}
                                        className="space-y-3.5"
                                    >
                                        {/* Header: Host / Match Name + Status Color Badge */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-base text-[#101F1A] tracking-tight truncate">
                                                    {activeBooking.user?.name || activeBooking.guest_name || activeBooking.player || 'Match Reservation'}
                                                </h3>
                                                <p className="text-xs text-[#101F1A]/60 font-medium truncate mt-0.5">
                                                    {activeBooking.court?.name || activeBooking.court || 'Court'} · {activeBooking.facility?.name || activeBooking.facility}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${activeTheme.badge}`}>
                                                {activeTheme.label || activeBooking.status || 'Confirmed'}
                                            </span>
                                        </div>

                                        {/* Date & Time Row with Status Color Tint */}
                                        <div className={`flex items-center gap-2.5 text-xs font-semibold p-2.5 rounded-lg border ${activeTheme.cardBg} ${activeTheme.border}`}>
                                            <Clock size={14} className="text-[#101F1A]/50 shrink-0" />
                                            <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                                                <span className="truncate">
                                                    {activeBooking.date} · {formatTimeRange(activeBooking.start_time, activeBooking.end_time)}
                                                </span>
                                                <span className="font-black text-[#101F1A] shrink-0">
                                                    ₱{Number(activeBooking.total_price || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Court & Payment Specifications Grid */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#101F1A]/5">
                                                <span className="text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider block">
                                                    Sport / Surface
                                                </span>
                                                <span className="font-bold text-[#101F1A] truncate block mt-0.5">
                                                    {activeBooking.court_type || activeBooking.court?.type || 'Standard Court'}
                                                </span>
                                            </div>
                                            <div className="bg-[#FAF9F5] p-2 rounded-lg border border-[#101F1A]/5">
                                                <span className="text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider block">
                                                    Payment
                                                </span>
                                                <span className="font-bold text-[#101F1A] uppercase truncate block mt-0.5">
                                                    {activeBooking.payment?.payment_method || activeBooking.payment_method || 'Venue Pay'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Player Info Row with Status Avatar Accent */}
                                        <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#101F1A]/5 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs ${activeTheme.avatarBg}`}>
                                                    {(activeBooking.user?.name || activeBooking.guest_name || activeBooking.player || 'P')[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-[#101F1A] truncate">
                                                        {activeBooking.user?.name || activeBooking.guest_name || activeBooking.player || 'Player'}
                                                    </div>
                                                    <div className="text-[10px] text-[#101F1A]/50 truncate">
                                                        {activeBooking.user?.email || 'Walk-in Match'}
                                                    </div>
                                                </div>
                                            </div>
                                            {activeBooking.payment?.reference_number && (
                                                <span className="text-[10px] font-mono text-[#101F1A]/60 bg-white px-2 py-0.5 rounded border border-[#101F1A]/10 shrink-0">
                                                    #{activeBooking.payment.reference_number.slice(-6)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Purposeful Actions */}
                                        <div className="pt-3 border-t border-[#101F1A]/8 flex items-center gap-2">
                                            <button
                                                onClick={() => router.visit(route('facility.bookings'))}
                                                className="flex-1 py-1.5 rounded-lg bg-[#101F1A] text-[#D6FF3F] text-xs font-bold text-center hover:bg-[#162923] transition-colors cursor-pointer"
                                            >
                                                Manage Booking
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Cancel this booking reservation?')) {
                                                        router.delete(route('bookings.destroy', activeBooking.id));
                                                    }
                                                }}
                                                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-700 text-xs font-bold text-center hover:bg-rose-100 transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty-inspector"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-8"
                                    >
                                        <CalendarIcon className="mx-auto text-[#101F1A]/30 mb-2" size={28} />
                                        <p className="text-xs font-bold text-[#101F1A]">No event selected</p>
                                        <p className="text-[11px] text-[#101F1A]/50 mt-0.5">Click any court card to inspect</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── RIGHT MAIN PANEL (Animated View Transition between Month Grid & Timetable) ── */}
                    <div className="lg:col-span-8 xl:col-span-9 rounded-xl border border-[#101F1A]/10 bg-white shadow-card overflow-hidden flex flex-col h-[540px] sm:h-[620px] lg:h-full">
                        <AnimatePresence mode="wait" initial={false}>
                            {viewMode === 'Month Grid' ? (
                                /* ── VIEW 1: MONTH GRID SURFACE ── */
                                <motion.div
                                    key="month-grid-view"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                                    className="h-full flex flex-col overflow-hidden"
                                >
                                    <div className="flex-1 overflow-y-auto dark-scrollbar flex flex-col">
                                        {/* Month Grid Header (Sun - Sat) - Sticky inside scroll container */}
                                        <div className="sticky top-0 z-20 grid grid-cols-7 border-b border-[#101F1A]/10 bg-[#FAF9F5] shrink-0 shadow-2xs">
                                            {WEEKDAYS.map((day) => (
                                                <div key={day} className="px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Month Grid 7-Column Cells */}
                                        <div className="flex-1 grid grid-cols-7">
                                            {monthGridCells.map((day, index) => {
                                                if (day === null) {
                                                    return (
                                                        <div
                                                            key={`empty-${index}`}
                                                            className="min-h-[96px] border-b border-r border-[#101F1A]/5 bg-[#101F1A]/[0.015]"
                                                        />
                                                    );
                                                }

                                                const dateKey = `${String(monthGridYear)}-${String(monthGridMonthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                                const dayBookings = bookingsByDate.get(dateKey) ?? [];
                                                const dayRevenue = dayBookings
                                                    .filter((booking) => String(booking.status).toLowerCase() !== 'cancelled')
                                                    .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);
                                                const isSelectedDay = dateKey === selectedDateIso;
                                                const isTodayCell = dateKey === today;

                                                return (
                                                    <button
                                                        key={dateKey}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedDate(new Date(`${dateKey}T12:00:00`));
                                                        }}
                                                        className={`min-h-[110px] sm:min-h-[120px] border-b border-r border-[#101F1A]/8 p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between group ${
                                                            isSelectedDay
                                                                ? 'bg-emerald-500/[0.08] ring-2 ring-inset ring-emerald-500/40'
                                                                : 'hover:bg-[#101F1A]/[0.02]'
                                                        }`}
                                                    >
                                                        {/* Cell Header: Day Number */}
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black transition-transform group-hover:scale-105 ${
                                                                    isTodayCell
                                                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-2xs'
                                                                        : isSelectedDay
                                                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                                                        : 'text-[#101F1A]'
                                                                }`}
                                                            >
                                                                {day}
                                                            </span>
                                                        </div>

                                                        {/* Day bookings pills */}
                                                        <div className="my-1.5 space-y-1 w-full">
                                                            {dayBookings.slice(0, 2).map((booking) => {
                                                                const theme = getBookingThemeByStatus(booking);
                                                                return (
                                                                    <div
                                                                        key={booking.id}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedDate(new Date(`${dateKey}T12:00:00`));
                                                                            setActiveBooking(booking);
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/80 hover:bg-white border border-[#101F1A]/6 hover:border-[#101F1A]/15 shadow-2xs truncate text-[10px] font-bold text-[#101F1A] transition-all cursor-pointer"
                                                                    >
                                                                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} />
                                                                        <span className="truncate">{booking.start_time?.slice(0, 5)} · {cleanCourtName(booking.court?.name || booking.court)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                            {dayBookings.length > 2 && (
                                                                <p className="text-[10px] font-bold text-[#101F1A]/50 pl-1">
                                                                    +{dayBookings.length - 2} more
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Prominent Total Booking Amount & Count Footer */}
                                                        {dayBookings.length > 0 ? (
                                                            <div className="mt-auto pt-1.5 border-t border-[#101F1A]/8 flex items-center justify-between gap-1 w-full">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-black tracking-tight shadow-2xs truncate ${
                                                                    dayRevenue > 0
                                                                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                }`}>
                                                                    {formatPeso(dayRevenue)}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-[#101F1A]/60 shrink-0">
                                                                    {dayBookings.length} {dayBookings.length === 1 ? 'booking' : 'bookings'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="mt-auto" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                /* ── VIEW 2: TIMETABLE SCHEDULE SURFACE (Weekly & Daily) ── */
                                <motion.div
                                    key={viewMode}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                                    className="h-full flex flex-col overflow-hidden"
                                >
                                    {/* Scrollable Hours Matrix with Live Time Line */}
                                    <div ref={gridScrollRef} className="flex-1 overflow-y-auto relative dark-scrollbar select-none flex flex-col">
                                        {/* Sticky Column Header - Inside scroll container for 1:1 column alignment */}
                                        <div className="sticky top-0 z-20 flex border-b border-[#101F1A]/10 bg-[#FAF9F5] select-none shrink-0 shadow-2xs">
                                            <div className="w-14 sm:w-16 shrink-0 border-r border-[#101F1A]/10 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/40" />

                                            {viewMode === 'Weekly View' ? (
                                                <div className="flex-1 grid grid-cols-7 divide-x divide-[#101F1A]/10">
                                                    {weekDays.map((dayDate, i) => {
                                                        const isSelectedDay = dayDate.toDateString() === selectedDate.toDateString();
                                                        const isToday = dayDate.toDateString() === new Date().toDateString();
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => setSelectedDate(dayDate)}
                                                                className={`py-2 px-1 text-center transition-all cursor-pointer focus:outline-none ${
                                                                    isSelectedDay
                                                                        ? 'bg-emerald-500/10'
                                                                        : isToday
                                                                        ? 'bg-emerald-500/[0.04]'
                                                                        : 'hover:bg-black/[0.02]'
                                                                }`}
                                                            >
                                                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${
                                                                    isSelectedDay ? 'text-emerald-950 font-black' : 'text-[#101F1A]/50'
                                                                }`}>
                                                                    {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                                                                </span>
                                                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black mt-0.5 ${
                                                                    isToday
                                                                        ? 'bg-[#101F1A] text-[#D6FF3F]'
                                                                        : isSelectedDay
                                                                        ? 'bg-emerald-600 text-white'
                                                                        : 'text-[#101F1A]'
                                                                }`}>
                                                                    {dayDate.getDate()}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex divide-x divide-[#101F1A]/10 overflow-x-auto hide-scrollbar">
                                                    {activeCourts.map(court => (
                                                        <div key={court.id} className="flex-1 min-w-[160px] py-2 px-3 text-left">
                                                            <span className="block text-xs font-black text-[#101F1A] truncate">
                                                                {cleanCourtName(court.name)}
                                                            </span>
                                                            <span className="text-[10px] font-semibold text-[#101F1A]/50 uppercase tracking-wider">
                                                                {court.type || 'Court'} · ₱{Number(court.hourly_rate || court.day_rate || 0)}/hr
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className="relative flex shrink-0"
                                            style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                                        >
                                            {/* Left Gutter: Hourly Markers */}
                                            <div className="w-14 sm:w-16 shrink-0 border-r border-[#101F1A]/10 bg-[#FAF9F5]/40 relative">
                                                {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                                    const hour = START_HOUR + i;
                                                    return (
                                                        <div
                                                            key={hour}
                                                            style={{ top: `${i * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                                                            className="absolute inset-x-0 border-b border-[#101F1A]/8 px-1.5 pt-1 text-right text-[10px] font-bold text-[#101F1A]/40"
                                                        >
                                                            {formatHourLabel(hour)}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Live Current Time Line Indicator */}
                                            {liveTimeTop !== null && (
                                                <div
                                                    style={{ top: `${liveTimeTop}px` }}
                                                    className="absolute inset-x-0 z-10 pointer-events-none flex items-center"
                                                >
                                                    <div className="w-14 sm:w-16 text-right pr-1">
                                                        <span className="bg-rose-500 text-white font-black text-[9px] px-1 py-0.5 rounded shadow-xs">
                                                            {liveTimeString}
                                                        </span>
                                                    </div>
                                                    <div className="h-[2px] flex-1 bg-rose-500 shadow-xs relative">
                                                        <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Timetable Grid Columns */}
                                            {viewMode === 'Weekly View' ? (
                                                <div className="flex-1 grid grid-cols-7 divide-x divide-[#101F1A]/10 relative">
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                style={{ top: `${i * HOUR_HEIGHT}px` }}
                                                                className="absolute inset-x-0 border-b border-[#101F1A]/6"
                                                            />
                                                        ))}
                                                    </div>

                                                    {weekDays.map((dayDate, dayIndex) => {
                                                        const dayIso = dayDate.toISOString().split('T')[0];
                                                        const rawDayBookings = filteredBookings.filter(b => b.date === dayIso);
                                                        const dayBookings = layoutDayBookings(rawDayBookings);
                                                        const isToday = dayDate.toDateString() === new Date().toDateString();

                                                        return (
                                                            <div
                                                                key={dayIndex}
                                                                className={`relative h-full transition-colors hover:bg-black/[0.01] ${
                                                                    isToday ? 'bg-emerald-500/[0.015]' : ''
                                                                }`}
                                                                onClick={(e) => {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const offsetY = e.clientY - rect.top;
                                                                    const clickedHour = Math.max(START_HOUR, Math.min(END_HOUR - 1, Math.floor(offsetY / HOUR_HEIGHT) + START_HOUR));
                                                                    const startStr = `${String(clickedHour).padStart(2, '0')}:00`;
                                                                    const endStr = `${String(clickedHour + 1).padStart(2, '0')}:00`;

                                                                    const targetFacilityId = selectedFacilityId !== 'ALL'
                                                                        ? selectedFacilityId
                                                                        : (facilities[0]?.id || data.facility_id);

                                                                    const facCourts = facilities.find(f => String(f.id) === String(targetFacilityId))?.courts || [];
                                                                    const targetCourtId = selectedCourtId !== 'ALL'
                                                                        ? selectedCourtId
                                                                        : (facCourts[0]?.id || data.court_id);

                                                                    const currentCourt = facCourts.find(c => String(c.id) === String(targetCourtId));
                                                                    const defaultPrice = currentCourt?.hourly_rate || currentCourt?.day_rate || 350;

                                                                    clearErrors();
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        facility_id: targetFacilityId,
                                                                        court_id: targetCourtId,
                                                                        date: dayIso,
                                                                        start_time: startStr,
                                                                        end_time: endStr,
                                                                        total_price: defaultPrice,
                                                                    }));
                                                                    setIsAddModalOpen(true);
                                                                }}
                                                            >
                                                                {dayBookings.map((booking) => {
                                                                    const top = timeToTop(booking.start_time);
                                                                    const height = durationToHeight(booking.start_time, booking.end_time);
                                                                    const theme = getBookingThemeByStatus(booking);
                                                                    const isSelected = activeBooking?.id === booking.id;

                                                                    return (
                                                                        <div
                                                                            key={booking.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveBooking(booking);
                                                                            }}
                                                                            style={{
                                                                                top: `${top}px`,
                                                                                height: `${height}px`,
                                                                                left: booking.styleLeft || '4px',
                                                                                width: booking.styleWidth || 'calc(100% - 8px)',
                                                                            }}
                                                                            className={`absolute z-10 rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-left ${theme.cardBg} ${theme.border} ${
                                                                                isSelected
                                                                                    ? `${theme.activeRing} -translate-y-0.5 z-15`
                                                                                    : 'shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                                                                            }`}
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <h4 className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${theme.titleColor}`}>
                                                                                    {booking.user?.name || booking.guest_name || booking.player || 'Court Match'}
                                                                                </h4>
                                                                                <p className={`text-[11px] truncate mt-0.5 ${theme.timeColor}`}>
                                                                                    {formatTimeRange(booking.start_time, booking.end_time)}
                                                                                </p>
                                                                            </div>

                                                                            <div className="flex items-center -space-x-1.5 mt-auto pt-1.5">
                                                                                <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white shadow-2xs ${theme.avatarBg}`}>
                                                                                    {(booking.user?.name || booking.guest_name || booking.player || 'P')[0]}
                                                                                </div>
                                                                                {booking.user?.avatar && (
                                                                                    <img src={booking.user.avatar} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white object-cover" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                /* Daily View Timetable Grid (Columns = Courts) */
                                                <div className="flex-1 flex divide-x divide-[#101F1A]/8 relative">
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                style={{ top: `${i * HOUR_HEIGHT}px` }}
                                                                className="absolute inset-x-0 border-b border-[#101F1A]/6"
                                                            />
                                                        ))}
                                                    </div>

                                                    {activeCourts.map(court => {
                                                        const dayIso = selectedDate.toISOString().split('T')[0];
                                                        const courtBookings = filteredBookings.filter(
                                                            b => b.date === dayIso && String(b.court_id) === String(court.id)
                                                        );

                                                        return (
                                                            <div
                                                                key={court.id}
                                                                className="flex-1 min-w-[160px] relative h-full transition-colors hover:bg-black/[0.01]"
                                                                onClick={(e) => {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const offsetY = e.clientY - rect.top;
                                                                    const clickedHour = Math.max(START_HOUR, Math.min(END_HOUR - 1, Math.floor(offsetY / HOUR_HEIGHT) + START_HOUR));
                                                                    const startStr = `${String(clickedHour).padStart(2, '0')}:00`;
                                                                    const endStr = `${String(clickedHour + 1).padStart(2, '0')}:00`;

                                                                    const defaultPrice = court.hourly_rate || court.day_rate || 350;

                                                                    clearErrors();
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        facility_id: court.facility_id || prev.facility_id,
                                                                        court_id: court.id,
                                                                        date: dayIso,
                                                                        start_time: startStr,
                                                                        end_time: endStr,
                                                                        total_price: defaultPrice,
                                                                    }));
                                                                    setIsAddModalOpen(true);
                                                                }}
                                                            >
                                                                {courtBookings.map(booking => {
                                                                    const top = timeToTop(booking.start_time);
                                                                    const height = durationToHeight(booking.start_time, booking.end_time);
                                                                    const theme = getBookingThemeByStatus(booking);
                                                                    const isSelected = activeBooking?.id === booking.id;

                                                                    return (
                                                                        <div
                                                                            key={booking.id}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveBooking(booking);
                                                                            }}
                                                                            style={{
                                                                                top: `${top}px`,
                                                                                height: `${height}px`,
                                                                            }}
                                                                            className={`absolute inset-x-1.5 z-10 rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-left ${theme.cardBg} ${theme.border} ${
                                                                                isSelected
                                                                                    ? `${theme.activeRing} -translate-y-0.5 z-15`
                                                                                    : 'shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                                                                            }`}
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <h4 className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${theme.titleColor}`}>
                                                                                    {booking.user?.name || booking.guest_name || booking.player || 'Court Match'}
                                                                                </h4>
                                                                                <p className={`text-[11px] truncate mt-0.5 ${theme.timeColor}`}>
                                                                                    {formatTimeRange(booking.start_time, booking.end_time)}
                                                                                </p>
                                                                            </div>

                                                                            <div className="flex items-center -space-x-1.5 mt-auto pt-1.5">
                                                                                <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white shadow-2xs ${theme.avatarBg}`}>
                                                                                    {(booking.user?.name || booking.guest_name || booking.player || 'P')[0]}
                                                                                </div>
                                                                                {booking.user?.avatar && (
                                                                                    <img src={booking.user.avatar} alt="" className="h-5 w-5 sm:h-6 sm:w-6 rounded-full ring-2 ring-white object-cover" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Add Event / Booking Modal with Automated Collision Prevention ── */}
            <Modal show={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} maxWidth="md">
                <form onSubmit={submitAddBooking} className="p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#101F1A]/10">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center">
                                <Plus size={16} strokeWidth={2.4} />
                            </div>
                            <h3 className="text-base font-bold text-[#101F1A]">Schedule Court Booking</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="p-1 rounded-md text-[#101F1A]/40 hover:text-[#101F1A] cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Conflict Alert Banner */}
                    {(conflictBooking || errors.conflict) && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/95 p-3.5 text-xs text-rose-950 shadow-2xs">
                            <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                                <p className="font-bold text-rose-950">
                                    {errors.conflict ? 'Booking Collision' : 'Time Conflict Detected'}
                                </p>
                                <p className="text-[11px] leading-relaxed text-rose-800">
                                    {errors.conflict ? (
                                        errors.conflict
                                    ) : (
                                        <>
                                            This court is already reserved by{' '}
                                            <strong className="font-bold text-rose-950">
                                                {conflictBooking.user?.name || conflictBooking.guest_name || conflictBooking.player || 'Another Player'}
                                            </strong>{' '}
                                            from{' '}
                                            <strong className="font-bold text-rose-950">
                                                {formatTimeRange(conflictBooking.start_time, conflictBooking.end_time)}
                                            </strong>
                                            {conflictBooking.status && (
                                                <span className="ml-1.5 inline-block uppercase text-[10px] font-bold px-1.5 py-0.5 bg-rose-200/80 text-rose-900 rounded">
                                                    {conflictBooking.status}
                                                </span>
                                            )}
                                            . Please select a different time or court.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Time Order Validation Alert */}
                    {isTimeOrderInvalid && (
                        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/95 p-3 text-xs text-amber-950 shadow-2xs">
                            <AlertCircle size={16} className="text-amber-600 shrink-0" />
                            <p className="text-[11px] text-amber-900 font-medium">
                                The end time must be after the start time.
                            </p>
                        </div>
                    )}

                    {/* Facility Selector */}
                    <div>
                        <InputLabel value="Venue" />
                        <select
                            value={data.facility_id}
                            onChange={(e) => {
                                const newFacId = e.target.value;
                                const fac = facilities.find(f => String(f.id) === String(newFacId));
                                const nextCourt = fac?.courts?.[0];
                                setData(prev => ({
                                    ...prev,
                                    facility_id: newFacId,
                                    court_id: nextCourt?.id || '',
                                    total_price: nextCourt?.hourly_rate || nextCourt?.day_rate || prev.total_price,
                                }));
                            }}
                            className="mt-1 block w-full rounded-lg border border-[#101F1A]/15 bg-white py-2 px-3 text-xs font-bold text-[#101F1A] focus:border-[#101F1A] focus:ring-[#101F1A]/10"
                        >
                            {facilities.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.facility_id} className="mt-1" />
                    </div>

                    {/* Court Selector */}
                    <div>
                        <InputLabel value="Court" />
                        <select
                            value={data.court_id}
                            onChange={(e) => {
                                const newCourtId = e.target.value;
                                const c = courtsForSelectedFacility.find(crt => String(crt.id) === String(newCourtId));
                                setData(prev => ({
                                    ...prev,
                                    court_id: newCourtId,
                                    total_price: c?.hourly_rate || c?.day_rate || prev.total_price,
                                }));
                            }}
                            className="mt-1 block w-full rounded-lg border border-[#101F1A]/15 bg-white py-2 px-3 text-xs font-bold text-[#101F1A] focus:border-[#101F1A] focus:ring-[#101F1A]/10"
                        >
                            {courtsForSelectedFacility.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                            ))}
                        </select>
                        <InputError message={errors.court_id} className="mt-1" />
                    </div>

                    {/* Date */}
                    <div>
                        <InputLabel value="Date" />
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-[#101F1A]/15 bg-white py-2 px-3 text-xs font-bold text-[#101F1A] focus:border-[#101F1A] focus:ring-[#101F1A]/10"
                        />
                        <InputError message={errors.date} className="mt-1" />
                    </div>

                    {/* Start & End Times */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <InputLabel value="Start Time" />
                            <input
                                type="time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border bg-white py-2 px-3 text-xs font-bold transition-colors ${
                                    conflictBooking || errors.start_time || isTimeOrderInvalid
                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 text-rose-950 bg-rose-50/20'
                                        : 'border-[#101F1A]/15 text-[#101F1A] focus:border-[#101F1A] focus:ring-[#101F1A]/10'
                                }`}
                            />
                            <InputError message={errors.start_time} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value="End Time" />
                            <input
                                type="time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className={`mt-1 block w-full rounded-lg border bg-white py-2 px-3 text-xs font-bold transition-colors ${
                                    conflictBooking || errors.end_time || isTimeOrderInvalid
                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 text-rose-950 bg-rose-50/20'
                                        : 'border-[#101F1A]/15 text-[#101F1A] focus:border-[#101F1A] focus:ring-[#101F1A]/10'
                                }`}
                            />
                            <InputError message={errors.end_time} className="mt-1" />
                        </div>
                    </div>

                    {/* Guest Name */}
                    <div>
                        <InputLabel value="Player / Host Name" />
                        <TextInput
                            type="text"
                            value={data.guest_name}
                            onChange={(e) => setData('guest_name', e.target.value)}
                            placeholder="e.g. Juan Dela Cruz"
                            className="mt-1 block w-full text-xs"
                        />
                        <InputError message={errors.guest_name} className="mt-1" />
                    </div>

                    {/* Total Price */}
                    <div>
                        <InputLabel value="Total Price (₱)" />
                        <TextInput
                            type="number"
                            value={data.total_price}
                            onChange={(e) => setData('total_price', e.target.value)}
                            className="mt-1 block w-full text-xs font-bold"
                        />
                        <InputError message={errors.total_price} className="mt-1" />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-[#101F1A]/15 text-xs font-bold text-[#101F1A] hover:bg-[#F5F2EA] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <PrimaryButton
                            disabled={processing || Boolean(conflictBooking) || isTimeOrderInvalid}
                            className="!bg-[#101F1A] text-[#D6FF3F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {conflictBooking ? 'Slot Unavailable' : 'Schedule Event'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
