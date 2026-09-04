import React, { useState } from 'react';
import AttentionRow from './AttentionRow';
import { BOOKING_STATUS } from './types';
import { Clock, ShieldCheck, UserCheck, AlertOctagon, X, ChevronRight, Sparkles, Zap } from 'lucide-react';

export default function AttentionPanel({
    bookings = [],
    expiredHolds = [],
    courts = [],
    isOpen = true,
    onClose,
    onCheckIn,
    onMarkPaid,
    onSelectBooking,
}) {
    const [activeTab, setActiveTab] = useState('AWAITING_PAYMENT'); // 'AWAITING_PAYMENT' | 'EXPIRED' | 'CHECK_IN_QUEUE'

    // 1. Awaiting Payment Items
    const awaitingPaymentItems = bookings
        .filter(b => b.status === BOOKING_STATUS.AWAITING_PAYMENT)
        .map(b => ({
            ...b,
            courtName: courts.find(c => c.id === b.courtId)?.name || 'Court',
        }));

    // 2. Check-in Queue Items (Confirmed upcoming bookings)
    const checkInQueueItems = bookings
        .filter(b => b.status === BOOKING_STATUS.CONFIRMED)
        .map(b => ({
            ...b,
            courtName: courts.find(c => c.id === b.courtId)?.name || 'Court',
        }));

    // Counts for tab badges
    const tabs = [
        {
            id: 'AWAITING_PAYMENT',
            label: 'Holds',
            count: awaitingPaymentItems.length,
            badgeBg: 'bg-[#FF5A36] text-white',
        },
        {
            id: 'CHECK_IN_QUEUE',
            label: 'Check-in',
            count: checkInQueueItems.length,
            badgeBg: 'bg-[#D6FF3F] text-[#101F1A]',
        },
        {
            id: 'EXPIRED',
            label: 'Expired',
            count: expiredHolds.length,
            badgeBg: 'bg-stone-300 text-stone-700',
        },
    ];

    const handleRowAction = (id, actionType) => {
        if (actionType === 'CHECK_IN') {
            onCheckIn?.(id);
        } else if (actionType === 'MARK_PAID') {
            onMarkPaid?.(id, 'CASH');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full rounded-xl border border-[#101F1A]/10 bg-white shadow-card overflow-hidden">
            
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b border-[#101F1A]/10 px-4 py-3 bg-[#101F1A] text-[#F5F2EA]">
                <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#D6FF3F] text-[#101F1A] shadow-2xs">
                        <Zap size={13} strokeWidth={2.6} />
                    </div>
                    <div>
                        <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white">
                            Attention Queue
                        </h3>
                        <p className="text-[10px] text-white/50">
                            Realtime holds & check-ins
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    title="Collapse attention panel"
                >
                    <X size={15} />
                </button>
            </div>

            {/* ── Tabs Navigation ─────────────────────────────────────────── */}
            <div className="flex border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 p-1.5 gap-1">
                {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                'flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-2 text-xs font-bold transition-all cursor-pointer',
                                active
                                    ? 'bg-white text-[#101F1A] shadow-xs'
                                    : 'text-[#101F1A]/60 hover:text-[#101F1A]',
                            ].join(' ')}
                        >
                            <span>{tab.label}</span>
                            {tab.count > 0 && (
                                <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${tab.badgeBg}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Queue List Content ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[620px] dark-scrollbar">
                
                {/* 1. Awaiting Payment Tab */}
                {activeTab === 'AWAITING_PAYMENT' && (
                    <>
                        {awaitingPaymentItems.length === 0 ? (
                            <div className="py-10 text-center text-[#101F1A]/50">
                                <Clock size={28} className="mx-auto text-[#101F1A]/25 mb-1.5" />
                                <p className="text-xs font-bold text-[#101F1A]/80">No Active Payment Holds</p>
                                <p className="text-[11px] mt-0.5">Online checkout holds (30-min window) appear here live.</p>
                            </div>
                        ) : (
                            awaitingPaymentItems.map((item) => (
                                <AttentionRow
                                    key={item.id}
                                    item={item}
                                    type="AWAITING_PAYMENT"
                                    onAction={handleRowAction}
                                    onSelect={() => onSelectBooking?.(item, courts.find(c => c.id === item.courtId))}
                                />
                            ))
                        )}
                    </>
                )}

                {/* 2. Check-in Queue Tab */}
                {activeTab === 'CHECK_IN_QUEUE' && (
                    <>
                        {checkInQueueItems.length === 0 ? (
                            <div className="py-10 text-center text-[#101F1A]/50">
                                <UserCheck size={28} className="mx-auto text-[#101F1A]/25 mb-1.5" />
                                <p className="text-xs font-bold text-[#101F1A]/80">Check-in Queue Clear</p>
                                <p className="text-[11px] mt-0.5">Confirmed upcoming sessions ready for arrival appear here.</p>
                            </div>
                        ) : (
                            checkInQueueItems.map((item) => (
                                <AttentionRow
                                    key={item.id}
                                    item={item}
                                    type="CHECK_IN_QUEUE"
                                    onAction={handleRowAction}
                                    onSelect={() => onSelectBooking?.(item, courts.find(c => c.id === item.courtId))}
                                />
                            ))
                        )}
                    </>
                )}

                {/* 3. Expired Holds Tab */}
                {activeTab === 'EXPIRED' && (
                    <>
                        {expiredHolds.length === 0 ? (
                            <div className="py-10 text-center text-[#101F1A]/50">
                                <AlertOctagon size={28} className="mx-auto text-[#101F1A]/25 mb-1.5" />
                                <p className="text-xs font-bold text-[#101F1A]/80">No Expired Holds</p>
                                <p className="text-[11px] mt-0.5">Unpaid slots released by the scheduler are tracked here.</p>
                            </div>
                        ) : (
                            expiredHolds.map((item) => (
                                <AttentionRow
                                    key={item.id}
                                    item={item}
                                    type="EXPIRED"
                                />
                            ))
                        )}
                    </>
                )}
            </div>

            {/* ── Footer Summary ──────────────────────────────────────────── */}
            <div className="border-t border-[#101F1A]/10 bg-[#F5F2EA]/40 px-3.5 py-2.5 text-[11px] text-[#101F1A]/60 flex items-center justify-between">
                <span className="font-semibold">Reverb Live Stream</span>
                <span className="text-[#10B981] font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    Auto-syncing
                </span>
            </div>
        </div>
    );
}
