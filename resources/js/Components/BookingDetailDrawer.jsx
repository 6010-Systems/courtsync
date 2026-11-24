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
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString) => {
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const isSuccess = mode === 'success';

    const bookingFee = Number(booking.booking_fee ?? 0);
    const totalPrice = Number(booking.total_price ?? 0);
    const addonsTotal = Number(booking.addons_total ?? 0);
    const courtRate = booking.subtotal != null
        ? Number(booking.subtotal)
        : Math.max(0, totalPrice - bookingFee - addonsTotal);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#10221C]/40 backdrop-blur-sm z-40"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto flex flex-col relative">
                            
                            {/* Top Section */}
                            <div className="bg-[#101F1A] px-5 py-6 flex flex-col items-center text-center relative">

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
                                
                                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                                    {isSuccess ? 'Booking Added Successfully!' : 'Booking Details'}
                                </h2>
                                
                                {isSuccess ? (
                                    <p className="text-white/70 text-sm leading-tight">
                                        {booking.user?.name || booking.guest_name || 'Walk-in player'} has been registered in the system.
                                    </p>
                                ) : (
                                    <span className="px-3 py-1 bg-[#D6FF3F] text-[#101F1A] text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                                        {booking.status}
                                    </span>
                                )}
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
                                    
                                    {/* Main Info Card */}
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                                                <User size={12} /> Player Info
                                            </span>
                                            {booking.user?.email && (
                                                <span className="text-[9px] bg-[#D6FF3F]/20 text-[#10221C] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Registered</span>
                                            )}
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
                                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}{booking.end_date || String(booking.end_time) <= String(booking.start_time) ? ' (next day)' : ''}
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

                                            <div className="flex items-center justify-between text-[#10221C]/70">
                                                <span>{booking.rate_plan_name || 'Court rate'}</span>
                                                <span className="font-bold text-[#10221C]">{formatPeso(courtRate)}</span>
                                            </div>

                                            {addonsTotal > 0 && (
                                                <div className="mt-1 flex items-center justify-between text-[#10221C]/70">
                                                    <span>Add-ons</span>
                                                    <span className="font-bold text-[#10221C]">{formatPeso(addonsTotal)}</span>
                                                </div>
                                            )}

                                            <div className="mt-1 flex items-center justify-between text-[#10221C]/70">
                                                <span>Booking fee</span>
                                                <span className="font-bold text-[#10221C]">{formatPeso(bookingFee)}</span>
                                            </div>

                                            <div className="mt-1.5 flex items-center justify-between border-t border-dashed border-[#10221C]/15 pt-1.5">
                                                <span className="font-black uppercase tracking-wide text-[#10221C]/60">Total</span>
                                                <span className="font-black text-[#10221C]">{formatPeso(totalPrice)}</span>
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
                                    <div className="pt-3 border-t border-[#10221C]/10 flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50/50 -mx-4 -mb-4 p-4">
                                        <Sparkles size={16} className="text-green-600" />
                                        <span>Booking successfully confirmed and logged.</span>
                                    </div>
                                )}
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
