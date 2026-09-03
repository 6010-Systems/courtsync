import React from 'react';
import { SPORTS_CONFIG, BOOKING_STATUS, formatTimeRange12 } from './types';
import SportIcon from './SportIcon';
import { Clock, Phone, Mail, CheckCircle2, CreditCard, AlertCircle, ChevronRight } from 'lucide-react';

export default function AttentionRow({
    item,
    type = 'AWAITING_PAYMENT', // 'AWAITING_PAYMENT' | 'EXPIRED' | 'CHECK_IN_QUEUE'
    onAction,
    onSelect,
}) {
    if (!item) return null;

    const sportMeta = SPORTS_CONFIG[item.sport] || { name: 'Badminton', color: '#D6FF3F' };

    // Format hold countdown
    const formatHoldCountdown = (seconds) => {
        if (!seconds || seconds <= 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    return (
        <div
            onClick={() => onSelect?.(item)}
            className="group relative flex items-center justify-between gap-3 rounded-xl border border-[#101F1A]/10 bg-white p-3 shadow-2xs transition-all duration-150 hover:border-[#101F1A]/30 hover:shadow-subtle cursor-pointer"
        >
            {/* Left: Avatar Initials + Customer Details */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold shadow-2xs',
                    type === 'AWAITING_PAYMENT' ? 'bg-[#FF5A36]/15 text-[#B8391D] border border-[#FF5A36]/30' : '',
                    type === 'CHECK_IN_QUEUE' ? 'bg-[#101F1A] text-[#D6FF3F]' : '',
                    type === 'EXPIRED' ? 'bg-stone-100 text-stone-600 border border-stone-200' : '',
                ].join(' ')}>
                    {item.initials || 'CS'}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-xs font-bold text-[#101F1A]">
                            {item.customerName}
                        </h4>
                        <SportIcon sport={item.sport} size={12} className="text-[#101F1A]/70 shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#101F1A]/65 mt-0.5">
                        <span className="font-semibold truncate">{item.courtName || item.sport}</span>
                        <span className="text-[#101F1A]/30">•</span>
                        <span className="font-bold text-[#101F1A] whitespace-nowrap">
                            {item.startTime && item.endTime ? formatTimeRange12(item.startTime, item.endTime) : item.timeRange}
                        </span>
                    </div>

                    {/* Contact & Expiry/Countdown Context */}
                    <div className="flex items-center gap-2 text-[10px] text-[#101F1A]/55 mt-1">
                        {item.customerPhone && (
                            <span className="truncate">{item.customerPhone}</span>
                        )}

                        {type === 'AWAITING_PAYMENT' && typeof item.holdRemainingSeconds === 'number' && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-[#FF5A36]/15 px-1.5 py-0.5 font-bold text-[#B8391D] border border-[#FF5A36]/25 animate-pulse">
                                <Clock size={9} />
                                <span>{formatHoldCountdown(item.holdRemainingSeconds)}</span>
                            </span>
                        )}

                        {type === 'EXPIRED' && (
                            <span className="text-[#B8391D] font-semibold">
                                {item.expiredAgo} ({item.reason || 'Expired'})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Action Button Pinned */}
            <div className="shrink-0 flex items-center gap-2">
                {type === 'AWAITING_PAYMENT' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(item.id, 'MARK_PAID');
                        }}
                        className="flex items-center gap-1 rounded-lg bg-[#10B981] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#0ea372] transition-colors cursor-pointer"
                    >
                        <CreditCard size={12} />
                        <span>Mark Paid</span>
                    </button>
                )}

                {type === 'CHECK_IN_QUEUE' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction?.(item.id, 'CHECK_IN');
                        }}
                        className="flex items-center gap-1 rounded-lg bg-[#D6FF3F] px-2.5 py-1.5 text-[11px] font-extrabold text-[#101F1A] shadow-xs hover:bg-[#c2ea2e] transition-colors cursor-pointer uppercase tracking-wider"
                    >
                        <CheckCircle2 size={12} strokeWidth={2.5} />
                        <span>Check In</span>
                    </button>
                )}

                {type === 'EXPIRED' && (
                    <div className="text-right">
                        <span className="text-xs font-extrabold tracking-tight text-[#101F1A]">₱{item.amount}</span>
                        <span className="block text-[9px] font-bold uppercase text-stone-400">Slot Freed</span>
                    </div>
                )}
            </div>
        </div>
    );
}
