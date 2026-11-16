import {
    Clock,
    MapPin,
    Plus,
    ReceiptText,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';

const STATUS_STYLES = {
    confirmed: { label: 'Confirmed', badge: 'bg-[#D6FF3F]/25 text-[#101F1A] border-[#D6FF3F]/60', dot: 'bg-[#101F1A]' },
    pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    completed: { label: 'Completed', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const PAYMENT_STYLES = {
    verified: { label: 'Verified', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700 border-red-200' },
    unpaid: { label: 'Unpaid', badge: 'bg-[#101F1A]/5 text-[#101F1A]/60 border-[#101F1A]/10' },
};

export function BookingStatusBadge({ status }) {
    const style = STATUS_STYLES[String(status).toLowerCase()] ?? STATUS_STYLES.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {style.label}
        </span>
    );
}

export function PaymentStatusBadge({ status }) {
    const style = PAYMENT_STYLES[String(status ?? 'unpaid').toLowerCase()] ?? PAYMENT_STYLES.unpaid;

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
            {style.label}
        </span>
    );
}

function durationLabel(startTime, endTime) {
    if (!startTime || !endTime) return null;

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    const hours = Math.max(0, endHour - startHour);

    return hours > 0 ? `${hours} hr${hours === 1 ? '' : 's'}` : null;
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

function customerName(booking) {
    return booking.user?.name || booking.guest_name || 'Walk-in';
}

export default function FacilityBookingsBoard({
    groups = [],
    viewMode = 'table',
    counts = {},
    onSelect,
    onVerify,
    onCancel,
    onDelete,
    onReceipt,
    onCreate,
    formatTime,
    formatDate,
    formatPeso,
}) {
    if (groups.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-[#101F1A]/20 bg-white px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101F1A]/5 text-[#101F1A]/40">
                    <Clock size={26} />
                </div>
                <h3 className="mt-3 text-base font-black text-[#101F1A]">No bookings found</h3>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#101F1A]/60">
                    {counts.all > 0
                        ? 'Nothing matches the current search or filter. Try another filter or clear the search.'
                        : 'Bookings appear here once players reserve a court. You can also log a walk-in manually.'}
                </p>
                {onCreate && (
                    <button
                        type="button"
                        onClick={onCreate}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#101F1A] px-4 py-2 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923]"
                    >
                        <Plus size={14} /> New booking
                    </button>
                )}
            </div>
        );
    }

    if (viewMode === 'card') {
        return (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {groups.flatMap((group) =>
                    group.bookings.map((booking) => (
                        <article
                            key={booking.id}
                            onClick={() => onSelect(booking)}
                            className="cursor-pointer rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card transition-colors hover:border-[#101F1A]/25"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                        {group.label} · {formatDate(booking.date)}
                                    </p>
                                    <p className="mt-1 text-sm font-black text-[#101F1A]">
                                        {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                                    </p>
                                </div>
                                <BookingStatusBadge status={booking.status} />
                            </div>

                            <div className="mt-3 space-y-1.5 text-xs text-[#101F1A]/70">
                                <p className="flex items-center gap-1.5 font-bold text-[#101F1A]">
                                    <MapPin size={12} /> {booking.court?.name || 'Court'}
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <User size={12} /> {customerName(booking)}
                                </p>
                                <div className="flex items-center justify-between pt-1">
                                    <PaymentStatusBadge status={booking.payment?.status ?? 'unpaid'} />
                                    <span className="text-sm font-black text-[#101F1A]">{formatPeso(booking.total_price)}</span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[#101F1A]/10 pt-3">
                                {booking.payment?.proof_path && (
                                    <button
                                        type="button"
                                        onClick={(event) => { event.stopPropagation(); onReceipt(booking); }}
                                        className="rounded-lg p-1.5 text-[#101F1A]/50 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                        title="View receipt"
                                    >
                                        <ReceiptText size={15} />
                                    </button>
                                )}
                                {booking.status === 'pending' && (
                                    <button
                                        type="button"
                                        onClick={(event) => { event.stopPropagation(); onVerify(booking); }}
                                        className="rounded-lg bg-[#101F1A] px-2.5 py-1 text-[11px] font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923]"
                                    >
                                        Verify
                                    </button>
                                )}
                                {booking.status !== 'cancelled' && (
                                    <button
                                        type="button"
                                        onClick={(event) => { event.stopPropagation(); onCancel(booking); }}
                                        className="rounded-lg p-1.5 text-[#101F1A]/50 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                        title="Cancel booking"
                                    >
                                        <XCircle size={15} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(event) => { event.stopPropagation(); onDelete(booking); }}
                                    className="rounded-lg p-1.5 text-[#101F1A]/40 transition-colors hover:bg-red-50 hover:text-red-600"
                                    title="Delete booking"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </article>
                    )),
                )}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-[#101F1A]">
                        <tr>
                            {['Time', 'Court', 'Customer', 'Payment', 'Booking', 'Price', 'Actions'].map((heading, index) => (
                                <th
                                    key={heading}
                                    scope="col"
                                    className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/60 ${index >= 5 ? 'text-right' : 'text-left'}`}
                                >
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {groups.map((group) => {
                        const dayTotal = group.bookings
                            .filter((booking) => booking.status !== 'cancelled')
                            .reduce((sum, booking) => sum + Number(booking.total_price || 0), 0);

                        return (
                            <tbody key={group.date} className="divide-y divide-[#101F1A]/5">
                                <tr>
                                    <td colSpan={7} className="border-t border-[#101F1A]/10 bg-[#101F1A]/[0.03] px-4 py-2">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-[#101F1A]">{group.label}</span>
                                                <span className="text-[11px] text-[#101F1A]/50">{formatDate(group.date)}</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-[#101F1A]/60">
                                                {group.bookings.length} booking{group.bookings.length === 1 ? '' : 's'} · {formatPeso(dayTotal)}
                                            </span>
                                        </div>
                                    </td>
                                </tr>

                                {group.bookings.map((booking) => {
                                    const customer = customerName(booking);
                                    const isRegistered = Boolean(booking.user?.name);

                                    return (
                                        <tr
                                            key={booking.id}
                                            onClick={() => onSelect(booking)}
                                            className="cursor-pointer transition-colors hover:bg-[#101F1A]/[0.02]"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="text-xs font-black text-[#101F1A]">
                                                    {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
                                                </p>
                                                <p className="text-[10px] text-[#101F1A]/50">
                                                    {durationLabel(booking.start_time, booking.end_time) ?? '—'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <p className="text-xs font-bold text-[#101F1A]">{booking.court?.name || 'Court'}</p>
                                                <p className="text-[10px] text-[#101F1A]/50">{booking.facility?.name ?? ''}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${isRegistered ? 'bg-[#D6FF3F] text-[#101F1A]' : 'bg-[#101F1A]/10 text-[#101F1A]/60'}`}>
                                                        {initials(customer)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-[#101F1A]">{customer}</p>
                                                        <p className="text-[10px] text-[#101F1A]/50">
                                                            {isRegistered ? 'Registered player' : 'Walk-in'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <PaymentStatusBadge status={booking.payment?.status ?? 'unpaid'} />
                                                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#101F1A]/40">
                                                    {booking.payment?.payment_method ?? 'No payment'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <BookingStatusBadge status={booking.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-black text-[#101F1A]">
                                                {formatPeso(booking.total_price)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {booking.payment?.proof_path && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => { event.stopPropagation(); onReceipt(booking); }}
                                                            className="rounded-lg p-1.5 text-[#101F1A]/50 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                            title="View receipt"
                                                        >
                                                            <ReceiptText size={15} />
                                                        </button>
                                                    )}

                                                    {booking.status === 'pending' && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => { event.stopPropagation(); onVerify(booking); }}
                                                            className="rounded-lg bg-[#101F1A] px-2.5 py-1 text-[11px] font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923]"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}

                                                    {booking.status !== 'cancelled' && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => { event.stopPropagation(); onCancel(booking); }}
                                                            className="rounded-lg p-1.5 text-[#101F1A]/50 transition-colors hover:bg-amber-50 hover:text-amber-600"
                                                            title="Cancel booking"
                                                        >
                                                            <XCircle size={15} />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(event) => { event.stopPropagation(); onDelete(booking); }}
                                                        className="rounded-lg p-1.5 text-[#101F1A]/40 transition-colors hover:bg-red-50 hover:text-red-600"
                                                        title="Delete booking"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        );
                    })}
                </table>
            </div>
        </div>
    );
}
