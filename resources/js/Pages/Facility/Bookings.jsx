import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { CalendarClock, LayoutGrid, List, Plus, Search, X, Sun, Moon } from 'lucide-react';
import BookingDetailDrawer from '@/Components/BookingDetailDrawer';
import RescheduleBookingModal from '@/Components/RescheduleBookingModal';
import FacilityBookingsBoard from '@/Components/FacilityBookingsBoard';
import BookingReviewCard from '@/Components/BookingReviewCard';
import { formatPeso } from '@/Components/MetricCard';
import { useConfirm } from '@/Components/ConfirmContext';
import { receiptUrl } from '@/Utils/receiptUrl';
import { estimateBookingFee, offeredAddons, offeredCourtPlans, planRates, quoteBooking } from '@/Utils/rateQuote';
import { courtIsOpenOnDate, hoursForDate } from '@/Utils/courtOperatingSchedule';
import {
    facilityAvailabilityBanner,
    facilityIsAcceptingBookings,
    facilityIsOpenOnDate,
    formatOperatingDaysLabel,
} from '@/Utils/facilityAvailability';

const FILTERS = [
    { key: 'All', label: 'All' },
    { key: 'Today', label: 'Today' },
    { key: 'Upcoming', label: 'Upcoming' },
    { key: 'Pending', label: 'Pending' },
];

export default function Bookings({ bookings, nextBooking = null, courtBookings = [], facilities, filters, counts = {} }) {
    const { confirm } = useConfirm();
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [activeFilter, setActiveFilter] = useState(filters?.filter || 'All');
    const [viewMode, setViewMode] = useState(() => (
        typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table'
    ));
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [addStep, setAddStep] = useState(1);
    const [rescheduleBooking, setRescheduleBooking] = useState(null);

    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('facility.bookings'),
                { search: searchQuery, filter: activeFilter },
                { preserveState: true, replace: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery, activeFilter]);

    const { data, setData, post, processing, errors, reset, transform } = useForm({
        facility_id: facilities[0]?.id || '',
        court_id: '',
        date: '',
        start_time: '',
        end_time: '',
        total_price: '',
        guest_name: '',
        rate_plan_id: '',
    });

    const [addonQuantities, setAddonQuantities] = useState({});

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getRelativeDay = (dateString) => {
        const date = new Date(dateString);
        
        // Use local timezone for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const compareDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        compareDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (compareDate.getTime() === today.getTime()) {
            return "Today";
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        }
        return formatDate(dateString);
    };

    const filteredBookings = bookings;

    // Group bookings by date
    const groupedBookings = useMemo(() => {
        const groups = {};
        filteredBookings.forEach(b => {
            if (!groups[b.date]) {
                groups[b.date] = [];
            }
            groups[b.date].push(b);
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTime = today.getTime();
        const PAST_OFFSET = 1e15; // pushes every past date group after every today/upcoming one

        // Nearest first: today/upcoming dates ascending, then past dates (most recent first).
        const proximityRank = (dateString) => {
            const diff = new Date(dateString).getTime() - todayTime;
            return diff >= 0 ? diff : PAST_OFFSET + Math.abs(diff);
        };

        return Object.keys(groups).sort((a, b) => proximityRank(a) - proximityRank(b)).map(date => ({
            date: date,
            label: getRelativeDay(date),
            bookings: groups[date].slice().sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
        }));
    }, [filteredBookings]);

    const localTodayKey = () => {
        const now = new Date();

        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const stats = useMemo(() => {
        const today = localTodayKey();
        const todaysBookings = bookings.filter((booking) => String(booking.date).slice(0, 10) === today && booking.status !== 'cancelled');

        return {
            today: counts.today ?? todaysBookings.length,
            pending: counts.pending ?? bookings.filter((booking) => booking.status === 'pending').length,
            confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
            revenue: todaysBookings.reduce((sum, booking) => sum + Number(booking.total_price || 0), 0),
        };
    }, [bookings, counts]);

    const handleVerifyBooking = async (booking) => {
        const ok = await confirm({
            title: 'Verify payment & confirm?',
            message: `This confirms booking #${booking.id} for ${booking.court?.name ?? 'this court'} and marks the payment as verified.`,
            confirmText: 'Verify booking',
            type: 'success',
        });

        if (ok) {
            router.post(route('bookings.verify', booking.id), {}, { preserveScroll: true });
        }
    };

    const handleCancelBooking = async (booking) => {
        const ok = await confirm({
            title: 'Cancel this booking?',
            message: `Booking #${booking.id} for ${booking.court?.name ?? 'this court'} will be cancelled and the slot will reopen.`,
            confirmText: 'Cancel booking',
            type: 'danger',
        });

        if (ok) {
            router.patch(route('bookings.update', booking.id), { status: 'cancelled' }, { preserveScroll: true });
        }
    };

    const handleReschedule = (booking) => {
        setSelectedBooking(null);
        setRescheduleBooking(booking);
    };

    const handleVerifyFromDrawer = async (booking) => {
        const ok = await confirm({
            title: 'Verify payment & confirm?',
            message: `This confirms booking #${booking.id} for ${booking.court?.name ?? 'this court'} and marks the payment as verified.`,
            confirmText: 'Verify booking',
            type: 'success',
        });

        if (ok) {
            router.post(route('bookings.verify', booking.id), {}, {
                preserveScroll: true,
                onSuccess: () => setSelectedBooking(null),
            });
        }
    };

    const handleRejectFromDrawer = async (booking) => {
        const isConfirmed = booking.status === 'confirmed';
        const ok = await confirm({
            title: isConfirmed ? 'Cancel this booking?' : 'Reject this booking?',
            message: isConfirmed
                ? `Cancel this confirmed booking for ${booking.user?.name || booking.guest_name || 'Walk-in'}? The time slot will be freed.`
                : `Reject this pending booking for ${booking.user?.name || booking.guest_name || 'Walk-in'}? The time slot will be freed.`,
            confirmText: isConfirmed ? 'Cancel booking' : 'Reject booking',
            type: 'danger',
        });

        if (ok) {
            router.post(route('bookings.reject', booking.id), {}, {
                preserveScroll: true,
                onSuccess: () => setSelectedBooking(null),
            });
        }
    };

    const handleDeleteBooking = async (booking) => {
        const ok = await confirm({
            title: 'Delete this booking?',
            message: 'This permanently removes the booking and cannot be undone.',
            confirmText: 'Delete',
            type: 'danger',
        });

        if (ok) {
            router.delete(route('bookings.destroy', booking.id), { preserveScroll: true });
        }
    };

    const handleReceipt = (booking) => {
        if (booking.payment?.proof_path) {
            setReceiptPreview(receiptUrl(booking.payment.proof_path));
        }
    };


    const handleAdd = (e) => {
        e.preventDefault();
        post(route('bookings.store'), {
            onSuccess: () => {
                const court = facilities.flatMap(f => f.courts).find(c => c.id == data.court_id);
                setSelectedBooking({
                    id: 'NEW',
                    status: 'pending',
                    user: null,
                    guest_name: data.guest_name || 'Walk-in',
                    date: data.date,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    total_price: pricingQuote.total,
                    court: court
                });
                setModalMode('success');
                reset();
                setAddonQuantities({});
                setIsAdding(false);
                setAddStep(1);
            }
        });
    };

    const closeModal = () => {
        setIsAdding(false);
        setAddStep(1);
        reset();
        setAddonQuantities({});
    };

    const generateTimeOptions = (court, selectedDate, courtId, allBookings = []) => {
        if (selectedDate && court && !courtIsOpenOnDate(court, selectedDate)) {
            return [];
        }

        const hours = hoursForDate(court, selectedDate);
        let startHour = 6;
        let endHour = 22;

        if (hours) {
            startHour = parseInt(String(hours.start).split(':')[0], 10);
            endHour = String(hours.end) === '24:00'
                ? 24
                : parseInt(String(hours.end).split(':')[0], 10);
        }

        const courtBookings = allBookings.filter(b => b.court_id == courtId && b.date === selectedDate && ['pending', 'confirmed'].includes(b.status.toLowerCase()));
        
        const bookedHours = new Set();
        courtBookings.forEach(b => {
            const bStart = parseInt(b.start_time.split(':')[0]);
            const bEnd = parseInt(b.end_time.split(':')[0]);
            for (let i = bStart; i < bEnd; i++) {
                bookedHours.add(i);
            }
        });

        const options = [];
        for (let i = startHour; i <= endHour; i++) {
            const timeValue = i === 24 ? '24:00' : `${i.toString().padStart(2, '0')}:00`;
            const date = new Date();
            date.setHours(i === 24 ? 0 : i, 0);
            const formatted = i === 24
                ? '12:00 AM'
                : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            options.push({
                value: timeValue,
                label: formatted,
                isBooked: i < endHour && bookedHours.has(i),
            });
        }
        return options;
    };

    const selectedFacility = facilities.find(f => f.id == data.facility_id);
    const selectedFacilityAccepting = facilityIsAcceptingBookings(selectedFacility);
    const selectedFacilityBanner = facilityAvailabilityBanner(selectedFacility);
    const availableCourts = (selectedFacility?.courts || []).filter((court) => court.status === 'AVAILABLE');
    const selectedCourt = availableCourts.find(c => c.id == data.court_id);
    const selectedDateClosed = Boolean(
        data.date
        && selectedFacility
        && (
            !facilityIsOpenOnDate(selectedFacility, data.date)
            || (selectedCourt && !courtIsOpenOnDate(selectedCourt, data.date))
        ),
    );
    const timeOptions = useMemo(() => {
        return generateTimeOptions(selectedCourt, data.date, selectedCourt?.id, bookings || []);
    }, [selectedCourt, data.date, bookings]);

    // Rate card for the selected court — the facility owner picks a package
    // instead of typing a raw amount; legacy courts fall back to their own rate.
    const courtPlans = useMemo(() => offeredCourtPlans(selectedCourt, selectedFacility), [selectedCourt, selectedFacility]);
    const addonPlans = useMemo(() => offeredAddons(selectedCourt, selectedFacility), [selectedCourt, selectedFacility]);
    const selectedRatePlan = courtPlans.find((plan) => plan.id == data.rate_plan_id) || null;

    useEffect(() => {
        const stillOffered = courtPlans.some((plan) => plan.id == data.rate_plan_id);
        if (!stillOffered) {
            setData('rate_plan_id', courtPlans.length > 0 ? courtPlans[0].id : '');
        }
        setAddonQuantities({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCourt?.id]);

    const addonSelection = useMemo(
        () => addonPlans
            .map((plan) => ({ plan, quantity: Number(addonQuantities[plan.id] || 0) }))
            .filter((row) => row.quantity > 0),
        [addonPlans, addonQuantities],
    );

    const setAddonQuantity = (plan, quantity) => {
        const max = Math.max(1, Number(plan.max_quantity || 1));
        const clamped = Math.max(0, Math.min(quantity, max));
        setAddonQuantities((prev) => ({ ...prev, [plan.id]: clamped }));
    };

    const pricingQuote = useMemo(() => quoteBooking({
        court: selectedCourt,
        ratePlan: selectedRatePlan,
        addons: addonSelection,
        startTime: data.start_time,
        endTime: data.end_time,
    }), [selectedCourt, selectedRatePlan, addonSelection, data.start_time, data.end_time]);

    const bookingFeeEstimate = useMemo(
        () => estimateBookingFee(selectedFacility, pricingQuote.total),
        [selectedFacility, pricingQuote.total],
    );
    const grandTotal = pricingQuote.total + bookingFeeEstimate;

    const canReviewManualBooking = Boolean(
        data.facility_id && data.court_id && data.date && data.start_time && data.end_time,
    );

    transform((formData) => ({
        ...formData,
        rate_plan_id: selectedRatePlan?.id || '',
        total_price: pricingQuote.total,
        addons: addonSelection.map(({ plan, quantity }) => ({ rate_plan_id: plan.id, quantity })),
    }));

    return (
        <AuthenticatedLayout
            inset="bookings"
            header={
                <PageHeader
                    title="Facility Bookings"
                    subtitle="Manage all your court reservations in one place"
                    actions={
                        facilities.length > 0 && (
                            <PrimaryButton 
                                onClick={() => { setIsAdding(true); setAddStep(1); }} 
                                className="!bg-[#10221C] hover:!bg-[#10221C]/90 text-[#D6FF3F] hover:text-[#D6FF3F] flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Plus size={16} /> New Booking
                            </PrimaryButton>
                        )
                    }
                    showSearch={false}
                    liveNotifications
                    notificationsFooterHref={route('facility.bookings')}
                />
            }
        >
            <Head title="Bookings" />

            <div className="flex flex-col gap-4 md:gap-6">
                
                {/* Toolbar */}
                <div className="flex flex-col gap-3 rounded-xl border border-[#101F1A]/10 bg-white p-3.5 shadow-card lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#101F1A]/40">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search player, court, or status…"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="h-10 w-full rounded-lg border border-[#101F1A]/15 bg-white pl-9 pr-3 text-sm text-[#101F1A] placeholder-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#101F1A]/10 bg-[#101F1A]/[0.02] p-1">
                            {FILTERS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActiveFilter(key)}
                                    className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        activeFilter === key
                                            ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                            : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden items-center gap-1 rounded-lg border border-[#101F1A]/10 bg-white p-1 lg:flex">
                            <button
                                type="button"
                                onClick={() => router.visit(route('facility.calendar'))}
                                aria-label="Calendar view"
                                title="Calendar Matrix View"
                                className="rounded-md p-1.5 transition-colors text-[#101F1A]/40 hover:text-[#101F1A]"
                            >
                                <Calendar size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                aria-label="Table view"
                                className={`rounded-md p-1.5 transition-colors ${viewMode === 'table' ? 'bg-[#101F1A] text-[#D6FF3F]' : 'text-[#101F1A]/40 hover:text-[#101F1A]'}`}
                            >
                                <List size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('card')}
                                aria-label="Card view"
                                className={`rounded-md p-1.5 transition-colors ${viewMode === 'card' ? 'bg-[#101F1A] text-[#D6FF3F]' : 'text-[#101F1A]/40 hover:text-[#101F1A]'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Nearest upcoming booking */}
                {nextBooking && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedBooking(nextBooking);
                            setModalMode('view');
                        }}
                        className="group flex w-full flex-col gap-3 rounded-xl border border-[#10221C] bg-[#10221C] p-4 text-left shadow-card transition-all duration-200 hover:scale-[1.005] hover:bg-[#1a382d] sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-center gap-3.5">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F] text-[#10221C]">
                                <CalendarClock size={22} />
                            </span>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D6FF3F]">Next booking</p>
                                <p className="mt-0.5 text-base font-black text-white">
                                    {getRelativeDay(nextBooking.date)}
                                    <span className="font-bold text-white/60"> · {formatTime(nextBooking.start_time)} – {formatTime(nextBooking.end_time)}</span>
                                </p>
                                <p className="text-xs text-white/60">
                                    {nextBooking.court?.name ?? 'Court'} · {nextBooking.user?.name ?? nextBooking.guest_name ?? 'Walk-in'}
                                </p>
                            </div>
                        </div>
                        <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                            nextBooking.status === 'confirmed'
                                ? 'bg-[#D6FF3F]/15 text-[#D6FF3F]'
                                : 'bg-amber-400/15 text-amber-300'
                        }`}>
                            {nextBooking.status}
                        </span>
                    </button>
                )}

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                        { label: 'Today', value: stats.today, hint: 'bookings scheduled' },
                        { label: 'Pending', value: stats.pending, hint: 'need confirmation' },
                        { label: 'Confirmed', value: stats.confirmed, hint: 'in this view' },
                        { label: "Today's revenue", value: formatPeso(stats.revenue), hint: 'non-cancelled' },
                    ].map((card) => (
                        <div key={card.label} className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">{card.label}</p>
                            <p className="mt-1.5 text-xl font-black text-[#101F1A]">{card.value}</p>
                            <p className="text-[10px] text-[#101F1A]/50">{card.hint}</p>
                        </div>
                    ))}
                </div>

                <FacilityBookingsBoard
                    groups={groupedBookings}
                    viewMode={viewMode}
                    counts={counts}
                    onSelect={(booking) => {
                        setSelectedBooking(booking);
                        setModalMode('view');
                    }}
                    onVerify={handleVerifyBooking}
                    onCancel={handleCancelBooking}
                    onDelete={handleDeleteBooking}
                    onReceipt={handleReceipt}
                    onCreate={() => { setIsAdding(true); setAddStep(1); }}
                    formatTime={formatTime}
                    formatDate={formatDate}
                    formatPeso={formatPeso}
                />

                </div>

            <BookingDetailDrawer
                isOpen={!!selectedBooking}
                booking={selectedBooking}
                mode={modalMode}
                onClose={() => setSelectedBooking(null)}
                onReschedule={handleReschedule}
                onVerify={handleVerifyFromDrawer}
                onReject={handleRejectFromDrawer}
            />

            <RescheduleBookingModal
                show={!!rescheduleBooking}
                booking={rescheduleBooking}
                courtBookings={courtBookings}
                facilities={facilities}
                onClose={() => setRescheduleBooking(null)}
            />

            <Modal show={isAdding} onClose={closeModal} maxWidth="2xl">
                <div className="p-6 sm:p-8">
                    <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-[#10221C] uppercase tracking-wide">
                                {addStep === 1 ? 'Manual Booking' : 'Review Booking'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {addStep === 1 ? 'Block off a court or log a walk-in player.' : 'Please review the details before confirming.'}
                            </p>
                        </div>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleAdd} className="flex flex-col gap-6">
                    {addStep === 1 ? (
                    <>
                        {selectedFacilityBanner && (
                            <div className={`rounded-xl border px-3 py-2.5 text-xs ${
                                selectedFacilityBanner.tone === 'rose'
                                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                                    : 'border-amber-200 bg-amber-50 text-amber-950'
                            }`}>
                                <p className="font-black">{selectedFacilityBanner.title}</p>
                                <p className="mt-0.5 opacity-80">{selectedFacilityBanner.body}</p>
                            </div>
                        )}
                        {selectedFacility && (
                            <p className="text-xs text-gray-500">
                                Open days: <span className="font-bold text-[#10221C]">{selectedFacility.operating_days_label || formatOperatingDaysLabel(selectedFacility.operating_days)}</span>
                            </p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="facility_id" value="Facility" />
                                <select
                                    id="facility_id"
                                    value={data.facility_id}
                                    onChange={(e) => {
                                        setData({
                                            ...data,
                                            facility_id: e.target.value,
                                            court_id: '',
                                            start_time: '',
                                            end_time: '',
                                        });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    <option value="">Select a facility</option>
                                    {facilities.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.name}
                                            {(f.operational_status && f.operational_status !== 'OPEN')
                                                ? ` (${f.operational_status === 'MAINTENANCE' ? 'Maintenance' : 'Unserviceable'})`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.facility_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="court_id" value="Court" />
                                <select
                                    id="court_id"
                                    value={data.court_id}
                                    onChange={(e) => {
                                        setData({
                                            ...data,
                                            court_id: e.target.value,
                                            start_time: '',
                                            end_time: '',
                                        });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm disabled:bg-gray-100"
                                    disabled={!data.facility_id}
                                >
                                    <option value="">Select a court</option>
                                    {availableCourts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.court_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="date" value="Date" />
                                <TextInput
                                    id="date"
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    className="mt-1 block w-full"
                                    disabled={!selectedFacilityAccepting}
                                />
                                {selectedDateClosed && (
                                    <p className="mt-2 text-xs font-semibold text-rose-600">Facility closed this day.</p>
                                )}
                                <InputError message={errors.date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="guest_name" value="Player Name (Optional Walk-in)" />
                                <TextInput id="guest_name" type="text" value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} className="mt-1 block w-full" placeholder="e.g. John Doe" />
                                <InputError message={errors.guest_name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="start_time" value="Start Time" />
                                <div className="relative">
                                    <select
                                        id="start_time"
                                        value={data.start_time}
                                        onChange={(e) => {
                                            setData({
                                                ...data,
                                                start_time: e.target.value,
                                                ...(data.end_time && e.target.value >= data.end_time ? { end_time: '' } : {})
                                            });
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm appearance-none !bg-none pr-10 cursor-pointer disabled:bg-gray-100 disabled:opacity-50"
                                        disabled={!data.court_id || !data.date}
                                    >
                                        <option value="">--:--</option>
                                        {timeOptions.slice(0, -1).map((opt) => (
                                            <option key={opt.value} value={opt.value} disabled={opt.isBooked} className={opt.isBooked ? 'text-gray-400 bg-gray-100' : 'text-gray-900'}>
                                                {opt.label} {opt.isBooked ? '(Booked)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 top-1">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_time" value="End Time" />
                                <div className="relative">
                                    <select
                                        id="end_time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm appearance-none !bg-none pr-10 cursor-pointer disabled:bg-gray-100 disabled:opacity-50"
                                        disabled={!data.start_time}
                                    >
                                        <option value="">--:--</option>
                                        {(() => {
                                            const startIndex = timeOptions.findIndex(o => o.value === data.start_time);
                                            let firstBookedAfterStart = timeOptions.findIndex((o, index) => index >= startIndex && o.isBooked);
                                            if (firstBookedAfterStart === -1) firstBookedAfterStart = timeOptions.length - 1;
                                            
                                            return timeOptions.filter((opt, index) => data.start_time && index > startIndex && index <= firstBookedAfterStart).map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ));
                                        })()}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 top-1">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>
                        </div>

                        {/* Rate card — pick a package instead of typing a raw amount */}
                        {data.court_id && (
                            <div className="rounded-xl border border-gray-100 bg-[#FAFAF8] p-4">
                                <InputLabel value="Rate" />
                                {courtPlans.length > 0 ? (
                                    <>
                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {courtPlans.map((plan) => {
                                                const rates = planRates(plan);
                                                const active = selectedRatePlan?.id === plan.id;

                                                return (
                                                    <button
                                                        type="button"
                                                        key={plan.id}
                                                        onClick={() => setData('rate_plan_id', plan.id)}
                                                        className={`text-left rounded-lg border-2 p-2.5 transition-all ${
                                                            active
                                                                ? 'border-[#10221C] bg-[#10221C] text-white shadow-md'
                                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-[#10221C]'}`}>{plan.name}</p>
                                                        <p className={`text-xs font-bold flex items-center gap-1.5 ${active ? 'text-[#D6FF3F]' : 'text-[#10221C]/70'}`}>
                                                            <span className="inline-flex items-center gap-1">
                                                                <Sun size={11} className={active ? 'text-[#D6FF3F]' : 'text-amber-500'} />
                                                                {formatPeso(rates.day)}/hr
                                                            </span>
                                                            {rates.night !== null && (
                                                                <>
                                                                    <span className="opacity-40">·</span>
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Moon size={11} className={active ? 'text-[#D6FF3F]' : 'text-indigo-400'} />
                                                                        {formatPeso(rates.night)}/hr
                                                                    </span>
                                                                </>
                                                            )}
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <InputError message={errors.rate_plan_id} className="mt-2" />

                                        {addonPlans.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {addonPlans.map((plan) => {
                                                    const qty = Number(addonQuantities[plan.id] || 0);
                                                    const max = Math.max(1, Number(plan.max_quantity || 1));

                                                    return (
                                                        <div key={plan.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                                            <div>
                                                                <p className="text-sm font-bold text-[#10221C]">{plan.name}</p>
                                                                <p className="text-[11px] text-gray-500">{formatPeso(planRates(plan).day)}/hr each · max {max}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => setAddonQuantity(plan, qty - 1)} disabled={qty === 0} className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-sm font-black text-[#10221C] disabled:opacity-40">−</button>
                                                                <span className="w-6 text-center text-sm font-black text-[#10221C]">{qty}</span>
                                                                <button type="button" onClick={() => setAddonQuantity(plan, qty + 1)} disabled={qty >= max} className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-sm font-black text-[#10221C] disabled:opacity-40">+</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="mt-2 text-sm font-bold text-[#10221C] flex items-center gap-2">
                                        {selectedCourt?.pricing_mode === 'SPLIT'
                                            ? (
                                                <>
                                                    <span className="inline-flex items-center gap-1 text-amber-700">
                                                        <Sun size={12} className="text-amber-500" />
                                                        {formatPeso(selectedCourt?.day_rate)}/hr
                                                    </span>
                                                    <span className="text-gray-300">·</span>
                                                    <span className="inline-flex items-center gap-1 text-indigo-700">
                                                        <Moon size={12} className="text-indigo-400" />
                                                        {formatPeso(selectedCourt?.night_rate)}/hr
                                                    </span>
                                                </>
                                            )
                                            : <>{formatPeso(selectedCourt?.hourly_rate)}/hr (court rate)</>}
                                    </p>
                                )}

                                <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#10221C]/60">
                                        Total {pricingQuote.durationHours > 0 ? `(${pricingQuote.durationHours} hr${pricingQuote.durationHours === 1 ? '' : 's'})` : ''}
                                    </span>
                                    <span className="text-lg font-black text-[#10221C]">{formatPeso(grandTotal)}</span>
                                </div>
                                <InputError message={errors.total_price} className="mt-2" />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <PrimaryButton
                                type="button"
                                disabled={!canReviewManualBooking}
                                onClick={() => setAddStep(2)}
                                className="!bg-[#10221C] hover:!bg-[#1a382d]"
                            >
                                Next: Review
                            </PrimaryButton>
                        </div>
                    </>
                    ) : (
                    <>
                        <BookingReviewCard
                            courtName={selectedCourt?.name}
                            courtSubtitle={selectedRatePlan?.name || selectedCourt?.type || 'Standard Court'}
                            isSplit={pricingQuote.isSplit}
                            dayRate={pricingQuote.dayRate}
                            nightRate={pricingQuote.nightRate}
                            dateLabel={formatDate(data.date)}
                            timeLabel={`${formatTime(data.start_time)} – ${formatTime(data.end_time)}`}
                            durationHours={pricingQuote.durationHours}
                            breakdown={pricingQuote.breakdown}
                            addonLines={pricingQuote.addonLines}
                            subtotal={pricingQuote.subtotal}
                            addonsTotal={pricingQuote.addonsTotal}
                            bookingFee={bookingFeeEstimate}
                            total={grandTotal}
                            extraRows={[{ label: 'Player', value: data.guest_name || 'Walk-in' }]}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setAddStep(1)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Back
                            </button>
                            <PrimaryButton disabled={processing || !selectedFacilityAccepting || selectedDateClosed} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                Confirm Manual Booking
                            </PrimaryButton>
                        </div>
                    </>
                    )}
                    </form>
                </div>
            </Modal>

            {/* Payment Receipt Preview */}
            {receiptPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setReceiptPreview(null)}
                >
                    <div
                        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setReceiptPreview(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                            aria-label="Close receipt preview"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={receiptPreview}
                            alt="Payment receipt"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <a
                            href={receiptPreview}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 text-xs font-bold text-[#D6FF3F] underline"
                        >
                            Open receipt in a new tab
                        </a>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
