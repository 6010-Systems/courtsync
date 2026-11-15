import React from 'react';

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
    totalPrice 
}) {
    return (
        <div className="p-6 sm:p-10">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-[#10221C] mb-1">Review Details</h2>
                <p className="text-sm text-gray-500">Please review your booking details before proceeding to payment.</p>
            </div>

            <div className="bg-[#FAFAF8] rounded-xl border border-gray-100 divide-y divide-gray-100">
                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Court</p>
                        <p className="font-bold text-[#10221C]">{selectedCourt?.name}</p>
                        <p className="text-xs text-gray-500">{selectedCourt?.type || 'Standard Court'}</p>
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
                        <p className="font-black text-[#10221C]">{formatPeso(price)}<span className="text-xs text-gray-400 font-medium">/hr</span></p>
                    )}
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Date</p>
                    <p className="font-bold text-[#10221C]">{formatDateString(selectedDate)}</p>
                </div>
                <div className="px-5 py-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Time</p>
                        <p className="font-bold text-[#10221C]">{formatTimeString(startTime)} – {formatTimeString(endTime)}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-[#10221C]/5 text-[#10221C] rounded text-xs font-bold">{durationHours} hr{durationHours > 1 ? 's' : ''}</span>
                </div>
                {pricingSummary?.isSplit && pricingSummary.breakdown?.length > 0 && (
                    <div className="px-5 py-3.5 bg-gray-50/80 space-y-1.5 text-xs">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate Calculation</p>
                        {pricingSummary.breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                                <span>{item.label} ({item.hours} hr{item.hours > 1 ? 's' : ''} × {formatPeso(item.rate)})</span>
                                <span className="font-bold text-[#10221C]">{formatPeso(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-200 flex justify-between items-end">
                <span className="text-sm font-medium text-gray-500">Total Amount</span>
                <span className="text-3xl font-black text-[#10221C]">{formatPeso(totalPrice)}</span>
            </div>
        </div>
    );
}
