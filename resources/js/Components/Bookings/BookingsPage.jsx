import React, { useState } from 'react';
import CalendarToolbar from './CalendarToolbar';
import KpiStrip from './KpiStrip';
import CourtCalendarGrid from './CourtCalendarGrid';
import AttentionPanel from './AttentionPanel';
import BookingDetailPopover from './BookingDetailPopover';
import NewBookingDrawer from './NewBookingDrawer';
import { useRealtimeBookings } from './useRealtimeBookings';
import { MOCK_COURTS, MOCK_FACILITY, BOOKING_SOURCE } from './types';
import { Sparkles, Radio, CheckCircle, Bell } from 'lucide-react';

export default function BookingsPage({
    facility = MOCK_FACILITY,
    courts = MOCK_COURTS,
}) {
    const {
        bookings,
        expiredHolds,
        kpis,
        echoStatus,
        animatingBookingId,
        pendingActionId,
        checkInBooking,
        markPaid,
        extendBooking,
        cancelBooking,
        createBooking,
        triggerSimulatedEvent,
    } = useRealtimeBookings();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('Day');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSport, setSelectedSport] = useState('ALL');
    const [isAttentionPanelOpen, setIsAttentionPanelOpen] = useState(true);

    // Modal & Drawer states
    const [drawerState, setDrawerState] = useState({
        isOpen: false,
        courtId: null,
        startTime: '16:00',
        endTime: '17:30',
        source: BOOKING_SOURCE.WALK_IN,
    });

    const [detailState, setDetailState] = useState({
        isOpen: false,
        booking: null,
        court: null,
    });

    // Attention count (holds + checkin queue)
    const attentionCount = bookings.filter(
        b => b.status === 'AWAITING_PAYMENT' || b.status === 'CONFIRMED'
    ).length;

    // Handlers
    const handleNewBooking = (source = BOOKING_SOURCE.WALK_IN) => {
        setDrawerState({
            isOpen: true,
            courtId: courts[0]?.id,
            startTime: '15:00',
            endTime: '16:30',
            source,
        });
    };

    const handleEmptySlotClick = ({ courtId, startTime, endTime }) => {
        setDrawerState({
            isOpen: true,
            courtId,
            startTime,
            endTime,
            source: BOOKING_SOURCE.WALK_IN,
        });
    };

    const handleSelectBooking = (booking, court) => {
        setDetailState({
            isOpen: true,
            booking,
            court: court || courts.find(c => c.id === booking.courtId),
        });
    };

    const handleJumpToNow = () => {
        setCurrentDate(new Date());
        // Scroll grid to current hour
        const now = new Date();
        const hour = now.getHours();
        const top = Math.max(0, (hour - 6) * 76);
        window.scrollTo({ top: top + 150, behavior: 'smooth' });
    };

    return (
        <div className="space-y-4 pb-20">
            {/* ── 1. Top Bar / Toolbar ────────────────────────────────────── */}
            <CalendarToolbar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNewBookingClick={() => handleNewBooking(BOOKING_SOURCE.STAFF)}
                onWalkInClick={() => handleNewBooking(BOOKING_SOURCE.WALK_IN)}
                attentionCount={attentionCount}
                isAttentionPanelOpen={isAttentionPanelOpen}
                onToggleAttentionPanel={() => setIsAttentionPanelOpen(!isAttentionPanelOpen)}
                selectedSport={selectedSport}
                onSelectSport={setSelectedSport}
            />

            {/* ── 2. KPI Strip ────────────────────────────────────────────── */}
            <KpiStrip kpis={kpis} />

            {/* ── 3. Main Grid Area + Right Rail Attention Panel ──────────── */}
            <div className="flex flex-col xl:flex-row gap-4 items-stretch">
                
                {/* Calendar Grid (Core Surface) */}
                <div className="flex-1 min-w-0 transition-all duration-300">
                    <CourtCalendarGrid
                        courts={courts}
                        bookings={bookings}
                        operatingHours={facility.operatingHours}
                        searchQuery={searchQuery}
                        selectedSport={selectedSport}
                        animatingBookingId={animatingBookingId}
                        onSelectBooking={handleSelectBooking}
                        onEmptySlotClick={handleEmptySlotClick}
                        viewMode={viewMode}
                    />
                </div>

                {/* Right Rail Attention Panel (Collapsible) */}
                {isAttentionPanelOpen && (
                    <div className="w-full xl:w-80 shrink-0 animate-fade-in">
                        <AttentionPanel
                            bookings={bookings}
                            expiredHolds={expiredHolds}
                            courts={courts}
                            isOpen={isAttentionPanelOpen}
                            onClose={() => setIsAttentionPanelOpen(false)}
                            onCheckIn={checkInBooking}
                            onMarkPaid={markPaid}
                            onSelectBooking={handleSelectBooking}
                        />
                    </div>
                )}
            </div>

            {/* ── 4. Booking Details Popover / Modal ───────────────────────── */}
            <BookingDetailPopover
                booking={detailState.isOpen ? detailState.booking : null}
                court={detailState.court}
                onClose={() => setDetailState({ isOpen: false, booking: null, court: null })}
                onCheckIn={checkInBooking}
                onMarkPaid={markPaid}
                onExtend={extendBooking}
                onCancel={cancelBooking}
                isPending={pendingActionId === detailState.booking?.id}
            />

            {/* ── 6. New Booking Drawer ───────────────────────────────────── */}
            <NewBookingDrawer
                isOpen={drawerState.isOpen}
                onClose={() => setDrawerState(prev => ({ ...prev, isOpen: false }))}
                initialCourtId={drawerState.courtId}
                initialStartTime={drawerState.startTime}
                initialEndTime={drawerState.endTime}
                initialSource={drawerState.source}
                existingBookings={bookings}
                onSubmit={createBooking}
            />
        </div>
    );
}
