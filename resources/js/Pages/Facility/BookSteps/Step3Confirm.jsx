import React from 'react';
import { Pencil } from 'lucide-react';
import { formatPeso } from '@/Components/MetricCard';

export default function Step3Confirm({ 
    selectedCourt, 
    price, 
    pricingSummary,
    selectedDate, 
    formatDateString, 
    startTime, 
    endTime, 
    formatTimeString, 
    durationHours, 
    subtotal,
    bookingFee,
    totalPrice,
    addonsTotal = 0,
    addonLines = [],
    setStep,
}) {
    return (
        <div className="p-6 sm:p-10">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-[#10221C] mb-1">Review Reservation Details</h2>
                <p className="text-sm text-gray-500">Please review your booking details before proceeding to payment.</p>
            </div>

            <div className="bg-[#FAFAF8] rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-xs">
                {/* Court Row */}
                <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Court</p>
                            {setStep && (
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                                >
                                    <Pencil className="w-2.5 h-2.5" /> Change
                                </button>
                            )}
                        </div>
                        <p className="font-bold text-[#10221C] text-base">{selectedCourt?.name}</p>
                        <p className="text-xs text-gray-500">
                            {pricingSummary?.ratePlanName || selectedCourt?.type || 'Standard Court'}
                        </p>
                    </div>
                    {pricingSummary?.isSplit ? (
                        <div className="text-right">
                            <p className="font-bold text-xs sm:text-sm text-[#10221C]">
                                <span className="text-amber-700">☀️ {formatPeso(pricingSummary.dayRate)}</span>
                                <span className="text-gray-300 mx-1">/</span>
                                <span className="text-indigo-700">🌙 {formatPeso(pricingSummary.nightRate)}</span>
                                <span className="text-xs text-gray-400 font-normal">/hr</span>
                            </p>
                            <span className="text-[10px] text-gray-400 font-medium">Day & Night Split</span>
                        </div>
                    ) : (
                        <p className="font-black text-[#10221C] text-base">{formatPeso(price)}<span className="text-xs text-gray-400 font-medium">/hr</span></p>
                    )}
                </div>

                {/* Date Row */}
                <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                            {setStep && (
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                                >
                                    <Pencil className="w-2.5 h-2.5" /> Change
                                </button>
                            )}
                        </div>
                        <p className="font-bold text-[#10221C]">{formatDateString(selectedDate)}</p>
                    </div>
                </div>

                {/* Time Row */}
                <div className="px-5 py-4 flex justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Slot</p>
                            {setStep && (
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline"
                                >
                                    <Pencil className="w-2.5 h-2.5" /> Change
                                </button>
                            )}
                        </div>
                        <p className="font-bold text-[#10221C]">{formatTimeString(startTime)} – {formatTimeString(endTime)}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-[#10221C]/5 text-[#10221C] rounded-lg text-xs font-bold">
                        {durationHours} hr{durationHours > 1 ? 's' : ''}
                    </span>
                </div>

                {/* Calculation breakdown */}
                {pricingSummary?.breakdown?.length > 0 && (
                    <div className="px-5 py-3.5 bg-gray-50/80 space-y-1.5 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Rate Calculation</p>
                        {pricingSummary.breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                                <span>{item.label} ({item.hours} hr{item.hours > 1 ? 's' : ''} × {formatPeso(item.rate)})</span>
                                <span className="font-bold text-[#10221C]">{formatPeso(item.subtotal)}</span>
                            </div>
                        ))}
                        {addonLines.map((line, idx) => (
                            <div key={`addon-${idx}`} className="flex justify-between text-gray-600">
                                <span>
                                    {line.name} ({line.quantity} × {line.hours} hr
                                    {line.hours > 1 ? 's' : ''} × {formatPeso(line.rate)})
                                </span>
                                <span className="font-bold text-[#10221C]">{formatPeso(line.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Price Summary */}
            <div className="mt-6 space-y-2 text-sm bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                    <span>{pricingSummary?.ratePlanName || 'Court base rate'}</span>
                    <span className="font-bold text-[#10221C]">{formatPeso(subtotal)}</span>
                </div>
                {addonsTotal > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                        <span>Add-ons total</span>
                        <span className="font-bold text-[#10221C]">{formatPeso(addonsTotal)}</span>
                    </div>
                )}
                {bookingFee > 0 && (
                    <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                        <span>Platform fee</span>
                        <span className="font-bold text-[#10221C]">{formatPeso(bookingFee)}</span>
                    </div>
                )}
                
                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-[#10221C]">Total Reservation Fee</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#10221C]">{formatPeso(totalPrice)}</span>
                </div>
            </div>
        </div>
    );
}
