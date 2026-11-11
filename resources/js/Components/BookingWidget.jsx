import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES_DARK, courtIsBookable } from '@/Utils/courtStatus';

export default function BookingWidget({ facility, user, courts = [] }) {
    const bookableCourts = courts.filter((c) => courtIsBookable(c.status));
    const selectableCourts = bookableCourts.length > 0 ? bookableCourts : courts;

    const generateTimeOptions = (timeRange, selectedDate, courtId, allBookings = []) => {
        let startHour = 6;
        let endHour = 22;

        if (timeRange) {
            const match = timeRange.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);
            if (match) {
                let sH = parseInt(match[1]);
                const sM = match[2];
                let eH = parseInt(match[3]);
                const eM = match[4];

                if (sM && sM.toUpperCase() === 'PM' && sH < 12) sH += 12;
                if (sM && sM.toUpperCase() === 'AM' && sH === 12) sH = 0;
                
                if (eM && eM.toUpperCase() === 'PM' && eH < 12) eH += 12;
                if (eM && eM.toUpperCase() === 'AM' && eH === 12) eH = 0;

                startHour = sH;
                endHour = eH;
            }
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
            const timeValue = `${i.toString().padStart(2, '0')}:00`;
            const date = new Date();
            date.setHours(i, 0);
            const formatted = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            options.push({ value: timeValue, label: formatted, isBooked: bookedHours.has(i) });
        }
        return options;
    };

    const [selectedCourtId, setSelectedCourtId] = useState(selectableCourts[0]?.id ?? null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
    const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });
    const [processing, setProcessing] = useState(false);
    const submittingRef = useRef(false);

    const showModal = (type, message) => setModal({ isOpen: true, type, message });
    const closeModal = () => setModal({ isOpen: false, type: '', message: '' });
    
    const selectedCourt = selectableCourts.find(c => c.id == selectedCourtId);
    const timeOptions = useMemo(() => {
        return generateTimeOptions(selectedCourt?.time_range, selectedDate, selectedCourt?.id, facility.bookings || []);
    }, [selectedCourt, selectedDate, facility.bookings]);

    // Generate next 14 days
    const dates = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        dates.push({
            date: localDate,
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: d.getDate(),
        });
    }

    useEffect(() => {
        const d = new Date();
        const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        if (selectedDate !== localDate) {
           setSelectedDate(localDate);
        }
    }, []);

    // Clear times when court changes
    useEffect(() => {
        setStartTime('');
        setEndTime('');
    }, [selectedDate, selectedCourtId]);

    const handleBooking = () => {
        if (!startTime || !endTime || !selectedCourtId || processing || submittingRef.current) return;

        // Generate a fresh idempotency key for every attempt so retries are never blocked
        const freshKey = crypto.randomUUID();

        submittingRef.current = true;
        setProcessing(true);

        router.post(route('bookings.store'), {
            facility_id: facility.id,
            court_id: selectedCourtId,
            date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            total_price: price
        }, {
            headers: {
                'Idempotency-Key': freshKey
            },
            onFinish: () => {
                submittingRef.current = false;
                setProcessing(false);
            },
            onSuccess: () => {
                showModal('success', 'Booking submitted successfully. Awaiting confirmation.');
                setStartTime('');
                setEndTime('');
                setIdempotencyKey(crypto.randomUUID());
            },
            onError: (errors) => {
                console.error(errors);
                const errorMsg = errors.idempotency || errors.conflict || 'Failed to process booking. Please try again.';
                showModal('error', errorMsg);
                setIdempotencyKey(crypto.randomUUID());
            }
        });
    };

    const pricingSummary = useMemo(() => {
        if (!selectedCourt || !startTime || !endTime) {
            return { isSplit: false, durationHours: 0, totalPrice: 0, breakdown: [] };
        }
        const [sH] = startTime.split(':').map(Number);
        const [eH] = endTime.split(':').map(Number);
        const diff = Math.max(0, eH - sH);
        const isSplit = selectedCourt.pricing_mode === 'SPLIT' && Boolean(selectedCourt.day_rate && selectedCourt.night_rate);

        if (!isSplit) {
            const rate = Number(selectedCourt.hourly_rate || 0);
            return { isSplit: false, durationHours: diff, totalPrice: diff * rate, rate };
        }

        const dayRate = Number(selectedCourt.day_rate);
        const nightRate = Number(selectedCourt.night_rate);
        const dayStartH = selectedCourt.day_start_time ? parseInt(String(selectedCourt.day_start_time).split(':')[0], 10) : 6;
        const nightStartH = selectedCourt.night_start_time ? parseInt(String(selectedCourt.night_start_time).split(':')[0], 10) : 18;

        let dayHours = 0;
        let nightHours = 0;
        for (let h = sH; h < eH; h++) {
            if (h >= nightStartH || h < dayStartH) nightHours++;
            else dayHours++;
        }

        const daySubtotal = dayHours * dayRate;
        const nightSubtotal = nightHours * nightRate;
        return {
            isSplit: true,
            durationHours: diff,
            totalPrice: daySubtotal + nightSubtotal,
            dayHours,
            nightHours,
            dayRate,
            nightRate,
            daySubtotal,
            nightSubtotal,
            breakdown: [
                dayHours > 0 ? { label: 'Day Rate', hours: dayHours, rate: dayRate, subtotal: daySubtotal } : null,
                nightHours > 0 ? { label: 'Night Rate', hours: nightHours, rate: nightRate, subtotal: nightSubtotal } : null,
            ].filter(Boolean),
        };
    }, [selectedCourt, startTime, endTime]);

    const durationHours = pricingSummary.durationHours;
    const totalPrice = pricingSummary.totalPrice;
    const price = selectedCourt?.hourly_rate ? Number(selectedCourt.hourly_rate) : (Number(selectedCourt?.day_rate) || 0);

    const formatTimeString = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    if (selectableCourts.length === 0) {
        return (
            <div className="bg-[#10221C] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#10221C]/40 border border-white/10">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Book a Court</h3>
                <p className="text-sm text-gray-400">This facility hasn't listed any courts yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-[#10221C] p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl shadow-[#10221C]/40 border border-white/10 lg:sticky lg:top-10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Book a Court</h3>
            <p className="text-sm text-gray-400 mb-5 sm:mb-6">Select a date and time to reserve.</p>

            <div className="space-y-5 sm:space-y-6">
                {/* Court Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Select Court</label>
                    <div className="relative">
                        <select
                            value={selectedCourtId}
                            onChange={(e) => setSelectedCourtId(e.target.value)}
                            className="block w-full pl-4 pr-10 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-white border-2 border-white/10 bg-white/5 focus:outline-none focus:ring-0 focus:border-[#D6FF3F] rounded-xl appearance-none transition hover:border-white/20 cursor-pointer"
                        >
                            {selectableCourts.map(court => (
                                <option key={court.id} value={court.id} className="text-gray-900">
                                    {court.name}{court.type ? ` (${court.type})` : ''}
                                    {court.pricing_mode === 'SPLIT' && court.day_rate && court.night_rate 
                                        ? ` - ☀️ ₱${Number(court.day_rate).toFixed(0)} / 🌙 ₱${Number(court.night_rate).toFixed(0)}/hr` 
                                        : (court.hourly_rate ? ` - ₱${Number(court.hourly_rate).toFixed(2)}/hr` : '')} · {COURT_STATUS_LABELS[court.status] || court.status}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {selectedCourt && (
                        <span className={`mt-2 inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${COURT_STATUS_STYLES_DARK[selectedCourt.status] || COURT_STATUS_STYLES_DARK.NOT_AVAILABLE}`}>
                            {COURT_STATUS_LABELS[selectedCourt.status] || selectedCourt.status}
                            {selectedCourt.time_range ? ` · ${selectedCourt.time_range}` : ''}
                        </span>
                    )}
                </div>

                {/* Date Selection */}
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Select Date</label>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x hide-scrollbar">
                        {dates.map((d, i) => (
                            <button 
                                key={i} 
                                onClick={() => setSelectedDate(d.date)}
                                className={`flex-shrink-0 snap-start w-20 py-4 rounded-2xl border-2 text-center transition-all ${selectedDate === d.date ? 'border-[#D6FF3F] bg-[#D6FF3F] text-[#10221C] shadow-lg shadow-[#D6FF3F]/20' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'}`}
                            >
                                <div className="text-xs font-bold uppercase tracking-wider mb-1">{d.dayName}</div>
                                <div className="text-2xl font-black">{d.dayNumber}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">Start Time</label>
                        <div className="relative">
                            <select
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(e.target.value);
                                    if (endTime && e.target.value >= endTime) {
                                        setEndTime('');
                                    }
                                }}
                                className="block w-full pl-4 pr-10 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white border-2 border-white/10 bg-white/5 focus:outline-none focus:ring-0 focus:border-[#D6FF3F] rounded-xl appearance-none !bg-none transition hover:border-white/20 cursor-pointer"
                            >
                                <option value="" className="text-gray-900">--:--</option>
                                {timeOptions.slice(0, -1).map((opt) => (
                                    <option key={opt.value} value={opt.value} disabled={opt.isBooked} className="text-gray-900">
                                        {opt.label} {opt.isBooked ? '(Booked)' : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2">End Time</label>
                        <div className="relative">
                            <select
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                disabled={!startTime}
                                className="block w-full pl-4 pr-10 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white border-2 border-white/10 bg-white/5 focus:outline-none focus:ring-0 focus:border-[#D6FF3F] rounded-xl appearance-none !bg-none transition hover:border-white/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="" className="text-gray-900">--:--</option>
                                {(() => {
                                    const startIndex = timeOptions.findIndex(o => o.value === startTime);
                                    let firstBookedAfterStart = timeOptions.findIndex((o, index) => index >= startIndex && o.isBooked);
                                    if (firstBookedAfterStart === -1) firstBookedAfterStart = timeOptions.length - 1;
                                    
                                    return timeOptions.filter((opt, index) => startTime && index > startIndex && index <= firstBookedAfterStart).map((opt) => (
                                        <option key={opt.value} value={opt.value} className="text-gray-900">{opt.label}</option>
                                    ));
                                })()}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                {startTime && endTime && durationHours > 0 && (
                    <div className="bg-[#1A332B] rounded-2xl p-4 sm:p-5 mt-6 sm:mt-8 border border-white/5 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300 font-medium">{selectedCourt?.name} ({durationHours} hr{durationHours > 1 ? 's' : ''})</span>
                            <span className="font-bold text-white">
                                {pricingSummary.isSplit
                                    ? `☀️ ₱${pricingSummary.dayRate} / 🌙 ₱${pricingSummary.nightRate}/hr`
                                    : `₱${price.toFixed(2)}/hr`}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-300 font-medium">Time</span>
                            <span className="font-bold text-white">{formatTimeString(startTime)} - {formatTimeString(endTime)}</span>
                        </div>
                        {pricingSummary.isSplit && pricingSummary.breakdown?.length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                                {pricingSummary.breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-gray-300">
                                        <span>• {item.label}: {item.hours} hr × ₱{Number(item.rate).toFixed(0)}</span>
                                        <span className="font-semibold text-white">₱{Number(item.subtotal).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                            <span className="text-white font-medium">Total</span>
                            <span className="text-[#D6FF3F] text-2xl font-black">₱{totalPrice.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {user ? (
                    <button
                        onClick={handleBooking}
                        disabled={!startTime || !endTime || durationHours <= 0 || processing}
                        className={`w-full font-black text-base sm:text-lg py-3.5 sm:py-4 px-4 rounded-xl transition duration-300 shadow-xl shadow-[#D6FF3F]/20 ${(startTime && endTime && durationHours > 0 && !processing) ? 'bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] hover:-translate-y-1' : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                        {processing ? 'Processing...' : 'Confirm Booking'}
                    </button>
                ) : (
                    <Link
                        href={`/${facility.slug}/login`}
                        className="w-full flex items-center justify-center bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] font-black text-base sm:text-lg py-3.5 sm:py-4 px-4 rounded-xl transition duration-300 shadow-xl shadow-[#D6FF3F]/20 hover:-translate-y-1"
                    >
                        Sign In to Book
                    </Link>
                )}
            </div>


            {/* Custom Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#10221C] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${modal.type === 'success' ? 'bg-[#D6FF3F]/20 text-[#D6FF3F]' : 'bg-red-500/20 text-red-500'}`}>
                            {modal.type === 'success' ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">
                            {modal.type === 'success' ? 'Success!' : 'Error'}
                        </h4>
                        <p className="text-gray-400 text-sm mb-6">
                            {modal.message}
                        </p>
                        {modal.type === 'success' && user?.role === 'PLAYER' && (
                            <Link href={route('player.bookings')} className="mb-3 block w-full rounded-xl bg-[#D6FF3F] py-3 text-center font-bold text-[#10221C] hover:bg-[#c4ec39]">View My Bookings</Link>
                        )}
                        <button 
                            onClick={closeModal}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${modal.type === 'success' ? 'bg-[#D6FF3F] text-[#10221C] hover:bg-[#c4ec39]' : 'bg-red-500 text-white hover:bg-red-600'}`}
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
}
