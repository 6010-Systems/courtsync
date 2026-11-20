import React, { useState, useEffect } from 'react';
import { ArrowRight, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusPill from '@/Components/Player/StatusPill';
import { getCourtImage } from '@/Utils/courtImages';
import Dialog from '@/Components/Dialog';

export default function NextGameCard({ 
    booking, 
    onOpenTicket = () => {},
    onCancel = () => {},
}) {
    const [copied, setCopied] = useState(false);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    if (!booking) return null;

    const rawDate = booking.date ? String(booking.date).split('T')[0].split(' ')[0] : '';
    const rawTime = booking.start_time ? String(booking.start_time).trim() : '08:00:00';
    const bookingDate = (() => {
        try {
            const d = new Date(`${rawDate}T${rawTime.length === 5 ? rawTime + ':00' : rawTime}`);
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
            return rawDate || 'Scheduled Match';
        }
    })();

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

    // Live countdown updating every minute
    useEffect(() => {
        const calculateCountdown = () => {
            const diff = bookingDate - new Date();
            if (diff <= 0) {
                setTimeLeft('Match active / concluded');
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`Starts in ${days}d ${hours}h`);
            } else if (hours > 0) {
                setTimeLeft(`Starts in ${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`Starts in ${minutes}m`);
            }
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 60000);
        return () => clearInterval(interval);
    }, [booking.date, booking.start_time]);

    // Handle .ics Calendar Download Client-Side
    const handleDownloadIcs = () => {
        const title = `CourtSync Match: ${booking.court?.name || 'Court'} at ${booking.facility?.name || 'Sports Venue'}`;
        const description = `Court reservation for ${booking.court?.type || 'Sport'} on ${booking.court?.name || 'Court'}. Total: PHP ${booking.total_price}. Digital ticket reference available in CourtSync.`;
        const location = `${booking.facility?.name || 'Venue'}, ${booking.facility?.city || 'Cebu'}, Philippines`;

        const cleanDate = (dStr, tStr) => {
            try {
                const cD = dStr ? String(dStr).split('T')[0].split(' ')[0] : '';
                const cT = tStr ? String(tStr).trim() : '08:00:00';
                const d = new Date(`${cD}T${cT.length === 5 ? cT + ':00' : cT}`);
                if (!isNaN(d.getTime())) {
                    return d.toISOString().replace(/-|:|\.\d+/g, '');
                }
            } catch {}
            return new Date().toISOString().replace(/-|:|\.\d+/g, '');
        };

        const dtStart = cleanDate(booking.date, booking.start_time);
        const dtEnd = cleanDate(booking.date, booking.end_time || '09:30:00');

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CourtSync//PH Athletic Calendar//EN',
            'CALSCALE:GREGORIAN',
            'BEGIN:VEVENT',
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `STATUS:CONFIRMED`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `courtsync-match-${booking.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Share Match handler
    const handleShare = () => {
        const shareUrl = window.location.origin;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(`Join my match on ${dateFormatted} at ${booking.facility?.name}! Details: ${shareUrl}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    // Open directions in Google Maps
    const handleDirections = () => {
        const query = encodeURIComponent(`${booking.facility?.name} ${booking.facility?.city || ''} Cebu Philippines`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const imageUrl = getCourtImage(booking.court, booking.facility, booking.id);

    return (
        <>
            <motion.div 
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl bg-white border border-[#10221C]/6 overflow-hidden shadow-2xs hover:border-[#10221C]/20 transition-all duration-300 flex flex-col md:flex-row"
            >
                {/* Left Visual Column (Court Image & Sport Badge) */}
                <div className="relative md:w-5/12 h-52 sm:h-60 md:h-auto min-h-[200px] bg-[#101F1A] overflow-hidden shrink-0">
                    <img 
                        src={imageUrl} 
                        alt={booking.court?.name || 'Court'} 
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/85 via-black/45 to-transparent" />

                    {/* Court Boundary Lines Pattern Overlay on Image */}
                    <div className="pointer-events-none absolute inset-0 opacity-15">
                        <svg viewBox="0 0 200 200" fill="none" stroke="#D6FF3F" strokeWidth="1.5" className="w-full h-full">
                            <rect x="20" y="20" width="160" height="160" />
                            <line x1="20" y1="100" x2="180" y2="100" />
                            <line x1="100" y1="20" x2="100" y2="180" strokeDasharray="4 4" />
                            <circle cx="100" cy="100" r="30" />
                        </svg>
                    </div>

                    {/* Top Left Live Countdown Chip with Pulsing Dot */}
                    <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF3F] text-[#10221C] text-[11px] sm:text-xs font-black tracking-tight shadow-md border border-[#10221C]/20">
                            <span className="w-2 h-2 rounded-full bg-[#10221C] animate-pulse shrink-0" />
                            <span>{timeLeft}</span>
                        </span>
                    </div>

                    {/* Bottom Left Sport & Court Tag */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-white/10">
                            {booking.court?.type || 'Sport'}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug drop-shadow-sm truncate">
                            {booking.court?.name || 'Court'}
                        </h4>
                        <p className="text-xs text-gray-200 mt-0.5 truncate">
                            {booking.facility?.name || 'Venue'}
                        </p>
                    </div>
                </div>

                {/* Right Details Column with Court Linework Watermark */}
                <div className="relative p-4 sm:p-6 md:w-7/12 flex flex-col justify-between space-y-4 overflow-hidden">
                    {/* Background Subtle Watermark Graphic */}
                    <div className="pointer-events-none absolute -right-8 -bottom-8 w-44 h-44 opacity-[0.035] text-[#10221C]">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                            <circle cx="50" cy="50" r="45" strokeDasharray="3 3" />
                            <circle cx="50" cy="50" r="28" />
                            <line x1="50" y1="0" x2="50" y2="100" />
                            <line x1="0" y1="50" x2="100" y2="50" />
                        </svg>
                    </div>

                    {/* Status & Date Header */}
                    <div className="relative z-10">
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#10221C]/60 uppercase tracking-wider">
                                <ArrowRight size={13} className="text-[#10221C]/70 shrink-0" />
                                <span>Next Match</span>
                            </div>
                            <StatusPill status={booking.status || 'CONFIRMED'} />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-[#10221C] tracking-tight leading-tight">
                            {dateFormatted}
                        </h3>

                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#10221C] mt-1 flex-wrap">
                            <span>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                            <span className="text-[11px] text-[#10221C]/50 font-semibold bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#10221C]/5">
                                1h 30m
                            </span>
                        </div>

                        <div className="text-xs text-[#10221C]/60 font-medium mt-1 truncate">
                            <span className="truncate">{booking.facility?.address || 'Gov. M. Cuenco Ave'}, {booking.facility?.city || 'Cebu City'}</span>
                        </div>
                    </div>

                    {/* Quick Summary Pill Strip */}
                    <div className="relative z-10 grid grid-cols-2 gap-2 bg-[#FAF9F5] border border-[#10221C]/6 rounded-xl p-2.5 sm:p-3 text-xs">
                        <div>
                            <span className="block text-[9px] sm:text-[10px] font-bold text-[#10221C]/50 uppercase tracking-wider">
                                Rate Plan
                            </span>
                            <span className="font-bold text-[#10221C] truncate block text-xs mt-0.5">
                                {booking.rate_plan_name || 'Standard Hourly'}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] sm:text-[10px] font-bold text-[#10221C]/50 uppercase tracking-wider">
                                Total Amount
                            </span>
                            <span className="font-black text-[#10221C] text-sm sm:text-base mt-0.5 block">
                                ₱{Number(booking.total_price || 350).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons Row — Enhanced Mobile Layout */}
                    <div className="relative z-10 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                        {/* Primary Digital Pass Button */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={() => onOpenTicket(booking)}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#101F1A] hover:bg-[#18342b] text-[#D6FF3F] text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
                        >
                            <span>View Digital Pass</span>
                        </motion.button>

                        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                            {/* Directions */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={handleDirections}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#10221C] text-xs font-bold transition cursor-pointer"
                                title="Get directions on Google Maps"
                            >
                                <span className="inline">Map</span>
                            </motion.button>

                            {/* Add to Calendar */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={handleDownloadIcs}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#10221C] text-xs font-bold transition cursor-pointer"
                                title="Download .ics file for Calendar"
                            >
                                <span className="inline">Add .ics</span>
                            </motion.button>

                            {/* Share Match */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={handleShare}
                                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#10221C] text-xs font-bold transition cursor-pointer"
                                title="Share match link"
                            >
                                <span className="inline">{copied ? 'Copied' : 'Share'}</span>
                            </motion.button>

                            {/* Cancel Reservation */}
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                type="button"
                                onClick={() => setIsCancelConfirmOpen(true)}
                                className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-[#FF5A36] hover:bg-rose-50 border border-transparent hover:border-[#FF5A36]/30 text-xs font-bold transition cursor-pointer"
                                title="Cancel this reservation"
                            >
                                <span>Cancel</span>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Cancel Confirmation Dialog */}
            <Dialog
                isOpen={isCancelConfirmOpen}
                onClose={() => setIsCancelConfirmOpen(false)}
                title="Cancel Upcoming Reservation?"
                subtitle={`Match on ${dateFormatted} at ${booking.facility?.name}`}
                icon={XCircle}
                iconVariant="coral"
                confirmText="Yes, Cancel Match"
                confirmVariant="coral"
                onConfirm={() => {
                    setIsCancelConfirmOpen(false);
                    onCancel(booking.id);
                }}
                size="md"
            >
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Are you sure you want to cancel your reservation for <strong>{booking.court?.name}</strong>?</p>
                    <p className="text-xs text-gray-400">
                        This slot will be released back to the facility pool for other players. Cancellation policies may apply.
                    </p>
                </div>
            </Dialog>
        </>
    );
}
