import React, { useState, useMemo, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, router, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import {
    Calendar as CalendarIcon,
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
} from 'lucide-react';

const HOUR_HEIGHT = 72; // px per hour in grid
const START_HOUR = 6;   // 6:00 AM
const END_HOUR = 23;    // 11:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

/**
 * Semantic status-driven color system.
 * Each booking card color directly corresponds to its reservation & verification status:
 * - CONFIRMED: Emerald Green (verified payment, active match)
 * - PENDING: Warm Amber (pending payment, reservation hold)
 * - OPEN_PLAY: Sky Blue (community match, open drop-in)
 * - CANCELLED: Soft Rose (cancelled booking, rejected payment)
 * - COMPLETED: Cool Slate (past concluded match)
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
    },
    PENDING: {
        cardBg: 'bg-amber-50/90 hover:bg-amber-100/90',
        border: 'border-amber-300 hover:border-amber-500',
        activeRing: 'border-2 border-amber-500 shadow-md ring-4 ring-amber-500/20',
        titleColor: 'text-amber-950',
        timeColor: 'text-amber-800 font-medium',
        avatarBg: 'bg-amber-600 text-white',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        label: 'Pending Hold',
    },
    OPEN_PLAY: {
        cardBg: 'bg-sky-50/90 hover:bg-sky-100/90',
        border: 'border-sky-300 hover:border-sky-500',
        activeRing: 'border-2 border-sky-500 shadow-md ring-4 ring-sky-500/20',
        titleColor: 'text-sky-950',
        timeColor: 'text-sky-700 font-medium',
        avatarBg: 'bg-sky-600 text-white',
        badge: 'bg-sky-100 text-sky-800 border-sky-300',
        label: 'Open Play',
    },
    CANCELLED: {
        cardBg: 'bg-rose-50/90 hover:bg-rose-100/90',
        border: 'border-rose-300 hover:border-rose-400',
        activeRing: 'border-2 border-rose-500 shadow-md ring-4 ring-rose-500/20',
        titleColor: 'text-rose-950',
        timeColor: 'text-rose-700 font-medium',
        avatarBg: 'bg-rose-600 text-white',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'Cancelled',
    },
    COMPLETED: {
        cardBg: 'bg-slate-50/90 hover:bg-slate-100/90',
        border: 'border-slate-300 hover:border-slate-400',
        activeRing: 'border-2 border-slate-500 shadow-md ring-4 ring-slate-500/20',
        titleColor: 'text-slate-900',
        timeColor: 'text-slate-600 font-medium',
        avatarBg: 'bg-slate-600 text-white',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        label: 'Completed',
    },
};

/**
 * Returns the theme corresponding directly to the booking's status.
 */
const getBookingThemeByStatus = (booking) => {
    if (!booking) return STATUS_THEMES.CONFIRMED;
    const rawStatus = (booking.status || '').toUpperCase();

    if (STATUS_THEMES[rawStatus]) {
        return STATUS_THEMES[rawStatus];
    }

    // Fallback based on payment status if booking status string differs
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

/**
 * Custom bespoke Dropdown / Select Component
 */
function CustomSelect({
    value,
    onChange,
    options = [],
    icon: Icon,
    placeholder = 'Select...',
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
                className={`inline-flex items-center gap-2 h-8 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 hover:bg-[#F5F2EA] px-2.5 text-xs font-bold text-[#101F1A] shadow-2xs transition-all cursor-pointer ${
                    isOpen ? 'ring-2 ring-[#101F1A]/10 border-[#101F1A]/30 bg-white' : ''
                }`}
            >
                {Icon && <Icon size={14} className="text-[#101F1A]/60 shrink-0" />}
                <span className="truncate max-w-[130px] sm:max-w-[170px]">
                    {activeOption ? activeOption.label : placeholder}
                </span>
                <ChevronDown
                    size={13}
                    className={`text-[#101F1A]/50 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div
                    className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1.5 z-50 min-w-[210px] max-w-[280px] max-h-72 overflow-y-auto rounded-xl border border-[#101F1A]/15 bg-white p-1.5 shadow-2xl transition-all dark-scrollbar`}
                >
                    <div className="space-y-0.5">
                        {options.map((option) => {
                            const isSelected = String(option.value) === String(value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                            : 'text-[#101F1A] hover:bg-[#F5F2EA]'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate">{option.label}</div>
                                        {option.hint && (
                                            <div className={`text-[10px] font-medium truncate ${
                                                isSelected ? 'text-[#D6FF3F]/70' : 'text-[#101F1A]/50'
                                            }`}>
                                                {option.hint}
                                            </div>
                                        )}
                                    </div>
                                    {isSelected && <Check size={14} className="text-[#D6FF3F] shrink-0" />}
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
 * Clusters overlapping events in the same day column and distributes them
 * into non-overlapping sub-column slices (styleLeft, styleWidth).
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

export default function CalendarPage({ facilities = [], bookings = [] }) {
    // Current focused date for calendar
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [scopeFilter, setScopeFilter] = useState('ALL'); // ALL, CONFIRMED, PENDING, OPEN_PLAY
    const [viewMode, setViewMode] = useState('Weekly View'); // 'Weekly View', 'Daily View'
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedFacilityId, setSelectedFacilityId] = useState(facilities[0]?.id || 'ALL');
    
    // In Weekly View, default to focusing on the first court for clean 100% full-width cards
    const [selectedCourtId, setSelectedCourtId] = useState(() => {
        return facilities[0]?.courts?.[0]?.id || 'ALL';
    });
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Selected booking for the left preview inspector card
    const [activeBooking, setActiveBooking] = useState(null);
    const [isSidebarExpandedMobile, setIsSidebarExpandedMobile] = useState(false);

    // Current time live tracker
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const gridScrollRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll timetable to active hours on load or view change
    useEffect(() => {
        if (gridScrollRef.current) {
            const nowH = new Date().getHours();
            const targetHour = Math.max(0, Math.min(nowH - START_HOUR - 1, TOTAL_HOURS - 6));
            gridScrollRef.current.scrollTop = targetHour * HOUR_HEIGHT;
        }
    }, [viewMode]);

    // Format helpers
    const fullDateTitle = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayOfWeekName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Active facility object and its courts
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

        // Previous month filler days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            currentWeek.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonthLastDay - i),
            });
        }

        // Current month days
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

        // Next month filler days
        if (currentWeek.length > 0) {
            let nextDay = 1;
            while (currentWeek.length < 7) {
                currentWeek.push({
                    day: nextDay,
                    isCurrentMonth: false,
                    date: new Date(year, month + 1, nextDay),
                });
                nextDay++;
            }
            weeks.push(currentWeek);
        }

        return weeks;
    }, [selectedDate]);

    // Filtered bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            if (selectedFacilityId !== 'ALL' && String(b.facility_id) !== String(selectedFacilityId)) {
                return false;
            }

            if (viewMode === 'Weekly View' && selectedCourtId !== 'ALL' && String(b.court_id) !== String(selectedCourtId)) {
                return false;
            }

            const s = (b.status || '').toUpperCase();
            if (scopeFilter === 'CONFIRMED' && s !== 'CONFIRMED') return false;
            if (scopeFilter === 'PENDING' && s !== 'PENDING') return false;
            if (scopeFilter === 'OPEN_PLAY' && s !== 'OPEN_PLAY') return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const userName = b.user?.name?.toLowerCase() || '';
                const guestName = b.guest_name?.toLowerCase() || '';
                const courtName = b.court?.name?.toLowerCase() || '';
                const ref = (b.reference || '').toLowerCase();
                if (!userName.includes(q) && !guestName.includes(q) && !courtName.includes(q) && !ref.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [bookings, selectedFacilityId, selectedCourtId, scopeFilter, searchQuery, viewMode]);

    // Auto-select initial active booking
    useEffect(() => {
        if (!activeBooking && filteredBookings.length > 0) {
            setActiveBooking(filteredBookings[0]);
        }
    }, [filteredBookings, activeBooking]);

    // Navigation
    const handlePrev = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'Weekly View') {
            next.setDate(next.getDate() - 7);
        } else {
            next.setDate(next.getDate() - 1);
        }
        setSelectedDate(next);
    };

    const handleNext = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'Weekly View') {
            next.setDate(next.getDate() + 7);
        } else {
            next.setDate(next.getDate() + 1);
        }
        setSelectedDate(next);
    };

    const handleToday = () => {
        setSelectedDate(new Date());
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

    // Add booking form
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

    // Real-time booking collision detection against existing loaded reservations
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

        if (reqStart >= reqEnd) {
            return null;
        }

        return bookings.find(b => {
            if (String(b.court_id) !== String(data.court_id)) return false;
            if (b.date !== data.date) return false;

            const status = (b.status || '').toLowerCase();
            if (status === 'cancelled' || status === 'rejected') return false;

            const bStart = normTime(b.start_time);
            const bEnd = normTime(b.end_time);

            // An overlap occurs when requested start < existing end AND requested end > existing start
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

    // Prepare dropdown options
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
        { value: 'Daily View', label: 'Daily View', hint: 'All courts side-by-side' },
        { value: 'Weekly View', label: 'Weekly View', hint: '7-day court schedule' },
    ];

    const activeTheme = activeBooking ? getBookingThemeByStatus(activeBooking) : STATUS_THEMES.CONFIRMED;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Calendar"
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Calendar" />

            <div className="w-full space-y-3 pb-6">
                
                {/* ── Action Toolbar: All Controls Co-located in One Cockpit ── */}
                <div className="relative z-30 rounded-xl border border-[#101F1A]/10 bg-white/95 p-3 sm:p-3.5 shadow-card backdrop-blur-md flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    
                    {/* Left: Vector Calendar Icon Tile + Current Date Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#101F1A] text-[#D6FF3F] shadow-2xs border border-[#101F1A]/10">
                            <CalendarCheck size={20} strokeWidth={2.3} />
                        </div>

                        <div className="flex flex-col min-w-0">
                            <h2 className="text-base sm:text-lg font-black text-[#101F1A] tracking-tight truncate">
                                {fullDateTitle}
                            </h2>
                            <span className="text-xs font-semibold text-[#101F1A]/55">
                                {dayOfWeekName}
                            </span>
                        </div>
                    </div>

                    {/* Middle: Integrated Scope Filter */}
                    <div className="flex items-center gap-1 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 p-0.5 shadow-2xs overflow-x-auto self-start xl:self-auto max-w-full">
                        {[
                            { key: 'ALL', label: 'All Events' },
                            { key: 'CONFIRMED', label: 'Confirmed' },
                            { key: 'PENDING', label: 'Pending Hold' },
                            { key: 'OPEN_PLAY', label: 'Open Play' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setScopeFilter(tab.key)}
                                className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    scopeFilter === tab.key
                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                        : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/40'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: Controls & Bespoke Custom Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        
                        {/* Multi-venue Selector: Custom Polished Dropdown */}
                        {facilities.length > 1 && (
                            <CustomSelect
                                value={selectedFacilityId}
                                onChange={(val) => {
                                    setSelectedFacilityId(val);
                                    setSelectedCourtId('ALL');
                                }}
                                options={facilityOptions}
                                icon={Building2}
                                placeholder="Select Venue"
                            />
                        )}

                        {/* Search Bookings Button / Input */}
                        <div className="relative">
                            {isSearchOpen ? (
                                <div className="flex items-center gap-1.5 bg-[#F5F2EA] px-2.5 py-1 rounded-lg border border-[#101F1A]/10">
                                    <Search size={13} className="text-[#101F1A]/50" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search court, player..."
                                        className="bg-transparent border-none text-xs font-medium text-[#101F1A] p-0 focus:ring-0 focus:outline-none w-32 sm:w-40"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                        className="text-[#101F1A]/40 hover:text-[#101F1A] p-0.5 cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#101F1A]/10 bg-white text-[#101F1A]/70 hover:bg-[#F5F2EA] hover:text-[#101F1A] shadow-2xs transition-colors cursor-pointer"
                                    title="Search bookings"
                                >
                                    <Search size={14} />
                                </button>
                            )}
                        </div>

                        {/* Navigation Stepper: < Today > */}
                        <div className="flex items-center rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 p-0.5 shadow-2xs">
                            <button
                                onClick={handlePrev}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[#101F1A]/70 hover:bg-white hover:text-[#101F1A] transition-colors cursor-pointer"
                                title="Previous"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                onClick={handleToday}
                                className="px-2.5 h-7 rounded-md text-xs font-bold text-[#101F1A] hover:bg-white transition-colors cursor-pointer"
                            >
                                Today
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-[#101F1A]/70 hover:bg-white hover:text-[#101F1A] transition-colors cursor-pointer"
                                title="Next"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        {/* View Switcher: Custom Polished Dropdown */}
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
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-all hover:bg-[#162923] cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={2.4} />
                            <span>Add Event</span>
                        </button>
                    </div>
                </div>

                {/* ── Mobile Accordion Toggle for Left Sidebar (Responsive) ── */}
                <div className="lg:hidden flex items-center justify-between p-2.5 rounded-xl border border-[#101F1A]/10 bg-white/95 shadow-2xs">
                    <span className="text-xs font-bold text-[#101F1A] truncate">
                        {activeBooking ? (
                            <span>{activeBooking.user?.name || activeBooking.guest_name || 'Reservation'}: <span className="text-[#101F1A]/70 font-semibold">{formatTimeRange(activeBooking.start_time, activeBooking.end_time)}</span></span>
                        ) : (
                            <span>Calendar & Details</span>
                        )}
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsSidebarExpandedMobile(!isSidebarExpandedMobile)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F2EA] text-[#101F1A] text-xs font-bold hover:bg-[#101F1A]/10 transition-colors cursor-pointer shrink-0 ml-2"
                    >
                        <span>{isSidebarExpandedMobile ? 'Hide' : 'Show Details'}</span>
                        <ChevronDown size={14} className={`transition-transform duration-200 ${isSidebarExpandedMobile ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* ── Main 2-Column Split Layout (Fixed Desktop Baseline, Zero Bottom Gap) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch lg:h-[calc(100vh-172px)] min-h-[580px]">
                    
                    {/* ── LEFT SIDEBAR: Flex Column that Stretches Full Height (Zero Beige Gap) ── */}
                    <div className={`lg:col-span-4 xl:col-span-3 lg:h-full lg:flex lg:flex-col gap-3.5 min-h-0 ${
                        isSidebarExpandedMobile ? 'block' : 'hidden lg:flex'
                    }`}>
                        
                        {/* 1. Mini Month Calendar (Strictly Styled to Reference Design) */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md shrink-0">
                            
                            {/* Month Header Navigation */}
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

                            {/* Days of Week Header */}
                            <div className="grid grid-cols-7 text-center mb-1.5 text-[11px] font-bold text-[#101F1A]/50">
                                <span>Su</span>
                                <span>Mo</span>
                                <span>Tu</span>
                                <span>We</span>
                                <span>Th</span>
                                <span>Fr</span>
                                <span>Sa</span>
                            </div>

                            {/* Days Matrix */}
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

                        {/* 2. Active Event Inspector (Strictly Styled to Reference Design) */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-4 shadow-card backdrop-blur-md">
                            {activeBooking ? (
                                <div className="space-y-3.5">
                                    {/* Header: Host / Match Name + Status Color Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-base text-[#101F1A] tracking-tight truncate">
                                                {activeBooking.user?.name || activeBooking.guest_name || 'Match Reservation'}
                                            </h3>
                                            <p className="text-xs text-[#101F1A]/60 font-medium truncate mt-0.5">
                                                {activeBooking.court?.name || 'Court'} · {activeBooking.facility?.name}
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
                                                {activeBooking.court?.type || 'Standard Court'}
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
                                                {(activeBooking.user?.name || activeBooking.guest_name || 'P')[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-xs font-bold text-[#101F1A] truncate">
                                                    {activeBooking.user?.name || activeBooking.guest_name || 'Player'}
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

                                    {/* Reference Note if present */}
                                    {activeBooking.notes && (
                                        <div className="text-xs bg-[#F5F2EA]/40 p-2.5 rounded-lg border border-[#101F1A]/8">
                                            <p className="text-xs text-[#101F1A]/80 leading-relaxed">
                                                {activeBooking.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
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
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CalendarIcon className="mx-auto text-[#101F1A]/30 mb-2" size={28} />
                                    <p className="text-xs font-bold text-[#101F1A]">No event selected</p>
                                    <p className="text-[11px] text-[#101F1A]/50 mt-0.5">Click any court card to inspect</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT MAIN PANEL (Sole Scrollable Container for Timetable) ── */}
                    <div className="lg:col-span-8 xl:col-span-9 rounded-xl border border-[#101F1A]/10 bg-white shadow-card overflow-hidden flex flex-col h-[540px] sm:h-[620px] lg:h-full">
                        
                        {/* Weekly View Court Tabs: Clean segmented selector */}
                        {viewMode === 'Weekly View' && activeCourts.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF9F5] border-b border-[#101F1A]/8 overflow-x-auto select-none shrink-0 dark-scrollbar">
                                {activeCourts.map(court => {
                                    const isCourtActive = String(selectedCourtId) === String(court.id);
                                    return (
                                        <button
                                            key={court.id}
                                            type="button"
                                            onClick={() => setSelectedCourtId(court.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                                isCourtActive
                                                    ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                                    : 'bg-white text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/80 border border-[#101F1A]/10'
                                            }`}
                                        >
                                            {cleanCourtName(court.name)} <span className="opacity-50 text-[10px] font-normal">({court.type})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Top Axis: Weekday Headers or Court Headers */}
                        <div className="flex border-b border-[#101F1A]/10 bg-[#FAF9F5] select-none shrink-0 z-20">
                            
                            {/* Empty space matching left time gutter */}
                            <div className="w-16 sm:w-20 shrink-0 border-r border-[#101F1A]/10" />

                            {/* Column Headers */}
                            {viewMode === 'Weekly View' ? (
                                <div className="flex-1 grid grid-cols-7 divide-x divide-[#101F1A]/8">
                                    {weekDays.map((dayDate, idx) => {
                                        const isToday = dayDate.toDateString() === new Date().toDateString();
                                        const isSelected = dayDate.toDateString() === selectedDate.toDateString();
                                        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                                        const monthDay = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedDate(dayDate)}
                                                className={`py-2 px-1 sm:px-2 text-center cursor-pointer transition-colors ${
                                                    isSelected
                                                        ? 'bg-[#101F1A]/[0.04]'
                                                        : isToday
                                                        ? 'bg-emerald-500/[0.04]'
                                                        : 'hover:bg-white/60'
                                                }`}
                                            >
                                                <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
                                                    isToday ? 'text-emerald-700' : 'text-[#101F1A]/60'
                                                }`}>
                                                    {dayName}
                                                </div>
                                                <div className={`text-xs sm:text-sm font-black tracking-tight mt-0.5 ${
                                                    isToday
                                                        ? 'text-emerald-800'
                                                        : isSelected
                                                        ? 'text-[#101F1A]'
                                                        : 'text-[#101F1A]/80'
                                                }`}>
                                                    {monthDay}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex-1 flex divide-x divide-[#101F1A]/8 overflow-x-auto">
                                    {activeCourts.map(court => (
                                        <div
                                            key={court.id}
                                            className="flex-1 min-w-[160px] py-2 px-3 flex items-center justify-between gap-2"
                                        >
                                            <span className="font-bold text-xs sm:text-sm text-[#101F1A] truncate">
                                                {court.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-[#101F1A]/60 bg-[#F5F2EA] px-1.5 py-0.5 rounded">
                                                {court.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Timetable Body — Sole Scrollable Container */}
                        <div
                            ref={gridScrollRef}
                            className="flex-1 min-h-0 relative overflow-y-auto overflow-x-auto dark-scrollbar select-none overscroll-contain"
                            style={{ overscrollBehavior: 'contain' }}
                        >
                            <div
                                className="relative flex min-w-[700px]"
                                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
                            >
                                {/* Left Time Gutter */}
                                <div className="w-16 sm:w-20 shrink-0 border-r border-[#101F1A]/10 bg-[#FAF9F5] select-none sticky left-0 z-10">
                                    {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                                        const h = START_HOUR + i;
                                        return (
                                            <div
                                                key={h}
                                                style={{ height: `${HOUR_HEIGHT}px` }}
                                                className="border-b border-[#101F1A]/8 px-2 py-1 text-right text-[11px] font-bold text-[#101F1A]/50"
                                            >
                                                {formatHourLabel(h)}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Weekly View Timetable Grid */}
                                {viewMode === 'Weekly View' ? (
                                    <div className="flex-1 grid grid-cols-7 divide-x divide-[#101F1A]/8 relative">
                                        
                                        {/* Horizontal Hour Lines */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    style={{ top: `${i * HOUR_HEIGHT}px` }}
                                                    className="absolute inset-x-0 border-b border-[#101F1A]/6"
                                                />
                                            ))}
                                        </div>

                                        {/* Live Current Time Line Indicator */}
                                        {liveTimeTop !== null && (
                                            <div
                                                className="absolute inset-x-0 z-30 pointer-events-none flex items-center"
                                                style={{ top: `${liveTimeTop}px` }}
                                            >
                                                <span className="absolute -left-16 sm:-left-20 z-40 bg-[#101F1A] text-[#D6FF3F] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                                    {liveTimeString}
                                                </span>
                                                <div className="w-full border-t-2 border-[#101F1A] relative shadow-xs">
                                                    <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-[#101F1A]" />
                                                </div>
                                            </div>
                                        )}

                                        {/* 7 Day Columns */}
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
                                                                className={`absolute z-20 rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-left ${theme.cardBg} ${theme.border} ${
                                                                    isSelected
                                                                        ? `${theme.activeRing} -translate-y-0.5 z-30`
                                                                        : 'shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                                                                }`}
                                                            >
                                                                {/* Title & 12-Hour Time with Status-Matched Typography */}
                                                                <div className="min-w-0">
                                                                    <h4 className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${theme.titleColor}`}>
                                                                        {booking.user?.name || booking.guest_name || 'Court Match'}
                                                                    </h4>
                                                                    <p className={`text-[11px] truncate mt-0.5 ${theme.timeColor}`}>
                                                                        {formatTimeRange(booking.start_time, booking.end_time)}
                                                                    </p>
                                                                </div>

                                                                {/* Bottom: Overlapping Player Avatars with Status-Matched Accent */}
                                                                <div className="flex items-center -space-x-1.5 mt-auto pt-1.5">
                                                                    <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white shadow-2xs ${theme.avatarBg}`}>
                                                                        {(booking.user?.name || booking.guest_name || 'P')[0]}
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
                                                                className={`absolute inset-x-1.5 z-20 rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-left ${theme.cardBg} ${theme.border} ${
                                                                    isSelected
                                                                        ? `${theme.activeRing} -translate-y-0.5 z-30`
                                                                        : 'shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                                                                }`}
                                                            >
                                                                <div className="min-w-0">
                                                                    <h4 className={`text-xs sm:text-[13px] font-bold tracking-tight truncate ${theme.titleColor}`}>
                                                                        {booking.user?.name || booking.guest_name || 'Court Match'}
                                                                    </h4>
                                                                    <p className={`text-[11px] truncate mt-0.5 ${theme.timeColor}`}>
                                                                        {formatTimeRange(booking.start_time, booking.end_time)}
                                                                    </p>
                                                                </div>

                                                                <div className="flex items-center -space-x-1.5 mt-auto pt-1.5">
                                                                    <div className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white shadow-2xs ${theme.avatarBg}`}>
                                                                        {(booking.user?.name || booking.guest_name || 'P')[0]}
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
                    </div>
                </div>
            </div>

            {/* ── Add Event / Booking Modal ── */}
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
                                                {conflictBooking.user?.name || conflictBooking.guest_name || 'Another Player'}
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
