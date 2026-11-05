import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Bookings({ bookings, filter, timezone }) {
    return (
        <AuthenticatedLayout header={<PageHeader title="My Bookings" subtitle="Track your court reservations across all facilities" actions={null} showSearch={false} showNotifications={false} />}>
            <Head title="My Bookings" />
            <div className="space-y-5">
                <nav aria-label="Booking filters" className="flex flex-wrap gap-2">
                    {['upcoming', 'past', 'cancelled', 'all'].map((value) => (
                        <Link key={value} href={route('player.bookings', { filter: value })} aria-current={filter === value ? 'page' : undefined}
                            className={`rounded-lg px-4 py-2 text-sm font-bold capitalize ${filter === value ? 'bg-[#101F1A] text-white' : 'border border-[#101F1A]/10 bg-white text-[#101F1A] hover:bg-[#D6FF3F]/30'}`}>
                            {value}
                        </Link>
                    ))}
                </nav>
                <p className="text-xs text-[#101F1A]/60">All booking times use {timezone}. Past bookings have reached their end time; cancelled bookings are listed separately.</p>
                <div className="space-y-3">
                    {bookings.data.length ? bookings.data.map((booking) => <PlayerBookingCard key={booking.id} booking={booking} />) : <EmptyPlayerBookings message={`No ${filter === 'all' ? '' : `${filter} `}bookings found.`} />}
                </div>
                {bookings.last_page > 1 && (
                    <nav aria-label="Booking pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        {bookings.prev_page_url ? <Link href={bookings.prev_page_url} className="rounded-lg border border-[#101F1A]/20 bg-white px-4 py-2 font-bold">Previous</Link> : <span className="px-4 py-2 text-gray-400">Previous</span>}
                        <span>Page {bookings.current_page} of {bookings.last_page} · {bookings.total} bookings</span>
                        {bookings.next_page_url ? <Link href={bookings.next_page_url} className="rounded-lg border border-[#101F1A]/20 bg-white px-4 py-2 font-bold">Next</Link> : <span className="px-4 py-2 text-gray-400">Next</span>}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}