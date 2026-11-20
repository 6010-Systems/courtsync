import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, Clock, History, Compass, ArrowRight, Sparkles } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard({ stats, nextBooking, recentBookings, timezone }) {
    const { auth } = usePage().props;

    const statCards = [
        {
            label: 'Upcoming Games',
            value: stats.upcoming,
            filter: 'upcoming',
            icon: Calendar,
            accent: 'text-[#101F1A]',
            bg: 'bg-[#D6FF3F]/30',
        },
        {
            label: 'Awaiting Confirmation',
            value: stats.awaitingConfirmation,
            filter: 'pending',
            icon: Clock,
            accent: 'text-amber-800',
            bg: 'bg-amber-100/70',
        },
        {
            label: 'Past Bookings',
            value: stats.past,
            filter: 'past',
            icon: History,
            accent: 'text-gray-600',
            bg: 'bg-gray-100',
        },
    ];

    return (
        <AuthenticatedLayout 
            header={
                <PageHeader 
                    title={`Welcome back, ${auth.user.name}`} 
                    subtitle="Manage your upcoming court reservations and match schedule" 
                    actions={
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-4 py-2 text-xs font-bold text-[#101F1A] hover:bg-[#c6ee35] transition shadow-xs active:scale-[0.98]"
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

            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Metric Summary Cards (Interactive Links) */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {statCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <Link 
                                key={card.label} 
                                href={route('player.bookings', { filter: card.filter })}
                                className="group relative rounded-2xl border border-[#101F1A]/10 bg-white p-5 shadow-card hover:shadow-lg hover:border-[#101F1A]/20 transition-all duration-200 overflow-hidden flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#101F1A]/60">
                                        {card.label}
                                    </span>
                                    <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <Icon className={`w-4 h-4 ${card.accent}`} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-baseline justify-between">
                                    <span className="text-3xl font-black text-[#101F1A]">
                                        {card.value}
                                    </span>
                                    <span className="text-xs font-bold text-[#101F1A]/50 group-hover:text-[#101F1A] flex items-center gap-1 transition-colors">
                                        View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Next Upcoming Reservation Hero */}
                <section aria-labelledby="next-reservation">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#FF5A36]" />
                            <h2 id="next-reservation" className="text-base sm:text-lg font-bold text-[#101F1A]">
                                Your Next Scheduled Game
                            </h2>
                        </div>
                    </div>
                    {nextBooking ? (
                        <PlayerBookingCard booking={nextBooking} />
                    ) : (
                        <EmptyPlayerBookings message="No upcoming reservations scheduled." />
                    )}
                </section>

                {/* Recent Bookings List */}
                <section aria-labelledby="recent-bookings">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 id="recent-bookings" className="text-base sm:text-lg font-bold text-[#101F1A]">
                            Recent Booking Activity
                        </h2>
                        <Link 
                            href={route('player.bookings', { filter: 'all' })} 
                            className="text-xs font-bold text-[#101F1A] hover:text-[#FF5A36] underline underline-offset-4 transition"
                        >
                            View All History
                        </Link>
                    </div>

                    <div className="space-y-3.5">
                        {recentBookings.length ? (
                            recentBookings.map((booking) => (
                                <PlayerBookingCard key={booking.id} booking={booking} />
                            ))
                        ) : (
                            <EmptyPlayerBookings message="No booking records found." />
                        )}
                    </div>
                </section>

                <p className="text-[11px] text-[#101F1A]/40 text-center">
                    All game schedules and notifications use {timezone}.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
