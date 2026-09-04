import React, { useState } from 'react';
import Dialog from '@/Components/Dialog';
import { useConfirm } from '@/Components/ConfirmContext';
import {
    X,
    User,
    Phone,
    Mail,
    Clock,
    DollarSign,
    CheckCircle2,
    PlusCircle,
    Ban,
    Sparkles,
    ShieldCheck,
    CreditCard,
    FileText,
    Loader2,
} from 'lucide-react';
import { STATUS_CONFIG, SPORTS_CONFIG, BOOKING_STATUS, formatTimeRange12 } from './types';
import SportIcon from './SportIcon';

export default function BookingDetailPopover({
    booking,
    court,
    onClose,
    onCheckIn,
    onMarkPaid,
    onExtend,
    onCancel,
    isPending = false,
}) {
    const { confirm } = useConfirm();

    const isOpen = Boolean(booking);
    const statusMeta = booking ? (STATUS_CONFIG[booking.status] || STATUS_CONFIG[BOOKING_STATUS.CONFIRMED]) : STATUS_CONFIG[BOOKING_STATUS.CONFIRMED];

    const formatHoldCountdown = (seconds) => {
        if (!seconds || seconds <= 0) return 'Expired';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (!booking) return null;

    const customHeader = (
        <div className="flex items-start justify-between gap-3 border-b border-[#101F1A]/10 p-5 bg-[#FAF8F5]">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#101F1A] text-sm font-extrabold text-[#D6FF3F] shadow-sm">
                    {booking.initials || 'CS'}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#101F1A] tracking-tight truncate">
                            {booking.customerName}
                        </h3>
                        <span className="rounded-md bg-[#101F1A]/8 px-2 py-0.5 text-[10px] font-bold text-[#101F1A]/70 uppercase shrink-0">
                            {booking.source}
                        </span>
                    </div>
                    <p className="text-xs text-[#101F1A]/50 font-mono truncate">
                        Ref: {booking.reference || booking.id}
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#101F1A]/50 hover:bg-[#101F1A]/10 hover:text-[#101F1A] transition-colors cursor-pointer shrink-0"
            >
                <X size={18} />
            </button>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            header={customHeader}
            size="md"
            closeOnClickOutside={true}
        >
            <div className="p-5 space-y-3.5">
                <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl p-3 border ${statusMeta.bg} ${statusMeta.border} shadow-2xs`}>
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotColor} ${statusMeta.isLive ? 'animate-pulse' : ''}`} />
                        <span className={`text-xs font-bold ${statusMeta.text}`}>
                            {statusMeta.label}
                        </span>
                    </div>

                    {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && typeof booking.holdRemainingSeconds === 'number' && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-[#FF5A36] px-2.5 py-1 text-xs font-black text-white shadow-xs animate-pulse">
                            <span>⏱ Hold Expires: {formatHoldCountdown(booking.holdRemainingSeconds)}</span>
                        </div>
                    )}

                    <div className="text-base font-extrabold tracking-tight text-[#101F1A]">
                        ₱{booking.amount?.toLocaleString() || '0'}
                    </div>
                </div>

                <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-[#F5F2EA]/60 p-2.5 border border-[#101F1A]/8">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">Court</span>
                            <span className="font-bold text-[#101F1A] mt-0.5 block truncate">
                                {court?.shortName || court?.name || 'Court'}
                            </span>
                        </div>

                        <div className="rounded-lg bg-[#F5F2EA]/60 p-2.5 border border-[#101F1A]/8">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">Schedule & Duration</span>
                            <span className="font-bold text-[#101F1A] mt-0.5 flex items-center gap-1">
                                <Clock size={12} className="text-[#101F1A]/60" />
                                <span>{formatTimeRange12(booking.startTime, booking.endTime)} ({booking.durationHours}h)</span>
                            </span>
                        </div>
                    </div>

                    <div className="rounded-lg bg-[#F5F2EA]/60 p-2.5 border border-[#101F1A]/8 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[#101F1A]/60 flex items-center gap-1.5 font-medium">
                                <Phone size={12} />
                                <span>Phone</span>
                            </span>
                            <span className="font-bold text-[#101F1A] font-mono">
                                {booking.customerPhone || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[#101F1A]/60 flex items-center gap-1.5 font-medium">
                                <Mail size={12} />
                                <span>Email</span>
                            </span>
                            <span className="font-semibold text-[#101F1A]">
                                {booking.customerEmail || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[#101F1A]/60 flex items-center gap-1.5 font-medium">
                                <CreditCard size={12} />
                                <span>Payment Method</span>
                            </span>
                            <span className="font-bold text-[#101F1A]">
                                {booking.paymentMethod || 'CASH'} ({booking.paymentStatus || 'PAID'})
                            </span>
                        </div>
                    </div>

                    {booking.notes && (
                        <div className="rounded-lg bg-[#FAF8F5] p-2.5 border border-[#101F1A]/8 text-[11px] text-[#101F1A]/75">
                            <span className="font-bold text-[#101F1A] block mb-0.5">Booking Notes / Add-ons:</span>
                            <span>{booking.notes}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#101F1A]/10">
                    <button
                        type="button"
                        onClick={handleCancelBooking}
                        className="text-xs font-bold text-[#FF5A36] hover:underline cursor-pointer"
                    >
                        Cancel Booking
                    </button>

                    <div className="flex items-center gap-2">
                        {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => onMarkPaid?.(booking.id, 'CASH')}
                                className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0ea372] transition-all cursor-pointer"
                            >
                                {isPending ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
                                <span>Mark Paid</span>
                            </button>
                        )}

                        {(booking.status === BOOKING_STATUS.CONFIRMED || booking.status === BOOKING_STATUS.PAID) && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => onCheckIn?.(booking.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-[#D6FF3F] px-4 py-2 text-xs font-extrabold text-[#101F1A] shadow-xs hover:bg-[#c2ea2e] transition-all press-scale cursor-pointer uppercase tracking-wider"
                            >
                                {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
                                <span>Check In</span>
                            </button>
                        )}

                        {booking.status === BOOKING_STATUS.IN_PROGRESS && (
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => onExtend?.(booking.id, 30)}
                                className="flex items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 py-2 text-xs font-bold text-[#D6FF3F] shadow-xs hover:bg-[#162923] transition-all cursor-pointer"
                            >
                                <PlusCircle size={13} />
                                <span>Extend +30m</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
