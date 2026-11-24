import React from 'react';
import { Sun, Moon, Clock, Calendar, Receipt, ShieldCheck } from 'lucide-react';
import { formatPeso } from '@/Components/MetricCard';

/**
 * Standardized "Review Details" receipt card for modals and booking management.
 * Reused so players and facility managers review rate, hours, and totals before confirming.
 */
export default function BookingReviewCard({
    courtName,
    courtSubtitle,
    isSplit = false,
    dayRate = 0,
    nightRate = null,
    flatRate = null,
    dateLabel,
    timeLabel,
    durationHours = 0,
    breakdown = [],
    addonLines = [],
    subtotal = 0,
    addonsTotal = 0,
    bookingFee = 0,
    total = 0,
    extraRows = [],
}) {
    return (
        <div className="rounded-2xl border border-[#101F1A]/10 bg-[#FAF9F5] p-4 sm:p-5 shadow-2xs">
            {/* Header / Court Info */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#101F1A]/8">
                <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Court & Package
                    </span>
                    <h4 className="text-base font-black text-[#101F1A] tracking-tight leading-snug">
                        {courtName || 'Court'}
                    </h4>
                    {courtSubtitle && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{courtSubtitle}</p>
                    )}
                </div>

                {isSplit ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Day Schedule Identifier: Outlined */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#101F1A]/20 bg-white text-xs font-bold text-[#101F1A]">
                            <Sun size={12} strokeWidth={2} className="text-[#101F1A]/70 shrink-0" />
                            <span>{formatPeso(dayRate)}/hr</span>
                        </span>
                        {/* Night Schedule Identifier: Filled */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#101F1A] text-white text-xs font-bold shadow-2xs">
                            <Moon size={11} fill="currentColor" className="text-[#D6FF3F] shrink-0" />
                            <span>{formatPeso(nightRate)}/hr</span>
                        </span>
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full border border-[#101F1A]/15 bg-white text-xs font-bold text-[#101F1A]">
                        {formatPeso(flatRate ?? dayRate)}/hr
                    </span>
                )}
            </div>

            {/* Date & Time Schedule Row */}
            <div className="py-3 border-b border-[#101F1A]/8 grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-[#101F1A]/10 flex items-center justify-center shrink-0">
                        <Calendar size={13} className="text-[#101F1A]" />
                    </div>
                    <div>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                        <p className="font-bold text-[#101F1A] truncate">{dateLabel || '—'}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-md bg-white border border-[#101F1A]/10 flex items-center justify-center shrink-0">
                            <Clock size={13} className="text-[#101F1A]" />
                        </div>
                        <div className="truncate">
                            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
                            <p className="font-bold text-[#101F1A] truncate">{timeLabel || '—'}</p>
                        </div>
                    </div>
                    <span className="ml-1 px-2 py-0.5 rounded bg-[#101F1A]/5 text-[#101F1A] text-[10px] font-extrabold shrink-0">
                        {durationHours}h
                    </span>
                </div>
            </div>

            {/* Extra Rows (e.g. facility custom metadata) */}
            {extraRows.length > 0 && (
                <div className="py-2.5 border-b border-[#101F1A]/8 space-y-1 text-xs">
                    {extraRows.map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-600">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{row.label}</span>
                            <span className="font-bold text-[#101F1A]">{row.value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Itemized Calculation Lines */}
            <div className="py-3 space-y-1.5 text-xs text-gray-600">
                {breakdown.length > 0 ? (
                    breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
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
                    <div className="flex justify-between items-center">
                        <span>{courtSubtitle || 'Court rate'}</span>
                        <span className="font-bold text-[#101F1A]">{formatPeso(subtotal)}</span>
                    </div>
                )}

                {addonLines.map((line, idx) => (
                    <div key={`addon-${idx}`} className="flex justify-between items-center">
                        <span className="truncate pr-2">
                            {line.name} ({line.quantity} × {line.hours}h)
                        </span>
                        <span className="font-bold text-[#101F1A] shrink-0">{formatPeso(line.subtotal)}</span>
                    </div>
                ))}

                {addonsTotal > 0 && addonLines.length === 0 && (
                    <div className="flex justify-between items-center">
                        <span>Add-ons Total</span>
                        <span className="font-bold text-[#101F1A]">{formatPeso(addonsTotal)}</span>
                    </div>
                )}

                <div className="flex justify-between items-center pt-0.5">
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

            {/* Perforated Receipt Cut */}
            <div className="relative my-2 py-1">
                <div className="border-t-2 border-dashed border-[#101F1A]/12 w-full" />
                <div className="absolute -left-6 -top-1.5 w-3.5 h-3.5 rounded-full bg-white border-r border-[#101F1A]/10 pointer-events-none" />
                <div className="absolute -right-6 -top-1.5 w-3.5 h-3.5 rounded-full bg-white border-l border-[#101F1A]/10 pointer-events-none" />
            </div>

            {/* Total Amount Due */}
            <div className="flex items-baseline justify-between pt-1">
                <div>
                    <span className="block text-[11px] font-black uppercase tracking-wider text-[#101F1A]">
                        Total Amount
                    </span>
                    <span className="block text-[10px] text-gray-400 font-medium">
                        All rates guaranteed
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-[#101F1A] tracking-tight">
                        {formatPeso(total)}
                    </span>
                </div>
            </div>
        </div>
    );
}
