import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CalendarClock, CheckCircle2, ClipboardList, Clock, MapPin, Maximize2, ReceiptText, User, Banknote, ShieldCheck, Check, Sparkles, XCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import { formatPeso } from '@/Components/MetricCard';
import { receiptUrl } from '@/Utils/receiptUrl';

export default function BookingDetailDrawer({ isOpen, onClose, onReschedule, onVerify, onReject, booking, mode = 'view' }) {
    const [activeTab, setActiveTab] = useState('details');
    const [showReceiptPreview, setShowReceiptPreview] = useState(false);

    useEffect(() => {
        setActiveTab('details');
        setShowReceiptPreview(false);
    }, [isOpen, booking?.id]);

    useEffect(() => {
        if (!showReceiptPreview) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowReceiptPreview(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showReceiptPreview]);

    if (!booking) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(`${String(dateString).slice(0, 10)}T12:00:00`);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hourStr, minuteStr] = timeString.split(':');
        const hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minuteStr} ${ampm}`;
    };

    const isSuccess = mode === 'success';
    const payment = booking.payment;
    const paymentStatus = (payment?.status || booking.status || '').toLowerCase();
    const isPending = paymentStatus === 'pending';
    const isVerified = paymentStatus === 'verified' || paymentStatus === 'confirmed';
    const isRejected = paymentStatus === 'rejected' || paymentStatus === 'cancelled';

    const bookingFee = Number(booking.booking_fee ?? 0);
    const totalPrice = Number(payment?.amount ?? booking.total_price ?? 0);
    const addonsTotal = Number(booking.addons_total ?? 0);
    const courtRate = booking.subtotal != null
        ? Number(booking.subtotal)
        : Math.max(0, totalPrice - bookingFee - addonsTotal);

    const playerName = booking.user?.name || booking.guest_name || 'Walk-in Player';
    const playerEmail = booking.user?.email || booking.guest_email || null;
    const playerPhone = booking.user?.phone || booking.guest_phone || null;
    const isRegistered = Boolean(booking.user?.email);

    const facilityName = booking.facility?.name || booking.court?.facility?.name || 'Facility';
    const courtName = booking.court?.name || 'Court';
    const proofUrl = receiptUrl(payment?.proof_path);

    const getInitials = (name) => {
        return String(name || '?')
            .split(' ')
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#101F1A]/60 backdrop-blur-xs z-50 transition-opacity"
                    />

                    {/* Modal Dialog */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-detail-title"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden pointer-events-auto flex flex-col relative max-h-[92vh] border border-[#101F1A]/10">
                            
                            {/* ── Dialog Header ── */}
                            <div className="bg-[#101F1A] px-6 py-5 text-left relative shrink-0">
                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D6FF3F]"
                                    aria-label="Close booking details dialog"
                                >
                                    <X size={16} />
                                </button>

                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Close booking details"
                                    className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                                >
                                    <X size={18} />
                                </button>

                                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-3 text-[#D6FF3F] shadow-inner">
                                    {isSuccess ? (
                                        <Check size={28} strokeWidth={3} />
                                    ) : (
                                        <ShieldCheck size={28} strokeWidth={2.5} />
                                    )}
                                </div>
                            </div>

                            {/* Bottom Section (Details) */}
                            <div className="max-h-[72vh] overflow-y-auto bg-[#F8F9FA] p-4">

                                {/* Tabs (view mode only) */}
                                {!isSuccess && (
                                    <div className="mb-3 flex items-center gap-1 rounded-xl border border-[#101F1A]/10 bg-white p-1 shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('details')}
                                            aria-pressed={activeTab === 'details'}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                                                activeTab === 'details'
                                                    ? 'bg-[#101F1A] text-[#D6FF3F] shadow-sm'
                                                    : 'text-[#101F1A]/60 hover:text-[#101F1A]'
                                            }`}
                                        >
                                            <ClipboardList size={13} />
                                            Booking
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('receipt')}
                                            aria-pressed={activeTab === 'receipt'}
                                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                                                activeTab === 'receipt'
                                                    ? 'bg-[#101F1A] text-[#D6FF3F] shadow-sm'
                                                    : 'text-[#101F1A]/60 hover:text-[#101F1A]'
                                            }`}
                                        >
                                            <ReceiptText size={13} />
                                            Proof of Payment
                                        </button>
                                    </div>
                                )}

                                {/* Booking details panel */}
                                <div className={isSuccess || activeTab === 'details' ? 'space-y-2 mb-4' : 'hidden'}>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-xs font-bold text-[#D6FF3F] shadow-2xs">
                                            {getInitials(playerName)}
                                        </div>
                                        <div className="text-[15px] font-black text-[#10221C] truncate">
                                            {booking.user?.name || booking.guest_name || 'Walk-in'}
                                            {booking.user?.email && (
                                                <span className="text-gray-400 font-medium text-[12px] ml-1.5">
                                                    • {booking.user.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2-Column Details: Date & Time */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <Calendar size={12} /> Date
                                            </span>
                                            <span className="text-[14px] font-bold text-[#10221C] truncate">
                                                {formatDate(booking.date)}
                                            </span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <Clock size={12} /> Time
                                            </span>
                                            <span className="text-[13px] font-bold text-[#10221C] truncate">
                                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Court and Price */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <MapPin size={12} /> Court
                                            </span>
                                            <span className="text-[14px] font-black text-[#10221C] truncate">
                                                {booking.court?.name || 'Unknown'}
                                            </span>
                                            {booking.rate_plan_name && (
                                                <span className="text-[10px] font-bold uppercase tracking-wide text-[#10221C]/50 truncate">
                                                    {booking.rate_plan_name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-[#D6FF3F] p-2 rounded-xl shadow-md flex flex-col justify-center relative overflow-hidden group">
                                            <Banknote size={48} className="absolute -right-3 -bottom-3 text-[#10221C]/10 group-hover:scale-110 transition-transform duration-300" />
                                            <span className="flex items-center gap-1.5 text-[11px] text-[#10221C]/60 font-bold uppercase tracking-wide mb-0.5 relative z-10">
                                                Total Price
                                            </span>
                                            <span className="text-lg font-black text-[#10221C] leading-tight truncate relative z-10">
                                                {formatPeso(totalPrice)}
                                            </span>
                                        </div>
                                    </div>

                                    {!isSuccess && (
                                        <div className="rounded-xl border border-[#10221C]/10 bg-[#FAFAF8] p-3 text-xs">
                                            <div className="mb-1.5 flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">
                                                    Payment breakdown
                                                </span>
                                                {booking.payment?.status && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                                                        booking.payment.status === 'verified'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : booking.payment.status === 'rejected'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {booking.payment.status}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Proof of Payment tab */}
                                {!isSuccess && activeTab === 'receipt' && (
                                    <div className="space-y-2">
                                        {booking.payment && (
                                            <div className="flex items-center justify-between rounded-xl border border-[#10221C]/10 bg-white px-3 py-2 shadow-sm">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">
                                                        {booking.payment.payment_method || 'Payment'}
                                                    </span>
                                                    <span className="text-sm font-black text-[#10221C]">
                                                        {formatPeso(booking.payment.amount ?? totalPrice)}
                                                    </span>
                                                </div>
                                                {booking.payment.status && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#10221C]/60">
                                                        {booking.payment.status}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {booking.payment?.proof_path ? (
                                            <div className="overflow-hidden rounded-xl border border-[#10221C]/10 bg-white shadow-sm">
                                                <div className="flex items-center justify-between border-b border-[#10221C]/10 px-3 py-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">
                                                        Proof of payment
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowReceiptPreview(true)}
                                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10221C]/60 transition-colors hover:text-[#10221C] cursor-pointer"
                                                    >
                                                        <Maximize2 size={11} />
                                                        View full size
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowReceiptPreview(true)}
                                                    aria-label="View payment receipt full size"
                                                    className="block w-full bg-gray-50 p-2 cursor-zoom-in"
                                                >
                                                    <img
                                                        src={receiptUrl(booking.payment.proof_path)}
                                                        alt="Payment receipt"
                                                        className="mx-auto max-h-[48vh] w-full rounded-lg object-contain"
                                                    />
                                                </button>
                                                <p className="border-t border-[#10221C]/10 px-3 py-2 text-center text-[10px] text-[#10221C]/50">
                                                    Tap the receipt to enlarge it.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="rounded-xl border border-dashed border-[#10221C]/15 bg-white/60 px-3 py-8 text-center text-[11px] text-[#10221C]/50">
                                                No payment receipt uploaded for this booking.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Facility-side actions */}
                                {!isSuccess && booking.status !== 'cancelled' && (
                                    <div className="space-y-2">
                                        {/* Verify payment — shown when payment isn't verified yet */}
                                        {onVerify && (booking.payment?.status ?? 'unpaid') !== 'verified' && (
                                            booking.status === 'pending'
                                                ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => onVerify(booking)}
                                                            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 cursor-pointer"
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            Verify
                                                        </button>
                                                        {onReject && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onReject(booking)}
                                                                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-rose-600 transition-colors hover:bg-rose-50 cursor-pointer"
                                                            >
                                                                <XCircle size={14} />
                                                                Reject
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onVerify(booking)}
                                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-emerald-700 cursor-pointer"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Verify payment
                                                    </button>
                                                )
                                        )}

                                        {/* Edit booking */}
                                        {onReschedule && (
                                            <button
                                                type="button"
                                                onClick={() => onReschedule(booking)}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D6FF3F] transition-colors hover:bg-[#162923] cursor-pointer"
                                            >
                                                <CalendarClock size={14} />
                                                Edit booking
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Footer / Actions */}
                                {isSuccess && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-center gap-3">
                                        <Sparkles size={18} className="text-emerald-600 shrink-0" />
                                        <span className="text-xs font-semibold text-emerald-800">
                                            Reservation successfully confirmed and logged into the facility calendar.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── Dialog Action Footer ── */}
                            <div className="border-t border-[#101F1A]/10 bg-white px-5 py-3.5 flex flex-wrap items-center justify-end gap-2 shrink-0">
                                {isPending && onVerify && (
                                    <>
                                        {onReject && (
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => onReject(payment)}
                                                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
                                            >
                                                <X size={14} />
                                                <span>Reject</span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => onVerify(payment)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D6FF3F] hover:bg-[#c8f526] px-4 py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:shadow-card transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
                                        >
                                            {isProcessing ? (
                                                <Loader2 size={14} className="animate-spin text-[#101F1A]" />
                                            ) : (
                                                <Check size={14} className="text-[#101F1A] stroke-[2.5]" />
                                            )}
                                            <span>Verify Payment</span>
                                        </button>
                                    </>
                                )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all cursor-pointer min-h-[40px]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Full-size receipt preview (opens in place, never a new tab) */}
                    {showReceiptPreview && booking.payment?.proof_path && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowReceiptPreview(false)}
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Payment receipt preview"
                        >
                            <button
                                type="button"
                                onClick={() => setShowReceiptPreview(false)}
                                aria-label="Close receipt preview"
                                className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
                            >
                                <X size={20} />
                            </button>

                            <motion.img
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                src={receiptUrl(booking.payment.proof_path)}
                                alt="Payment receipt"
                                onClick={(event) => event.stopPropagation()}
                                className="max-h-[88vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
                            />
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
