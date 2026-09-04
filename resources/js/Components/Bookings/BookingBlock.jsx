import React from 'react';
import { STATUS_CONFIG, SPORTS_CONFIG, BOOKING_STATUS, formatTimeRange12 } from './types';
import SportIcon from './SportIcon';
import PaymentIcon from './PaymentIcon';
import { Clock, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';

export default function BookingBlock({
    booking,
    top,
    height,
    onClick,
    isAnimating = false,
    isHighlighted = false,
    isDimmed = false,
    stackedCount = 0,
    onStackClick,
}) {
    if (!booking) return null;

    const isMaintenance = booking.status === BOOKING_STATUS.MAINTENANCE;
    const statusMeta = STATUS_CONFIG[booking.status] || STATUS_CONFIG[BOOKING_STATUS.CONFIRMED];
    const sportMeta = SPORTS_CONFIG[booking.sport] || { name: 'Badminton', color: '#D6FF3F' };

    // Format hold countdown if applicable
    const formatHoldCountdown = (seconds) => {
        if (!seconds || seconds <= 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formattedTime = formatTimeRange12(booking.startTime, booking.endTime);
    const isCompact = height < 64;

    // Maintenance / Blocked rendering
    if (isMaintenance) {
        return (
            <div
                style={{ top: `${top}px`, height: `${height}px` }}
                className="absolute inset-x-1.5 z-10 flex flex-col justify-between rounded-xl border border-amber-300/80 diagonal-hatch bg-amber-50/95 p-2.5 shadow-2xs transition-all overflow-hidden select-none pointer-events-auto"
                title={`${booking.customerName} (${formattedTime})`}
            >
                <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-900">
                            <Wrench size={11} strokeWidth={2.4} />
                        </div>
                        <span className="truncate text-xs font-bold tracking-tight text-amber-950">
                            {booking.customerName}
                        </span>
                    </div>
                    <span className="shrink-0 rounded-md bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-amber-950">
                        Maintenance
                    </span>
                </div>

                {!isCompact && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-900 mt-auto">
                        <Clock size={11} className="shrink-0 text-amber-700" />
                        <span>{formattedTime}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            style={{ top: `${top}px`, height: `${height}px` }}
            onClick={onClick}
            tabIndex={0}
            role="button"
            aria-label={`${booking.customerName}, ${booking.sport} from ${formattedTime}, status: ${statusMeta.label}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={[
                'absolute inset-x-1.5 z-10 flex flex-col justify-between rounded-xl border p-2.5 transition-all duration-200 cursor-pointer overflow-hidden text-left focus:outline-none focus-ring-volt hover-lift group',
                statusMeta.bg,
                statusMeta.border,
                statusMeta.shadow || 'shadow-subtle',
                isAnimating ? 'ring-2 ring-[#D6FF3F] animate-pulse-volt shadow-volt-glow' : '',
                isHighlighted
                    ? '!z-30 ring-2 ring-[#101F1A] !border-[#101F1A] !opacity-100 shadow-md scale-[1.01]'
                    : isDimmed
                    ? 'opacity-35 grayscale-[0.25]'
                    : 'opacity-100',
            ].join(' ')}
        >
            {/* ── 1. Top Header: Avatar + Customer Name + Status Pill Badge ─────── */}
            <div className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-[9px] font-extrabold text-[#D6FF3F] shadow-2xs">
                        {booking.initials || 'CS'}
                    </div>
                    <span className={`truncate text-xs font-bold tracking-tight ${statusMeta.text}`}>
                        {booking.customerName}
                    </span>
                </div>

                {/* Status Pill Badge (Replaces one-sided border) */}
                <div className="shrink-0 flex items-center gap-1">
                    {booking.status === BOOKING_STATUS.AWAITING_PAYMENT && typeof booking.holdRemainingSeconds === 'number' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FF5A36] px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-xs animate-pulse">
                            <Clock size={9} />
                            <span>{formatHoldCountdown(booking.holdRemainingSeconds)}</span>
                        </span>
                    ) : (
                        <span className={[
                            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow-2xs',
                            statusMeta.pillBg,
                            statusMeta.pillText,
                        ].join(' ')}>
                            {statusMeta.isLive && (
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10B981] opacity-75" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                                </span>
                            )}
                            <span>{statusMeta.label}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* ── 2. Middle: Schedule Capsule (Time + Duration) ────────────────── */}
            <div className="my-auto flex items-center justify-between gap-1.5 text-[11px] pt-1">
                <div className="flex items-center gap-1 min-w-0">
                    <Clock size={11} className="text-[#101F1A]/40 shrink-0" />
                    <span className={`font-semibold truncate ${statusMeta.subtext || 'text-[#101F1A]/70'}`}>
                        {formattedTime}
                    </span>
                    {booking.durationHours && !isCompact && (
                        <span className="text-[#101F1A]/35 text-[10px] hidden sm:inline">
                            ({booking.durationHours}h)
                        </span>
                    )}
                </div>

                {/* Amount preview on top right if space allows */}
                {booking.amount && !isCompact && (
                    <span className="text-[11px] font-extrabold text-[#101F1A] shrink-0 font-sans">
                        ₱{booking.amount.toLocaleString()}
                    </span>
                )}
            </div>

            {/* ── 3. Bottom Row: Sport Capsule + Payment Tag ───────────────────── */}
            {!isCompact && (
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#101F1A]/6 mt-auto">
                    {/* Sport Capsule */}
                    <div className="inline-flex items-center gap-1 rounded-md bg-[#101F1A]/5 px-1.5 py-0.5 text-[10px] font-bold text-[#101F1A]/80">
                        <SportIcon sport={booking.sport} size={10} className="text-[#101F1A]/70" />
                        <span className="truncate">{booking.sport}</span>
                    </div>

                    {/* Payment Method / Status Pill */}
                    {booking.paymentMethod && (
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#101F1A]/60">
                            <PaymentIcon method={booking.paymentMethod} size={10} className="text-[#101F1A]/50" />
                            <span>{booking.paymentMethod}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Stacking indicator if multiple overlapping bookings */}
            {stackedCount > 0 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onStackClick?.();
                    }}
                    className="absolute right-2 bottom-2 z-20 flex h-5 items-center rounded-md bg-[#101F1A] px-1.5 text-[10px] font-bold text-[#D6FF3F] shadow-sm hover:bg-[#162923] transition-colors cursor-pointer"
                >
                    +{stackedCount} more
                </button>
            )}
        </div>
    );
}
