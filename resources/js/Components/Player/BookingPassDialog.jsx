import React, { Fragment, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import {
    Dialog as HeadlessDialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { Clock, MapPin, Printer, X } from 'lucide-react';
import BasketballIcon from '@/Components/Icons/BasketballIcon';
import PickleballIcon from '@/Components/Icons/PickleballIcon';

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
    completed: {
        label: 'Completed',
        badge: 'bg-teal-50 text-teal-900 border-teal-200/80',
        dot: 'bg-teal-500',
    },
};

/**
 * Dynamic sport-specific timeline marker for boarding pass ticket
 */
export function SportTimelineMarker({ sportType = '', size = 28, className = '' }) {
    const norm = (sportType || '').toLowerCase().trim();

    if (norm.includes('basketball')) {
        return (
            <BasketballIcon 
                size={size} 
                className={className} 
                stroke="#10221C" 
                strokeWidth={2} 
            />
        );
    }

    if (norm.includes('badminton')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Badminton Shuttlecock"
            >
                <path d="M 9 9 L 23 9 L 19 23 L 13 23 Z" fill="#F8FAFC" stroke="#10221C" strokeWidth="1.8" strokeLinejoin="round" />
                <line x1="13" y1="9" x2="15" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="16" y1="9" x2="16" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="19" y1="9" x2="17" y2="23" stroke="#CBD5E1" strokeWidth="1.3" />
                <line x1="10.5" y1="15" x2="21.5" y2="15" stroke="#10221C" strokeWidth="1.5" />
                <path d="M 13 23 C 13 27 19 27 19 23 Z" fill="#E2E8F0" stroke="#10221C" strokeWidth="1.8" />
            </svg>
        );
    }

    if (norm.includes('tennis') || norm.includes('padel')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Tennis Ball"
            >
                <circle cx="16" cy="16" r="14" fill="#D6FF3F" stroke="#10221C" strokeWidth="2" />
                <path d="M 6.1 6.1 C 13 11 13 21 6.1 25.9" fill="none" stroke="#10221C" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M 6.1 6.1 C 13 11 13 21 6.1 25.9" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M 25.9 6.1 C 19 11 19 21 25.9 25.9" fill="none" stroke="#10221C" strokeWidth="2.6" strokeLinecap="round" />
                <path d="M 25.9 6.1 C 19 11 19 21 25.9 25.9" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        );
    }

    if (norm.includes('volleyball')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Volleyball"
            >
                <circle cx="16" cy="16" r="14" fill="#F8FAFC" stroke="#10221C" strokeWidth="2" />
                <path d="M 16 2 C 16 16 2 16 2 16" fill="none" stroke="#10221C" strokeWidth="1.6" />
                <path d="M 16 30 C 16 16 30 16 30 16" fill="none" stroke="#10221C" strokeWidth="1.6" />
                <path d="M 2 16 C 16 16 26 26 26 26" fill="none" stroke="#10221C" strokeWidth="1.6" />
            </svg>
        );
    }

    if (norm.includes('futsal') || norm.includes('soccer')) {
        return (
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                className={className} 
                aria-label="Futsal Ball"
            >
                <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke="#10221C" strokeWidth="2" />
                <polygon points="16,8 22,13 20,20 12,20 10,13" fill="#10221C" />
                <line x1="16" y1="8" x2="16" y2="2" stroke="#10221C" strokeWidth="1.6" />
                <line x1="22" y1="13" x2="28" y2="10" stroke="#10221C" strokeWidth="1.6" />
                <line x1="20" y1="20" x2="25" y2="26" stroke="#10221C" strokeWidth="1.6" />
                <line x1="12" y1="20" x2="7" y2="26" stroke="#10221C" strokeWidth="1.6" />
                <line x1="10" y1="13" x2="4" y2="10" stroke="#10221C" strokeWidth="1.6" />
            </svg>
        );
    }

    return (
        <PickleballIcon 
            size={size} 
            className={className} 
            stroke="#10221C" 
            strokeWidth={18} 
            withHoleBorders={true} 
        />
    );
}

/**
 * Authentic 2D Barcode matching physical boarding passes and transit cards
 */
export function TicketBarcode({ reference = 'CS-2026-000001' }) {
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

export default function BookingPassDialog({ booking, isOpen, onClose }) {
    const { auth } = usePage().props;

    if (!booking) return null;

    const rawDate = booking.date ? String(booking.date).split('T')[0].split(' ')[0] : '';
    const bookingDate = (() => {
        try {
            const d = new Date(`${rawDate}T12:00:00`);
            if (!isNaN(d.getTime())) return d;
            const fallback = new Date(booking.date);
            return !isNaN(fallback.getTime()) ? fallback : new Date();
        } catch {
            return new Date();
        }
    })();
    const dateShort = (() => {
        try {
            return bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return rawDate || 'Date';
        }
    })();
    const weekdayShort = (() => {
        try {
            return bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
        } catch {
            return '';
        }
    })();
    
    const timeFormatted = (value) => {
        if (!value) return '';
        const str = String(value).trim();
        if (str.includes('AM') || str.includes('PM') || str.includes('am') || str.includes('pm')) {
            return str;
        }
        try {
            const timePart = str.length === 5 ? `${str}:00` : str;
            const d = new Date(`2000-01-01T${timePart}`);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            }
        } catch {}
        return str;
    };

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

    const pesos = (amount) => `₱${Number(amount || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;

    const total = Number(booking.total_price);
    const statusCfg = statusConfig[booking.status] || {
        label: booking.status,
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-400',
    };

    const playerName = booking.user?.name || auth?.user?.name || 'Player';
    const referenceCode = booking.reference_number || `CS-${bookingDate.getFullYear()}-${String(booking.id).padStart(6, '0')}`;

    return (
        <>
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
                        width: 340px !important;
                        box-shadow: none !important;
                        border: 1px solid #e5e7eb !important;
                        margin: 0 !important;
                    }
                }
            `}</style>

            <Transition show={isOpen} as={Fragment}>
                <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
                    {/* Dark Modal Backdrop */}
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-150"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[#101F1A]/60 backdrop-blur-xs transition-opacity" />
                    </TransitionChild>

                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-150"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-100"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-[340px] sm:max-w-[350px] transform text-left transition-all">
                                    {/* Pure Physical Ticket Card (Zero background container) */}
                                    <div 
                                        id="booking-ticket-card"
                                        className="relative w-full select-none text-[#10221C] drop-shadow-2xl"
                                    >
                                        {/* Upper Ticket Section */}
                                        <div className="bg-white rounded-t-3xl p-5 sm:p-6 pb-2">
                                            {/* Passenger / Player Row */}
                                            <div className="flex items-start justify-between gap-3 mb-5">
                                                <div className="min-w-0 flex-1">
                                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Player Pass
                                                    </span>
                                                    <h3 
                                                        className="text-lg sm:text-xl font-black text-[#10221C] tracking-tight leading-tight mt-0.5 truncate whitespace-nowrap" 
                                                        title={playerName}
                                                    >
                                                        {playerName}
                                                    </h3>
                                                </div>

                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${statusCfg.badge}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                                    {statusCfg.label}
                                                </span>
                                            </div>

                                            {/* Times & Route Timeline Graphic */}
                                            <div className="mb-5">
                                                {/* Time row with duration in center */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-base sm:text-lg font-black text-[#10221C] tracking-tight">
                                                        {timeFormatted(booking.start_time)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D6FF3F] text-[#101F1A] text-xs font-black tracking-tight shadow-xs border border-[#101F1A]/10">
                                                        <Clock size={11} className="shrink-0 text-[#101F1A]" />
                                                        {durationText}
                                                    </span>
                                                    <span className="text-base sm:text-lg font-black text-[#10221C] tracking-tight">
                                                        {timeFormatted(booking.end_time)}
                                                    </span>
                                                </div>

                                                {/* Timeline Line with Moving Dynamic Sport Icon */}
                                                <div className="flex items-center gap-1 my-2">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-[#10221C] shrink-0" />
                                                    <div className="flex-1 h-[2.5px] bg-[#10221C]" />
                                                    <div className="shrink-0 flex items-center justify-center -rotate-12 transition-transform hover:rotate-0 hover:scale-110">
                                                        <SportTimelineMarker 
                                                            sportType={booking.court?.type} 
                                                            size={28} 
                                                            className="shrink-0 drop-shadow-[0_2px_4px_rgba(16,31,26,0.2)]" 
                                                        />
                                                    </div>
                                                    <div className="flex-1 border-t-2 border-dashed border-[#10221C]/60" />
                                                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[#10221C] bg-white shrink-0" />
                                                </div>

                                                {/* Origin & Destination Station Details */}
                                                <div className="grid grid-cols-2 gap-3 mt-3 pt-2.5 border-t border-gray-100">
                                                    <div>
                                                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Venue
                                                        </span>
                                                        <h4 className="text-sm font-black text-[#10221C] tracking-tight leading-snug line-clamp-2 mt-0.5" title={booking.facility?.name}>
                                                            {booking.facility?.name ?? 'Venue'}
                                                        </h4>
                                                        <p className="flex items-center gap-1 text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                            <MapPin size={10} className="shrink-0 text-gray-400" />
                                                            {[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Venue Address'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Court & Sport
                                                        </span>
                                                        <h4 className="text-sm font-black text-[#10221C] tracking-tight leading-snug truncate mt-0.5" title={booking.court?.name}>
                                                            {booking.court?.name ?? 'Court'}
                                                        </h4>
                                                        <div className="flex justify-end mt-1">
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#101F1A]/5 text-[#101F1A] text-[10px] font-extrabold uppercase tracking-wide">
                                                                {booking.court?.type || 'Sports Court'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Booking Reference Code */}
                                            <div className="mb-5">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Booking Reference
                                                    </span>
                                                    <span className="text-[11px] font-mono font-bold text-gray-500">
                                                        #{booking.id}
                                                    </span>
                                                </div>
                                                <div className="rounded-xl bg-[#FAF9F5] border border-[#10221C]/8 p-2.5 flex items-center justify-between">
                                                    <span className="font-mono text-xs sm:text-sm font-black text-[#10221C] tracking-wider">
                                                        {referenceCode}
                                                    </span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 bg-white px-2 py-0.5 rounded border border-[#101F1A]/10">
                                                        Pass
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Key Flight-Style Data Matrix Grid */}
                                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 pt-3 pb-2 text-left">
                                                <div className="pr-1.5 sm:pr-2">
                                                    <span className="block text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Date
                                                    </span>
                                                    <span className="block text-xs sm:text-sm md:text-base font-black text-[#10221C] mt-0.5 leading-tight truncate">
                                                        {dateShort}
                                                    </span>
                                                    <span className="block text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5">
                                                        {weekdayShort}
                                                    </span>
                                                </div>

                                                <div className="px-1.5 sm:px-2 text-center">
                                                    <span className="block text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Rate Plan
                                                    </span>
                                                    <span className="block text-xs sm:text-sm md:text-base font-black text-[#10221C] mt-0.5 leading-tight truncate" title={booking.rate_plan_name}>
                                                        {booking.rate_plan_name || 'Standard'}
                                                    </span>
                                                    <span className="block text-[9px] sm:text-[10px] text-gray-400 font-semibold mt-0.5">
                                                        Hourly
                                                    </span>
                                                </div>

                                                <div className="pl-1.5 sm:pl-2 text-right">
                                                    <span className="block text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                        Total
                                                    </span>
                                                    <span className="block text-xs sm:text-sm md:text-base font-black text-[#10221C] mt-0.5 leading-tight truncate">
                                                        {pesos(total)}
                                                    </span>
                                                    <span className="block text-[9px] sm:text-[10px] font-bold text-emerald-600 mt-0.5 capitalize truncate">
                                                        {booking.payment?.status || 'At Venue'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Perforated Notch Divider Band with Clean Transparent Grooves */}
                                        <div 
                                            className="relative h-6 w-full bg-white flex items-center justify-center pointer-events-none"
                                            style={{
                                                WebkitMaskImage: 'radial-gradient(circle 12px at 0 50%, transparent 12px, black 12.5px), radial-gradient(circle 12px at 100% 50%, transparent 12px, black 12.5px)',
                                                WebkitMaskPosition: 'left center, right center',
                                                WebkitMaskSize: '51% 100%, 51% 100%',
                                                WebkitMaskRepeat: 'no-repeat, no-repeat',
                                                maskImage: 'radial-gradient(circle 12px at 0 50%, transparent 12px, black 12.5px), radial-gradient(circle 12px at 100% 50%, transparent 12px, black 12.5px)',
                                                maskPosition: 'left center, right center',
                                                maskSize: '51% 100%, 51% 100%',
                                                maskRepeat: 'no-repeat, no-repeat',
                                            }}
                                        >
                                            <div className="w-full border-t-2 border-dashed border-gray-300 mx-5" />
                                        </div>

                                        {/* Lower Stub (Barcode & Entry Pass) */}
                                        <div className="bg-white rounded-b-3xl p-5 pt-2 pb-6 flex flex-col items-center">
                                            <TicketBarcode reference={referenceCode} />
                                            <p className="mt-2 text-[10px] text-gray-400 font-semibold text-center uppercase tracking-wider">
                                                Show this digital pass at the venue entrance
                                            </p>
                                        </div>
                                    </div>

                                    {/* Floating Ticket Action Controls (Print & Close) */}
                                    <div className="mt-4 flex items-center justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#10221C] text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 backdrop-blur-sm border border-white/40 cursor-pointer"
                                        >
                                            <Printer size={13} className="text-[#10221C]" />
                                            Print Pass
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-semibold shadow-md transition-all active:scale-95 backdrop-blur-sm border border-white/10 cursor-pointer"
                                        >
                                            <X size={13} />
                                            Close
                                        </button>
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </HeadlessDialog>
            </Transition>
        </>
    );
}
