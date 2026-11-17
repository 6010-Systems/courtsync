import React, { useState, useMemo, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import MetricCard, { formatCount, formatPeso } from '@/Components/MetricCard';
import { Head, Link, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import {
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    Eye,
    FileText,
    Loader2,
    PhilippinePeso,
    Search,
    ShieldCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import BookingDetailDrawer from '@/Components/BookingDetailDrawer';

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minuteStr} ${ampm}`;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(`${String(dateStr).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
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

const ITEMS_PER_PAGE = 12;

export default function Payments({ auth, payments = [], facilities = [] }) {
    const { confirm } = useConfirm();
    const toast = useToast();

    const [processingId, setProcessingId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    const [selectedFacilityId, setSelectedFacilityId] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, selectedFacilityId]);

    const openBookingDetails = (payment) => {
        if (!payment?.booking) return;

        setSelectedBooking({
            ...payment.booking,
            payment,
            user: payment.user ?? payment.booking.user ?? null,
        });
    };

    // Summary calculations
    const summary = useMemo(() => {
        let totalVerified = 0;
        let pending = 0;
        let pendingAmount = 0;
        let verified = 0;
        let rejected = 0;

        payments.forEach((p) => {
            const status = (p.status || '').toLowerCase();
            const amount = Number(p.amount || 0);

            if (status === 'verified') {
                verified += 1;
                totalVerified += amount;
            } else if (status === 'pending') {
                pending += 1;
                pendingAmount += amount;
            } else if (status === 'rejected') {
                rejected += 1;
            }
        });

        return {
            totalCount: payments.length,
            totalVerifiedAmount: totalVerified,
            pendingCount: pending,
            pendingAmount,
            verifiedCount: verified,
            rejectedCount: rejected,
        };
    }, [payments]);

    // Filtered list
    const filteredPayments = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return payments.filter((payment) => {
            const playerName = (payment.booking?.guest_name || payment.user?.name || '').toLowerCase();
            const playerEmail = (payment.user?.email || '').toLowerCase();
            const courtName = (payment.booking?.court?.name || '').toLowerCase();
            const facilityName = (payment.booking?.facility?.name || '').toLowerCase();
            const method = (payment.payment_method || '').toLowerCase();
            const status = (payment.status || '').toLowerCase();

            const matchesSearch =
                !query ||
                playerName.includes(query) ||
                playerEmail.includes(query) ||
                courtName.includes(query) ||
                facilityName.includes(query) ||
                method.includes(query);

            const matchesStatus =
                statusFilter === 'ALL' ||
                status === statusFilter.toLowerCase();

            const matchesFacility =
                selectedFacilityId === 'ALL' ||
                String(payment.booking?.facility_id) === String(selectedFacilityId);

            return matchesSearch && matchesStatus && matchesFacility;
        });
    }, [payments, searchQuery, statusFilter, selectedFacilityId]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPayments, currentPage]);

    const handleVerify = async (payment) => {
        const bookingId = payment.booking_id;
        const playerName = payment.booking?.guest_name || payment.user?.name || 'Customer';
        const formattedAmount = formatPeso(payment.amount);

        const confirmed = await confirm({
            title: 'Verify Payment',
            message: `Verify payment of ${formattedAmount} for ${playerName}? This will confirm the booking and lock the court slot.`,
            confirmText: 'Verify Payment',
            cancelText: 'Cancel',
            type: 'info',
        });

        if (!confirmed) return;

        setProcessingId(bookingId);
        router.post(
            route('bookings.verify', bookingId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment verified successfully. Booking confirmed.');
                    setProcessingId(null);
                },
                onError: () => {
                    toast.error('Failed to verify payment.');
                    setProcessingId(null);
                },
            }
        );
    };

    const handleReject = async (payment) => {
        const bookingId = payment.booking_id;
        const playerName = payment.booking?.guest_name || payment.user?.name || 'Customer';
        const formattedAmount = formatPeso(payment.amount);

        const confirmed = await confirm({
            title: 'Reject Payment',
            message: `Reject payment of ${formattedAmount} for ${playerName}? The booking will be cancelled and the court time slot will immediately reopen for others.`,
            confirmText: 'Reject Payment',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (!confirmed) return;

        setProcessingId(bookingId);
        router.post(
            route('bookings.reject', bookingId),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Payment rejected. Booking slot reopened.');
                    setProcessingId(null);
                },
                onError: () => {
                    toast.error('Failed to reject payment.');
                    setProcessingId(null);
                },
            }
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setSelectedFacilityId('ALL');
    };

    const hasActiveFilters = Boolean(searchQuery || statusFilter !== 'ALL' || selectedFacilityId !== 'ALL');

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <PageHeader
                    title="Payments"
                    subtitle="Track customer payments, verify receipts, and monitor facility booking revenue"
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Payments Tracking" />

            <div className="w-full space-y-5 pb-6">
                {/* ── Summary Metric Cards ── */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                        label="Total Collected"
                        value={formatPeso(summary.totalVerifiedAmount)}
                        hint="Verified revenue to date"
                        icon={CreditCard}
                        accent="lime"
                    />
                    <MetricCard
                        label="Pending Review"
                        value={formatCount(summary.pendingCount)}
                        hint={
                            summary.pendingCount > 0
                                ? `${formatPeso(summary.pendingAmount)} awaiting verification`
                                : 'All verifications caught up'
                        }
                        icon={Clock}
                        accent="lime"
                        alert={summary.pendingCount > 0}
                    />
                    <MetricCard
                        label="Verified Payments"
                        value={formatCount(summary.verifiedCount)}
                        hint="Finalized court reservations"
                        icon={CheckCircle2}
                        accent="lime"
                    />
                    <MetricCard
                        label="Rejected Payments"
                        value={formatCount(summary.rejectedCount)}
                        hint="Cancelled reservations"
                        icon={XCircle}
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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search player, court, or payment method..."
                                className="w-full pl-9 pr-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Facility Dropdown */}
                            {facilities.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={selectedFacilityId}
                                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                                        className="h-10 rounded-xl border-[#101F1A]/15 bg-white pl-3 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all cursor-pointer"
                                        aria-label="Filter payments by facility"
                                    >
                                        <option value="ALL">All Facilities</option>
                                        {facilities.map((facility) => (
                                            <option key={facility.id} value={facility.id}>
                                                {facility.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter Tabs */}
                            <div className="inline-flex rounded-xl bg-[#F5F2EA]/80 p-1 border border-[#101F1A]/5">
                                {[
                                    { key: 'ALL', label: 'All' },
                                    { key: 'PENDING', label: 'Pending' },
                                    { key: 'VERIFIED', label: 'Verified' },
                                    { key: 'REJECTED', label: 'Rejected' },
                                ].map((tab) => {
                                    const isActive = statusFilter === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setStatusFilter(tab.key)}
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
                {summary.totalCount === 0 ? (
                    /* Zero Payments Overall Empty State */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A]">
                            <CreditCard size={28} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No payments found</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            When players book courts and submit transaction receipts, their records will appear here for verification.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={route('facility.bookings')}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                            >
                                <span>View Bookings Calendar</span>
                            </Link>
                        </div>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    /* Filter Mismatch Empty State */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2EA] text-[#101F1A]/40">
                            <Search size={26} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No matching payments found</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            No payment records matched your search query or selected status filter.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-colors"
                            >
                                <X size={14} />
                                <span>Clear all filters</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Payments Table & Mobile Cards */
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Player</th>
                                        <th scope="col" className="px-6 py-4">Court & Facility</th>
                                        <th scope="col" className="px-6 py-4">Date & Time</th>
                                        <th scope="col" className="px-6 py-4">Amount</th>
                                        <th scope="col" className="px-6 py-4">Proof Receipt</th>
                                        <th scope="col" className="px-6 py-4">Status</th>
                                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {paginatedPayments.map((payment) => {
                                        const status = (payment.status || '').toLowerCase();
                                        const isPending = status === 'pending';
                                        const isVerified = status === 'verified';
                                        const isRejected = status === 'rejected';
                                        const isProcessing = processingId === payment.booking_id;

                                        const playerName = payment.booking?.guest_name || payment.user?.name || 'Guest';
                                        const startTime = formatTime(payment.booking?.start_time);
                                        const endTime = formatTime(payment.booking?.end_time);
                                        const bookingFee = Number(payment.booking?.booking_fee ?? 0);
                                        const bookingTotal = Number(payment.booking?.total_price ?? payment.amount);
                                        const courtRate = payment.booking?.subtotal != null
                                            ? Number(payment.booking.subtotal)
                                            : Math.max(0, bookingTotal - bookingFee);

                                        return (
                                            <tr
                                                key={payment.id}
                                                onClick={() => openBookingDetails(payment)}
                                                className={`cursor-pointer transition-colors ${
                                                    isPending
                                                        ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                                        : 'hover:bg-[#F5F2EA]/30'
                                                }`}
                                                title="Click to view full booking details"
                                            >
                                                {/* Player */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101F1A] text-[11px] font-bold text-[#D6FF3F] shadow-2xs">
                                                            {getInitials(playerName)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[#101F1A]">{playerName}</div>
                                                            <div className="text-xs text-[#101F1A]/60">
                                                                {payment.user?.email || (payment.booking?.guest_name ? 'Guest Walk-in' : 'Registered Player')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Court & Facility */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="font-bold text-[#101F1A]">
                                                            {payment.booking?.court?.name || 'Court'}
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 text-xs text-[#101F1A]/60 mt-0.5">
                                                            <Building2 size={12} className="text-[#101F1A]/40" />
                                                            <span>{payment.booking?.facility?.name || 'Facility'}</span>
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Date & Time */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col text-xs font-medium text-[#101F1A]/80">
                                                        <span>{formatDate(payment.booking?.date)}</span>
                                                        <span className="text-[#101F1A]/50 font-normal">
                                                            {startTime} – {endTime}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Amount & Method */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-[#101F1A]">
                                                            {formatPeso(payment.amount)}
                                                        </span>
                                                        <span className="text-[10px] text-[#101F1A]/50">
                                                            Court {formatPeso(courtRate)}
                                                            {bookingFee > 0 ? ` + Fee ${formatPeso(bookingFee)}` : ' · no fee'}
                                                        </span>
                                                        <span className="mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                                            {payment.payment_method || 'Manual'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Proof Receipt */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {payment.proof_path ? (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                openBookingDetails(payment);
                                                            }}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/15 bg-white px-2.5 py-1 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all"
                                                        >
                                                            <Eye size={13} className="text-[#101F1A]/60" />
                                                            <span>View Receipt</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-[#101F1A]/40 italic">
                                                            No receipt uploaded
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                            <span>Pending</span>
                                                        </span>
                                                    )}
                                                    {isVerified && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                            <span>Verified</span>
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                            <span>Rejected</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {isPending ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={isProcessing}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    handleVerify(payment);
                                                                }}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D6FF3F] hover:bg-[#c8f526] px-3 py-1.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:shadow-card focus-ring-volt transition-all disabled:opacity-50 cursor-pointer"
                                                            >
                                                                {isProcessing ? (
                                                                    <Loader2 size={13} className="animate-spin text-[#101F1A]" />
                                                                ) : (
                                                                    <Check size={13} className="text-[#101F1A] stroke-[2.5]" />
                                                                )}
                                                                <span>Verify</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isProcessing}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    handleReject(payment);
                                                                }}
                                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors disabled:opacity-50"
                                                            >
                                                                <X size={13} />
                                                                <span>Reject</span>
                                                            </button>
                                                        </div>
                                                    ) : isVerified ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                                            <CheckCircle2 size={14} />
                                                            <span>Secured</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                                                            <XCircle size={14} />
                                                            <span>Cancelled</span>
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View (No Horizontal Scroll) */}
                        <div className="md:hidden divide-y divide-[#101F1A]/5">
                            {paginatedPayments.map((payment) => {
                                const status = (payment.status || '').toLowerCase();
                                const isPending = status === 'pending';
                                const isVerified = status === 'verified';
                                const isRejected = status === 'rejected';
                                const isProcessing = processingId === payment.booking_id;

                                const playerName = payment.booking?.guest_name || payment.user?.name || 'Guest';
                                const startTime = formatTime(payment.booking?.start_time);
                                const endTime = formatTime(payment.booking?.end_time);

                                return (
                                    <div
                                        key={`mobile-${payment.id}`}
                                        onClick={() => openBookingDetails(payment)}
                                        className={`p-4 space-y-3.5 transition-colors cursor-pointer ${
                                            isPending
                                                ? 'bg-amber-50/40 border-l-4 border-l-amber-500'
                                                : 'bg-white'
                                        }`}
                                    >
                                        {/* Header Row: Player & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101F1A] text-xs font-bold text-[#D6FF3F] shadow-2xs shrink-0">
                                                    {getInitials(playerName)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[#101F1A] text-sm truncate">
                                                        {playerName}
                                                    </div>
                                                    <div className="text-xs text-[#101F1A]/60 truncate">
                                                        {payment.booking?.court?.name || 'Court'} · {payment.booking?.facility?.name}
                                                    </div>
                                                </div>
                                            </div>

                                            {isPending && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <span>Pending</span>
                                                </span>
                                            )}
                                            {isVerified && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span>Verified</span>
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-800 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                    <span>Rejected</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Financial & Time Meta Grid */}
                                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#101F1A]/5 bg-[#F5F2EA]/40 p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Amount
                                                </span>
                                                <span className="font-black text-[#101F1A] text-sm block mt-0.5">
                                                    {formatPeso(payment.amount)}
                                                </span>
                                                <span className="text-[10px] text-[#101F1A]/60 uppercase font-semibold">
                                                    {payment.payment_method || 'Manual'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Schedule
                                                </span>
                                                <span className="font-semibold text-[#101F1A] block mt-0.5">
                                                    {formatDate(payment.booking?.date)}
                                                </span>
                                                <span className="text-[10px] text-[#101F1A]/60 block">
                                                    {startTime} – {endTime}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Action Controls */}
                                        <div className="flex items-center gap-2 pt-1">
                                            {payment.proof_path && (
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        openBookingDetails(payment);
                                                    }}
                                                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#101F1A]/15 bg-white py-2.5 px-3 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] min-h-[44px]"
                                                >
                                                    <Eye size={14} />
                                                    <span>Receipt</span>
                                                </button>
                                            )}

                                            {isPending && (
                                                <div className="flex-1 grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isProcessing}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleVerify(payment);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#D6FF3F] hover:bg-[#c8f526] py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:shadow-card min-h-[44px] disabled:opacity-50 transition-all cursor-pointer"
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 size={14} className="animate-spin text-[#101F1A]" />
                                                        ) : (
                                                            <Check size={14} className="text-[#101F1A] stroke-[2.5]" />
                                                        )}
                                                        <span>Verify</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isProcessing}
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            handleReject(payment);
                                                        }}
                                                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-white py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 min-h-[44px] disabled:opacity-50"
                                                    >
                                                        <X size={14} />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#101F1A]/10 bg-[#F5F2EA]/40 px-6 py-3.5 text-xs">
                                <span className="font-medium text-[#101F1A]/60">
                                    Showing{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)}
                                    </span>{' '}
                                    of <span className="font-bold text-[#101F1A]">{filteredPayments.length}</span> payments
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-2 font-bold text-[#101F1A]">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Booking Detail Drawer */}
            <BookingDetailDrawer
                isOpen={!!selectedBooking}
                booking={selectedBooking}
                mode="view"
                onClose={() => setSelectedBooking(null)}
                onVerify={(payment) => {
                    setSelectedBooking(null);
                    handleVerify(payment);
                }}
                onReject={(payment) => {
                    setSelectedBooking(null);
                    handleReject(payment);
                }}
                isProcessing={Boolean(processingId)}
            />
        </AuthenticatedLayout>
    );
}
