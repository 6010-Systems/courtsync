import React, { useState, useMemo } from 'react';
import { 
    Clock, 
    Sun, 
    Moon, 
    Calendar, 
    Check, 
    ChevronDown, 
    Timer, 
    SlidersHorizontal,
    Sparkles 
} from 'lucide-react';

import { formatPeso } from '@/Components/MetricCard';
import { planRates } from '@/Utils/rateQuote';

export default function Step2DateTime({ 
    selectedCourt, 
    price, 
    pricingSummary,
    totalPrice,
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
    formatTimeString,
    courtPlans = [],
    addonPlans = [],
    selectedRatePlan = null,
    setRatePlanId,
    addonQuantities = {},
    setAddonQuantity,
    addonsTotal = 0,
    bookingFee = 0,
}) {
    const [showCustomTimes, setShowCustomTimes] = useState(false);

    const hasSplitRates = selectedRatePlan
        ? planRates(selectedRatePlan).night !== null
        : selectedCourt?.pricing_mode === 'SPLIT' && Boolean(selectedCourt?.day_rate && selectedCourt?.night_rate);
    const selectedRates = selectedRatePlan ? planRates(selectedRatePlan) : null;

    // Curate a focused selection of prime, available slots (max 4-5 slots across morning, afternoon, evening)
    // "suggested time slots should be 1 row and in a pill, and dont suggest everything"
    const suggestedSlots = useMemo(() => {
        if (!timeOptions || timeOptions.length < 2) return [];

        // 1. Gather all strictly AVAILABLE 1-hour slots
        const availableOneHourSlots = [];
        for (let i = 0; i < timeOptions.length - 1; i++) {
            const startOpt = timeOptions[i];
            const endOpt = timeOptions[i + 1];
            if (!startOpt || !endOpt) continue;

            if (!startOpt.isBooked) {
                const hour = parseInt(startOpt.value.split(':')[0], 10);
                const isNight = Boolean(startOpt.isNight || startOpt.rateTag?.toLowerCase().includes('night'));

                availableOneHourSlots.push({
                    id: `${startOpt.value}-${endOpt.value}`,
                    start: startOpt.value,
                    end: endOpt.value,
                    label: `${startOpt.label} – ${endOpt.label}`,
                    hour,
                    isNight,
                    rateTag: startOpt.rateTag,
                });
            }
        }

        if (availableOneHourSlots.length === 0) return [];

        // 2. Curate 4-5 prime athletic slots: 
        // Morning (8 AM, 9 AM), Afternoon (2 PM, 4 PM), Evening (6 PM, 7 PM, 8 PM)
        const primeHours = [8, 9, 14, 16, 18, 19, 20];
        const curated = [];
        const addedIds = new Set();

        for (const targetH of primeHours) {
            const match = availableOneHourSlots.find((s) => s.hour === targetH && !addedIds.has(s.id));
            if (match && curated.length < 5) {
                curated.push(match);
                addedIds.add(match.id);
            }
        }

        // Fill with remaining available slots if fewer than 4 prime slots found
        if (curated.length < 4) {
            for (const slot of availableOneHourSlots) {
                if (!addedIds.has(slot.id) && curated.length < 5) {
                    curated.push(slot);
                    addedIds.add(slot.id);
                }
            }
        }

        // Sort chronologically
        curated.sort((a, b) => a.hour - b.hour);

        return curated;
    }, [timeOptions]);

    const handleSelectSlot = (slot) => {
        setStartTime(slot.start);
        setEndTime(slot.end);
    };

    return (
        <div className="p-3 sm:p-6 md:p-8">
            {/* Header / Court Metadata */}
            <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#101F1A] tracking-tight">
                    Select Date & Time
                </h2>
                
                {/* Court & Pricing Chips */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#101F1A]/5 text-[#101F1A] text-xs font-bold">
                        Court: <strong className="ml-1 text-[#101F1A]">{selectedCourt?.name}</strong>
                    </span>

                    {selectedRatePlan && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5F2EA] border border-[#101F1A]/10 text-xs font-bold text-[#101F1A]">
                            {selectedRatePlan.name}
                        </span>
                    )}

                    {hasSplitRates ? (
                        <div className="inline-flex items-center gap-2">
                            {/* Day: Outlined identifier */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#101F1A]/20 bg-white text-xs font-bold text-[#101F1A]">
                                <Sun size={12} strokeWidth={2} className="text-[#101F1A]/70 shrink-0" />
                                <span>{formatPeso(selectedRates ? selectedRates.day : selectedCourt.day_rate)}/hr</span>
                            </span>
                            {/* Night: Filled identifier */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#101F1A] bg-[#101F1A] text-white text-xs font-bold shadow-2xs">
                                <Moon size={11} fill="currentColor" className="text-[#D6FF3F] shrink-0" />
                                <span>{formatPeso(selectedRates ? selectedRates.night : selectedCourt.night_rate)}/hr</span>
                            </span>
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#101F1A]/15 bg-white text-xs font-bold text-[#101F1A]">
                            {formatPeso(selectedRates ? selectedRates.day : price)}/hr
                        </span>
                    )}
                </div>
            </div>
            
            {/* Rate card selection (if facility offers multiple rate plans) */}
            {courtPlans.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                        Choose Rate Plan
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {courtPlans.map((plan) => {
                            const rates = planRates(plan);
                            const active = selectedRatePlan?.id === plan.id;
                            const inclusions = plan.description
                                || `Court${plan.includes_ball ? ', ball' : ''}${Number(plan.included_paddles) > 0 ? ` & ${plan.included_paddles} paddles` : ''}`;

                            return (
                                <button
                                    type="button"
                                    key={plan.id}
                                    onClick={() => setRatePlanId(plan.id)}
                                    className={`text-left rounded-xl border-2 p-3 transition-all ${
                                        active
                                            ? 'border-[#101F1A] bg-[#101F1A] text-white shadow-md'
                                            : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className={`font-bold text-xs sm:text-sm truncate ${active ? 'text-white' : 'text-[#101F1A]'}`}>
                                                {plan.name}
                                            </p>
                                            <p className={`text-[10px] mt-0.5 truncate ${active ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {inclusions}
                                            </p>
                                        </div>
                                        <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                                            active ? 'border-[#D6FF3F] bg-[#D6FF3F]' : 'border-gray-300'
                                        }`} />
                                    </div>
                                    <p className={`mt-2 text-xs font-bold flex items-center gap-2 ${active ? 'text-[#D6FF3F]' : 'text-[#101F1A]'}`}>
                                        <span className="inline-flex items-center gap-1">
                                            <Sun size={11} strokeWidth={2} className={active ? 'text-[#D6FF3F]' : 'text-[#101F1A]/70'} />
                                            {formatPeso(rates.day)}/hr
                                        </span>
                                        {rates.night !== null && (
                                            <>
                                                <span className="opacity-30">•</span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Moon size={10} fill="currentColor" className={active ? 'text-[#D6FF3F]' : 'text-[#101F1A]'} />
                                                    {formatPeso(rates.night)}/hr
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {addonPlans.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {addonPlans.map((plan) => {
                                const qty = Number(addonQuantities[plan.id] || 0);
                                const max = Math.max(1, Number(plan.max_quantity || 1));

                                return (
                                    <div
                                        key={plan.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-[#FAFAF8] px-3 py-2 text-xs"
                                    >
                                        <div>
                                            <p className="text-xs font-bold text-[#101F1A]">{plan.name}</p>
                                            <p className="text-[10px] text-gray-500">
                                                {formatPeso(planRates(plan).day)}/hr each · max {max}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setAddonQuantity(plan, qty - 1)}
                                                disabled={qty === 0}
                                                className="h-6 w-6 rounded-md border border-gray-200 bg-white text-xs font-black text-[#101F1A] disabled:opacity-40 cursor-pointer"
                                            >
                                                −
                                            </button>
                                            <span className="w-5 text-center text-xs font-black text-[#101F1A]">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => setAddonQuantity(plan, qty + 1)}
                                                disabled={qty >= max}
                                                className="h-6 w-6 rounded-md border border-gray-200 bg-white text-xs font-black text-[#101F1A] disabled:opacity-40 cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {addonsTotal > 0 && (
                                <p className="text-[11px] font-bold text-[#10221C]/70 text-right">
                                    Add-ons: {formatPeso(addonsTotal)}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Date Picker Grid */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Pick a Date
                    </label>

                    {/* Clean Styled Custom Date Picker */}
                    <label className="relative inline-flex items-center gap-1.5 text-xs font-bold text-[#101F1A]/70 hover:text-[#101F1A] cursor-pointer transition bg-[#FAF8F5] hover:bg-white px-2.5 py-1 rounded-lg border border-[#101F1A]/10 shadow-2xs">
                        <Calendar size={13} className="text-[#101F1A]/50" />
                        <span>Choose other date</span>
                        <input 
                            type="date" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                                if (!e.target.value) return;
                                const match = dates.find((d) => d.date === e.target.value);
                                if (match?.isClosed) return;
                                setSelectedDate(e.target.value);
                            }}
                        />
                    </label>
                </div>

                {/* Compact, Well-Proportioned Date Cards Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {dates.map((d, i) => {
                        const isClosed = Boolean(d.isClosed);
                        const isSelected = selectedDate === d.date;

                        return (
                            <button 
                                key={i}
                                type="button"
                                disabled={isClosed}
                                title={isClosed ? (d.closedReason || 'Facility closed this day') : `${d.dayName}, ${d.monthName} ${d.dayNumber}`}
                                onClick={() => {
                                    if (!isClosed) {
                                        setSelectedDate(d.date);
                                    }
                                }}
                                className={`relative py-2 sm:py-2.5 px-1 sm:px-1.5 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer ${
                                    isClosed
                                        ? 'border-rose-100 bg-rose-50/70 text-rose-300 cursor-not-allowed opacity-70'
                                        : isSelected 
                                        ? 'border-[#101F1A] bg-[#101F1A] text-white shadow-md ring-2 ring-[#D6FF3F]/35 scale-[1.02]' 
                                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:shadow-2xs hover:bg-[#FAF8F5]'
                                }`}
                            >
                                <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                                    isSelected && !isClosed ? 'text-gray-300' : isClosed ? 'text-rose-300' : 'text-gray-400'
                                }`}>
                                    {d.dayName}
                                </div>
                                <div className={`text-sm sm:text-base font-black leading-tight my-0.5 ${
                                    isSelected && !isClosed ? 'text-[#D6FF3F]' : isClosed ? 'text-rose-300' : 'text-[#101F1A]'
                                }`}>
                                    {d.dayNumber}
                                </div>
                                <div className={`text-[9px] sm:text-[10px] font-semibold ${
                                    isSelected && !isClosed ? 'text-gray-300' : isClosed ? 'text-rose-300' : 'text-gray-400'
                                }`}>
                                    {isClosed ? 'Closed' : d.monthName}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {isCustomDate && selectedDate && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FAF8F5] border border-[#101F1A]/10 text-xs font-bold text-[#101F1A]">
                        <Calendar size={13} className="text-[#101F1A]/60" />
                        <span>Selected Custom Date: <strong>{formatDateString(selectedDate)}</strong></span>
                    </div>
                )}
            </div>

            {/* Suggested Time Slots Section (1 Row, Pills, Curated) */}
            {selectedDate && (
                <div className="pt-5 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-[#101F1A]/70" />
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                Suggested Slots
                            </label>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium">1-tap select</span>
                    </div>

                    {/* Single Row Horizontal Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 hide-scrollbar">
                        {suggestedSlots.length > 0 ? (
                            suggestedSlots.map((slot) => {
                                const isSelected = startTime === slot.start && endTime === slot.end;

                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => handleSelectSlot(slot)}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                            isSelected
                                                ? 'bg-[#101F1A] text-white shadow-xs ring-2 ring-[#D6FF3F]/40'
                                                : slot.isNight
                                                ? 'bg-[#101F1A]/6 border border-[#101F1A]/25 text-[#101F1A] hover:bg-[#101F1A]/10'
                                                : 'bg-white border border-[#101F1A]/20 text-[#101F1A] hover:bg-[#FAF8F5]'
                                        }`}
                                        title={`Select ${slot.label}`}
                                    >
                                        {isSelected ? (
                                            <Check size={12} className="text-[#D6FF3F] shrink-0" strokeWidth={3} />
                                        ) : slot.isNight ? (
                                            <Moon size={11} fill="currentColor" className="text-[#101F1A] shrink-0" />
                                        ) : (
                                            <Sun size={12} strokeWidth={2} className="text-[#101F1A]/70 shrink-0" />
                                        )}
                                        <span>{slot.label}</span>
                                    </button>
                                );
                            })
                        ) : (
                            <span className="text-xs text-gray-400 italic py-1">
                                No prime slots available for this date.
                            </span>
                        )}

                        {/* Custom Time Selector Toggle Pill */}
                        <button
                            type="button"
                            onClick={() => setShowCustomTimes(!showCustomTimes)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                showCustomTimes
                                    ? 'bg-[#101F1A] text-white'
                                    : 'bg-[#FAF8F5] hover:bg-gray-100 text-[#101F1A]/70 border border-dashed border-[#101F1A]/20'
                            }`}
                        >
                            <SlidersHorizontal size={11} />
                            <span>Custom Time</span>
                            <ChevronDown size={11} className={`transition-transform duration-200 ${showCustomTimes ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* Custom Hours / Exact Time Dropdowns (Expandable on demand) */}
                    {showCustomTimes && (
                        <div className="grid grid-cols-2 gap-3 mt-3 p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">Start Time</label>
                                <select
                                    value={startTime}
                                    onChange={(e) => {
                                        setStartTime(e.target.value);
                                        if (endTime && e.target.value >= endTime) setEndTime('');
                                    }}
                                    className="block w-full px-3 py-2 text-xs font-bold text-[#10221C] border border-gray-200 bg-white focus:outline-none focus:border-[#10221C] rounded-lg cursor-pointer"
                                >
                                    <option value="">Select start</option>
                                    {timeOptions.slice(0, -1).map((opt) => (
                                        <option key={opt.value} value={opt.value} disabled={opt.isBooked}>
                                            {opt.label} {opt.rateTag ? `(${opt.rateTag})` : ''} {opt.labelSuffix}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mb-1">End Time</label>
                                <select
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    disabled={!startTime}
                                    className="block w-full px-3 py-2 text-xs font-bold text-[#10221C] border border-gray-200 bg-white focus:outline-none focus:border-[#10221C] rounded-lg cursor-pointer disabled:opacity-50"
                                >
                                    <option value="">Select end</option>
                                    {(() => {
                                        const startIndex = timeOptions.findIndex((o) => o.value === startTime);
                                        let firstBookedAfterStart = timeOptions.findIndex((o, index) => index >= startIndex && o.isBooked);
                                        if (firstBookedAfterStart === -1) firstBookedAfterStart = timeOptions.length - 1;
                                        
                                        return timeOptions.filter((opt, index) => startTime && index > startIndex && index <= firstBookedAfterStart).map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label} {opt.rateTag ? `(${opt.rateTag})` : ''}</option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Selected Time Preview & Rate Breakdown */}
                    {durationHours > 0 && (
                        <div className="mt-3.5 p-3 bg-[#FAF8F5] rounded-xl border border-[#101F1A]/8 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-[#101F1A]">
                                    <Clock size={13} className="text-[#101F1A]/70" />
                                    <span>Selected: <strong>{formatTimeString(startTime)} – {formatTimeString(endTime)}</strong></span>
                                </div>
                                <span className="font-black text-[#101F1A] bg-[#D6FF3F] px-2 py-0.5 rounded-full text-[10px] border border-[#101F1A]/10">
                                    {durationHours} hr{durationHours > 1 ? 's' : ''}
                                </span>
                            </div>

                            {pricingSummary?.breakdown?.length > 0 && (
                                <div className="pt-2 border-t border-gray-200/60 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between font-bold text-[#101F1A]">
                                        <span className="flex items-center gap-1">
                                            <Timer size={12} className="text-[#101F1A]/70" />
                                            <span>Rate Breakdown</span>
                                        </span>
                                        <span className="font-black text-xs text-[#101F1A]">
                                            Total: {formatPeso(totalPrice || 0)}
                                        </span>
                                    </div>
                                    {pricingSummary.breakdown.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-gray-600">
                                            <span>{item.label}: {item.hours} hr{item.hours > 1 ? 's' : ''} @ {formatPeso(item.rate)}/hr</span>
                                            <span className="font-semibold text-[#101F1A]">{formatPeso(item.subtotal)}</span>
                                        </div>
                                    ))}
                                    {(pricingSummary.addonLines || []).map((line, idx) => (
                                        <div key={`addon-${idx}`} className="flex justify-between text-gray-600">
                                            <span>{line.name}: {line.quantity} × {line.hours} hr @ {formatPeso(line.rate)}</span>
                                            <span className="font-semibold text-[#101F1A]">{formatPeso(line.subtotal)}</span>
                                        </div>
                                    ))}
                                    {bookingFee > 0 && (
                                        <div className="flex justify-between text-gray-500">
                                            <span>Booking fee</span>
                                            <span className="font-semibold text-[#101F1A]">{formatPeso(bookingFee)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
