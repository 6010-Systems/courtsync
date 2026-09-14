import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES_DARK, courtIsBookable } from '@/Utils/courtStatus';

export default function BookingWidget({ facility, user, courts = [] }) {
    const bookableCourts = courts.filter((c) => courtIsBookable(c.status));
    const selectableCourts = bookableCourts.length > 0 ? bookableCourts : courts;

    const mockSlots = [
        { start_time: '08:00', end_time: '09:00', formatted: '08:00 AM - 09:00 AM' },
        { start_time: '09:00', end_time: '10:00', formatted: '09:00 AM - 10:00 AM' },
        { start_time: '10:00', end_time: '11:00', formatted: '10:00 AM - 11:00 AM' },
        { start_time: '14:00', end_time: '15:00', formatted: '02:00 PM - 03:00 PM' },
        { start_time: '16:00', end_time: '17:00', formatted: '04:00 PM - 05:00 PM' },
        { start_time: '18:00', end_time: '19:00', formatted: '06:00 PM - 07:00 PM' }
    ];

    const [selectedCourtId, setSelectedCourtId] = useState(selectableCourts[0]?.id ?? null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState(mockSlots);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

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

    // Simulate changing availability based on date (Mock logic)
    useEffect(() => {
        setSelectedTimeSlot(null);
        // Randomly hide some slots for the mock effect
        const randomSlots = mockSlots.filter(() => Math.random() > 0.3);
        setAvailableSlots(randomSlots);
    }, [selectedDate, selectedCourtId]);

    const handleBooking = () => {
        if (!selectedTimeSlot) return;
        alert(`Booking Confirmed!\nCourt: ${selectedCourt?.name}\nDate: ${selectedDate}\nTime: ${selectedTimeSlot.formatted}`);
        setSelectedTimeSlot(null);
    };

    const selectedCourt = selectableCourts.find(c => c.id == selectedCourtId);
    const price = selectedCourt?.hourly_rate ? Number(selectedCourt.hourly_rate) : 0;

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
                                    {court.name}{court.type ? ` (${court.type})` : ''}{court.hourly_rate ? ` - ₱${Number(court.hourly_rate).toFixed(2)}/hr` : ''} · {COURT_STATUS_LABELS[court.status] || court.status}
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
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">Select Time</label>
                    
                    {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableSlots.map((slot, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setSelectedTimeSlot(slot)}
                                    className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${selectedTimeSlot?.start_time === slot.start_time ? 'border-[#D6FF3F] bg-[#D6FF3F] text-[#10221C] shadow-md' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white hover:bg-white/10'}`}
                                >
                                    {slot.formatted}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-400 text-sm py-4 text-center border-2 border-white/5 border-dashed rounded-xl">
                            No available slots for this date.
                        </div>
                    )}
                </div>

                {/* Order Summary */}
                {selectedTimeSlot && (
                    <div className="bg-[#1A332B] rounded-2xl p-4 sm:p-5 mt-6 sm:mt-8 border border-white/5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300 font-medium">{selectedCourt?.name} (1 hr)</span>
                            <span className="font-bold text-white">₱{price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300 font-medium">Time</span>
                            <span className="font-bold text-white">{selectedTimeSlot.formatted}</span>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                            <span className="text-white font-medium">Total</span>
                            <span className="text-[#D6FF3F] text-2xl font-black">₱{price.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {user ? (
                    <button
                        onClick={handleBooking}
                        disabled={!selectedTimeSlot}
                        className={`w-full font-black text-base sm:text-lg py-3.5 sm:py-4 px-4 rounded-xl transition duration-300 shadow-xl shadow-[#D6FF3F]/20 ${selectedTimeSlot ? 'bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] hover:-translate-y-1' : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'}`}
                    >
                        Confirm Booking
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

            {/* Contact Info Footer */}
            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/10 text-center">
                <p className="text-sm font-medium text-gray-400 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {facility.contact_number}
                </p>
            </div>
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
