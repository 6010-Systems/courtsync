import { Head, Link } from '@inertiajs/react';
import { 
    CalendarCheck, 
    History, 
    XCircle, 
    Layers, 
    ChevronLeft, 
    ChevronRight, 
    Info 
} from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import PlayerBookingCard, { EmptyPlayerBookings } from '@/Components/PlayerBookingCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Bookings({ bookings, filter, timezone }) {
    const filterTabs = [
        { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
        { id: 'past', label: 'Past', icon: History },
        { id: 'cancelled', label: 'Cancelled', icon: XCircle },
        { id: 'all', label: 'All Bookings', icon: Layers },
    ];

    return (
        <AuthenticatedLayout header={<PageHeader title="My Bookings" subtitle="Track your court reservations across all facilities" actions={null} showSearch={false} liveNotifications notificationsFooterHref={route('player.bookings')} />}>
            <Head title="My Bookings" />
            <div className="space-y-6">
                {/* Filter Navigation Bar (Horizontally scrollable on mobile) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#101F1A]/10 shadow-card">
                    <nav aria-label="Booking filters" className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none -mx-1 px-1 sm:mx-0 sm:px-0">
                        {filterTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = filter === tab.id;
                            return (
                                <Link
                                    key={tab.id}
                                    href={route('player.bookings', { filter: tab.id })}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                        isActive
                                            ? 'bg-[#101F1A] text-white shadow-xs'
                                            : 'text-[#101F1A]/70 hover:bg-[#F5F2EA] hover:text-[#101F1A]'
                                    }`}
                                >
                                    <Icon size={14} className={isActive ? 'text-[#D6FF3F]' : 'text-[#101F1A]/50'} />
                                    <span>{tab.label}</span>
                                    {isActive && bookings?.total !== undefined && (
                                        <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-black text-white">
                                            {bookings.total}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#101F1A]/50 px-1 font-medium">
                        <Info size={13} className="shrink-0" />
                        <span>Times use {timezone}</span>
                    </div>
                </div>

                {/* Bookings Card Grid (3 Columns on Desktop) */}
                {bookings.data && bookings.data.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bookings.data.map((booking) => (
                            <PlayerBookingCard key={booking.id} booking={booking} />
                        ))}
                    </div>
                ) : (
                    <EmptyPlayerBookings message={`No ${filter === 'all' ? '' : `${filter} `}reservations found.`} />
                )}

                {/* Pagination Controls */}
                {bookings.last_page > 1 && (
                    <nav aria-label="Booking pages" className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#101F1A]/10 shadow-card text-xs">
                        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                            {bookings.prev_page_url ? (
                                <Link 
                                    href={bookings.prev_page_url} 
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2 font-bold text-[#101F1A] hover:bg-[#F5F2EA] transition-colors shadow-2xs"
                                >
                                    <ChevronLeft size={14} />
                                    <span>Previous</span>
                                </Link>
                            ) : (
                                <span className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2 font-semibold text-gray-300 cursor-not-allowed">
                                    <ChevronLeft size={14} />
                                    <span>Previous</span>
                                </span>
                            )}

                            {bookings.next_page_url ? (
                                <Link 
                                    href={bookings.next_page_url} 
                                    className="sm:hidden flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2 font-bold text-[#101F1A] hover:bg-[#F5F2EA] transition-colors shadow-2xs"
                                >
                                    <span>Next</span>
                                    <ChevronRight size={14} />
                                </Link>
                            ) : (
                                <span className="sm:hidden flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2 font-semibold text-gray-300 cursor-not-allowed">
                                    <span>Next</span>
                                    <ChevronRight size={14} />
                                </span>
                            )}
                        </div>

                        <span className="font-bold text-[#101F1A]/70 text-center">
                            Page <span className="font-black text-[#101F1A]">{bookings.current_page}</span> of {bookings.last_page} · {bookings.total} bookings
                        </span>

                        {bookings.next_page_url ? (
                            <Link 
                                href={bookings.next_page_url} 
                                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2 font-bold text-[#101F1A] hover:bg-[#F5F2EA] transition-colors shadow-2xs"
                            >
                                <span>Next</span>
                                <ChevronRight size={14} />
                            </Link>
                        ) : (
                            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2 font-semibold text-gray-300 cursor-not-allowed">
                                <span>Next</span>
                                <ChevronRight size={14} />
                            </span>
                        )}
                    </nav>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
