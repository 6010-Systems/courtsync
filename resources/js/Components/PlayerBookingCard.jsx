import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { 
    CalendarCheck, 
    Clock, 
    MapPin, 
    Ticket, 
    Building2, 
    RotateCcw 
} from 'lucide-react';
import BookingPassDialog from '@/Components/Player/BookingPassDialog';
import StatusPill from '@/Components/Player/StatusPill';

export { default as BookingPassDialog } from '@/Components/Player/BookingPassDialog';

export default function PlayerBookingCard({ booking }) {
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    const bookingDate = new Date(`${booking.date}T12:00:00`);
    const dateFormatted = bookingDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    const weekday = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });

    const formatTime = (value) => {
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

    const pesos = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
    const total = Number(booking.total_price);
    const bookingFee = Number(booking.booking_fee ?? 0);
    const addonsTotal = Number(booking.addons_total ?? 0);
    const subtotal = booking.subtotal != null ? Number(booking.subtotal) : total - bookingFee - addonsTotal;
    const sportType = booking.court?.type || 'Court';

    return (
        <>
            <article className="group rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-subtle hover:shadow-card hover:border-[#101F1A]/20 transition-all duration-200 flex flex-col justify-between">
                <div>
                    {/* Header: Sport, Rate Plan, & Status */}
                    <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-[#101F1A]/6">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#101F1A]/5 text-[#101F1A] text-[10px] font-black uppercase tracking-wider shrink-0">
                                {sportType}
                            </span>
                            {booking.rate_plan_name && (
                                <span className="inline-flex items-center rounded bg-[#F5F2EA] px-1.5 py-0.5 text-[9px] font-bold text-[#101F1A]/70 truncate max-w-[85px]" title={booking.rate_plan_name}>
                                    {booking.rate_plan_name}
                                </span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-[#101F1A]/35 shrink-0">
                                #{booking.id}
                            </span>
                        </div>
                        <StatusPill status={booking.status} className="shrink-0 text-[10px] px-2 py-0.5" />
                    </div>

                    {/* Venue & Court Headline */}
                    <div className="mt-2.5">
                        <h3 className="text-base font-black text-[#101F1A] tracking-tight leading-snug group-hover:text-green-800 transition-colors truncate" title={booking.court?.name}>
                            {booking.court?.name ?? 'Court unavailable'}
                        </h3>
                        <p className="flex items-center gap-1 text-xs font-bold text-[#101F1A]/70 mt-1 truncate" title={booking.facility?.name}>
                            <Building2 size={12} className="text-[#101F1A]/40 shrink-0" aria-hidden="true" />
                            <span className="truncate">{booking.facility?.name ?? 'Facility unavailable'}</span>
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[#101F1A]/50 mt-0.5 truncate">
                            <MapPin size={11} className="text-[#101F1A]/40 shrink-0" aria-hidden="true" />
                            <span className="truncate">{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Location unavailable'}</span>
                        </p>
                    </div>

                    {/* Compact Schedule Block */}
                    <div className="my-2.5 rounded-lg bg-[#FAF8F5] border border-[#101F1A]/6 p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-1">
                            <span className="flex items-center gap-1.5 font-bold text-[#101F1A] text-[11px] truncate">
                                <CalendarCheck size={13} className="text-[#101F1A]/60 shrink-0" aria-hidden="true" />
                                <span className="truncate">{dateFormatted}</span>
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#101F1A]/50 bg-white px-1.5 py-0.5 rounded border border-[#101F1A]/8 shrink-0">
                                {weekday}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1.5 pt-1.5 border-t border-[#101F1A]/6">
                            <span className="flex items-center gap-1.5 font-semibold text-[#101F1A]/80 text-[11px] truncate">
                                <Clock size={13} className="text-[#101F1A]/60 shrink-0" aria-hidden="true" />
                                <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                            </span>
                            <span className="text-[9px] font-black text-[#101F1A] bg-[#D6FF3F] px-1.5 py-0.5 rounded-full border border-[#101F1A]/10 shrink-0">
                                {durationText}
                            </span>
                        </div>
                    </div>

                    {/* Financial Row */}
                    <div className="rounded-lg border border-dashed border-[#101F1A]/10 p-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                            <span className="block text-[8px] font-bold uppercase tracking-wider text-[#101F1A]/50">Total</span>
                            <span className="font-black text-[#101F1A] text-xs sm:text-sm leading-tight block truncate">{pesos(total)}</span>
                            {(bookingFee > 0 || addonsTotal > 0) && (
                                <span className="block text-[9px] text-[#101F1A]/55 truncate">
                                    {pesos(subtotal)} rate
                                    {bookingFee > 0 && ` + ${pesos(bookingFee)} fee`}
                                </span>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <span className="block text-[8px] font-bold uppercase tracking-wider text-[#101F1A]/50">Payment</span>
                            <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded capitalize border border-emerald-200/60">
                                {booking.payment?.status ?? 'Not submitted'}
                            </span>
                            {booking.payment?.payment_method && (
                                <span className="block text-[9px] text-[#101F1A]/50 mt-0.5">
                                    {booking.payment.payment_method.replaceAll('_', ' ')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-[#101F1A]/8 flex items-center justify-between gap-1.5">
                    <button
                        type="button"
                        onClick={() => setIsTicketOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#101F1A]/15 bg-[#F5F2EA] hover:bg-[#D6FF3F] hover:border-[#101F1A]/30 px-2.5 py-1.5 sm:px-2 sm:py-1 text-[11px] font-bold text-[#101F1A] transition-colors cursor-pointer shadow-2xs active:scale-95 shrink-0"
                        title="View Digital Boarding Pass"
                    >
                        <Ticket size={12} aria-hidden="true" />
                        <span>Pass</span>
                    </button>

                    {booking.facility?.slug && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Link 
                                href={route('facility.show', booking.facility.slug)} 
                                className="text-[11px] font-bold text-[#101F1A]/60 hover:text-[#101F1A] hover:underline underline-offset-2 px-1.5 py-1.5 sm:px-1 sm:py-1 transition-colors"
                            >
                                Facility
                            </Link>
                            <Link 
                                href={route('facility.book', { facility: booking.facility.slug, court: booking.court_id, from: 'bookings' })} 
                                className="inline-flex items-center gap-1 rounded-lg bg-[#101F1A] hover:bg-[#1a382d] text-white px-2.5 py-1.5 sm:px-2 sm:py-1 text-[11px] font-bold transition-all shadow-2xs active:scale-95"
                            >
                                <RotateCcw size={11} className="text-[#D6FF3F]" aria-hidden="true" />
                                <span>Rebook</span>
                            </Link>
                        </div>
                    )}
                </div>
            </article>

            {/* Standalone Digital Boarding Pass Ticket Dialog */}
            <BookingPassDialog
                booking={booking}
                isOpen={isTicketOpen}
                onClose={() => setIsTicketOpen(false)}
            />
        </>
    );
}

export function EmptyPlayerBookings({ message = 'You have no bookings yet.' }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-8 sm:p-12 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/25 text-[#101F1A]">
                <CalendarCheck size={28} aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-base font-black text-[#101F1A]">{message}</h3>
            <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                Explore premier sports facilities, pick your preferred court, and reserve your game in minutes.
            </p>
            <Link 
                href="/" 
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#101F1A] hover:bg-[#c4ec36] transition-all shadow-xs active:scale-95"
            >
                <span>Explore Facilities</span>
            </Link>
        </div>
    );
}
