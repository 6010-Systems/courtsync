import React, { useState, useEffect } from 'react';
import { 
    ArrowRight, 
    CalendarCheck, 
    Clock, 
    Compass, 
    MapPin, 
    Share2, 
    Ticket, 
    Check 
} from 'lucide-react';
import StatusPill from '@/Components/Player/StatusPill';
import { getCourtImage } from '@/Utils/courtImages';
import SportIcon from '@/Components/Icons/SportIcon';

export default function NextGameCard({ 
    booking, 
    onOpenTicket = () => {},
}) {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [imgError, setImgError] = useState(false);

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
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
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

    useEffect(() => {
        const calculateCountdown = () => {
            const diff = bookingDate - new Date();
            if (diff <= 0) {
                setTimeLeft('Match in progress / concluded');
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

    const handleDownloadIcs = () => {
        const title = `CourtSync Match: ${booking.court?.name || 'Court'} at ${booking.facility?.name || 'Sports Venue'}`;
        const description = `Court reservation for ${booking.court?.type || 'Sport'} on ${booking.court?.name || 'Court'}. Total: PHP ${booking.total_price}. Digital ticket reference available in CourtSync.`;
        const location = `${booking.facility?.name || 'Venue'}, ${[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Philippines'}`;

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

    const handleShare = () => {
        const shareText = `Join my court match on ${dateFormatted} (${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}) at ${booking.facility?.name ?? 'our venue'}!`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleDirections = () => {
        const query = encodeURIComponent(`${booking.facility?.name ?? ''} ${[booking.facility?.city, booking.facility?.province].filter(Boolean).join(' ') || ''} Philippines`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const imageUrl = getCourtImage(booking.court, booking.facility);
    const pesos = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

    return (
        <article className="group relative rounded-2xl bg-white border border-[#101F1A]/10 overflow-hidden shadow-card hover:border-[#101F1A]/20 transition-all duration-300 flex flex-col md:flex-row">
            {/* Visual Column */}
            <div className="relative md:w-5/12 h-48 sm:h-56 md:h-auto min-h-[200px] bg-[#101F1A] overflow-hidden shrink-0 flex items-center justify-center">
                {!imgError ? (
                    <img 
                        src={imageUrl} 
                        alt="" 
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#101F1A] relative min-h-[200px]">
                        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#D6FF3F_1px,transparent_1px)] [background-size:8px_8px]" />
                        <SportIcon sportType={booking.court?.type} size={48} className="relative z-10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Live Countdown Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6FF3F] text-[#101F1A] text-[11px] sm:text-xs font-black tracking-tight shadow-md border border-[#101F1A]/20">
                        <span className="w-2 h-2 rounded-full bg-[#101F1A] animate-pulse shrink-0" />
                        <span>{timeLeft}</span>
                    </span>
                </div>

                {/* Sport & Court Tag */}
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

            {/* Details Column */}
            <div className="relative p-5 sm:p-6 md:w-7/12 flex flex-col justify-between space-y-4 overflow-hidden">
                <div>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#101F1A]/60 uppercase tracking-wider">
                            <ArrowRight size={13} className="text-[#101F1A]/70 shrink-0" />
                            <span>Your Next Match</span>
                        </div>
                        <StatusPill status={booking.status || 'CONFIRMED'} />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-[#101F1A] tracking-tight leading-tight">
                        {dateFormatted}
                    </h3>

                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#101F1A] mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={14} className="text-[#101F1A]/60" />{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</span>
                        <span className="text-[11px] text-[#101F1A]/60 font-semibold bg-[#F5F2EA] px-2 py-0.5 rounded-full border border-[#101F1A]/5">
                            {durationText}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#101F1A]/70 font-medium mt-2">
                        <MapPin size={13} className="shrink-0 text-[#101F1A]/50" />
                        <span className="truncate">{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Venue location'}</span>
                    </div>
                </div>

                {/* Summary Strip */}
                <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] border border-[#101F1A]/8 rounded-xl p-3 text-xs">
                    <div>
                        <span className="block text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">
                            Rate Plan
                        </span>
                        <span className="font-bold text-[#101F1A] truncate block text-xs mt-0.5">
                            {booking.rate_plan_name || 'Standard Plan'}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">
                            Total Price
                        </span>
                        <span className="font-black text-[#101F1A] text-sm sm:text-base mt-0.5 block">
                            {pesos(Number(booking.total_price))}
                        </span>
                    </div>
                </div>

                {/* Actions Row (Mobile-Optimized Touch Grid) */}
                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onOpenTicket(booking)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#101F1A] hover:bg-[#1a382d] text-[#D6FF3F] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                        <Ticket size={14} />
                        <span>View Digital Pass</span>
                    </button>

                    <div className="grid grid-cols-3 sm:flex items-center gap-1.5 flex-1">
                        <button
                            type="button"
                            onClick={handleDirections}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#101F1A] text-xs font-bold transition cursor-pointer active:scale-95"
                            title="Get directions on Google Maps"
                        >
                            <Compass size={13} />
                            <span>Map</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadIcs}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#101F1A] text-xs font-bold transition cursor-pointer active:scale-95"
                            title="Download .ics file for Calendar"
                        >
                            <CalendarCheck size={13} />
                            <span>Calendar</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#101F1A] text-xs font-bold transition cursor-pointer active:scale-95"
                            title="Share match link"
                        >
                            {copied ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
                            <span>{copied ? 'Copied' : 'Share'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}
