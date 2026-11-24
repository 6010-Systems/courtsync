import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    CalendarCheck, 
    Clock, 
    Compass, 
    History, 
    Ticket 
} from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import BookingPassDialog from '@/Components/Player/BookingPassDialog';
import NextGameCard from '@/Components/Player/NextGameCard';
import RecentActivityList from '@/Components/Player/RecentActivityList';
import StatCard from '@/Components/Dashboard/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ stats, nextBooking, recentBookings = [], timezone = 'Asia/Manila' }) {
    const { auth } = usePage().props;
    const [activeTicketBooking, setActiveTicketBooking] = useState(null);

    const popularSports = [
        { name: 'Pickleball', icon: '🎾' },
        { name: 'Badminton', icon: '🏸' },
        { name: 'Basketball', icon: '🏀' },
        { name: 'Tennis', icon: '🎾' },
        { name: 'Volleyball', icon: '🏐' },
    ];

    return (
        <AuthenticatedLayout header={<PageHeader title={`Welcome back, ${auth.user.name}`} subtitle="Your courts, reservations, and next game" actions={null} showSearch={false} liveNotifications notificationsFooterHref={route('player.bookings')} />}>
            <Head title="Player Dashboard" />
            <div className="space-y-6">
                {/* Action CTA Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-[#101F1A]/10 shadow-card">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-[#D6FF3F] ring-4 ring-[#D6FF3F]/30" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#101F1A]/70">CourtSync Player Hub</span>
                    </div>
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                        <Link 
                            href={route('player.bookings')} 
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#101F1A] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#1a382d] transition-all shadow-xs active:scale-95 text-center"
                        >
                            <Ticket size={14} className="text-[#D6FF3F]" />
                            <span>My Bookings</span>
                        </Link>
                        <Link 
                            href="/" 
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D6FF3F] px-3.5 py-2.5 text-xs font-bold text-[#101F1A] hover:bg-[#c4ec36] transition-all shadow-xs active:scale-95 text-center"
                        >
                            <Compass size={14} />
                            <span>Explore Facilities</span>
                        </Link>
                    </div>
                </div>

                {/* Clean CourtSync Metric Cards */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                    <Link href={route('player.bookings', { filter: 'upcoming' })} className="block">
                        <StatCard
                            label="Upcoming Reservations"
                            value={stats.upcoming}
                            icon={CalendarCheck}
                            iconVariant="volt"
                            className="hover:border-[#101F1A]/30 hover:shadow-card cursor-pointer"
                        />
                    </Link>
                    <Link href={route('player.bookings', { filter: 'upcoming' })} className="block">
                        <StatCard
                            label="Awaiting Confirmation"
                            value={stats.awaitingConfirmation}
                            icon={Clock}
                            iconVariant="coral"
                            className="hover:border-[#101F1A]/30 hover:shadow-card cursor-pointer"
                        />
                    </Link>
                    <Link href={route('player.bookings', { filter: 'past' })} className="block">
                        <StatCard
                            label="Past Bookings"
                            value={stats.past}
                            icon={History}
                            iconVariant="default"
                            className="hover:border-[#101F1A]/30 hover:shadow-card cursor-pointer"
                        />
                    </Link>
                </div>

                <p className="text-xs text-[#101F1A]/60">Booking times and reservation categories use {timezone}. Upcoming includes reservations currently in progress.</p>

                {/* Next Reservation Section */}
                <section aria-labelledby="next-reservation">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id="next-reservation" className="text-lg font-bold text-[#101F1A]">Your Next Reservation</h2>
                        {nextBooking && (
                            <button
                                type="button"
                                onClick={() => setActiveTicketBooking(nextBooking)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101F1A] hover:text-green-700 underline underline-offset-4 cursor-pointer"
                            >
                                <Ticket size={13} />
                                <span>Digital Pass</span>
                            </button>
                        )}
                    </div>
                    {nextBooking ? (
                        <NextGameCard 
                            booking={nextBooking} 
                            onOpenTicket={(b) => setActiveTicketBooking(b)} 
                        />
                    ) : (
                        <div className="rounded-2xl bg-[#101F1A] p-6 sm:p-8 text-white shadow-card">
                            <div className="max-w-xl">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D6FF3F]/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#D6FF3F] border border-[#D6FF3F]/30 mb-3">
                                    <span>Ready for matchday?</span>
                                </span>
                                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                    No upcoming reservations
                                </h3>
                                <p className="mt-2 text-sm text-gray-300">
                                    Explore premier sports arenas, check live court schedules, and reserve your spot in minutes.
                                </p>

                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    <Link 
                                        href="/" 
                                        className="inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#101F1A] hover:bg-[#c4ec36] transition-all shadow-md active:scale-95"
                                    >
                                        <Compass size={14} />
                                        <span>Find Courts & Book</span>
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                                        <span className="font-semibold mr-1">Popular:</span>
                                        {popularSports.map((sport) => (
                                            <Link
                                                key={sport.name}
                                                href="/"
                                                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition-colors"
                                            >
                                                {sport.icon} {sport.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Recent Bookings Section */}
                <section aria-labelledby="recent-bookings">
                    {recentBookings && recentBookings.length > 0 ? (
                        <RecentActivityList 
                            bookings={recentBookings} 
                            onOpenTicket={(b) => setActiveTicketBooking(b)} 
                        />
                    ) : (
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 id="recent-bookings" className="text-lg font-bold text-[#101F1A]">Recent Bookings</h2>
                                <Link href={route('player.bookings', { filter: 'all' })} className="text-sm font-bold text-[#101F1A] underline underline-offset-4">View All</Link>
                            </div>
                            <EmptyPlayerBookings />
                        </div>
                    )}
                </section>
            </div>

            {/* Standalone Digital Boarding Pass Ticket Dialog */}
            <BookingPassDialog 
                booking={activeTicketBooking}
                isOpen={Boolean(activeTicketBooking)}
                onClose={() => setActiveTicketBooking(null)}
            />
        </AuthenticatedLayout>
    );
}
