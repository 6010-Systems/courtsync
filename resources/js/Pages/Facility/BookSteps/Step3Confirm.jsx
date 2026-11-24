import React, { useState } from 'react';
import { 
    Sun, 
    Moon, 
    Clock, 
    Calendar, 
    MapPin, 
    ShieldCheck, 
    CheckCircle2, 
    Receipt, 
    Sparkles 
} from 'lucide-react';

import { formatPeso } from '@/Components/MetricCard';
import SportIcon from '@/Components/Icons/SportIcon';

export default function Step3Confirm({ 
    facility = null,
    selectedCourt = null, 
    price = 0, 
    pricingSummary = null,
    selectedDate = '', 
    formatDateString = (d) => d, 
    startTime = '', 
    endTime = '', 
    formatTimeString = (t) => t, 
    durationHours = 1, 
    subtotal = 0,
    bookingFee = 0,
    totalPrice = 0,
    addonsTotal = 0,
    addonLines = [],
}) {
    const [imgFailed, setImgFailed] = useState(false);
    const customPhoto = selectedCourt?.image_url;
    const showPhoto = Boolean(customPhoto) && !imgFailed;
    const sportType = selectedCourt?.type || 'Sports Court';
    const isSplit = pricingSummary?.isSplit ?? (selectedCourt?.pricing_mode === 'SPLIT');

    // Extract day/night hours from breakdown if present
    const breakdown = pricingSummary?.breakdown || [];
    const dayBreakdown = breakdown.find((b) => b.label?.toLowerCase().includes('day'));
    const nightBreakdown = breakdown.find((b) => b.label?.toLowerCase().includes('night'));

    return (
        <div className="p-3 sm:p-5 md:p-6 max-w-4xl mx-auto">
            {/* Header / Step Subtitle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#101F1A] tracking-tight">
                        Review Booking Details
                    </h2>
                    <p className="text-xs sm:text-sm text-[#101F1A]/60 mt-0.5">
                        Double-check your schedule and pricing breakdown before heading to payment.
                    </p>
                </div>
                
                {/* Hold / Status Chip */}
                <div className="self-start sm:self-auto shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Slot Reserved · Ready to Confirm</span>
                    </span>
                </div>
            </div>

            {/* Main 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                {/* LEFT COLUMN: Court & Fixture Overview (7 Cols) */}
                <div className="md:col-span-7 flex flex-col gap-4">
                    {/* Court & Venue Identity Card */}
                    <div className="bg-white rounded-2xl border border-[#101F1A]/10 p-4 sm:p-5 shadow-2xs flex items-center gap-4 transition hover:border-[#101F1A]/20">
                        {/* Court Sport Emblem / Thumbnail (Zero broken-image risk) */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-[#101F1A] border border-[#101F1A]/10 flex items-center justify-center shrink-0 shadow-xs">
                            {showPhoto ? (
                                <img 
                                    src={customPhoto} 
                                    alt="" 
                                    onError={() => setImgFailed(true)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-[#101F1A] relative select-none">
                                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D6FF3F_1px,transparent_1px)] [background-size:6px_6px]" />
                                    <SportIcon sportType={sportType} size={30} className="relative z-10" />
                                </div>
                            )}
                        </div>

                        {/* Court & Venue Meta */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#101F1A]/5 text-[#101F1A] text-[10px] font-black uppercase tracking-wider">
                                    <SportIcon sportType={sportType} size={13} className="shrink-0" />
                                    <span>{sportType}</span>
                                </span>
                                {selectedCourt?.is_indoor !== undefined && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-500 bg-gray-100">
                                        {selectedCourt.is_indoor ? 'Indoor' : 'Outdoor'}
                                    </span>
                                )}
                                {pricingSummary?.ratePlanName && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#F5F2EA] border border-[#101F1A]/10 text-[10px] font-bold text-[#101F1A]">
                                        {pricingSummary.ratePlanName}
                                    </span>
                                )}
                            </div>

                            <h3 className="text-base sm:text-lg font-black text-[#101F1A] tracking-tight leading-snug truncate" title={selectedCourt?.name}>
                                {selectedCourt?.name || 'Selected Court'}
                            </h3>

                            <p className="flex items-center gap-1 text-xs text-gray-500 font-medium truncate mt-0.5">
                                <MapPin size={12} className="shrink-0 text-gray-400" />
                                <span className="truncate">{facility?.name || 'Community Sports Complex'}</span>
                                {(facility?.city || facility?.province) && (
                                    <span className="text-gray-400">· {[facility.city, facility.province].filter(Boolean).join(', ')}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Schedule & Visual Timeline Card */}
                    <div className="bg-white rounded-2xl border border-[#101F1A]/10 p-4 sm:p-5 shadow-2xs flex-1 flex flex-col justify-between">
                        <div>
                            {/* Calendar Date Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#101F1A]/6">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#FAF9F5] border border-[#101F1A]/10 flex items-center justify-center shrink-0">
                                        <Calendar size={14} className="text-[#101F1A]" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                                        <p className="text-sm font-black text-[#101F1A] leading-tight">
                                            {formatDateString(selectedDate)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-[#101F1A] bg-[#101F1A]/5 px-2.5 py-1 rounded-full">
                                    {durationHours} hr{durationHours > 1 ? 's' : ''} total
                                </span>
                            </div>

                            {/* Athletic Timeline Route Strip */}
                            <div className="my-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Start</span>
                                        <span className="text-base sm:text-lg font-black text-[#101F1A] tracking-tight">
                                            {formatTimeString(startTime)}
                                        </span>
                                    </div>

                                    {/* Duration Central Badge */}
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#101F1A] text-white text-xs font-black shadow-xs">
                                        <Clock size={11} className="text-[#D6FF3F] shrink-0" />
                                        <span>{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Finish</span>
                                        <span className="text-base sm:text-lg font-black text-[#101F1A] tracking-tight">
                                            {formatTimeString(endTime)}
                                        </span>
                                    </div>
                                </div>

                                {/* Connecting Visual Rail */}
                                <div className="flex items-center gap-1.5 px-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#101F1A] shrink-0 ring-4 ring-[#101F1A]/10" />
                                    <div className="flex-1 h-0.5 bg-[#101F1A]" />
                                    <div className="shrink-0">
                                        <SportIcon sportType={sportType} size={18} className="text-[#101F1A]" />
                                    </div>
                                    <div className="flex-1 border-t-2 border-dashed border-[#101F1A]/40" />
                                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#101F1A] bg-white shrink-0 ring-4 ring-gray-100" />
                                </div>
                            </div>
                        </div>

                        {/* Day vs Night Schedule Identifiers (Adheres to user's outlined Sun / filled Moon rule) */}
                        <div className="pt-3 border-t border-[#101F1A]/6 flex flex-wrap items-center gap-2">
                            {dayBreakdown && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#101F1A]/20 bg-white text-xs font-bold text-[#101F1A] shadow-2xs">
                                    <Sun size={12} strokeWidth={2} className="text-[#101F1A]/80 shrink-0" />
                                    <span>Day Schedule · {dayBreakdown.hours} hr{dayBreakdown.hours > 1 ? 's' : ''} ({formatPeso(dayBreakdown.rate)}/hr)</span>
                                </span>
                            )}
                            {nightBreakdown && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#101F1A] text-white text-xs font-bold shadow-2xs">
                                    <Moon size={11} fill="currentColor" className="text-[#D6FF3F] shrink-0" />
                                    <span>Night Schedule · {nightBreakdown.hours} hr{nightBreakdown.hours > 1 ? 's' : ''} ({formatPeso(nightBreakdown.rate)}/hr)</span>
                                </span>
                            )}
                            {!dayBreakdown && !nightBreakdown && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#101F1A]/15 bg-white text-xs font-bold text-[#101F1A]">
                                    <span>Standard Hourly Rate: {formatPeso(price)}/hr</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Summary Receipt & Cost Breakdown (5 Cols) */}
                <div className="md:col-span-5 bg-[#FAF9F5] rounded-2xl border border-[#101F1A]/10 p-4 sm:p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                    <div>
                        {/* Receipt Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#101F1A]/8">
                            <div className="flex items-center gap-2">
                                <Receipt size={16} className="text-[#101F1A]" />
                                <span className="text-xs font-black uppercase tracking-wider text-[#101F1A]">
                                    Payment Summary
                                </span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#101F1A]/10 text-[#101F1A]/80">
                                Pre-tax Breakdown
                            </span>
                        </div>

                        {/* Itemized Line Items */}
                        <div className="py-3 space-y-2 text-xs">
                            {/* Court Rate Line(s) */}
                            {breakdown.length > 0 ? (
                                breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            {item.label?.toLowerCase().includes('night') ? (
                                                <Moon size={11} fill="currentColor" className="text-[#101F1A]" />
                                            ) : (
                                                <Sun size={11} strokeWidth={2} className="text-[#101F1A]/70" />
                                            )}
                                            <span>
                                                {item.label} ({item.hours}h × {formatPeso(item.rate)})
                                            </span>
                                        </div>
                                        <span className="font-bold text-[#101F1A]">{formatPeso(item.subtotal)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>{pricingSummary?.ratePlanName || 'Court rate'} ({durationHours}h)</span>
                                    <span className="font-bold text-[#101F1A]">{formatPeso(subtotal)}</span>
                                </div>
                            )}

                            {/* Add-on Plans (Equipment, Balls, Paddles) */}
                            {addonLines.length > 0 && addonLines.map((line, idx) => (
                                <div key={`addon-${idx}`} className="flex justify-between items-center text-gray-600">
                                    <span className="truncate pr-2">
                                        {line.name} ({line.quantity} × {line.hours}h)
                                    </span>
                                    <span className="font-bold text-[#101F1A] shrink-0">{formatPeso(line.subtotal)}</span>
                                </div>
                            ))}

                            {/* Booking / Service Fee */}
                            <div className="flex justify-between items-center text-gray-600 pt-1">
                                <span>Platform Booking Fee</span>
                                {bookingFee > 0 ? (
                                    <span className="font-bold text-[#101F1A]">{formatPeso(bookingFee)}</span>
                                ) : (
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                        Free (₱0.00)
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Perforated Receipt Cut Line */}
                        <div className="relative my-2 py-1">
                            <div className="border-t-2 border-dashed border-[#101F1A]/15 w-full" />
                            {/* Decorative Cutout Notches on Left and Right of Card */}
                            <div className="absolute -left-6 -top-1.5 w-3.5 h-3.5 rounded-full bg-white border-r border-[#101F1A]/10 pointer-events-none" />
                            <div className="absolute -right-6 -top-1.5 w-3.5 h-3.5 rounded-full bg-white border-l border-[#101F1A]/10 pointer-events-none" />
                        </div>

                        {/* Total Due Section */}
                        <div className="flex items-baseline justify-between pt-1">
                            <div>
                                <span className="block text-[11px] font-black uppercase tracking-wider text-[#101F1A]">
                                    Total Amount Due
                                </span>
                                <span className="block text-[10px] text-gray-400 font-medium">
                                    All fees and taxes included
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl sm:text-3xl font-black text-[#101F1A] tracking-tight">
                                    {formatPeso(totalPrice)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trust & Guarantee Callout Footer */}
                    <div className="mt-4 pt-3 border-t border-[#101F1A]/8">
                        <div className="rounded-xl bg-white border border-[#101F1A]/8 p-2.5 flex items-start gap-2.5">
                            <ShieldCheck size={16} className="text-[#101F1A] shrink-0 mt-0.5" />
                            <div className="text-[11px] text-[#101F1A]/80 leading-snug">
                                <strong className="font-bold text-[#101F1A]">Guaranteed Reservation</strong>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    No hidden fees. Select payment method (GCash, Maya, or venue cash) on the next step.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
