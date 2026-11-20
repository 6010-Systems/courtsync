import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Compass, Sparkles } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ nextBooking, recentBookings, timezone }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout 
            header={
                <PageHeader 
                    title={`Welcome back, ${auth.user.name}`} 
                    subtitle="Manage your upcoming court reservations and match schedule" 
                    actions={
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-4 py-2 text-xs font-bold text-[#10221C] hover:bg-[#c6ee35] transition shadow-xs active:scale-[0.98]"
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Explore Venues</span>
                        </Link>
                    } 
                    showSearch={false} 
                    liveNotifications 
                    notificationsFooterHref={route('player.bookings')} 
                />
            }
        >
            <Head title="Player Dashboard" />

            <div className="space-y-8 w-full">
                {/* Quick Action Navigation */}
                <div className="flex flex-wrap items-center gap-3">
                    <Link 
                        href={route('player.bookings')} 
                        className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1a382d] transition shadow-xs active:scale-[0.98]"
                    >
                        View My Bookings
                    </Link>
                    <Link 
                        href="/" 
                        className="inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-5 py-2.5 text-xs font-bold text-[#10221C] hover:bg-[#c6ee35] transition shadow-xs active:scale-[0.98]"
                    >
                        <Compass className="w-3.5 h-3.5" />
                        Explore Facilities
                    </Link>
                </div>

                {/* Next Upcoming Reservation Hero */}
                <section aria-labelledby="next-reservation">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                            <h2 id="next-reservation" className="text-base sm:text-lg font-bold text-[#10221C]">
                                Your Next Scheduled Game
                            </h2>
                        </div>
                    </div>
                    {nextBooking ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            <PlayerBookingCard booking={nextBooking} />
                        </div>
                    ) : (
                        <EmptyPlayerBookings message="No upcoming reservations scheduled." />
                    )}
                </section>

                {/* Recent Bookings Grid — 3 or 4 cards per row */}
                <section aria-labelledby="recent-bookings">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 id="recent-bookings" className="text-base sm:text-lg font-bold text-[#10221C]">
                            Recent Booking Activity
                        </h2>
                        <Link 
                            href={route('player.bookings', { filter: 'all' })} 
                            className="text-xs font-bold text-[#10221C] hover:text-[#FF5A36] underline underline-offset-4 transition"
                        >
                            View All History
                        </Link>
                    </div>

                    {recentBookings.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {recentBookings.map((booking) => (
                                <PlayerBookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    ) : (
                        <EmptyPlayerBookings message="No booking records found." />
                    )}
                </section>

                <p className="text-[11px] text-[#101F1A]/40 text-center">
                    All game schedules and notifications use {timezone}.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
