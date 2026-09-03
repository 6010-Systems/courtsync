import React, { useState, useEffect } from 'react';
import Dialog from '@/Components/Dialog';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Phone,
    Mail,
    CreditCard,
    FileText,
    Check,
    AlertCircle,
    UserPlus,
    Building2,
    DollarSign,
    Tag,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    Plus,
    Receipt,
} from 'lucide-react';
import {
    MOCK_COURTS,
    PAYMENT_METHODS,
    BOOKING_STATUS,
    BOOKING_SOURCE,
    INITIAL_BOOKINGS,
    formatTime12,
} from './types';
import PaymentIcon from './PaymentIcon';

const FACILITY_SLOTS = [
    { time: '06:00', label: '6:00 AM' },
    { time: '07:30', label: '7:30 AM' },
    { time: '09:00', label: '9:00 AM' },
    { time: '10:30', label: '10:30 AM' },
    { time: '12:00', label: '12:00 PM' },
    { time: '13:30', label: '1:30 PM' },
    { time: '15:00', label: '3:00 PM' },
    { time: '16:30', label: '4:30 PM' },
    { time: '18:00', label: '6:00 PM' },
    { time: '19:30', label: '7:30 PM' },
    { time: '21:00', label: '9:00 PM' },
];

const AVAILABLE_ADD_ONS = [
    { id: 'racket-2', name: '2x Rackets', price: 100 },
    { id: 'tube-1', name: 'Shuttle Tube', price: 180 },
    { id: 'locker', name: 'Locker Key', price: 50 },
    { id: 'towel', name: 'Towel Rental', price: 40 },
    { id: 'lights', name: 'Night Lights', price: 80 },
    { id: 'referee', name: 'Court Referee', price: 150 },
];

export default function NewBookingDrawer({
    isOpen = false,
    onClose,
    initialCourtId = null,
    initialStartTime = '16:00',
    initialEndTime = '17:30',
    initialSource = BOOKING_SOURCE.WALK_IN,
    existingBookings = INITIAL_BOOKINGS,
    onSubmit,
}) {
    const [step, setStep] = useState(1);
    const source = BOOKING_SOURCE.WALK_IN;
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [courtId, setCourtId] = useState(initialCourtId || MOCK_COURTS[0].id);
    const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(initialStartTime);
    const [durationHours, setDurationHours] = useState(1.5);
    const [selectedAddOns, setSelectedAddOns] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentStatus, setPaymentStatus] = useState('PAID');
    const [paymentReference, setPaymentReference] = useState('');
    const [tenderedAmount, setTenderedAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            if (initialCourtId) setCourtId(initialCourtId);
            if (initialStartTime) setStartTime(initialStartTime);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerEmail('');
            setSelectedAddOns([]);
            setPaymentReference('');
            setTenderedAmount('');
            setNotes('');
            setErrors({});
        }
    }, [isOpen, initialCourtId, initialStartTime]);

    const selectedCourt = MOCK_COURTS.find(c => c.id === courtId) || MOCK_COURTS[0];

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    };

    const computeEndTime = () => {
        if (!startTime) return '17:30';
        const [h, m] = startTime.split(':').map(Number);
        const totalMinutes = h * 60 + (m || 0) + durationHours * 60;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    const calculatedEndTime = computeEndTime();
    const addOnsTotal = selectedAddOns.reduce((sum, id) => {
        const item = AVAILABLE_ADD_ONS.find(a => a.id === id);
        return sum + (item ? item.price : 0);
    }, 0);
    const serverEstimatedPrice = Math.round(selectedCourt.hourlyRate * durationHours) + addOnsTotal;
    const parsedTendered = parseFloat(tenderedAmount) || 0;
    const changeAmount = Math.max(0, parsedTendered - serverEstimatedPrice);

    // Responsive to duration: checks if full [start, end) interval overlaps any booked session or closing time
    const getSlotAvailability = (slotTime) => {
        const startMin = timeToMinutes(slotTime);
        const endMin = startMin + Math.round(durationHours * 60);

        // Check if exceeds facility closing time (11:00 PM / 23:00)
        if (endMin > 23 * 60) {
            return { isAvailable: false, reason: 'Past Hours' };
        }

        // Check against existing court reservations
        const courtBookings = (existingBookings || []).filter(
            b => b.courtId === courtId &&
                 b.status !== BOOKING_STATUS.CANCELLED &&
                 b.status !== 'EXPIRED'
        );

        for (const b of courtBookings) {
            const bStart = timeToMinutes(b.startTime);
            const bEnd = timeToMinutes(b.endTime);

            // Interval collision: start < bEnd && end > bStart
            if (startMin < bEnd && endMin > bStart) {
                if (startMin >= bStart && startMin < bEnd) {
                    return { isAvailable: false, reason: 'Booked' };
                }
                return { isAvailable: false, reason: 'Conflict' };
            }
        }

        return { isAvailable: true, reason: 'Available' };
    };

    const currentSlotAvailability = getSlotAvailability(startTime);

    const toggleAddOn = (id) => {
        setSelectedAddOns(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleProceedToPayment = (e) => {
        if (e) e.preventDefault();

        const newErrors = {};
        if (!customerName.trim()) {
            newErrors.customerName = 'Please enter the customer name';
        }
        if (!customerPhone.trim()) {
            newErrors.customerPhone = 'Mobile number is required';
        }
        if (!currentSlotAvailability.isAvailable) {
            newErrors.startTime = `The ${durationHours}h slot starting at ${formatTime12(startTime)} conflicts with another booking.`;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setStep(2);
    };

    const handleCompleteBooking = () => {
        const addOnsLabels = selectedAddOns
            .map(id => AVAILABLE_ADD_ONS.find(a => a.id === id)?.name)
            .filter(Boolean);

        const combinedNotes = [
            notes.trim(),
            addOnsLabels.length > 0 ? `Add-ons: ${addOnsLabels.join(', ')}` : '',
        ].filter(Boolean).join(' | ');

        const newBooking = {
            courtId: selectedCourt.id,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            customerEmail: customerEmail.trim(),
            sport: selectedCourt.sport,
            startTime,
            endTime: calculatedEndTime,
            durationHours,
            source,
            status: paymentStatus === 'AWAITING_PAYMENT' ? BOOKING_STATUS.AWAITING_PAYMENT : BOOKING_STATUS.CONFIRMED,
            paymentStatus: paymentStatus === 'AWAITING_PAYMENT' ? 'PENDING' : 'PAID',
            paymentMethod,
            paymentReference: paymentReference.trim() || undefined,
            amount: serverEstimatedPrice,
            notes: combinedNotes,
        };

        onSubmit(newBooking);
        onClose();
    };

    // Equal-height header (h-16)
    const customHeader = (
        <div className="h-16 border-b border-[#101F1A]/10 px-6 bg-[#FAF8F5] flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101F1A] text-[#D6FF3F] shadow-xs">
                    {step === 1 ? <UserPlus size={19} strokeWidth={2.4} /> : <CreditCard size={19} strokeWidth={2.4} />}
                </div>
                <div>
                    <h2 className="text-base font-bold tracking-tight text-[#101F1A]">
                        {step === 1 ? 'New Booking — Details' : 'New Booking — Payment'}
                    </h2>
                    <p className="text-xs text-[#101F1A]/55">
                        {step === 1 ? 'Customer details & schedule slot' : 'Select payment method & confirm reservation'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    step === 1
                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                        : 'bg-emerald-100 text-emerald-800'
                }`}>
                    <span>1. Details</span>
                    {step === 2 && <Check size={12} strokeWidth={3} className="text-emerald-700" />}
                </div>
                <div className="h-0.5 w-3 bg-[#101F1A]/20" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    step === 2
                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                        : 'bg-[#101F1A]/8 text-[#101F1A]/50'
                }`}>
                    <span>2. Payment</span>
                </div>
            </div>
        </div>
    );

    // Equal-height footer (h-16)
    const stepFooter = (
        <div className="h-16 border-t border-[#101F1A]/10 px-6 bg-[#FAF8F5] flex items-center justify-between rounded-b-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#101F1A]/60">
                <span className="font-bold text-[#101F1A]">{selectedCourt.shortName}</span>
                <span>•</span>
                <span>{formatTime12(startTime)} – {formatTime12(calculatedEndTime)}</span>
                <span>•</span>
                <span className="font-bold text-[#101F1A]">₱{serverEstimatedPrice.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
                {step === 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 rounded-xl px-4 text-xs font-bold text-[#101F1A]/70 hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleProceedToPayment}
                            className="h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[#101F1A] text-[#D6FF3F] px-5 text-xs font-extrabold uppercase tracking-wider shadow-subtle hover:bg-[#162923] transition-all press-scale cursor-pointer shrink-0"
                        >
                            <span>Proceed to Payment</span>
                            <ChevronRight size={15} strokeWidth={2.5} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="h-10 rounded-xl px-4 text-xs font-bold text-[#101F1A]/70 hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <ArrowLeft size={14} />
                            <span>Back to Details</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCompleteBooking}
                            className="h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-5 text-xs font-extrabold text-[#101F1A] shadow-subtle hover:bg-[#c2ea2e] hover:shadow-volt-glow transition-all press-scale cursor-pointer uppercase tracking-wider shrink-0"
                        >
                            <Check size={15} strokeWidth={2.5} />
                            <span>Confirm & Book</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            header={customHeader}
            size="4xl"
            className="sm:min-h-0"
            closeOnClickOutside={false}
            footer={stepFooter}
        >
            {step === 1 ? (
                /* ── Step 1: 2-Column Space ─────────────────── */
                <form onSubmit={handleProceedToPayment} className="p-5 flex flex-col gap-4 min-h-[520px]">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                        
                        {/* ── Left Column: Player & Notes (5 Cols) ─────── */}
                        <div className="lg:col-span-5 flex flex-col space-y-3">
                            {/* Customer Details Card (Compact Spacing) */}
                            <div className="rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#101F1A]/8 space-y-2.5">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70 block">
                                    <User size={13} className="text-[#101F1A]/50" />
                                    <span>Customer Information</span>
                                </span>

                                <div className="space-y-2.5">
                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            Full Name / Group <span className="text-[#FF5A36]">*</span>
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" size={14} />
                                            <input
                                                type="text"
                                                required
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="e.g. Juan Dela Cruz / Team Smash"
                                                className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-9 pr-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A] transition-all"
                                            />
                                        </div>
                                        {errors.customerName && (
                                            <p className="text-[11px] text-[#B8391D] mt-1 font-bold">{errors.customerName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            Mobile Number <span className="text-[#FF5A36]">*</span>
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" size={14} />
                                            <input
                                                type="tel"
                                                required
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="e.g. 0917 123 4567"
                                                className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-9 pr-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A] transition-all"
                                            />
                                        </div>
                                        {errors.customerPhone && (
                                            <p className="text-[11px] text-[#B8391D] mt-1 font-bold">{errors.customerPhone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            Email Address <span className="text-[#101F1A]/40 font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" size={14} />
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                placeholder="e.g. player@gmail.com"
                                                className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-9 pr-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A] transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Notes Card (Consumes all available vertical space) */}
                            <div className="rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#101F1A]/8 space-y-2.5 flex-1 flex flex-col justify-between min-h-[140px]">
                                <div className="space-y-1">
                                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70 block">
                                        <FileText size={13} className="text-[#101F1A]/50" />
                                        <span>Staff Notes & Instructions</span>
                                    </span>
                                    <p className="text-[11px] text-[#101F1A]/50">
                                        Special requests, customer preferences, or staff reminders.
                                    </p>
                                </div>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. VIP player, equipment requested at front desk, tournament bracket match..."
                                    className="w-full flex-1 min-h-[110px] rounded-xl border border-[#101F1A]/15 bg-white p-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A] resize-none transition-all"
                                />
                            </div>
                        </div>

                        {/* ── Right Column: Court, Schedule, Slots & Add-ons (7 Cols) */}
                        <div className="lg:col-span-7 flex flex-col space-y-3">
                            {/* Court Selection Cards */}
                            <div>
                                <label className="block text-xs font-bold text-[#101F1A] mb-1.5">
                                    Target Court
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {MOCK_COURTS.map((c) => {
                                        const isSelected = courtId === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setCourtId(c.id)}
                                                className={[
                                                    'flex flex-col justify-between p-2.5 min-h-[60px] rounded-xl border text-left transition-all cursor-pointer',
                                                    isSelected
                                                        ? 'bg-[#101F1A] text-white border-[#101F1A] shadow-xs'
                                                        : 'bg-white text-[#101F1A] border-[#101F1A]/12 hover:border-[#101F1A]/30',
                                                ].join(' ')}
                                            >
                                                <span className="font-bold text-xs truncate">
                                                    {c.shortName}
                                                </span>
                                                <span className={[
                                                    'text-[10px] font-black mt-1 px-1.5 py-0.5 rounded-md self-start',
                                                    isSelected
                                                        ? 'bg-[#D6FF3F] text-[#101F1A]'
                                                        : 'bg-[#101F1A]/6 text-[#101F1A]',
                                                ].join(' ')}>
                                                    ₱{c.hourlyRate}/h
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Date, Start Time & Duration (Moved up below Court Selection) */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={bookingDate}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs font-semibold text-[#101F1A] focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs font-semibold text-[#101F1A] focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                        Duration
                                    </label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {[1, 1.5, 2, 3].map((dur) => (
                                            <button
                                                key={dur}
                                                type="button"
                                                onClick={() => setDurationHours(dur)}
                                                className={[
                                                    'rounded-xl h-10 text-xs font-bold transition-colors cursor-pointer border flex items-center justify-center',
                                                    durationHours === dur
                                                        ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A]'
                                                        : 'bg-white text-[#101F1A]/75 border-[#101F1A]/12 hover:bg-[#F5F2EA]',
                                                ].join(' ')}
                                            >
                                                {dur}h
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Available Facility Slots Grid */}
                            <div className="rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#101F1A]/8 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70">
                                        <Clock size={13} className="text-[#101F1A]/50" />
                                        <span>Available Slots for {selectedCourt.shortName}</span>
                                    </span>
                                    {currentSlotAvailability.isAvailable ? (
                                        <span className="text-[11px] font-bold text-[#0E7A56] bg-[#0E7A56]/10 px-2 py-0.5 rounded-md">
                                            Slot: {formatTime12(startTime)} – {formatTime12(calculatedEndTime)} ({durationHours}h)
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-bold text-[#B8391D] bg-[#B8391D]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <AlertCircle size={12} />
                                            <span>Time Overlap ({durationHours}h hits booked session)</span>
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {FACILITY_SLOTS.map((slot) => {
                                        const { isAvailable, reason } = getSlotAvailability(slot.time);
                                        const isCurrent = startTime === slot.time;
                                        return (
                                            <button
                                                key={slot.time}
                                                type="button"
                                                disabled={!isAvailable}
                                                onClick={() => setStartTime(slot.time)}
                                                className={[
                                                    'flex flex-col items-center justify-center py-2.5 px-2 min-h-[52px] rounded-xl border text-center transition-all cursor-pointer text-xs',
                                                    isCurrent
                                                        ? isAvailable
                                                            ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A] shadow-xs'
                                                            : 'bg-[#B8391D] text-white border-[#B8391D] shadow-xs'
                                                        : !isAvailable
                                                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through opacity-60'
                                                            : 'bg-white text-[#101F1A] border-[#101F1A]/15 hover:border-[#101F1A]/40 hover:bg-[#F5F2EA]',
                                                ].join(' ')}
                                            >
                                                <span className="font-bold text-xs">{slot.label}</span>
                                                <span className="text-[10px] mt-0.5 opacity-75">
                                                    {isCurrent
                                                        ? (isAvailable ? 'Selected' : 'Conflict')
                                                        : (!isAvailable ? reason : 'Available')}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {errors.startTime && (
                                    <p className="text-[11px] text-[#B8391D] font-bold flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        <span>{errors.startTime}</span>
                                    </p>
                                )}
                            </div>

                            {/* Equipment & Add-ons (Checkable Cards below Slots) */}
                            <div className="rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#101F1A]/8 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70">
                                        <Tag size={13} className="text-[#101F1A]/50" />
                                        <span>Equipment & Add-ons</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-[#101F1A]/60">
                                        {selectedAddOns.length > 0 ? (
                                            <span className="text-[#0E7A56] bg-[#0E7A56]/10 px-2 py-0.5 rounded-md">
                                                {selectedAddOns.length} selected (+₱{addOnsTotal})
                                            </span>
                                        ) : (
                                            'Optional'
                                        )}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {AVAILABLE_ADD_ONS.map((addon) => {
                                        const isChecked = selectedAddOns.includes(addon.id);
                                        return (
                                            <button
                                                key={addon.id}
                                                type="button"
                                                onClick={() => toggleAddOn(addon.id)}
                                                className={[
                                                    'flex items-center justify-between p-2.5 min-h-[44px] rounded-xl border text-left transition-all cursor-pointer text-xs',
                                                    isChecked
                                                        ? 'bg-[#101F1A] text-white border-[#101F1A] shadow-xs'
                                                        : 'bg-white text-[#101F1A] border-[#101F1A]/12 hover:border-[#101F1A]/30',
                                                ].join(' ')}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={[
                                                        'h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                                                        isChecked
                                                            ? 'bg-[#D6FF3F] border-[#D6FF3F] text-[#101F1A]'
                                                            : 'bg-white border-[#101F1A]/25',
                                                    ].join(' ')}>
                                                        {isChecked && <Check size={11} strokeWidth={3} />}
                                                    </div>
                                                    <span className="font-bold text-xs truncate">{addon.name}</span>
                                                </div>
                                                <span className={[
                                                    'text-[10px] font-extrabold shrink-0 ml-1.5',
                                                    isChecked ? 'text-[#D6FF3F]' : 'text-[#101F1A]/60',
                                                ].join(' ')}>
                                                    +₱{addon.price}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                /* ── Step 2: Payment & Checkout Maximized ──────────────────── */
                <div className="p-4 sm:p-5 flex flex-col gap-3.5 min-h-[500px]">
                    {/* Order Summary Card */}
                    <div className="rounded-2xl bg-[#101F1A] p-4 text-[#F5F2EA] shadow-subtle flex items-center justify-between gap-3 shrink-0">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black text-[#D6FF3F] bg-[#D6FF3F]/15 px-2 py-0.5 rounded uppercase tracking-wider">
                                    Order Summary
                                </span>
                                <span className="text-xs text-white/40">•</span>
                                <span className="text-xs font-semibold text-white/90 truncate">
                                    {selectedCourt.name}
                                </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                                {customerName} <span className="text-white/40 font-normal text-xs">({customerPhone})</span>
                            </h3>
                            <p className="text-[11px] text-[#F5F2EA]/75 truncate">
                                <span>{bookingDate}</span> • <span>{formatTime12(startTime)} – {formatTime12(calculatedEndTime)} ({durationHours}h)</span>
                                {selectedAddOns.length > 0 && (
                                    <span className="text-[#D6FF3F] ml-1 font-semibold">
                                        • +{selectedAddOns.length} Add-on{selectedAddOns.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                            <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block">Total Due</span>
                            <span className="text-2xl sm:text-3xl font-black text-[#D6FF3F] tracking-tight">
                                ₱{serverEstimatedPrice.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
                        {/* Payment Method Selector (7 Cols) */}
                        <div className="lg:col-span-7 rounded-2xl bg-[#FAF8F5] p-4 border border-[#101F1A]/8 flex flex-col justify-between space-y-3">
                            <div className="space-y-2.5">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <CreditCard size={13} className="text-[#101F1A]/50" />
                                    <span>Select Payment Method</span>
                                </span>

                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {PAYMENT_METHODS.map((method) => {
                                        const isSelected = paymentMethod === method.id;
                                        return (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={[
                                                    'flex flex-col items-center justify-center p-2.5 min-h-[64px] rounded-xl border text-center transition-all cursor-pointer',
                                                    isSelected
                                                        ? 'bg-[#101F1A] text-white border-[#101F1A] shadow-xs'
                                                        : 'bg-white text-[#101F1A]/75 border-[#101F1A]/10 hover:bg-[#F5F2EA]',
                                                ].join(' ')}
                                            >
                                                <PaymentIcon method={method.id} size={18} className={isSelected ? 'text-[#D6FF3F]' : 'text-[#101F1A]/70'} />
                                                <span className="font-bold text-xs mt-1.5 truncate max-w-full">{method.label.split(' ')[0]}</span>
                                                <span className={[
                                                    'text-[10px] mt-0.5',
                                                    isSelected ? 'text-[#D6FF3F]' : 'text-[#101F1A]/45'
                                                ].join(' ')}>
                                                    Instant
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dynamic Provider Panels */}
                            {paymentMethod === 'GCASH' ? (
                                <div className="space-y-3 pt-3 border-t border-[#101F1A]/8">
                                    <div className="rounded-2xl bg-[#007DFE]/8 border border-[#007DFE]/25 p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 px-2 rounded-md bg-[#007DFE] text-white text-[11px] font-black tracking-wider flex items-center justify-center">
                                                    GCash
                                                </div>
                                                <span className="text-xs font-bold text-[#101F1A]">Express Merchant</span>
                                            </div>
                                            <span className="text-[10px] font-extrabold text-[#007DFE] bg-[#007DFE]/15 px-2 py-0.5 rounded-md">
                                                Active QR & Number
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-[#007DFE]/15">
                                            <div>
                                                <span className="text-[10px] text-[#101F1A]/50 block font-semibold">Account Name</span>
                                                <span className="font-extrabold text-[#101F1A] truncate block">CourtSync Facilities Inc.</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#101F1A]/50 block font-semibold">GCash Mobile No.</span>
                                                <span className="font-extrabold text-[#007DFE] block">0917 888 2687</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            GCash Reference / Transaction No. <span className="text-[#FF5A36]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="e.g. 1002 9847 2891"
                                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs font-semibold text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#007DFE] focus:ring-1 focus:ring-[#007DFE]"
                                        />
                                    </div>
                                </div>
                            ) : paymentMethod === 'MAYA' ? (
                                <div className="space-y-3 pt-3 border-t border-[#101F1A]/8">
                                    <div className="rounded-2xl bg-[#22C55E]/8 border border-[#22C55E]/25 p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 px-2 rounded-md bg-[#22C55E] text-white text-[11px] font-black tracking-wider flex items-center justify-center">
                                                    Maya
                                                </div>
                                                <span className="text-xs font-bold text-[#101F1A]">Maya Business Verified</span>
                                            </div>
                                            <span className="text-[10px] font-extrabold text-[#16A34A] bg-[#22C55E]/15 px-2 py-0.5 rounded-md">
                                                Instant Settlement
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-2.5 rounded-xl border border-[#22C55E]/15">
                                            <div>
                                                <span className="text-[10px] text-[#101F1A]/50 block font-semibold">Merchant Name</span>
                                                <span className="font-extrabold text-[#101F1A] truncate block">CourtSync Arena PH</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#101F1A]/50 block font-semibold">Maya Business ID</span>
                                                <span className="font-extrabold text-[#16A34A] block">MY-CS-99201</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            Maya Approval / Ref Code <span className="text-[#FF5A36]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="e.g. MAYA-8902187"
                                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs font-semibold text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]"
                                        />
                                    </div>
                                </div>
                            ) : paymentMethod === 'QRPH' ? (
                                <div className="pt-3 border-t border-[#101F1A]/8">
                                    <div className="flex flex-col sm:flex-row items-center gap-3.5 bg-white p-3.5 rounded-2xl border border-[#101F1A]/10 shadow-2xs">
                                        {/* Stylized QR Code Box */}
                                        <div className="p-2 rounded-xl bg-white border border-[#101F1A]/12 shadow-subtle shrink-0 flex flex-col items-center justify-center">
                                            {/* QR SVG */}
                                            <svg width="118" height="118" viewBox="0 0 124 124" className="text-[#101F1A]">
                                                {/* Background */}
                                                <rect width="124" height="124" fill="#FFFFFF" rx="8" />
                                                {/* Top-Left Finder */}
                                                <rect x="10" y="10" width="30" height="30" rx="4" fill="#101F1A" />
                                                <rect x="15" y="15" width="20" height="20" rx="2" fill="#FFFFFF" />
                                                <rect x="20" y="20" width="10" height="10" rx="2" fill="#101F1A" />
                                                {/* Top-Right Finder */}
                                                <rect x="84" y="10" width="30" height="30" rx="4" fill="#101F1A" />
                                                <rect x="89" y="15" width="20" height="20" rx="2" fill="#FFFFFF" />
                                                <rect x="94" y="20" width="10" height="10" rx="2" fill="#101F1A" />
                                                {/* Bottom-Left Finder */}
                                                <rect x="10" y="84" width="30" height="30" rx="4" fill="#101F1A" />
                                                <rect x="15" y="89" width="20" height="20" rx="2" fill="#FFFFFF" />
                                                <rect x="20" y="94" width="10" height="10" rx="2" fill="#101F1A" />
                                                {/* Data Matrix Elements */}
                                                <rect x="46" y="12" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="58" y="12" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="70" y="12" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="46" y="24" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="70" y="24" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="58" y="30" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                
                                                <rect x="12" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="24" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="36" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="84" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="96" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="108" y="46" width="6" height="6" rx="1.5" fill="#101F1A" />

                                                <rect x="12" y="58" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="30" y="58" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="84" y="58" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="102" y="58" width="6" height="6" rx="1.5" fill="#101F1A" />

                                                <rect x="12" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="24" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="36" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="84" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="96" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="108" y="70" width="6" height="6" rx="1.5" fill="#101F1A" />

                                                <rect x="46" y="84" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="58" y="84" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="70" y="84" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="46" y="96" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="70" y="96" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="46" y="108" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="58" y="108" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="84" y="96" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="96" y="108" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="108" y="84" width="6" height="6" rx="1.5" fill="#101F1A" />
                                                <rect x="108" y="102" width="6" height="6" rx="1.5" fill="#101F1A" />

                                                {/* Center QR Ph / CourtSync Badge */}
                                                <rect x="47" y="47" width="30" height="30" rx="7" fill="#101F1A" />
                                                <rect x="50" y="50" width="24" height="24" rx="5" fill="#D6FF3F" />
                                                <path d="M56 62 L60 66 L68 55" stroke="#101F1A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                            </svg>
                                            <span className="text-[9px] font-black uppercase text-[#101F1A] bg-[#D6FF3F] px-2 py-0.5 rounded-full mt-1.5 tracking-wider shadow-2xs">
                                                QR Ph
                                            </span>
                                        </div>

                                        {/* QR Info & Reference Input */}
                                        <div className="flex-1 space-y-2 min-w-0 w-full">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-[#101F1A]">Scan with Any PH App</span>
                                                    <span className="text-xs font-black text-[#0E7A56] bg-[#0E7A56]/10 px-2 py-0.5 rounded-md">
                                                        ₱{serverEstimatedPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-[#101F1A]/60 mt-0.5 leading-tight">
                                                    GCash, Maya, ShopeePay, BPI, BDO, UnionBank, RCBC.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-[#101F1A] mb-1">
                                                    Transaction / Reference No. <span className="text-[#101F1A]/40 font-normal">(Optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentReference}
                                                    onChange={(e) => setPaymentReference(e.target.value)}
                                                    placeholder="e.g. Instapay Ref #98765432"
                                                    className="h-9.5 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : paymentMethod === 'CARD' ? (
                                <div className="space-y-3 pt-3 border-t border-[#101F1A]/8">
                                    <div className="rounded-2xl bg-[#6366F1]/8 border border-[#6366F1]/25 p-3.5 space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 px-2 rounded-md bg-[#6366F1] text-white text-[11px] font-black tracking-wider flex items-center justify-center">
                                                    POS Card
                                                </div>
                                                <span className="text-xs font-bold text-[#101F1A]">Frontdesk Terminal</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#6366F1]">
                                                <span>Visa · MC · JCB · BancNet</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-[#101F1A]/65 bg-white/80 p-2.5 rounded-xl border border-[#6366F1]/15 leading-relaxed">
                                            Insert or tap customer card on physical counter POS terminal. Enter transaction approval code below once receipt prints.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                            Terminal Approval / Auth Code <span className="text-[#FF5A36]">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="e.g. AUTH-654321 / BDO-POS-01"
                                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs font-semibold text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* CASH */
                                <div className="space-y-3 pt-3 border-t border-[#101F1A]/8">
                                    {/* Quick Cash Presets */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-[11px] font-bold text-[#101F1A]/70">
                                                Quick Cash Bills & Shortcuts
                                            </label>
                                            {tenderedAmount && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTenderedAmount('')}
                                                    className="text-[10px] font-bold text-[#FF5A36] hover:underline cursor-pointer"
                                                >
                                                    Clear Amount
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setTenderedAmount(String(serverEstimatedPrice))}
                                                className={[
                                                    'h-8 rounded-lg border text-xs font-black transition-all cursor-pointer truncate px-1',
                                                    parsedTendered === serverEstimatedPrice
                                                        ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A]'
                                                        : 'bg-white text-[#101F1A] border-[#101F1A]/15 hover:bg-[#101F1A] hover:text-[#D6FF3F]',
                                                ].join(' ')}
                                            >
                                                Exact (₱{serverEstimatedPrice.toLocaleString()})
                                            </button>
                                            {[500, 1000, 2000].map((bill) => (
                                                <button
                                                    key={bill}
                                                    type="button"
                                                    onClick={() => setTenderedAmount(String(bill))}
                                                    className={[
                                                        'h-8 rounded-lg border text-xs font-bold transition-all cursor-pointer',
                                                        parsedTendered === bill
                                                            ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A]'
                                                            : 'bg-white text-[#101F1A] border-[#101F1A]/15 hover:bg-[#101F1A] hover:text-[#D6FF3F]',
                                                    ].join(' ')}
                                                >
                                                    ₱{bill.toLocaleString()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom Cash Received & Change Due Calculation */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                                Cash Received <span className="text-[#FF5A36]">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-[#101F1A]/50">
                                                    ₱
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={tenderedAmount}
                                                    onChange={(e) => setTenderedAmount(e.target.value)}
                                                    placeholder={`e.g. ${serverEstimatedPrice}`}
                                                    className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-7 pr-3 text-xs font-black text-[#101F1A] placeholder:text-[#101F1A]/35 placeholder:font-normal focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-[#101F1A] mb-1">
                                                {parsedTendered < serverEstimatedPrice && parsedTendered > 0
                                                    ? 'Remaining Balance'
                                                    : 'Change to Return'}
                                            </label>
                                            <div className={[
                                                'h-10 rounded-xl border px-3 flex items-center justify-between font-black text-xs transition-colors',
                                                parsedTendered >= serverEstimatedPrice
                                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                                    : parsedTendered > 0
                                                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                                                    : 'border-[#101F1A]/10 bg-white text-[#101F1A]/50',
                                            ].join(' ')}>
                                                <span className="text-sm">
                                                    ₱{parsedTendered >= serverEstimatedPrice
                                                        ? changeAmount.toLocaleString()
                                                        : parsedTendered > 0
                                                        ? (serverEstimatedPrice - parsedTendered).toLocaleString()
                                                        : '0.00'}
                                                </span>
                                                <span className={[
                                                    'text-[9px] font-bold px-1.5 py-0.5 rounded',
                                                    parsedTendered >= serverEstimatedPrice
                                                        ? (changeAmount === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-200 text-emerald-800')
                                                        : parsedTendered > 0
                                                        ? 'bg-amber-200 text-amber-800'
                                                        : 'bg-stone-100 text-[#101F1A]/40',
                                                ].join(' ')}>
                                                    {parsedTendered >= serverEstimatedPrice
                                                        ? (changeAmount === 0 ? 'Exact Amount' : 'Return Change')
                                                        : parsedTendered > 0
                                                        ? 'Short Amount'
                                                        : 'Enter Cash'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Cashier Drawer / Receipt Reference */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#101F1A]/70 mb-1">
                                            Official Receipt / Drawer Ref <span className="text-[#101F1A]/40 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentReference}
                                            onChange={(e) => setPaymentReference(e.target.value)}
                                            placeholder="e.g. OR #8841 / Front Register 1"
                                            className="h-9 w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 text-xs text-[#101F1A] placeholder:text-[#101F1A]/35 focus:border-[#101F1A] focus:ring-1 focus:ring-[#101F1A]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Settlement State & Breakdown (5 Cols) */}
                        <div className="lg:col-span-5 rounded-2xl bg-[#FAF8F5] p-4 border border-[#101F1A]/8 flex flex-col justify-between space-y-3">
                            <div className="space-y-2.5">
                                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <ShieldCheck size={14} className="text-[#101F1A]/50" />
                                    <span>Settlement Mode</span>
                                </span>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentStatus('PAID')}
                                        className={[
                                            'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px]',
                                            paymentStatus === 'PAID'
                                                ? 'bg-[#0E7A56] text-white border-[#0E7A56] shadow-xs'
                                                : 'bg-white text-[#101F1A]/70 border-[#101F1A]/12 hover:bg-[#F5F2EA]',
                                        ].join(' ')}
                                    >
                                        <span className="font-bold text-xs">Paid & Confirmed</span>
                                        <span className="text-[10px] mt-0.5 opacity-80">Full payment received</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentStatus('AWAITING_PAYMENT')}
                                        className={[
                                            'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[64px]',
                                            paymentStatus === 'AWAITING_PAYMENT'
                                                ? 'bg-[#FF5A36] text-white border-[#FF5A36] shadow-xs'
                                                : 'bg-white text-[#101F1A]/70 border-[#101F1A]/12 hover:bg-[#F5F2EA]',
                                        ].join(' ')}
                                    >
                                        <span className="font-bold text-xs">Hold for Payment</span>
                                        <span className="text-[10px] mt-0.5 opacity-80">30-min hold timer</span>
                                    </button>
                                </div>
                            </div>

                            {/* Itemized Billing Breakdown Box (Consumes Full Height Safely) */}
                            <div className="flex-1 flex flex-col justify-between rounded-2xl bg-white p-3.5 sm:p-4 border border-[#101F1A]/10 shadow-2xs space-y-2.5 overflow-hidden">
                                <div className="space-y-2 min-w-0">
                                    <div className="flex items-center justify-between border-b border-[#101F1A]/8 pb-1.5">
                                        <span className="text-[11px] font-black uppercase tracking-wider text-[#101F1A]/60 flex items-center gap-1.5">
                                            <Receipt size={13} className="text-[#101F1A]/50" />
                                            <span>Financial Summary</span>
                                        </span>
                                        <span className="text-[10px] font-bold text-[#101F1A]/45 bg-stone-100 px-2 py-0.5 rounded">
                                            Walk-in Billing
                                        </span>
                                    </div>

                                    {/* Line Items (Scroll-safe) */}
                                    <div className="space-y-1.5 text-xs text-[#101F1A]/75 overflow-y-auto max-h-[140px] pr-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="font-bold text-[#101F1A] block truncate">{selectedCourt.name}</span>
                                                <span className="text-[11px] text-[#101F1A]/50">{durationHours}h @ ₱{selectedCourt.hourlyRate}/h</span>
                                            </div>
                                            <span className="font-black text-[#101F1A] shrink-0">
                                                ₱{(selectedCourt.hourlyRate * durationHours).toLocaleString()}
                                            </span>
                                        </div>

                                        {selectedAddOns.length > 0 ? (
                                            <div className="pt-1.5 border-t border-[#101F1A]/6 space-y-1">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-[#101F1A]/60">
                                                    <span>Selected Add-ons ({selectedAddOns.length})</span>
                                                    <span className="text-[#0E7A56]">+₱{addOnsTotal.toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-1 pl-1">
                                                    {selectedAddOns.map(id => {
                                                        const item = AVAILABLE_ADD_ONS.find(a => a.id === id);
                                                        if (!item) return null;
                                                        return (
                                                            <div key={id} className="flex items-center justify-between text-[11px] text-[#101F1A]/70">
                                                                <span className="truncate">• {item.name}</span>
                                                                <span className="font-semibold text-[#101F1A]/70 shrink-0">+₱{item.price}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#101F1A]/6">
                                                <span className="text-[#101F1A]/50">Equipment & Add-ons</span>
                                                <span className="text-[#101F1A]/40 font-medium">None selected</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#101F1A]/6">
                                            <span className="text-[#101F1A]/50">Facility Tax & Service</span>
                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                                Included (0%)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total & Status Footer */}
                                <div className="border-t border-dashed border-[#101F1A]/15 pt-2.5 space-y-1.5 shrink-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] text-[#101F1A]/50 font-black uppercase tracking-wider block">
                                                Total Due
                                            </span>
                                            <span className="text-lg sm:text-xl font-black text-[#101F1A] tracking-tight">
                                                ₱{serverEstimatedPrice.toLocaleString()}
                                            </span>
                                        </div>
                                        <span className={[
                                            'text-[10px] px-2.5 py-1 rounded-lg font-black flex items-center gap-1.5 shadow-2xs shrink-0',
                                            paymentStatus === 'PAID'
                                                ? 'bg-[#0E7A56] text-white'
                                                : 'bg-[#FF5A36] text-white'
                                        ].join(' ')}>
                                            <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-white" />
                                            <span>{paymentStatus === 'PAID' ? 'Instant Sync' : '30-Min Hold'}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
