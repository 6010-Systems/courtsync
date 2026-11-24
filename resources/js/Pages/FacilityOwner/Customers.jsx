import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import MetricCard, { formatCount, formatPeso } from '@/Components/MetricCard';
import { Head, Link, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import {
    Calendar,
    CalendarCheck2,
    Footprints,
    Mail,
    Phone,
    Search,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function formatDate(value) {
    if (!value) return '—';

    return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getInitials(name) {
    return String(name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function Customers({ filters = {}, customers, summary = {}, facilities = [] }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [failedAvatars, setFailedAvatars] = useState(() => new Set());
    const searchTimer = useRef(null);

    const currentType = filters.type ?? 'all';

    useEffect(() => {
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, []);

    const applyFilters = (next = {}) => {
        const facilityId = 'facility_id' in next ? next.facility_id : filters.facility_id;
        const searchTerm = 'search' in next ? next.search : filters.search;
        const customerType = 'type' in next ? next.type : filters.type;

        router.get(
            route('facility.customers'),
            {
                ...(facilityId ? { facility_id: facilityId } : {}),
                ...(searchTerm ? { search: searchTerm } : {}),
                ...(customerType && customerType !== 'all' ? { type: customerType } : {}),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearch = (value) => {
        setSearch(value);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            applyFilters({ search: value.trim() || undefined });
        }, 350);
    };

    const handleClearSearch = () => {
        setSearch('');
        if (searchTimer.current) clearTimeout(searchTimer.current);
        applyFilters({ search: undefined });
    };

    const handleClearAllFilters = () => {
        setSearch('');
        if (searchTimer.current) clearTimeout(searchTimer.current);
        router.get(
            route('facility.customers'),
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleAvatarError = (key) => {
        setFailedAvatars((prev) => new Set(prev).add(key));
    };

    const hasActiveFilters = Boolean(filters.search || (filters.type && filters.type !== 'all') || filters.facility_id);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Customers"
                    subtitle="Track registered players and walk-in guests across your facilities"
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Customer Directory" />

            <div className="w-full space-y-5 pb-6">
                {/* ── Metric Summary Cards ── */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
                    <MetricCard
                        label="Customers"
                        value={formatCount(summary.customers ?? 0)}
                        hint="Unique players & guests"
                        icon={Users}
                        accent="lime"
                    />
                    <MetricCard
                        label="Registered"
                        value={formatCount(summary.registered ?? 0)}
                        hint="Player accounts"
                        icon={UserCheck}
                        accent="lime"
                    />
                    <MetricCard
                        label="Walk-ins"
                        value={formatCount(summary.walk_ins ?? 0)}
                        hint="Grouped by guest name"
                        icon={Footprints}
                        accent="lime"
                    />
                    <MetricCard
                        label="Bookings"
                        value={formatCount(summary.bookings ?? 0)}
                        hint="Non-cancelled total"
                        icon={CalendarCheck2}
                        accent="lime"
                    />
                    <MetricCard
                        label="Total spent"
                        value={formatPeso(summary.total_spent ?? 0)}
                        hint="All-time booking value"
                        icon={CalendarCheck2}
                        accent="lime"
                    />
                </div>

                {/* ── Filter & Search Toolbar ── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40"
                                aria-hidden="true"
                            />
                            <TextInput
                                type="text"
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by name, email, or phone..."
                                className="w-full pl-9 pr-9"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Multi-Facility Filter */}
                            {facilities.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={filters.facility_id ?? ''}
                                        onChange={(e) =>
                                            applyFilters({ facility_id: e.target.value || undefined })
                                        }
                                        className="h-10 rounded-xl border-[#101F1A]/15 bg-white pl-3 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all cursor-pointer"
                                        aria-label="Filter by facility"
                                    >
                                        <option value="">All facilities</option>
                                        {facilities.map((facility) => (
                                            <option key={facility.id} value={facility.id}>
                                                {facility.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Customer Type Filter Chips */}
                            <div className="inline-flex rounded-xl bg-[#F5F2EA]/80 p-1 border border-[#101F1A]/5">
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'registered', label: 'Registered' },
                                    { key: 'walk_in', label: 'Walk-ins' },
                                ].map((tab) => {
                                    const isActive = currentType === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => applyFilters({ type: tab.key })}
                                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                                    : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Table & Content Area ── */}
                {customers.data.length === 0 ? (
                    hasActiveFilters ? (
                        /* Filter Mismatch Empty State */
                        <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2EA] text-[#101F1A]/40">
                                <Search size={26} strokeWidth={2} />
                            </div>
                            <h3 className="mt-4 text-base font-black text-[#101F1A]">No matching customers found</h3>
                            <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                                No customers matched your search query or selected type filter.
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={handleClearAllFilters}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-colors"
                                >
                                    <X size={14} />
                                    <span>Clear all filters</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Zero Customers Overall Empty State */
                        <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A]">
                                <Users size={28} strokeWidth={2} />
                            </div>
                            <h3 className="mt-4 text-base font-black text-[#101F1A]">No customers yet</h3>
                            <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                                Customers appear here automatically after their first court reservation or walk-in booking.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href={route('facility.bookings')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                                >
                                    <span>View Facility Bookings</span>
                                </Link>
                            </div>
                        </div>
                    )
                ) : (
                    /* Directory Table & Mobile Cards */
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Customer</th>
                                        <th scope="col" className="px-6 py-4">Type</th>
                                        <th scope="col" className="px-6 py-4 text-right">Bookings</th>
                                        <th scope="col" className="px-6 py-4 text-right">Total Spent</th>
                                        <th scope="col" className="px-6 py-4 text-right">First Booking</th>
                                        <th scope="col" className="px-6 py-4 text-right">Last Booking</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {customers.data.map((customer) => {
                                        const hasAvatar = customer.avatar && !failedAvatars.has(customer.key);
                                        const isRegistered = customer.type === 'registered';

                                        return (
                                            <tr
                                                key={customer.key}
                                                className="hover:bg-[#F5F2EA]/30 transition-colors"
                                            >
                                                {/* Customer Info */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {hasAvatar ? (
                                                            <img
                                                                src={customer.avatar}
                                                                alt=""
                                                                className="h-9 w-9 rounded-full border border-[#101F1A]/10 object-cover"
                                                                referrerPolicy="no-referrer"
                                                                onError={() => handleAvatarError(customer.key)}
                                                            />
                                                        ) : (
                                                            <div
                                                                className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold shadow-2xs ${
                                                                    isRegistered
                                                                        ? 'bg-[#101F1A] text-[#D6FF3F]'
                                                                        : 'bg-[#101F1A]/10 text-[#101F1A]/70'
                                                                }`}
                                                            >
                                                                {getInitials(customer.name)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-[#101F1A]">
                                                                {customer.name}
                                                            </p>
                                                            <p className="truncate text-xs text-[#101F1A]/60">
                                                                {customer.email ?? (customer.mobile_number || 'Guest / Walk-in')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isRegistered ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            <span>Registered</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                            <span>Walk-in</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Bookings Count */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <p className="font-black text-[#101F1A]">
                                                        {formatCount(customer.bookings_count)}
                                                    </p>
                                                    <p className="text-[10px] text-[#101F1A]/50">
                                                        booking{customer.bookings_count === 1 ? '' : 's'}
                                                    </p>
                                                </td>

                                                {/* Total Spent */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-[#101F1A]">
                                                    {formatPeso(customer.total_spent)}
                                                </td>

                                                {/* First Booking */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-[#101F1A]/70 font-medium">
                                                    {formatDate(customer.first_booking)}
                                                </td>

                                                {/* Last Booking */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-[#101F1A]/70 font-medium">
                                                    {formatDate(customer.last_booking)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View (No Horizontal Scroll) */}
                        <div className="md:hidden divide-y divide-[#101F1A]/5">
                            {customers.data.map((customer) => {
                                const hasAvatar = customer.avatar && !failedAvatars.has(customer.key);
                                const isRegistered = customer.type === 'registered';

                                return (
                                    <div key={`mobile-${customer.key}`} className="p-4 bg-white space-y-3.5">
                                        {/* Header Row: Avatar, Name & Type */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {hasAvatar ? (
                                                    <img
                                                        src={customer.avatar}
                                                        alt=""
                                                        className="h-10 w-10 rounded-full border border-[#101F1A]/10 object-cover shrink-0"
                                                        referrerPolicy="no-referrer"
                                                        onError={() => handleAvatarError(customer.key)}
                                                    />
                                                ) : (
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold shadow-2xs shrink-0 ${
                                                            isRegistered
                                                                ? 'bg-[#101F1A] text-[#D6FF3F]'
                                                                : 'bg-[#101F1A]/10 text-[#101F1A]/70'
                                                        }`}
                                                    >
                                                        {getInitials(customer.name)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate font-bold text-[#101F1A] text-sm">
                                                        {customer.name}
                                                    </p>
                                                    {customer.email && (
                                                        <p className="flex items-center gap-1 text-xs text-[#101F1A]/60 truncate">
                                                            <Mail size={11} className="shrink-0 text-[#101F1A]/40" />
                                                            <span className="truncate">{customer.email}</span>
                                                        </p>
                                                    )}
                                                    {customer.mobile_number && (
                                                        <p className="flex items-center gap-1 text-xs text-[#101F1A]/60 truncate">
                                                            <Phone size={11} className="shrink-0 text-[#101F1A]/40" />
                                                            <span className="truncate">{customer.mobile_number}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {isRegistered ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span>Registered</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    <span>Walk-in</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Stats Container */}
                                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#101F1A]/5 bg-[#F5F2EA]/40 p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Bookings
                                                </span>
                                                <span className="font-black text-[#101F1A] text-sm block mt-0.5">
                                                    {formatCount(customer.bookings_count)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Total Spent
                                                </span>
                                                <span className="font-bold text-[#101F1A] text-sm block mt-0.5">
                                                    {formatPeso(customer.total_spent)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    First Booking
                                                </span>
                                                <span className="font-semibold text-[#101F1A] block mt-0.5">
                                                    {formatDate(customer.first_booking)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Last Booking
                                                </span>
                                                <span className="font-semibold text-[#101F1A] block mt-0.5">
                                                    {formatDate(customer.last_booking)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Bar */}
                        {customers.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#101F1A]/10 bg-[#F5F2EA]/40 px-6 py-3.5 text-xs">
                                <span className="font-medium text-[#101F1A]/60">
                                    Showing{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {customers.from ?? 0}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {customers.to ?? 0}
                                    </span>{' '}
                                    of <span className="font-bold text-[#101F1A]">{formatCount(customers.total)}</span> customers
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {customers.prev_page_url ? (
                                        <Link
                                            href={customers.prev_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all"
                                        >
                                            Previous
                                        </Link>
                                    ) : (
                                        <span className="rounded-lg border border-[#101F1A]/10 bg-white/50 px-3 py-1.5 font-bold text-[#101F1A]/30 cursor-not-allowed">
                                            Previous
                                        </span>
                                    )}
                                    <span className="px-2 font-bold text-[#101F1A]">
                                        Page {customers.current_page} of {customers.last_page}
                                    </span>
                                    {customers.next_page_url ? (
                                        <Link
                                            href={customers.next_page_url}
                                            preserveScroll
                                            className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all"
                                        >
                                            Next
                                        </Link>
                                    ) : (
                                        <span className="rounded-lg border border-[#101F1A]/10 bg-white/50 px-3 py-1.5 font-bold text-[#101F1A]/30 cursor-not-allowed">
                                            Next
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
