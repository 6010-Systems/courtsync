import React, { useState, useMemo } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { 
    CalendarCheck, 
    Clock, 
    MapPin, 
    Ticket, 
    XCircle, 
    Building2, 
    CreditCard, 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Dialog from '@/Components/Dialog';
import { getCourtImage, DEFAULT_COURT_IMAGES } from '@/Utils/courtImages';

const statusConfig = {
    pending: {
        label: 'Awaiting Confirmation',
        badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
        dot: 'bg-amber-500',
    },
    confirmed: {
        label: 'Confirmed',
        badge: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-rose-50 text-rose-900 border-rose-200/80',
        dot: 'bg-rose-500',
    },
};

/**
 * Authentic 2D Barcode matching physical boarding passes and transit cards
 */
function TicketBarcode({ reference = 'CS-2026-000001' }) {
    const grid = useMemo(() => {
        let seed = 0;
        for (let i = 0; i < reference.length; i++) {
            seed = (seed * 31 + reference.charCodeAt(i)) & 0xffffffff;
        }
        const rng = () => {
            seed = (seed * 1664525 + 1013904223) & 0xffffffff;
            return (seed >>> 0) / 4294967296;
        };

        const rows = 9;
        const cols = 28;
        const matrix = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                const isAnchor =
                    (r < 2 && (c < 2 || c >= cols - 2)) ||
                    (r >= rows - 2 && (c < 2 || c >= cols - 2)) ||
                    (r === 4 && (c >= 12 && c <= 15));
                row.push(isAnchor ? true : rng() > 0.42);
            }
            matrix.push(row);
        }
        return matrix;
    }, [reference]);

    return (
        <div className="w-full flex flex-col items-center">
            <svg
                viewBox="0 0 280 64"
                className="w-full h-14 sm:h-16 text-[#10221C]"
                fill="currentColor"
                shapeRendering="crispEdges"
                aria-label={`Barcode for ${reference}`}
            >
                {/* Left Standard Guard Bars */}
                <rect x="0" y="0" width="3.5" height="64" />
                <rect x="6" y="0" width="1.5" height="64" />
                <rect x="10" y="0" width="4" height="64" />
                <rect x="16" y="0" width="2" height="64" />
                <rect x="21" y="0" width="1.5" height="64" />
                <rect x="25" y="0" width="3.5" height="64" />
                <rect x="31" y="0" width="1.5" height="64" />

                {/* Center 2D Matrix Modules */}
                {grid.map((row, r) =>
                    row.map((active, c) =>
                        active ? (
                            <rect
                                key={`${r}-${c}`}
                                x={38 + c * 7.2}
                                y={r * 7.1}
                                width="5.8"
                                height="5.5"
                            />
                        ) : null
                    )
                )}

                {/* Right Standard Guard Bars */}
                <rect x="246" y="0" width="1.5" height="64" />
                <rect x="250" y="0" width="3.5" height="64" />
                <rect x="256" y="0" width="1.5" height="64" />
                <rect x="260" y="0" width="4" height="64" />
                <rect x="266" y="0" width="2" height="64" />
                <rect x="270" y="0" width="1.5" height="64" />
                <rect x="274" y="0" width="3.5" height="64" />
            </svg>
        </div>
    );
}

export default function PlayerBookingCard({ booking }) {
    const { auth } = usePage().props;
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const bookingDate = new Date(`${booking.date}T12:00:00`);
    const dateFormatted = bookingDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    const dateShort = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekdayShort = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    const timeFormatted = (value) => new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });

    const durationText = (() => {
        if (!booking.start_time || !booking.end_time) return '1h';
        const [sH, sM] = String(booking.start_time).split(':').map(Number);
        const [eH, eM] = String(booking.end_time).split(':').map(Number);
        const totalMins = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
        if (totalMins <= 0) return '1h';
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    })();

    const pesos = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

    const total = Number(booking.total_price);
    const statusCfg = statusConfig[booking.status] || {
        label: booking.status,
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-400',
    };

    const playerName = booking.user?.name || auth?.user?.name || 'Player';
    const referenceCode = booking.reference_number || `CS-${bookingDate.getFullYear()}-${String(booking.id).padStart(6, '0')}`;
    const courtImage = getCourtImage(booking.court, booking.facility, booking.id);

    const handleConfirmCancel = () => {
        setIsCancelling(true);
        router.delete(route('bookings.destroy', booking.id), {
            onFinish: () => {
                setIsCancelling(false);
                setIsCancelOpen(false);
                setIsDetailsOpen(false);
            },
        });
    };

    return (
        <>
            <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#101F1A]/10 bg-white shadow-card hover:shadow-xl hover:border-[#101F1A]/20 transition-all duration-300 h-full"
            >
                {/* Top Section with Court Image */}
                <div>
                    <div className="relative h-40 w-full overflow-hidden bg-[#101F1A]/5">
                        <img
                            src={courtImage}
                            alt={booking.court?.name ?? 'Court'}
                            loading="lazy"
                            onError={(e) => {
                                const fallback = DEFAULT_COURT_IMAGES[booking.id % DEFAULT_COURT_IMAGES.length];
                                if (e.currentTarget.src !== fallback) {
                                    e.currentTarget.src = fallback;
                                }
                            }}
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {/* Top Gradient Overlay */}
                        <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, rgba(16,31,26,0.35) 0%, rgba(16,31,26,0) 40%, rgba(255,255,255,0.7) 85%, #ffffff 100%)',
                            }}
                        />

                        {/* Floating Status Badge (Top-Left) */}
                        <div className="absolute top-3 left-3 z-10">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs border ${statusCfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                            </span>
                        </div>

                        {/* Floating Reference Pill (Top-Right) */}
                        <div className="absolute top-3 right-3 z-10">
                            <span className="inline-flex items-center bg-[#101F1A]/85 text-[#F5F2EA] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs border border-white/10">
                                #{referenceCode}
                            </span>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="-mt-3.5 relative z-10 px-4 sm:px-5 pb-3">
                        {/* Sport Category & Rate Plan */}
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                {booking.court?.type || 'Sports Court'}
                            </span>
                            {booking.rate_plan_name && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[10px] font-bold text-[#101F1A]/70 truncate max-w-[130px]" title={booking.rate_plan_name}>
                                        {booking.rate_plan_name}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Court Name */}
                        <h3 className="font-display text-base sm:text-lg font-bold text-[#10221C] group-hover:text-[#FF5A36] transition-colors line-clamp-1" title={booking.court?.name}>
                            {booking.court?.name ?? 'Court unavailable'}
                        </h3>

                        {/* Facility Name */}
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#101F1A]/70 truncate font-medium" title={booking.facility?.name}>
                            <Building2 className="w-3.5 h-3.5 text-[#101F1A]/40 shrink-0" />
                            <span className="truncate">{booking.facility?.name ?? 'Facility unavailable'}</span>
                        </p>

                        {/* Schedule & Location Strip */}
                        <div className="mt-3 p-3 rounded-xl bg-[#FAF9F5] border border-[#101F1A]/6 space-y-1.5 text-xs text-[#101F1A]/75">
                            <p className="flex items-center gap-2 font-semibold text-[#101F1A]">
                                <CalendarCheck size={13} className="text-[#FF5A36]/80 shrink-0" />
                                <span>{dateFormatted}</span>
                            </p>
                            <p className="flex items-center gap-2 text-xs">
                                <Clock size={13} className="text-[#101F1A]/50 shrink-0" />
                                <span>{timeFormatted(booking.start_time)} – {timeFormatted(booking.end_time)}</span>
                            </p>
                            <p className="flex items-center gap-2 text-xs text-[#101F1A]/60 truncate">
                                <MapPin size={13} className="text-[#101F1A]/40 shrink-0" />
                                <span className="truncate">{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Location unavailable'}</span>
                            </p>
                        </div>

                        {/* Price & Payment Line */}
                        <div className="mt-3.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#101F1A]/6">
                            <span className="text-[#101F1A]/60 text-[11px]">
                                Payment: <strong className="capitalize text-[#101F1A]">{booking.payment?.status ?? 'At Facility'}</strong>
                            </span>
                            <span className="font-black text-sm text-[#101F1A]">{pesos(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Card Action Buttons (Fixed Footer) */}
                <div className="px-4 sm:px-5 py-3 bg-[#FAF9F5]/70 border-t border-[#101F1A]/6 flex items-center justify-between gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsDetailsOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101F1A] bg-white hover:bg-gray-100 px-3 py-1.5 rounded-lg border border-[#101F1A]/10 transition cursor-pointer shadow-2xs shrink-0"
                    >
                        <Ticket className="w-3.5 h-3.5 text-[#101F1A]/70" />
                        View Ticket
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {booking.status === 'pending' && (
                            <button
                                type="button"
                                onClick={() => setIsCancelOpen(true)}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                        )}

                        {booking.facility?.slug && (
                            <Link 
                                href={route('facility.book', { facility: booking.facility.slug, court: booking.court_id })}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#10221C] bg-[#D6FF3F] hover:bg-[#c9f532] px-3 py-1.5 rounded-lg transition shadow-2xs"
                            >
                                Book Again
                            </Link>
                        )}
                    </div>
                </div>
            </motion.article>

            {/* Print Stylesheet for Physical Ticket Printout */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #booking-ticket-card, #booking-ticket-card * {
                        visibility: visible !important;
                    }
                    #booking-ticket-card {
                        position: fixed !important;
                        left: 50% !important;
                        top: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: 380px !important;
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            {/* REALISTIC BOOKING TICKET DIALOG (Modeled after Boarding Pass Reference) */}
            <Dialog
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                closeOnClickOutside={true}
                header={null}
                footer={null}
                size="md"
                className="!bg-transparent !border-0 !shadow-none !p-0 max-w-sm sm:max-w-md"
                contentClassName="!bg-transparent !p-0"
            >
                {/* Pure Physical Ticket Card */}
                <div 
                    id="booking-ticket-card"
                    className="relative w-full bg-white rounded-[32px] overflow-hidden shadow-2xl text-[#10221C] select-none"
                >
                    {/* Upper Ticket Section */}
                    <div className="p-6 sm:p-8 pb-5">
                        {/* Passenger / Player Row */}
                        <div className="flex items-start justify-between gap-3 mb-6">
                            <div>
                                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Player
                                </span>
                                <h3 className="text-2xl sm:text-[26px] font-black text-[#10221C] tracking-tight leading-tight mt-0.5">
                                    {playerName}
                                </h3>
                            </div>

                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${statusCfg.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                            </span>
                        </div>

                        {/* Times & Route Timeline Graphic */}
                        <div className="mb-6">
                            {/* Time row with duration in center */}
                            <div className="flex items-baseline justify-between mb-1.5">
                                <span className="text-sm font-bold text-[#10221C]">
                                    {timeFormatted(booking.start_time)}
                                </span>
                                <span className="text-xs font-black text-[#10221C] tracking-tight">
                                    {durationText}
                                </span>
                                <span className="text-sm font-bold text-[#10221C]">
                                    {timeFormatted(booking.end_time)}
                                </span>
                            </div>

                            {/* Timeline Line with Moving Sport Icon */}
                            <div className="flex items-center gap-1 my-1.5">
                                {/* Left Filled Start Dot */}
                                <div className="w-2.5 h-2.5 rounded-full bg-[#10221C] shrink-0" />
                                {/* Solid Progress Line */}
                                <div className="flex-1 h-[2px] bg-[#10221C]" />
                                {/* Moving Icon Marker */}
                                <div className="px-2 py-0.5 rounded-full bg-[#10221C] text-[#D6FF3F] shrink-0 flex items-center justify-center shadow-xs">
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                </div>
                                {/* Dashed Incomplete Line */}
                                <div className="flex-1 border-t-2 border-dashed border-[#10221C]/60" />
                                {/* Right Stroked End Dot */}
                                <div className="w-2.5 h-2.5 rounded-full border-2 border-[#10221C] bg-white shrink-0" />
                            </div>

                            {/* Origin & Destination Station Details */}
                            <div className="flex items-start justify-between gap-3 mt-2">
                                <div className="max-w-[55%]">
                                    <h4 className="text-base sm:text-lg font-black text-[#10221C] tracking-tight leading-snug line-clamp-1" title={booking.facility?.name}>
                                        {booking.facility?.name ?? 'Venue'}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                        {[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Venue Address'}
                                    </p>
                                </div>
                                <div className="text-right max-w-[45%]">
                                    <h4 className="text-base sm:text-lg font-black text-[#10221C] tracking-tight leading-snug line-clamp-1" title={booking.court?.name}>
                                        {booking.court?.name ?? 'Court'}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                        {booking.court?.type || 'Sports Court'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Reference Code */}
                        <div className="mb-6">
                            <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                Booking Reference
                            </span>
                            <span className="block text-2xl sm:text-[28px] font-black text-[#10221C] tracking-wide font-mono mt-0.5">
                                {referenceCode}
                            </span>
                        </div>

                        {/* 3-Column Info Strip (Train Car | Train | Seat equivalent) */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                            <div>
                                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Date
                                </span>
                                <span className="block text-lg sm:text-xl font-black text-[#10221C] mt-0.5 leading-tight">
                                    {dateShort}
                                </span>
                                <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                                    {weekdayShort}
                                </span>
                            </div>

                            <div className="text-center">
                                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Rate Plan
                                </span>
                                <span className="block text-lg sm:text-xl font-black text-[#10221C] mt-0.5 leading-tight truncate">
                                    {booking.rate_plan_name || (booking.court?.pricing_mode === 'SPLIT' ? 'Split' : 'Standard')}
                                </span>
                                <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                                    {booking.court?.pricing_mode || 'Hourly'}
                                </span>
                            </div>

                            <div className="text-right">
                                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    Total
                                </span>
                                <span className="block text-lg sm:text-xl font-black text-[#10221C] mt-0.5 leading-tight">
                                    {pesos(total)}
                                </span>
                                <span className="block text-[10px] font-bold text-emerald-600 mt-0.5 capitalize">
                                    {booking.payment?.status || 'At Venue'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Perforated Tear Line with Left and Right Circular Punches */}
                    <div className="relative flex items-center justify-between my-1">
                        {/* Left Punch Notch */}
                        <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#101F1A] shadow-inner" />
                        
                        {/* Dashed Horizontal Perforation */}
                        <div className="w-full border-t-2 border-dashed border-gray-200 mx-5" />
                        
                        {/* Right Punch Notch */}
                        <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#101F1A] shadow-inner" />
                    </div>

                    {/* Lower Stub (Barcode & Entry Pass) */}
                    <div className="p-6 sm:p-8 pt-4 pb-7 bg-white flex flex-col items-center">
                        <TicketBarcode reference={referenceCode} />
                        <p className="mt-2 text-[10px] text-gray-400 font-semibold text-center uppercase tracking-wider">
                            Show this digital pass at the venue entrance
                        </p>
                    </div>
                </div>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog
                isOpen={isCancelOpen}
                onClose={() => setIsCancelOpen(false)}
                title="Cancel Reservation?"
                subtitle={`Booking #${booking.id} on ${dateFormatted}`}
                icon={XCircle}
                iconVariant="coral"
                confirmText={isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
                confirmVariant="coral"
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                size="md"
            >
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Are you sure you want to cancel this reservation for <strong>{booking.court?.name}</strong> at <strong>{booking.facility?.name}</strong>?</p>
                    <p className="text-xs text-gray-400">Your reserved time slot ({timeFormatted(booking.start_time)} – {timeFormatted(booking.end_time)}) will be released for other players.</p>
                </div>
            </Dialog>
        </>
    );
}

export function EmptyPlayerBookings({ message = 'You have no bookings yet.' }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-[#101F1A]/15 bg-white p-10 text-center shadow-xs"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#D6FF3F]/40 border border-[#D6FF3F] text-[#10221C] flex items-center justify-center mx-auto mb-3">
                <CalendarCheck size={28} className="text-[#10221C]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-base font-bold text-[#10221C]">{message}</p>
            <p className="mt-1 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                Ready for a match? Find a court in your area and reserve your spot in just a few clicks.
            </p>
            <Link 
                href="/" 
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-[#D6FF3F] hover:bg-[#18342b] transition shadow-md shadow-[#101F1A]/10 active:scale-[0.98]"
            >
                Find & Book Courts
            </Link>
        </motion.div>
    );
}
