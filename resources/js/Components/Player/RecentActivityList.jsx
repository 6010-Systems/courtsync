import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusPill from '@/Components/Player/StatusPill';

export default function RecentActivityList({ 
    bookings = [], 
    onOpenTicket = () => {},
}) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="rounded-2xl bg-white border border-[#10221C]/6 p-8 text-center shadow-2xs">
                <p className="text-sm font-bold text-[#10221C]">No recent match activity</p>
                <p className="text-xs text-[#10221C]/50 mt-1">Book a court to start building your verified match record!</p>
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
        <div className="group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 shadow-2xs overflow-hidden">
            {/* Background Athletic Geometry Watermark */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 w-36 h-36 opacity-[0.035] text-[#10221C]">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                    <rect x="15" y="15" width="70" height="70" rx="6" />
                    <line x1="15" y1="50" x2="85" y2="50" />
                    <line x1="50" y1="15" x2="50" y2="85" strokeDasharray="3 3" />
                </svg>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-3.5">
                <div>
                    <h3 className="text-base sm:text-lg font-black text-[#10221C] tracking-tight">
                        Recent Match Activity
                    </h3>
                    <p className="text-xs text-[#10221C]/50 font-medium">
                        Your latest verified court sessions and schedule records
                    </p>
                </div>

                <Link
                    href={route('player.bookings', { filter: 'all' })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#10221C] hover:text-[#FF5A36] transition-colors underline underline-offset-4 shrink-0"
                >
                    <span>View All</span>
                    <ArrowRight size={13} />
                </Link>
            </div>

            {/* Compact Rows (~64px height per row, fully responsive on mobile) */}
            <div className="relative z-10 divide-y divide-gray-100">
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
                                month: 'short', day: 'numeric',
                            });
                        } catch {
                            return rawDate || 'Date';
                        }
                    })();
                    const sportType = booking.court?.type || 'Pickleball';

                    return (
                        <motion.div 
                            key={booking.id}
                            whileHover={{ x: 2, backgroundColor: 'rgba(250, 249, 245, 0.9)' }}
                            transition={{ duration: 0.15 }}
                            className="py-3 flex items-center justify-between gap-2.5 sm:gap-3 px-2 rounded-xl transition-colors"
                        >
                            {/* Left: Court & Venue Details */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF9F5] border border-[#10221C]/8 text-[#10221C]">
                                        {sportType}
                                    </span>
                                    <p className="font-display font-black text-xs sm:text-sm text-[#10221C] truncate">
                                        {booking.court?.name || 'Court'}
                                    </p>
                                    <span className="text-[10px] font-bold text-[#10221C]/40 hidden sm:inline">•</span>
                                    <span className="text-[11px] font-bold text-[#10221C]/60 truncate hidden sm:inline">
                                        {booking.facility?.name}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-[#10221C]/50 mt-0.5 flex-wrap">
                                    <span className="font-bold text-[#10221C]/75">{dateFormatted}</span>
                                    <span>•</span>
                                    <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                                </div>
                            </div>

                            {/* Right: Status Pill and Digital Pass Action */}
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="hidden xs:block">
                                    <StatusPill status={booking.status} />
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    type="button"
                                    onClick={() => onOpenTicket(booking)}
                                    className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-[#10221C]/6 bg-white hover:bg-[#FAF9F5] text-xs font-bold text-[#10221C] transition cursor-pointer shadow-2xs"
                                    title="View Ticket / Boarding Pass"
                                    aria-label="View Boarding Pass Ticket"
                                >
                                    <span>Ticket</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
