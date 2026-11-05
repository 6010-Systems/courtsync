import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Dashboard({ stats, nextBooking, recentBookings, timezone }) {
    const { auth } = usePage().props;

    return (
        <AuthenticatedLayout header={<PageHeader title={`Welcome back, ${auth.user.name}`} subtitle="Your courts, reservations, and next game" actions={null} showSearch={false} showNotifications={false} />}>
            <Head title="Player Dashboard" />
            <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                    <Link href={route('player.bookings')} className="rounded-lg bg-[#101F1A] px-5 py-3 text-sm font-bold text-white hover:bg-[#1a382d]">View My Bookings</Link>
                    <Link href="/" className="rounded-lg bg-[#D6FF3F] px-5 py-3 text-sm font-bold text-[#101F1A] hover:bg-[#c4ec36]">Explore Facilities</Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        ['Upcoming Reservations', stats.upcoming],
                        ['Awaiting Confirmation', stats.awaitingConfirmation],
                        ['Past Bookings', stats.past],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#101F1A]/10 bg-white p-6 shadow-card">
                            <p className="text-xs font-bold uppercase tracking-wide text-[#101F1A]/60">{label}</p>
                            <p className="mt-3 text-3xl font-black text-[#101F1A]">{value}</p>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-[#101F1A]/60">Booking times and reservation categories use {timezone}. Upcoming includes reservations currently in progress.</p>
                <section aria-labelledby="next-reservation">
                    <h2 id="next-reservation" className="mb-3 text-lg font-bold text-[#101F1A]">Your Next Reservation</h2>
                    {nextBooking ? <PlayerBookingCard booking={nextBooking} /> : <EmptyPlayerBookings message="No upcoming reservations." />}
                </section>
                <section aria-labelledby="recent-bookings">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h2 id="recent-bookings" className="text-lg font-bold text-[#101F1A]">Recent Bookings</h2>
                        <Link href={route('player.bookings', { filter: 'all' })} className="text-sm font-bold text-[#101F1A] underline underline-offset-4">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {recentBookings.length ? recentBookings.map((booking) => <PlayerBookingCard key={booking.id} booking={booking} />) : <EmptyPlayerBookings />}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}