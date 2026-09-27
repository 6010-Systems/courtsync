import React from 'react';
import { Clock } from 'lucide-react';
export default function Step2DateTime({ 
    selectedCourt, 
    price, 
    dates, 
    selectedDate, 
    setSelectedDate, 
    isCustomDate, 
    startTime, 
    setStartTime, 
    endTime, 
    setEndTime, 
    timeOptions, 
    durationHours, 
    formatDateString, 
    formatTimeString 
}) {
    return (
        <div className="p-6 sm:p-10">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-[#10221C] mb-1">Select Date & Time</h2>
                <p className="text-sm text-gray-500">
                    Booking <strong className="text-[#10221C]">{selectedCourt?.name}</strong> · ₱{price.toFixed(2)}/hr
                </p>
            </div>
            
            {/* Date Picker */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">Pick a Date</label>
                    {/* Custom date input */}
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition bg-blue-50/50 hover:bg-blue-50 px-2 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Other Date:</span>
                        <input 
                            type="date" 
                            className="text-xs font-bold text-blue-600 bg-transparent border-none outline-none cursor-pointer p-0 m-0 w-24 focus:ring-0" 
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => { if (e.target.value) setSelectedDate(e.target.value); }}
                        />
                    </label>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {dates.map((d, i) => (
                        <button 
                            key={i} 
                            onClick={() => setSelectedDate(d.date)}
                            className={`relative py-3 sm:py-4 rounded-xl border-2 text-center transition-all duration-200 ${
                                selectedDate === d.date 
                                    ? 'border-[#10221C] bg-[#10221C] text-white shadow-lg shadow-[#10221C]/15' 
                                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
                            }`}
                        >
                            <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${selectedDate === d.date ? 'text-gray-400' : 'text-gray-400'}`}>{d.dayName}</div>
                            <div className="text-xl sm:text-2xl font-black leading-tight my-1">{d.dayNumber}</div>
                            <div className={`text-[10px] sm:text-xs font-semibold ${selectedDate === d.date ? 'text-gray-300' : 'text-gray-400'}`}>{d.monthName}</div>
                        </button>
                    ))}
                </div>

                {/* Selected Date Preview */}
                {selectedDate && (
                    <div className="mt-4 flex items-center gap-3 bg-[#10221C]/5 rounded-xl px-4 py-3">
                        <div className="w-9 h-9 rounded-lg bg-[#10221C] text-white flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#10221C]">{formatDateString(selectedDate)}</p>
                            {isCustomDate && <p className="text-[11px] text-gray-500">Custom date selected</p>}
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="ml-auto text-gray-400 hover:text-gray-600 transition p-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Time Selection */}
            {selectedDate && (
                <div className="pt-7 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-600 mb-4 uppercase tracking-widest">Choose Time Slot</label>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">Start Time</label>
                            <div className="relative">
                                <select
                                    value={startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value);
                                        if (endTime && e.target.value >= endTime) setEndTime('');
                                    }}
                                    className="block w-full pl-4 pr-10 py-3.5 text-sm font-bold text-[#10221C] border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-[#10221C] focus:bg-white rounded-xl appearance-none bg-none transition hover:border-gray-300 cursor-pointer"
                                >
                                    <option value="">Select start</option>
                                    {timeOptions.slice(0, -1).map((opt) => (
                                        <option key={opt.value} value={opt.value} disabled={opt.isBooked}>
                                            {opt.label} {opt.isBooked ? '(Booked)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">End Time</label>
                            <div className="relative">
                                <select
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    disabled={!startTime}
                                    className="block w-full pl-4 pr-10 py-3.5 text-sm font-bold text-[#10221C] border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-[#10221C] focus:bg-white rounded-xl appearance-none bg-none transition hover:border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">Select end</option>
                                    {(() => {
                                        const startIndex = timeOptions.findIndex(o => o.value === startTime);
                                        let firstBookedAfterStart = timeOptions.findIndex((o, index) => index >= startIndex && o.isBooked);
                                        if (firstBookedAfterStart === -1) firstBookedAfterStart = timeOptions.length - 1;
                                        
                                        return timeOptions.filter((opt, index) => startTime && index > startIndex && index <= firstBookedAfterStart).map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ));
                                    })()}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {durationHours > 0 && (
                        <div className="mt-4 flex items-center gap-2.5 bg-[#D6FF3F]/20 rounded-xl px-4 py-3">
                            <svg className="w-5 h-5 text-[#10221C]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-bold text-[#10221C]">{formatTimeString(startTime)} – {formatTimeString(endTime)}</span>
                            <span className="ml-auto text-xs font-bold bg-[#10221C] text-white px-2 py-0.5 rounded-full">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
