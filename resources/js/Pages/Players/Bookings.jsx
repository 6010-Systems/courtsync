import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Bookings({ bookings, filter, timezone }) {
    const filters = [
        { key: 'upcoming', label: 'Upcoming Games' },
        { key: 'pending', label: 'Awaiting Confirmation' },
        { key: 'past', label: 'Past Games' },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'all', label: 'All History' },
    ];

    return (
        <AuthenticatedLayout 
            header={
                <PageHeader 
                    title="My Bookings" 
                    subtitle="Track and manage your court reservations across all venues" 
                    actions={
                        <Link 
                            href="/" 
                            className="inline-flex items-center gap-2 rounded-xl bg-[#D6FF3F] px-4 py-2 text-xs font-bold text-[#101F1A] hover:bg-[#c6ee35] transition shadow-xs active:scale-[0.98]"
                        >
                            <Compass className="w-3.5 h-3.5" />
                            <span>Book New Court</span>
                        </Link>
                    } 
                    showSearch={false} 
                    liveNotifications 
                    notificationsFooterHref={route('player.bookings')} 
                />
            }
        >
            <Head title="My Bookings" />

            <div className="space-y-6 w-full">
                {/* Filter Navigation Tabs */}
                <nav aria-label="Booking filters" className="flex flex-wrap gap-2">
                    {filters.map((tab) => {
                        const isActive = filter === tab.key;
                        return (
                            <Link 
                                key={tab.key} 
                                href={route('player.bookings', { filter: tab.key })} 
                                aria-current={isActive ? 'page' : undefined}
                                className={`relative rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-150 ${
                                    isActive 
                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-sm' 
                                        : 'border border-[#101F1A]/10 bg-white text-[#101F1A]/80 hover:bg-[#FAF9F5] hover:text-[#101F1A]'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>

                <p className="text-[11px] text-[#101F1A]/50">
                    Schedules use local timezone ({timezone}). Upcoming includes active games currently in progress.
                </p>

                {/* Booking Cards Grid — 3 or 4 cards per row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    <AnimatePresence mode="popLayout">
                        {bookings.data.length ? (
                            bookings.data.map((booking) => (
                                <PlayerBookingCard key={booking.id} booking={booking} />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <EmptyPlayerBookings 
                                    message={`No ${filter === 'all' ? '' : `${filter} `}bookings found.`} 
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Pagination */}
                {bookings.last_page > 1 && (
                    <nav aria-label="Booking pages" className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm pt-4 border-t border-[#101F1A]/10">
                        {bookings.prev_page_url ? (
                            <Link 
                                href={bookings.prev_page_url} 
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 font-bold text-[#101F1A] hover:bg-gray-50 transition"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-300 font-medium">
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </span>
                        )}

                        <span className="text-gray-500 font-medium">
                            Page <strong className="text-[#101F1A]">{bookings.current_page}</strong> of <strong className="text-[#101F1A]">{bookings.last_page}</strong> · ({bookings.total} total)
                        </span>

                        {bookings.next_page_url ? (
                            <Link 
                                href={bookings.next_page_url} 
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 font-bold text-[#101F1A] hover:bg-gray-50 transition"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-gray-300 font-medium">
                                Next <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
