import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Ticket } from 'lucide-react';
import StatusPill from '@/Components/Player/StatusPill';

export default function RecentActivityList({ 
    bookings = [], 
    onOpenTicket = () => {},
}) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[#101F1A]/20 bg-white p-8 text-center">
                <p className="font-bold text-[#101F1A]">No recent match activity</p>
                <p className="mt-1 text-xs text-[#101F1A]/60">Book a court to start building your verified match history!</p>
            </div>
        );
    }

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        const str = String(timeStr).trim();
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

    return (
        <div className="relative rounded-2xl bg-white border border-[#101F1A]/10 p-5 shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-base sm:text-lg font-black text-[#101F1A] tracking-tight">
                        Recent Activity
                    </h3>
                    <p className="text-xs text-[#101F1A]/60 font-medium">
                        Your latest verified court sessions and reservation records
                    </p>
                </div>

                <Link
                    href={route('player.bookings', { filter: 'all' })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#101F1A] hover:text-green-700 transition-colors underline underline-offset-4 shrink-0"
                >
                    <span>View All</span>
                    <ArrowRight size={13} />
                </Link>
            </div>

            {/* Compact Rows */}
            <div className="divide-y divide-gray-100">
                {bookings.map((booking) => {
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
                    const dateFormatted = (() => {
                        try {
                            return bookingDate.toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric',
                            });
                        } catch {
                            return rawDate || 'Date';
                        }
                    })();
                    const sportType = booking.court?.type || 'Sport';

                    return (
                        <div 
                            key={booking.id}
                            className="py-3 flex items-center justify-between gap-3 px-2 rounded-xl transition-colors hover:bg-[#FAF8F5]"
                        >
                            {/* Left: Court & Venue Details */}
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F5F2EA] border border-[#101F1A]/8 text-[#101F1A]">
                                        {sportType}
                                    </span>
                                    <p className="font-black text-xs sm:text-sm text-[#101F1A] truncate">
                                        {booking.court?.name || 'Court'}
                                    </p>
                                    <span className="text-[10px] font-bold text-[#101F1A]/40 hidden sm:inline">•</span>
                                    <span className="text-xs font-medium text-[#101F1A]/70 truncate hidden sm:inline">
                                        {booking.facility?.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#101F1A]/60 mt-1 flex-wrap">
                                    <span className="font-bold text-[#101F1A]/80">{dateFormatted}</span>
                                    <span>•</span>
                                    <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                                    <span className="hidden md:inline">•</span>
                                    <span className="hidden md:inline">{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ')}</span>
                                </div>
                            </div>

                            {/* Right: Status Pill and Digital Pass Action */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="hidden xs:block">
                                    <StatusPill status={booking.status} />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onOpenTicket(booking)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#101F1A]/10 bg-white hover:bg-[#D6FF3F] hover:border-[#101F1A]/30 text-xs font-bold text-[#101F1A] transition cursor-pointer shadow-xs active:scale-95"
                                    title="View Digital Boarding Pass"
                                    aria-label="View Boarding Pass Ticket"
                                >
                                    <Ticket size={12} />
                                    <span className="hidden sm:inline">Ticket</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
