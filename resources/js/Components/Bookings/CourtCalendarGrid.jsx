import React, { useState, useEffect, useRef } from 'react';
import BookingBlock from './BookingBlock';
import SportIcon from './SportIcon';
import { SPORTS_CONFIG, BOOKING_STATUS } from './types';
import { Clock, Plus, Sparkles, MapPin, Layers } from 'lucide-react';

const HOUR_HEIGHT = 76; // pixels per hour
const START_HOUR = 6;   // 06:00 AM
const END_HOUR = 23;    // 11:00 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;

export default function CourtCalendarGrid({
    courts = [],
    bookings = [],
    operatingHours,
    searchQuery = '',
    selectedSport = 'ALL',
    animatingBookingId = null,
    onSelectBooking,
    onEmptySlotClick,
    viewMode = 'Day',
}) {
    const [currentHour, setCurrentHour] = useState(new Date().getHours());
    const [currentTimeLabel, setCurrentTimeLabel] = useState('');
    const [hoveredHour, setHoveredHour] = useState(null);
    const gridRef = useRef(null);

    // Track current time
    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date();
            setCurrentHour(now.getHours());
            const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            setCurrentTimeLabel(timeStr);
        };

        updateCurrentTime();
        const timer = setInterval(updateCurrentTime, 15000); // every 15s
        return () => clearInterval(timer);
    }, []);

    // Filter courts if sport filter is applied
    const filteredCourts = courts.filter(c => {
        if (selectedSport === 'ALL' || !selectedSport) return true;
        return c.sport.toLowerCase() === selectedSport.toLowerCase();
    });

    // Filter bookings based on search query
    const filteredBookings = bookings.filter(b => {
        if (b.status === BOOKING_STATUS.CANCELLED || b.status === BOOKING_STATUS.EXPIRED) {
            // Cancelled and expired releases slots from the grid
            return false;
        }

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            b.customerName?.toLowerCase().includes(q) ||
            b.customerPhone?.toLowerCase().includes(q) ||
            b.customerEmail?.toLowerCase().includes(q) ||
            b.sport?.toLowerCase().includes(q) ||
            b.reference?.toLowerCase().includes(q) ||
            b.notes?.toLowerCase().includes(q)
        );
    });

    // Helper: Convert "HH:MM" to pixel offset from top
    const timeToTop = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        const minutes = (h - START_HOUR) * 60 + (m || 0);
        return Math.max(0, (minutes / 60) * HOUR_HEIGHT);
    };

    // Helper: Convert duration in hours to pixel height
    const durationToHeight = (durationHours) => {
        return Math.max(36, (durationHours || 1) * HOUR_HEIGHT - 4); // small gap
    };

    // Check if booking overlaps with a specific hour
    const isBookingInHoveredHour = (booking, hour) => {
        if (hour === null || hour === undefined) return false;
        const [startH, startM] = (booking.startTime || '00:00').split(':').map(Number);
        const [endH, endM] = (booking.endTime || '00:00').split(':').map(Number);
        const bStart = startH * 60 + (startM || 0);
        const bEnd = endH * 60 + (endM || 0);
        const slotStart = hour * 60;
        const slotEnd = (hour + 1) * 60;
        return bStart < slotEnd && bEnd > slotStart;
    };

    // Format hour row labels (6AM, 7AM, ... 11AM, 12PM, 1PM, ...)
    const hoursList = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
        const h = START_HOUR + i;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        return {
            rawHour: h,
            label: `${displayHour}:00`,
            shortLabel: `${displayHour}${period}`,
            period,
        };
    });

    // Handle clicking an empty slot
    const handleSlotClick = (courtId, hour, minute = 0) => {
        const startTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const endHour = hour + 1 <= END_HOUR ? hour + 1 : END_HOUR;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        onEmptySlotClick({ courtId, startTime, endTime });
    };

    return (
        <div className="flex flex-col rounded-xl border border-[#101F1A]/12 bg-white shadow-card overflow-hidden">
            
            {/* ── Scrollable Grid Container ───────────────────────────────── */}
            <div ref={gridRef} className="overflow-x-auto overflow-y-auto max-h-[720px] dark-scrollbar relative">
                
                {/* ── Sticky Court Resource Headers ─────────────────────────── */}
                <div className="sticky top-0 z-40 flex bg-[#101F1A] border-b border-white/10 shadow-sm min-w-[760px]">
                    
                    {/* Left Time Axis Gutter Header */}
                    <div className="sticky left-0 z-50 w-16 sm:w-20 shrink-0 bg-[#101F1A] p-3 text-center border-r border-white/10 flex flex-col justify-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Time</span>
                        <span className="text-[11px] font-bold text-[#D6FF3F]">PST</span>
                    </div>

                    {/* Court Columns Headers */}
                    <div className="flex flex-1 divide-x divide-white/10">
                        {filteredCourts.map((court) => {
                            return (
                                <div
                                    key={court.id}
                                    className="flex-1 min-w-[170px] sm:min-w-[190px] px-3.5 py-3 transition-colors hover:bg-white/[0.04] flex items-center justify-between gap-2"
                                >
                                    <h3 className="font-bold text-xs sm:text-sm text-[#F5F2EA] tracking-tight truncate">
                                        {court.shortName}
                                    </h3>
                                    <span className="rounded-md bg-[#D6FF3F] px-1.5 py-0.5 text-[10px] font-black text-[#101F1A] whitespace-nowrap shadow-2xs">
                                        ₱{court.hourlyRate}/h
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Main Time Grid Matrix ─────────────────────────────────── */}
                <div className="relative flex min-w-[760px]" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
                    
                    {/* Left Sticky Time Gutter with Direct Time & Current Time Pill */}
                    <div className="sticky left-0 z-20 w-16 sm:w-20 shrink-0 bg-[#F5F2EA] border-r border-[#101F1A]/10 select-none shadow-[2px_0_6px_rgba(16,31,26,0.02)]">
                        {hoursList.slice(0, -1).map((h) => {
                            const isCurrentHour = currentHour === h.rawHour;
                            const isHovered = hoveredHour === h.rawHour;

                            return (
                                <div
                                    key={h.rawHour}
                                    style={{ height: `${HOUR_HEIGHT}px` }}
                                    onMouseEnter={() => setHoveredHour(h.rawHour)}
                                    onMouseLeave={() => setHoveredHour(null)}
                                    className={[
                                        'relative border-b px-2 py-2 flex items-start justify-end transition-all cursor-pointer select-none',
                                        isHovered ? 'bg-[#EAE5D9]' : 'border-[#101F1A]/8 hover:bg-[#EFECE3]'
                                    ].join(' ')}
                                    title={`Hover to highlight all bookings active at ${h.shortLabel}`}
                                >
                                    {isCurrentHour ? (
                                        <span className="inline-flex items-center justify-center rounded-full bg-[#101F1A] text-[#D6FF3F] px-2 py-0.5 text-[11px] font-black tracking-tight shadow-xs">
                                            {h.shortLabel}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-[#101F1A]/70 tracking-tight pr-1">
                                            {h.shortLabel}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Court Resource Columns */}
                    <div className="flex flex-1 divide-x divide-[#101F1A]/8 relative bg-[#FAF8F5]">
                        {filteredCourts.map((court) => {
                            const courtBookings = filteredBookings.filter(b => b.courtId === court.id);

                            return (
                                <div
                                    key={court.id}
                                    className="relative flex-1 min-w-[170px] sm:min-w-[190px] group"
                                >
                                    {/* Background Hourly Clickable Grid Rows */}
                                    {hoursList.slice(0, -1).map((h) => {
                                        const isRowHovered = hoveredHour === h.rawHour;
                                        return (
                                            <div
                                                key={h.rawHour}
                                                style={{ height: `${HOUR_HEIGHT}px` }}
                                                onClick={() => handleSlotClick(court.id, h.rawHour, 0)}
                                                className={[
                                                    'border-b transition-colors cursor-pointer relative',
                                                    isRowHovered
                                                        ? 'bg-[#D6FF3F]/12 border-[#101F1A]/15'
                                                        : 'border-[#101F1A]/8 hover:bg-[#D6FF3F]/10'
                                                ].join(' ')}
                                                title={`Click to book ${court.shortName} at ${h.shortLabel}`}
                                            >
                                                {/* Half-hour subtle dashed divider */}
                                                <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-[#101F1A]/[0.05]" />
                                            </div>
                                        );
                                    })}

                                    {/* Render Booking Blocks */}
                                    {courtBookings.map((b) => {
                                        const top = timeToTop(b.startTime);
                                        const height = durationToHeight(b.durationHours);
                                        const isAnimating = animatingBookingId === b.id;
                                        const isHighlighted = hoveredHour !== null && isBookingInHoveredHour(b, hoveredHour);
                                        const isDimmed = hoveredHour !== null && !isHighlighted;

                                        return (
                                            <BookingBlock
                                                key={b.id}
                                                booking={b}
                                                top={top}
                                                height={height}
                                                isAnimating={isAnimating}
                                                isHighlighted={isHighlighted}
                                                isDimmed={isDimmed}
                                                onClick={() => onSelectBooking(b, court)}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Empty State Banner if no courts matching filter */}
                {filteredCourts.length === 0 && (
                    <div className="p-12 text-center text-[#101F1A]/60">
                        <Layers size={36} className="mx-auto text-[#101F1A]/30 mb-2" />
                        <p className="font-bold text-sm text-[#101F1A]">No courts match the selected sport filter</p>
                        <p className="text-xs mt-1">Try selecting "All Sports" to view the full facility schedule.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
