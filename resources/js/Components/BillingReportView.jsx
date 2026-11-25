import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, router } from '@inertiajs/react';
import { formatCount, formatPeso } from '@/Components/MetricCard';
import {
    ArrowLeft,
    Banknote,
    Building2,
    CalendarCheck2,
    CheckCircle2,
    ChevronRight,
    ReceiptText,
} from 'lucide-react';

const PAYMENT_STYLES = {
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    unpaid: 'bg-[#101F1A]/5 text-[#101F1A]/60 border-[#101F1A]/10',
};

const BOOKING_STYLES = {
    confirmed: 'bg-[#D6FF3F]/25 text-[#101F1A] border-[#D6FF3F]/60',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const SOURCE_LABELS = {
    online: 'Online',
    walk_in: 'Walk-in',
    staff_block: 'Court block',
};

function formatBookingDate(value) {
    if (!value) return '—';

    return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function formatBookingTime(value) {
    if (!value) return '—';

    return new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });
}

function StatCard({ label, value, hint, icon: Icon }) {
    return (
        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">{label}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D6FF3F] text-[#101F1A]">
                    <Icon size={16} strokeWidth={2.25} />
                </span>
            </div>
            <p className="mt-3 text-2xl font-black text-[#101F1A]">{value}</p>
            {hint ? <p className="mt-1 text-xs text-[#101F1A]/60">{hint}</p> : null}
        </div>
    );
}

export default function BillingReportView({
    title,
    subtitle,
    reportRoute,
    billingStatusRoute = null,
    canManageBilling = false,
    headerAction = null,
    filters,
    monthOptions = [],
    facilityOptions = [],
    summary = {},
    facilities = [],
    selectedFacility = null,
    breakdown = [],
}) {
    const applyFilters = ({ month = filters.month, facilityId = filters.facility_id } = {}) => {
        const params = { month };

        if (facilityId) {
            params.facility_id = facilityId;
        }

        router.get(route(reportRoute), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const toggleBilling = (facility) => {
        if (!canManageBilling || !billingStatusRoute) {
            return;
        }

        const nextStatus = facility.billing_status === 'BILLED' ? 'UNBILLED' : 'BILLED';

        router.post(
            route(billingStatusRoute, facility.facility_id ?? facility.id),
            { period: filters.month, status: nextStatus },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={title}
                    subtitle={subtitle}
                    actions={headerAction}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title={title} />

            <div className="w-full space-y-4 pb-2">
                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label htmlFor="report-month" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Month
                            </label>
                            <select
                                id="report-month"
                                value={filters.month}
                                onChange={(e) => applyFilters({ month: e.target.value })}
                                className="h-9 rounded-lg border border-[#101F1A]/15 bg-white px-3 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer"
                            >
                                {monthOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="report-facility" className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Facility
                            </label>
                            <select
                                id="report-facility"
                                value={filters.facility_id ?? ''}
                                onChange={(e) => applyFilters({ facilityId: e.target.value || null })}
                                className="h-9 max-w-[260px] rounded-lg border border-[#101F1A]/15 bg-white px-3 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer"
                            >
                                <option value="">All facilities</option>
                                {facilityOptions.map((facility) => (
                                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <p className="max-w-md text-xs leading-relaxed text-[#101F1A]/60">
                        Collection covers bookings with a booking fee, excluding cancelled bookings. A fee counts as collected once its payment is verified. Mark a facility as billed once its monthly collection is settled.
                    </p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard label="Facilities w/ Fees" value={formatCount(summary.facilities ?? 0)} hint={`${formatCount(summary.billed_facilities ?? 0)} billed · ${formatCount(summary.unbilled_facilities ?? 0)} not billed`} icon={Building2} />
                    <StatCard label="Bookings w/ Fee" value={formatCount(summary.bookings ?? 0)} hint={`Court rate subtotal ${formatPeso(summary.subtotal ?? 0)}`} icon={CalendarCheck2} />
                    <StatCard label="Booking Fees Due" value={formatPeso(summary.booking_fee ?? 0)} hint={`${formatPeso(summary.pending_fee ?? 0)} still pending`} icon={ReceiptText} />
                    <StatCard label="Online Fees" value={formatPeso(summary.online_fee ?? 0)} hint="From online bookings" icon={ReceiptText} />
                    <StatCard label="Walk-in Fees" value={formatPeso(summary.walk_in_fee ?? 0)} hint="From desk/walk-in bookings" icon={Banknote} />
                    <StatCard label="Fees Collected" value={formatPeso(summary.collected_fee ?? 0)} hint={`${formatPeso(summary.billed_fee ?? 0)} billed · ${formatPeso(summary.unbilled_fee ?? 0)} not billed`} icon={CheckCircle2} />
                </div>

                {/* Per-facility summary */}
                <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#101F1A]/10 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-black text-[#101F1A]">Collection Summary per Facility</h2>
                            <p className="text-xs text-[#101F1A]/60">{formatCount(facilities.length)} facilities with booking fees this month</p>
                        </div>
                        <span className="rounded-full bg-[#D6FF3F] px-3 py-1 text-xs font-black text-[#101F1A]">
                            {formatPeso(summary.booking_fee ?? 0)} due
                        </span>
                    </div>

                    {facilities.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                            <ReceiptText size={32} className="mx-auto text-[#101F1A]/30" />
                            <p className="mt-3 text-sm font-bold text-[#101F1A]">No booking fees recorded for this month.</p>
                            <p className="mt-1 text-xs text-[#101F1A]/60">Facilities only appear once they have bookings with a configured booking fee.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#101F1A]/5">
                                <thead className="bg-[#101F1A]/[0.02]">
                                    <tr>
                                        {['Facility', 'Owner', 'Bookings', 'Court Rate', 'Fee Due', 'Collected', 'Pending', 'Billing', 'Total Value', ''].map((heading, index) => (
                                            <th
                                                key={heading || 'chevron'}
                                                scope="col"
                                                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 ${index >= 2 && index <= 6 ? 'text-right' : 'text-left'}`}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {facilities.map((facility) => {
                                        const isSelected = selectedFacility?.id === facility.facility_id;

                                        return (
                                            <tr
                                                key={facility.facility_id}
                                                onClick={() => applyFilters({ facilityId: facility.facility_id })}
                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#D6FF3F]/15' : 'hover:bg-[#101F1A]/[0.02]'}`}
                                                title="View booking breakdown"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-bold text-[#101F1A]">{facility.name}</p>
                                                    <p className="text-[11px] text-[#101F1A]/50">
                                                        {[facility.city, facility.province].filter(Boolean).join(', ') || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-[#101F1A]">{facility.owner || '—'}</p>
                                                    <p className="text-[11px] text-[#101F1A]/50">{facility.owner_email || ''}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-[#101F1A]">{formatCount(facility.bookings_count)}</td>
                                                <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatPeso(facility.subtotal)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">
                                                    {formatPeso(facility.booking_fee)}
                                                    <p className="text-[10px] font-medium text-[#101F1A]/50">{formatPeso(facility.walk_in_fee ?? 0)} walk-in</p>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-emerald-700">{formatPeso(facility.collected_fee)}</td>
                                                <td className="px-4 py-3 text-right text-sm text-amber-700">{formatPeso(facility.pending_fee)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            title={facility.billed_at ? `Billed ${facility.billed_at}` : 'Not billed yet'}
                                                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${facility.billing_status === 'BILLED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                                                        >
                                                            {facility.billing_status === 'BILLED' ? 'Billed' : 'Not billed'}
                                                        </span>
                                                        {canManageBilling && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleBilling(facility);
                                                                }}
                                                                className="rounded-lg border border-[#101F1A]/15 bg-white px-2 py-1 text-[10px] font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                                                            >
                                                                {facility.billing_status === 'BILLED' ? 'Mark not billed' : 'Mark billed'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatPeso(facility.total_price)}</td>
                                                <td className="px-4 py-3 text-right text-[#101F1A]/40"><ChevronRight size={16} /></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-[#101F1A]/[0.03]">
                                    <tr>
                                        <td className="px-4 py-3 text-xs font-black uppercase tracking-wider text-[#101F1A]" colSpan={2}>Totals</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">{formatCount(summary.bookings ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">{formatPeso(summary.subtotal ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">{formatPeso(summary.booking_fee ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-emerald-700">{formatPeso(summary.collected_fee ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-black text-amber-700">{formatPeso(summary.pending_fee ?? 0)}</td>
                                        <td />
                                        <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">{formatPeso(summary.total_price ?? 0)}</td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {selectedFacility && (
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#101F1A]/10 px-4 py-3">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => applyFilters({ facilityId: null })}
                                    className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 hover:text-[#101F1A]"
                                >
                                    <ArrowLeft size={12} /> All facilities
                                </button>
                                <h2 className="text-base font-black text-[#101F1A]">{selectedFacility.name}</h2>
                                <p className="text-xs text-[#101F1A]/60">
                                    {[selectedFacility.owner, [selectedFacility.city, selectedFacility.province].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'Facility breakdown'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50">Bookings in breakdown</p>
                                <p className="text-lg font-black text-[#101F1A]">{formatCount(breakdown.length)}</p>
                                <div className="mt-1 flex items-center justify-end gap-2">
                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${selectedFacility.billing_status === 'BILLED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                        {selectedFacility.billing_status === 'BILLED' ? 'Billed' : 'Not billed'}
                                    </span>
                                    {canManageBilling && (
                                        <button
                                            type="button"
                                            onClick={() => toggleBilling({ id: selectedFacility.id, billing_status: selectedFacility.billing_status })}
                                            className="rounded-lg border border-[#101F1A]/15 bg-white px-2 py-1 text-[10px] font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                                        >
                                            {selectedFacility.billing_status === 'BILLED' ? 'Mark not billed' : 'Mark billed'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {breakdown.length === 0 ? (
                            <div className="px-4 py-10 text-center text-sm text-[#101F1A]/60">
                                No fee-bearing bookings for this facility in {monthOptions.find((option) => option.value === filters.month)?.label ?? filters.month}.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#101F1A]/5">
                                    <thead className="bg-[#101F1A]/[0.02]">
                                        <tr>
                                            {['Date', 'Court', 'Player', 'Court Rate', 'Booking Fee', 'Total Paid', 'Booking', 'Payment'].map((heading, index) => (
                                                <th
                                                    key={heading}
                                                    scope="col"
                                                    className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 ${index >= 3 && index <= 5 ? 'text-right' : 'text-left'}`}
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#101F1A]/5">
                                        {breakdown.map((row) => (
                                            <tr key={row.id} className="transition-colors hover:bg-[#101F1A]/[0.02]">
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-bold text-[#101F1A]">{formatBookingDate(row.date)}</p>
                                                    <p className="text-[11px] text-[#101F1A]/50">
                                                        {formatBookingTime(row.start_time)} – {formatBookingTime(row.end_time)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[#101F1A]">{row.court}</td>
                                                <td className="px-4 py-3 text-sm text-[#101F1A]">
                                                    <p>{row.player}</p>
                                                    <p className="text-[11px] text-[#101F1A]/50">Booking #{row.id} · {SOURCE_LABELS[row.source] ?? 'Online'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm text-[#101F1A]/70">{formatPeso(row.subtotal)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-black text-[#101F1A]">{formatPeso(row.booking_fee)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-[#101F1A]">{formatPeso(row.total_price)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${BOOKING_STYLES[row.status] ?? 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PAYMENT_STYLES[row.payment_status] ?? PAYMENT_STYLES.unpaid}`}>
                                                        {row.payment_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
