import { Link } from '@inertiajs/react';
import { CalendarCheck, Clock, MapPin } from 'lucide-react';

const statusStyles = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function PlayerBookingCard({ booking }) {
    const date = new Date(`${booking.date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    const time = (value) => new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });

    return (
        <article className="rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#101F1A]/50">Booking #{booking.id}</p>
                    <h3 className="mt-1 text-lg font-bold text-[#101F1A]">{booking.court?.name ?? 'Court unavailable'}</h3>
                    <p className="text-sm text-[#101F1A]/70">{booking.facility?.name ?? 'Facility unavailable'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[booking.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {booking.status === 'pending' ? 'Awaiting confirmation' : booking.status}
                </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-[#101F1A]/70 sm:grid-cols-2">
                <p className="flex items-center gap-2"><CalendarCheck size={16} aria-hidden="true" />{date}</p>
                <p className="flex items-center gap-2"><Clock size={16} aria-hidden="true" />{time(booking.start_time)} – {time(booking.end_time)}</p>
                <p className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Location unavailable'}</p>
                <p className="font-bold text-[#101F1A]">{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(booking.total_price))}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#101F1A]/10 pt-4">
                <p className="text-xs text-[#101F1A]/60">
                    Payment: <span className="font-bold capitalize">{booking.payment?.status ?? 'Not submitted'}</span>
                    {booking.payment?.payment_method && ` · ${booking.payment.payment_method.replaceAll('_', ' ')}`}
                </p>
                {booking.facility?.slug && (
                    <div className="flex gap-4 text-sm font-bold text-[#101F1A]">
                        <Link href={route('facility.show', booking.facility.slug)} className="underline underline-offset-4 hover:text-green-700">View Facility</Link>
                        <Link href={route('facility.book', booking.facility.slug)} className="underline underline-offset-4 hover:text-green-700">Book Again</Link>
                    </div>
                )}
            </div>
        </article>
    );
}

export function EmptyPlayerBookings({ message = 'You have no bookings yet.' }) {
    return (
        <div className="rounded-xl border border-dashed border-[#101F1A]/20 bg-white p-8 text-center">
            <CalendarCheck size={32} className="mx-auto text-[#101F1A]/40" aria-hidden="true" />
            <p className="mt-3 font-bold text-[#101F1A]">{message}</p>
            <p className="mt-2 text-sm text-[#101F1A]/60">Find a facility and reserve a court for your next game.</p>
            <Link href="/" className="mt-5 inline-block rounded-lg bg-[#D6FF3F] px-5 py-3 text-sm font-bold text-[#101F1A] hover:bg-[#c4ec36]">Explore Facilities</Link>
        </div>
    );
}