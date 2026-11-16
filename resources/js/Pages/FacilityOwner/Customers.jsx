import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { formatCount, formatPeso } from '@/Components/MetricCard';
import { Head, Link, router } from '@inertiajs/react';
import { CalendarCheck2, Footprints, Search, UserCheck, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function formatDate(value) {
    if (!value) return '—';

    return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function initials(name) {
    return String(name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function StatCard({ label, value, hint, icon: Icon }) {
    return (
        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">{label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6FF3F] text-[#101F1A]">
                    <Icon size={16} strokeWidth={2.25} />
                </span>
            </div>
            <p className="mt-3 text-2xl font-black text-[#101F1A]">{value}</p>
            {hint ? <p className="mt-1 text-xs text-[#101F1A]/60">{hint}</p> : null}
        </div>
    );
}

export default function Customers({ filters, customers, summary = {}, facilities = [] }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const searchTimer = useRef(null);

    useEffect(() => () => clearTimeout(searchTimer.current), []);

    const applyFilters = (next = {}) => {
        const facilityId = 'facility_id' in next ? next.facility_id : filters.facility_id;
        const searchTerm = 'search' in next ? next.search : filters.search;

        router.get(route('facility.customers'), {
            ...(facilityId ? { facility_id: facilityId } : {}),
            ...(searchTerm ? { search: searchTerm } : {}),
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleSearch = (value) => {
        setSearch(value);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => applyFilters({ search: value || undefined }), 350);
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Customers"
                    subtitle="Everyone who has booked your courts — booking counts are ready for future loyalty discounts"
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Customers" />

            <div className="w-full space-y-4 pb-2">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard label="Customers" value={formatCount(summary.customers ?? 0)} hint="Unique customers" icon={Users} />
                    <StatCard label="Registered" value={formatCount(summary.registered ?? 0)} hint="Player accounts" icon={UserCheck} />
                    <StatCard label="Walk-ins" value={formatCount(summary.walk_ins ?? 0)} hint="Grouped by guest name" icon={Footprints} />
                    <StatCard label="Bookings" value={formatCount(summary.bookings ?? 0)} hint="Non-cancelled" icon={CalendarCheck2} />
                    <StatCard label="Total spent" value={formatPeso(summary.total_spent ?? 0)} hint="All-time booking value" icon={CalendarCheck2} />
                </div>

                <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                    <div className="flex flex-col gap-3 border-b border-[#101F1A]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-black text-[#101F1A]">Customer directory</h2>
                            <p className="text-xs text-[#101F1A]/60">
                                Sorted by most bookings. Counts exclude cancelled reservations.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#101F1A]/40">
                                    <Search size={14} />
                                </span>
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => handleSearch(event.target.value)}
                                    placeholder="Search name, email, phone…"
                                    className="h-9 w-56 rounded-lg border border-[#101F1A]/15 bg-white pl-9 pr-3 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]"
                                />
                            </div>

                            {facilities.length > 1 && (
                                <select
                                    value={filters.facility_id ?? ''}
                                    onChange={(event) => applyFilters({ facility_id: event.target.value || undefined })}
                                    className="h-9 max-w-[220px] rounded-lg border border-[#101F1A]/15 bg-white px-3 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer"
                                >
                                    <option value="">All facilities</option>
                                    {facilities.map((facility) => (
                                        <option key={facility.id} value={facility.id}>{facility.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {customers.data.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <Users size={32} className="mx-auto text-[#101F1A]/25" />
                            <p className="mt-3 text-sm font-bold text-[#101F1A]">No customers found</p>
                            <p className="mt-1 text-xs text-[#101F1A]/60">
                                {filters.search ? 'Try a different search term or clear the filters.' : 'Customers appear here after their first booking.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#101F1A]/5">
                                <thead className="bg-[#101F1A]/[0.02]">
                                    <tr>
                                        {['Customer', 'Type', 'Bookings', 'Total spent', 'First booking', 'Last booking'].map((heading, index) => (
                                            <th
                                                key={heading}
                                                scope="col"
                                                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 ${index >= 2 ? 'text-right' : 'text-left'}`}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {customers.data.map((customer) => (
                                        <tr key={customer.key} className="transition-colors hover:bg-[#101F1A]/[0.02]">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {customer.avatar ? (
                                                        <img
                                                            src={customer.avatar}
                                                            alt=""
                                                            className="h-9 w-9 rounded-full border border-[#101F1A]/10 object-cover"
                                                        />
                                                    ) : (
                                                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${customer.type === 'registered' ? 'bg-[#D6FF3F] text-[#101F1A]' : 'bg-[#101F1A]/10 text-[#101F1A]/60'}`}>
                                                            {initials(customer.name)}
                                                        </span>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-[#101F1A]">{customer.name}</p>
                                                        <p className="truncate text-[11px] text-[#101F1A]/50">
                                                            {customer.email ?? 'No account'}
                                                        </p>
                                                        {customer.mobile_number ? (
                                                            <p className="text-[11px] text-[#101F1A]/50">{customer.mobile_number}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${customer.type === 'registered' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {customer.type === 'registered' ? 'Registered' : 'Walk-in'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <p className="text-sm font-black text-[#101F1A]">{formatCount(customer.bookings_count)}</p>
                                                <p className="text-[10px] text-[#101F1A]/50">
                                                    booking{customer.bookings_count === 1 ? '' : 's'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatPeso(customer.total_spent)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatDate(customer.first_booking)}</td>
                                            <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatDate(customer.last_booking)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {customers.last_page > 1 && (
                        <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-[#101F1A]/10 px-4 py-3 text-xs">
                            {customers.prev_page_url ? (
                                <Link href={customers.prev_page_url} preserveScroll className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] hover:bg-[#F5F2EA]">
                                    Previous
                                </Link>
                            ) : (
                                <span className="px-3 py-1.5 text-[#101F1A]/40">Previous</span>
                            )}

                            <span className="text-[#101F1A]/60">
                                Page {customers.current_page} of {customers.last_page} · {formatCount(customers.total)} customers
                            </span>

                            {customers.next_page_url ? (
                                <Link href={customers.next_page_url} preserveScroll className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] hover:bg-[#F5F2EA]">
                                    Next
                                </Link>
                            ) : (
                                <span className="px-3 py-1.5 text-[#101F1A]/40">Next</span>
                            )}
                        </nav>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
