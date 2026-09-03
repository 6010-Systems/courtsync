import React from 'react';
import PageHeader from '@/Components/PageHeader';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Bell,
    Clock,
} from 'lucide-react';

export default function CalendarToolbar({
    currentDate,
    onDateChange,
    viewMode,
    onViewModeChange,
    searchQuery,
    onSearchChange,
    onNewBookingClick,
    onWalkInClick,
    attentionCount = 0,
    isAttentionPanelOpen,
    onToggleAttentionPanel,
    selectedSport,
    onSelectSport,
}) {
    // Format display date string based on current view
    const formattedDateTitle = () => {
        const d = currentDate || new Date();
        if (viewMode === 'Day') {
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (viewMode === 'Week') {
            const startOfWeek = new Date(d);
            const day = startOfWeek.getDay();
            const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
            startOfWeek.setDate(diff);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${startStr} – ${endStr}`;
        } else {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
    };

    const handlePrev = () => {
        const nextDate = new Date(currentDate);
        if (viewMode === 'Day') {
            nextDate.setDate(nextDate.getDate() - 1);
        } else if (viewMode === 'Week') {
            nextDate.setDate(nextDate.getDate() - 7);
        } else {
            nextDate.setMonth(nextDate.getMonth() - 1);
        }
        onDateChange(nextDate);
    };

    const handleNext = () => {
        const nextDate = new Date(currentDate);
        if (viewMode === 'Day') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if (viewMode === 'Week') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else {
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        onDateChange(nextDate);
    };

    const handleToday = () => {
        onDateChange(new Date());
    };

    const headerActions = (
        <div className="flex flex-wrap items-center gap-2">
            {/* 1. Date Navigator (‹ / › / Label / Today) */}
            <div className="flex items-center rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/60 p-0.5 shadow-2xs">
                <button
                    type="button"
                    onClick={handlePrev}
                    title="Previous"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#101F1A]/70 transition-colors hover:bg-white hover:text-[#101F1A] cursor-pointer"
                >
                    <ChevronLeft size={14} />
                </button>
                
                <div className="px-2 text-center">
                    <span className="text-xs font-bold text-[#101F1A] whitespace-nowrap">
                        {formattedDateTitle()}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={handleNext}
                    title="Next"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[#101F1A]/70 transition-colors hover:bg-white hover:text-[#101F1A] cursor-pointer"
                >
                    <ChevronRight size={14} />
                </button>

                <button
                    type="button"
                    onClick={handleToday}
                    className="ml-0.5 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-[#101F1A] shadow-2xs hover:bg-[#D6FF3F] transition-colors cursor-pointer"
                >
                    Today
                </button>
            </div>

            {/* 2. View Switcher (Day / Week / Month) */}
            <div className="flex items-center rounded-lg border border-[#101F1A]/10 bg-[#101F1A]/5 p-0.5">
                {['Day', 'Week', 'Month'].map((mode) => {
                    const active = viewMode === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => onViewModeChange(mode)}
                            className={[
                                'rounded-md px-2.5 py-1 text-xs font-bold transition-all duration-150 cursor-pointer',
                                active
                                    ? 'bg-[#101F1A] text-[#D6FF3F] shadow-2xs'
                                    : 'text-[#101F1A]/60 hover:text-[#101F1A]',
                            ].join(' ')}
                        >
                            {mode}
                        </button>
                    );
                })}
            </div>

            {/* 3. Attention Queue Drawer Toggle */}
            <button
                type="button"
                onClick={onToggleAttentionPanel}
                title="Attention Queue (Holds & Upcoming)"
                className={[
                    'relative flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-colors cursor-pointer shadow-subtle',
                    isAttentionPanelOpen
                        ? 'border-[#FF5A36] bg-[#FF5A36]/10 text-[#FF5A36]'
                        : 'border-[#101F1A]/10 bg-white/90 text-[#101F1A] hover:bg-white hover:border-[#101F1A]/25',
                ].join(' ')}
            >
                <Clock size={13} />
                <span className="hidden md:inline">Holds</span>
                {attentionCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF5A36] px-1 text-[9px] font-black text-white shadow-2xs animate-pulse">
                        {attentionCount}
                    </span>
                )}
            </button>

            {/* 4. Primary CTA: + New Booking */}
            <button
                type="button"
                onClick={onNewBookingClick}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#D6FF3F] px-3.5 text-xs font-extrabold text-[#101F1A] shadow-subtle hover:bg-[#c2ea2e] hover:shadow-volt-glow transition-all press-scale cursor-pointer uppercase tracking-wider"
            >
                <Plus size={14} strokeWidth={2.5} />
                <span>New Booking</span>
            </button>
        </div>
    );

    return (
        <PageHeader
            title="Court Bookings"
            subtitle="Bogo Sports Center • 5 Courts Active"
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search bookings, players…"
            showSearch={true}
            showNotifications={true}
            actions={headerActions}
        />
    );
}
