import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Compass, 
    Trophy, 
    Clock, 
    Target, 
    Eye, 
    EyeOff, 
    CalendarPlus,
    CalendarCheck,
    CheckCircle2,
    RotateCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PickleballIcon from '@/Components/Icons/PickleballIcon';
import StatCard from '@/Components/Player/StatCard';
import NextGameCard from '@/Components/Player/NextGameCard';
import WeeklyActivityChart from '@/Components/Player/WeeklyActivityChart';
import SportBreakdown from '@/Components/Player/SportBreakdown';
import RebookChips from '@/Components/Player/RebookChips';
import RecentActivityList from '@/Components/Player/RecentActivityList';
import ReviewPrompt from '@/Components/Player/ReviewPrompt';
import { BookingPassDialog } from '@/Components/PlayerBookingCard';
import Dialog from '@/Components/Dialog';

// Framer motion orchestration variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.04,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 320,
            damping: 24,
        },
    },
};

export default function Dashboard({ nextBooking: initialNextBooking, recentBookings: initialRecentBookings = [], timezone = 'Asia/Manila' }) {
    const { auth } = usePage().props;
    const playerName = auth?.user?.name || 'Player Demo';
    const firstName = playerName.split(' ')[0] || 'Player';

    // UI Prototype State & Preferences
    const [showStats, setShowStats] = useState(true);
    const [weeklyGoal, setWeeklyGoal] = useState(4);
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [activeTicketBooking, setActiveTicketBooking] = useState(null);
    const [dismissReview, setDismissReview] = useState(false);

    // Realistic PH prototype bookings (Cebu, Mandaue, Bogo, Lapu-Lapu, Talisay)
    const defaultNextBooking = {
        id: 1042,
        facility_id: 1,
        court_id: 3,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        start_time: '08:30:00',
        end_time: '10:00:00',
        total_price: '450.00',
        rate_plan_name: 'All-In Match Package',
        status: 'CONFIRMED',
        court: {
            id: 3,
            name: 'Center Court',
            type: 'Pickleball',
        },
        facility: {
            id: 1,
            name: 'Cebu Smash Badminton & Sports Arena',
            slug: 'courtsync-premier-arena',
            city: 'Cebu City',
            province: 'Cebu',
            address: 'Gov. M. Cuenco Ave, Banilad',
            contact_number: '0912 345 6789',
        },
        payment: {
            id: 88,
            status: 'verified',
            payment_method: 'gcash',
            amount: '450.00',
        },
    };

    const defaultRecentBookings = [
        {
            id: 1039,
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '16:00:00',
            end_time: '17:30:00',
            total_price: '400.00',
            status: 'COMPLETED',
            court: { name: 'Court 1', type: 'Basketball' },
            facility: { name: 'Mandaue Metro Play Arena', city: 'Mandaue City' },
        },
        {
            id: 1035,
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '08:30:00',
            end_time: '10:00:00',
            total_price: '350.00',
            status: 'COMPLETED',
            court: { name: 'Center Court', type: 'Pickleball' },
            facility: { name: 'Bogo City Sports & Pickleball Hub', city: 'Bogo City' },
        },
        {
            id: 1030,
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '19:00:00',
            end_time: '20:30:00',
            total_price: '300.00',
            status: 'COMPLETED',
            court: { name: 'Court 2', type: 'Badminton' },
            facility: { name: 'Lapu-Lapu Coastal Racket Club', city: 'Lapu-Lapu City' },
        },
        {
            id: 1022,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '07:00:00',
            end_time: '08:30:00',
            total_price: '350.00',
            status: 'NO_SHOW',
            court: { name: 'Court A', type: 'Tennis' },
            facility: { name: 'Queen City Tennis & Turf Complex', city: 'Cebu City' },
        },
        {
            id: 1018,
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '18:00:00',
            end_time: '19:30:00',
            total_price: '400.00',
            status: 'COMPLETED',
            court: { name: 'Court 3', type: 'Pickleball' },
            facility: { name: 'Talisay Athletic Ground & Courts', city: 'Talisay City' },
        },
    ];

    const [activeNextBooking, setActiveNextBooking] = useState(initialNextBooking || defaultNextBooking);
    const [recentBookingsList, setRecentBookingsList] = useState(
        initialRecentBookings.length > 0 ? initialRecentBookings : defaultRecentBookings
    );

    const handleCancelNextBooking = (bookingId) => {
        setActiveNextBooking(null);
    };

    return (
        <AuthenticatedLayout 
            header={
                <PageHeader 
                    title={`Welcome back, ${firstName}`} 
                    subtitle="Your athletic schedule, activity trends, and quick rebooking." 
                    actions={
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Privacy Toggle: Show / Hide Stats */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setShowStats(!showStats)}
                                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white border border-[#10221C]/6 text-xs font-bold text-[#10221C] hover:bg-gray-50 transition cursor-pointer shadow-2xs shrink-0"
                                title={showStats ? 'Hide activity statistics' : 'Show activity statistics'}
                                aria-label={showStats ? 'Hide activity stats' : 'Show activity stats'}
                            >
                                {showStats ? <EyeOff size={14} className="text-[#10221C]/40" /> : <Eye size={14} className="text-[#10221C]" />}
                                <span className="hidden sm:inline">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
                            </motion.button>

                            {/* Single Primary CTA */}
                            <motion.div whileTap={{ scale: 0.96 }}>
                                <Link 
                                    href="/" 
                                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#D6FF3F] hover:bg-[#c2ea2e] px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-black text-[#10221C] transition shadow-xs border border-[#101F1A]/10 shrink-0"
                                >
                                    <Compass size={14} className="text-[#10221C]" />
                                    <span>Find a Court</span>
                                </Link>
                            </motion.div>
                        </div>
                    } 
                    showSearch={false} 
                    liveNotifications 
                    notificationsFooterHref={route('player.bookings')} 
                />
            }
        >
            <Head title="Player Dashboard" />

            {/* Expansive Full Viewport Container (Fixes Awkward Large Margins on Wide Screens) */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5 sm:space-y-6 w-full pb-10"
            >
                {/* 1. STATS STRIP (4 StatCards: Games, Hours, Favorite Sport, Weekly Goal) */}
                {showStats ? (
                    <motion.section 
                        variants={itemVariants}
                        aria-label="Player Activity Overview" 
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
                    >
                        {/* 1. Games Played */}
                        <StatCard
                            label="Games Played"
                            value={24}
                            icon={Trophy}
                            delta={18.5}
                            deltaText="vs last month"
                            higherIsBetter={true}
                            graphicType="court"
                        />

                        {/* 2. Hours on Court */}
                        <StatCard
                            label="Hours on Court"
                            value={38.5}
                            unit="hrs"
                            icon={Clock}
                            delta={12.4}
                            deltaText="vs last month"
                            higherIsBetter={true}
                            graphicType="speed"
                        />

                        {/* 3. Favorite Sport */}
                        <StatCard
                            label="Favorite Sport"
                            value="Pickleball"
                            icon={() => <PickleballIcon size={18} stroke="#10221C" strokeWidth={18} />}
                            subtitle="14 games · 58% of play"
                            delta={null}
                            graphicType="court"
                        />

                        {/* 4. Weekly Goal Progress */}
                        <StatCard
                            label="Weekly Goal Progress"
                            value={`3 / ${weeklyGoal}`}
                            unit="games"
                            icon={Target}
                            subtitle={`${weeklyGoal - 3 > 0 ? `${weeklyGoal - 3} game to reach target` : 'Weekly goal achieved!'}`}
                            onClick={() => setIsGoalDialogOpen(true)}
                            actionLabel="Edit Goal"
                            graphicType="target"
                        />
                    </motion.section>
                ) : (
                    <motion.div 
                        variants={itemVariants}
                        className="rounded-2xl bg-white border border-[#10221C]/6 p-4 flex items-center justify-between shadow-2xs"
                    >
                        <div className="flex items-center gap-2 text-xs text-[#10221C]/60 font-medium">
                            <EyeOff size={16} className="text-[#10221C]/40" />
                            <span>Activity statistics are currently hidden for privacy.</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowStats(true)}
                            className="text-xs font-bold text-[#10221C] hover:text-[#FF5A36] underline underline-offset-2 transition cursor-pointer"
                        >
                            Show Stats Strip
                        </button>
                    </motion.div>
                )}

                {/* 2. MAIN TWO-COLUMN BODY (Fluid 12-Column Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    {/* Left Column (8-col on lg, full on mobile): Next Game Card, Rebook Chips, Review Prompt */}
                    <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                        {/* Next Game Card with Motion Entrance */}
                        <motion.section variants={itemVariants} aria-labelledby="next-match-heading">
                            {activeNextBooking ? (
                                <NextGameCard 
                                    booking={activeNextBooking} 
                                    onOpenTicket={(b) => setActiveTicketBooking(b)}
                                    onCancel={handleCancelNextBooking}
                                />
                            ) : (
                                <div className="rounded-2xl bg-white border border-[#10221C]/6 p-8 text-center shadow-2xs">
                                    <div className="w-12 h-12 rounded-2xl bg-[#D6FF3F]/30 text-[#10221C] flex items-center justify-center mx-auto mb-3">
                                        <CalendarCheck size={24} />
                                    </div>
                                    <h3 className="text-base font-black text-[#10221C]">No upcoming match scheduled</h3>
                                    <p className="text-xs text-[#10221C]/60 max-w-sm mx-auto mt-1 mb-4">
                                        Ready to play? Find courts in Cebu, Mandaue, Bogo, Lapu-Lapu, and Talisay.
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101F1A] text-[#D6FF3F] text-xs font-bold hover:bg-[#18342b] transition active:scale-95"
                                    >
                                        <Compass size={14} />
                                        <span>Browse Available Courts</span>
                                    </Link>
                                </div>
                            )}
                        </motion.section>

                        {/* Rebook Row: "Play Again" Chips */}
                        <motion.section variants={itemVariants} aria-label="Quick Rebook Suggestions">
                            <RebookChips />
                        </motion.section>

                        {/* Dismissible Post-Match Review Prompt */}
                        {!dismissReview && (
                            <motion.section variants={itemVariants} aria-label="Match Experience Review">
                                <ReviewPrompt 
                                    facilityName="Cebu Smash Badminton & Sports Arena"
                                    matchDate="Yesterday at 4:00 PM"
                                    onDismiss={() => setDismissReview(true)}
                                />
                            </motion.section>
                        )}

                        {/* Recent Activity List (~64px compact rows) */}
                        <motion.section variants={itemVariants} aria-label="Recent Match History">
                            <RecentActivityList 
                                bookings={recentBookingsList} 
                                onOpenTicket={(b) => setActiveTicketBooking(b)}
                            />
                        </motion.section>
                    </div>

                    {/* Right Column (4-col on lg, full on mobile): Weekly Activity Chart & Sport Breakdown */}
                    <div className="lg:col-span-4 space-y-5 sm:space-y-6">
                        {/* Recharts Bar Chart: Hours per week */}
                        <motion.div variants={itemVariants}>
                            <WeeklyActivityChart totalHours={38.5} />
                        </motion.div>

                        {/* Horizontal Sport Breakdown */}
                        <motion.div variants={itemVariants}>
                            <SportBreakdown />
                        </motion.div>
                    </div>
                </div>

                {/* Footer Timezone Note */}
                <p className="text-[11px] text-[#101F1A]/40 text-center pt-2">
                    All game schedules and verified digital passes operate in {timezone}.
                </p>
            </motion.div>

            {/* Standalone Reusable Digital Boarding Pass Ticket Dialog */}
            <BookingPassDialog 
                booking={activeTicketBooking}
                isOpen={!!activeTicketBooking}
                onClose={() => setActiveTicketBooking(null)}
            />

            {/* Weekly Goal Customization Dialog */}
            <Dialog
                isOpen={isGoalDialogOpen}
                onClose={() => setIsGoalDialogOpen(false)}
                title="Set Weekly Goal"
                subtitle="Target number of court sessions per week"
                icon={Target}
                iconVariant="volt"
                confirmText="Save Goal"
                confirmVariant="volt"
                onConfirm={() => setIsGoalDialogOpen(false)}
                size="sm"
            >
                <div className="space-y-4 py-2">
                    <p className="text-xs text-[#10221C]/60">
                        Stay active and track your weekly momentum. We will highlight your progress on the dashboard.
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {[2, 3, 4, 5].map((target) => (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                key={target}
                                type="button"
                                onClick={() => setWeeklyGoal(target)}
                                className={`py-3 rounded-xl border text-center transition-all cursor-pointer ${
                                    weeklyGoal === target
                                        ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A] font-black shadow-xs'
                                        : 'bg-[#FAF9F5] hover:bg-gray-100 text-[#10221C] border-[#10221C]/10 font-bold'
                                }`}
                            >
                                <span className="block text-lg">{target}</span>
                                <span className="block text-[10px] uppercase font-semibold">Games/Wk</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}
