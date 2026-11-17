import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    User,
    Banknote,
    ShieldCheck,
    Check,
    CheckCircle2,
    XCircle,
    Sparkles,
    Building2,
    ExternalLink,
    ZoomIn,
    Phone,
    Mail,
    FileText,
    Loader2,
} from 'lucide-react';
import { formatPeso } from '@/Components/MetricCard';
import { receiptUrl } from '@/Utils/receiptUrl';

export default function BookingDetailDrawer({
    isOpen,
    onClose,
    booking,
    mode = 'view',
    onVerify,
    onReject,
    isProcessing = false,
}) {
    const [isZoomed, setIsZoomed] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (isZoomed) {
                    setIsZoomed(false);
                } else {
                    onClose?.();
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, isZoomed, onClose]);

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
    const courtRate = booking.subtotal != null
        ? Number(booking.subtotal)
        : Math.max(0, totalPrice - bookingFee);

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

                                <div className="flex items-center gap-3 pr-8">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#D6FF3F] shadow-inner shrink-0">
                                        {isSuccess ? (
                                            <Check size={22} strokeWidth={3} />
                                        ) : (
                                            <ShieldCheck size={22} strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 id="booking-detail-title" className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                                            {isSuccess ? 'Booking Created' : 'Booking & Payment Details'}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className="text-xs text-white/60 truncate">
                                                ID: #{booking.id} · {facilityName}
                                            </span>
                                            {/* Status Badge */}
                                            {isPending && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                    Pending Verification
                                                </span>
                                            )}
                                            {isVerified && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#D6FF3F] px-2 py-0.5 text-[10px] font-black text-[#101F1A]">
                                                    <Check size={10} strokeWidth={3} />
                                                    Verified & Secured
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                                                    <X size={10} />
                                                    Cancelled / Rejected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Scrollable Dialog Body ── */}
                            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#FAF9F5]">
                                
                                {/* 1. Player Info Card */}
                                <div className="bg-white p-3.5 rounded-2xl border border-[#101F1A]/10 shadow-card">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                            <User size={12} /> Player Information
                                        </span>
                                        {isRegistered ? (
                                            <span className="text-[10px] bg-[#D6FF3F] text-[#101F1A] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                Registered Member
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-[#101F1A]/5 text-[#101F1A]/70 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                                                Guest Walk-in
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-xs font-bold text-[#D6FF3F] shadow-2xs">
                                            {getInitials(playerName)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-sm text-[#101F1A] truncate">
                                                {playerName}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#101F1A]/60 mt-0.5">
                                                {playerEmail && (
                                                    <span className="inline-flex items-center gap-1 truncate">
                                                        <Mail size={11} className="text-[#101F1A]/40" />
                                                        {playerEmail}
                                                    </span>
                                                )}
                                                {playerPhone && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Phone size={11} className="text-[#101F1A]/40" />
                                                        {playerPhone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Venue & Schedule Matrix */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {/* Court & Venue */}
                                    <div className="bg-white p-3 rounded-2xl border border-[#101F1A]/10 shadow-2xs">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 mb-1">
                                            <Building2 size={12} /> Venue & Court
                                        </span>
                                        <div className="font-bold text-sm text-[#101F1A] truncate">
                                            {courtName}
                                        </div>
                                        <div className="text-xs text-[#101F1A]/60 truncate mt-0.5">
                                            {facilityName}
                                        </div>
                                    </div>

                                    {/* Schedule */}
                                    <div className="bg-white p-3 rounded-2xl border border-[#101F1A]/10 shadow-2xs">
                                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 mb-1">
                                            <Clock size={12} /> Reserved Time
                                        </span>
                                        <div className="font-bold text-sm text-[#101F1A] truncate">
                                            {formatDate(booking.date)}
                                        </div>
                                        <div className="text-xs text-[#101F1A]/60 truncate mt-0.5">
                                            {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Financial Breakdown Card */}
                                {!isSuccess && (
                                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white p-3.5 shadow-2xs">
                                        <div className="mb-2 flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                                <Banknote size={12} /> Payment Summary
                                            </span>
                                            <span className="rounded-md bg-[#F5F2EA] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#101F1A]">
                                                {payment?.payment_method || 'Manual'}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 text-xs text-[#101F1A]/70">
                                            <div className="flex items-center justify-between">
                                                <span>Court rental subtotal</span>
                                                <span className="font-bold text-[#101F1A]">{formatPeso(courtRate)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Facility booking fee</span>
                                                <span className="font-bold text-[#101F1A]">
                                                    {bookingFee > 0 ? formatPeso(bookingFee) : '₱0.00 (Free)'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-dashed border-[#101F1A]/15 pt-2 mt-2">
                                                <span className="text-xs font-bold uppercase tracking-wide text-[#101F1A]/70">
                                                    Total Charged
                                                </span>
                                                <span className="text-base font-black text-[#101F1A]">
                                                    {formatPeso(totalPrice)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 4. Payment Receipt Section */}
                                {!isSuccess && proofUrl && (
                                    <div className="overflow-hidden rounded-2xl border border-[#101F1A]/10 bg-white shadow-card">
                                        <div className="flex items-center justify-between border-b border-[#101F1A]/10 bg-[#F5F2EA]/40 px-3.5 py-2">
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                                <FileText size={12} /> Uploaded Proof Receipt
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsZoomed(true)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#101F1A] hover:text-[#101F1A]/70 cursor-pointer transition-colors"
                                                >
                                                    <ZoomIn size={12} />
                                                    <span>Enlarge</span>
                                                </button>
                                                <span className="text-[#101F1A]/30">·</span>
                                                <a
                                                    href={proofUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#101F1A] hover:underline"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>New Tab</span>
                                                </a>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => setIsZoomed(true)}
                                            className="relative block bg-[#101F1A]/5 p-2 cursor-zoom-in group"
                                            title="Click to zoom receipt"
                                        >
                                            <img
                                                src={proofUrl}
                                                alt="Payment receipt proof"
                                                className="max-h-56 sm:max-h-64 w-full rounded-xl object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                                            />
                                            <div className="absolute inset-0 bg-[#101F1A]/0 group-hover:bg-[#101F1A]/10 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#101F1A]/80 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                    <ZoomIn size={12} /> Click to enlarge
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isSuccess && !proofUrl && (
                                    <div className="rounded-2xl border border-dashed border-[#101F1A]/15 bg-white/60 p-4 text-center">
                                        <FileText size={24} className="mx-auto text-[#101F1A]/30 mb-1" />
                                        <p className="text-xs font-semibold text-[#101F1A]/70">No payment receipt attached</p>
                                        <p className="text-[10px] text-[#101F1A]/40 mt-0.5">
                                            This reservation was recorded without an uploaded receipt proof.
                                        </p>
                                    </div>
                                )}

                                {/* Success Mode Message */}
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

                    {/* ── High-Res Receipt Lightbox Modal ── */}
                    {isZoomed && proofUrl && (
                        <div
                            onClick={() => setIsZoomed(false)}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#101F1A]/90 backdrop-blur-md cursor-zoom-out"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-2xl bg-white p-2 shadow-2xl"
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsZoomed(false)}
                                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#101F1A]/80 text-white hover:bg-[#101F1A] transition-colors cursor-pointer"
                                    aria-label="Close enlarged receipt"
                                >
                                    <X size={16} />
                                </button>
                                <img
                                    src={proofUrl}
                                    alt="Enlarged payment receipt proof"
                                    className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
