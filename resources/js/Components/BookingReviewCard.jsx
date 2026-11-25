import React from 'react';
import { formatPeso } from '@/Components/MetricCard';

/**
 * The same "Review Details" layout players see at Step 3 of the booking
 * wizard (Facility/BookSteps/Step3Confirm.jsx), reused so a facility owner
 * reviews the rate, hours, and total before confirming a manual booking or
 * an edit.
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
    bookingFeeLabel = 'Booking fee',
    total = 0,
    extraRows = [],
}) {
    return (
        <div>
            <div className="bg-[#FAFAF8] rounded-xl border border-gray-100 divide-y divide-gray-100">
                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Court</p>
                        <p className="font-bold text-[#10221C]">{courtName || 'Court'}</p>
                        {courtSubtitle && <p className="text-xs text-gray-500">{courtSubtitle}</p>}
                    </div>
                    {isSplit ? (
                        <div className="text-right">
                            <p className="font-bold text-xs sm:text-sm text-[#10221C]">
                                <span className="text-amber-700">☀️ {formatPeso(dayRate)}</span>
                                <span className="text-gray-300 mx-1">/</span>
                                <span className="text-indigo-700">🌙 {formatPeso(nightRate)}</span>
                                <span className="text-xs text-gray-400 font-normal">/hr</span>
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium">Day & Night Split</span>
                        </div>
                    ) : (
                        <p className="font-black text-[#10221C]">
                            {formatPeso(flatRate ?? dayRate)}
                            <span className="text-xs text-gray-400 font-medium">/hr</span>
                        </p>
                    )}
                </div>

                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Date</p>
                    <p className="font-bold text-[#10221C]">{dateLabel || '—'}</p>
                </div>

                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
                        <p className="font-bold text-[#10221C]">{timeLabel || '—'}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#10221C]/5 text-[#10221C] rounded text-xs font-bold">
                        {durationHours} hr{durationHours === 1 ? '' : 's'}
                    </span>
                </div>

                {extraRows.map((row, idx) => (
                    <div key={idx} className="px-5 py-4 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</p>
                        <p className="font-bold text-[#10221C]">{row.value}</p>
                    </div>
                ))}

                {(breakdown.length > 0 || addonLines.length > 0) && (
                    <div className="px-5 py-3.5 bg-gray-50/80 space-y-1.5 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate Calculation</p>
                        {breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                                <span>{item.label} ({item.hours} hr{item.hours === 1 ? '' : 's'} × {formatPeso(item.rate)})</span>
                                <span className="font-bold text-[#10221C]">{formatPeso(item.subtotal)}</span>
                            </div>
                        ))}
                        {addonLines.map((line, idx) => (
                            <div key={`addon-${idx}`} className="flex justify-between text-gray-600">
                                <span>
                                    {line.name} ({line.quantity} × {line.hours} hr
                                    {line.hours === 1 ? '' : 's'} × {formatPeso(line.rate)})
                                </span>
                                <span className="font-bold text-[#10221C]">{formatPeso(line.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-5 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                    <span>{courtSubtitle || 'Court rate'}</span>
                    <span className="font-bold text-[#10221C]">{formatPeso(subtotal)}</span>
                </div>
                {addonsTotal > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>Add-ons</span>
                        <span className="font-bold text-[#10221C]">{formatPeso(addonsTotal)}</span>
                    </div>
                )}
                {bookingFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>{bookingFeeLabel}</span>
                        <span className="font-bold text-[#10221C]">{formatPeso(bookingFee)}</span>
                    </div>
                )}
            </div>

            <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                <span className="text-sm font-medium text-gray-500">Total Amount</span>
                <span className="text-3xl font-black text-[#10221C]">{formatPeso(total)}</span>
            </div>
        </div>
    );
}
