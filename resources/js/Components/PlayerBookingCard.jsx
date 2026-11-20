import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { 
    CalendarCheck, 
    Clock, 
    MapPin, 
    Ticket, 
    XCircle, 
    Phone, 
    Building2, 
    CreditCard, 
    CheckCircle2, 
    AlertCircle,
    Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';
import Dialog from '@/Components/Dialog';

const statusConfig = {
    pending: {
        label: 'Awaiting Confirmation',
        badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
        dot: 'bg-amber-500',
    },
    confirmed: {
        label: 'Confirmed',
        badge: 'bg-emerald-50 text-emerald-900 border-emerald-200/80',
        dot: 'bg-emerald-500',
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-rose-50 text-rose-900 border-rose-200/80',
        dot: 'bg-rose-500',
    },
};

export default function PlayerBookingCard({ booking }) {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const dateFormatted = new Date(`${booking.date}T12:00:00`).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    
    const timeFormatted = (value) => new Date(`2000-01-01T${value}`).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
    });

    const pesos = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);

    const total = Number(booking.total_price);
    const bookingFee = Number(booking.booking_fee ?? 0);
    const addonsTotal = Number(booking.addons_total ?? 0);
    const subtotal = booking.subtotal != null ? Number(booking.subtotal) : total - bookingFee - addonsTotal;
    const statusCfg = statusConfig[booking.status] || {
        label: booking.status,
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-400',
    };

    const handleConfirmCancel = () => {
        setIsCancelling(true);
        router.delete(route('bookings.destroy', booking.id), {
            onFinish: () => {
                setIsCancelling(false);
                setIsCancelOpen(false);
                setIsDetailsOpen(false);
            },
        });
    };

    return (
        <>
            <motion.article 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-2xl border border-[#101F1A]/10 bg-white p-5 shadow-card hover:shadow-lg transition-all duration-200 sm:p-6"
            >
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black tracking-widest text-[#101F1A]/40 uppercase">
                                Booking #{booking.id}
                            </span>
                            {booking.rate_plan_name && (
                                <span className="rounded-full bg-[#F5F2EA] px-2 py-0.5 text-[10px] font-bold text-[#101F1A]/70 border border-[#101F1A]/5">
                                    {booking.rate_plan_name}
                                </span>
                            )}
                        </div>
                        <h3 className="mt-1 text-lg font-bold text-[#101F1A] group-hover:text-[#FF5A36] transition-colors">
                            {booking.court?.name ?? 'Court unavailable'}
                        </h3>
                        <p className="text-xs sm:text-sm font-medium text-[#101F1A]/70 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-[#101F1A]/40 shrink-0" />
                            {booking.facility?.name ?? 'Facility unavailable'}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                    </span>
                </div>

                {/* Details Grid */}
                <div className="mt-4 grid gap-2.5 text-xs sm:text-sm text-[#101F1A]/75 sm:grid-cols-2 bg-[#FAF9F5] p-3.5 rounded-xl border border-[#101F1A]/5">
                    <p className="flex items-center gap-2">
                        <CalendarCheck size={15} className="text-[#101F1A]/50 shrink-0" />
                        <span className="font-semibold">{dateFormatted}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <Clock size={15} className="text-[#101F1A]/50 shrink-0" />
                        <span>{timeFormatted(booking.start_time)} – {timeFormatted(booking.end_time)}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#101F1A]/50 shrink-0" />
                        <span className="truncate">{[booking.facility?.city, booking.facility?.province].filter(Boolean).join(', ') || 'Location unavailable'}</span>
                    </p>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                        <span className="text-xs text-[#101F1A]/60">Total:</span>
                        <span className="font-black text-[#101F1A] text-sm sm:text-base">{pesos(total)}</span>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#101F1A]/10 pt-3.5">
                    <p className="text-xs text-[#101F1A]/60 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payment: <strong className="capitalize text-[#101F1A]">{booking.payment?.status ?? 'At Facility'}</strong></span>
                        {booking.payment?.payment_method && (
                            <span className="text-[#101F1A]/40">({booking.payment.payment_method.replaceAll('_', ' ')})</span>
                        )}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsDetailsOpen(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#101F1A] bg-[#F5F2EA] hover:bg-[#eae5d8] px-3 py-1.5 rounded-lg border border-[#101F1A]/10 transition"
                        >
                            <Ticket className="w-3.5 h-3.5 text-[#101F1A]/70" />
                            View Ticket
                        </button>

                        {booking.status === 'pending' && (
                            <button
                                type="button"
                                onClick={() => setIsCancelOpen(true)}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition"
                            >
                                Cancel
                            </button>
                        )}

                        {booking.facility?.slug && (
                            <Link 
                                href={route('facility.book', { facility: booking.facility.slug, court: booking.court_id })}
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#101F1A] bg-[#D6FF3F] hover:bg-[#c9f532] px-3 py-1.5 rounded-lg transition shadow-2xs"
                            >
                                Book Again
                            </Link>
                        )}
                    </div>
                </div>
            </motion.article>

            {/* Ticket & Details Dialog */}
            <Dialog
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                title={`Reservation Ticket #${booking.id}`}
                subtitle={`${booking.facility?.name ?? 'Venue'} · ${booking.court?.name ?? 'Court'}`}
                icon={Ticket}
                iconVariant="forest"
                size="lg"
            >
                <div className="space-y-4">
                    {/* Status Pill */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Status</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-bold ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                        </span>
                    </div>

                    {/* Schedule Information */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-[#FAF9F5] space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Date</span>
                            <span className="font-bold text-[#10221C]">{dateFormatted}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Time Slot</span>
                            <span className="font-bold text-[#10221C]">{timeFormatted(booking.start_time)} – {timeFormatted(booking.end_time)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Court</span>
                            <span className="font-bold text-[#10221C]">{booking.court?.name}</span>
                        </div>
                        {booking.rate_plan_name && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Rate Plan</span>
                                <span className="font-bold text-[#10221C]">{booking.rate_plan_name}</span>
                            </div>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 rounded-xl border border-gray-100 space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Court Subtotal</span>
                            <span className="font-semibold text-[#10221C]">{pesos(subtotal)}</span>
                        </div>
                        {addonsTotal > 0 && (
                            <div className="flex justify-between text-gray-500">
                                <span>Add-ons Total</span>
                                <span className="font-semibold text-[#10221C]">{pesos(addonsTotal)}</span>
                            </div>
                        )}
                        {bookingFee > 0 && (
                            <div className="flex justify-between text-gray-500">
                                <span>Platform Booking Fee</span>
                                <span className="font-semibold text-[#10221C]">{pesos(bookingFee)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                            <span className="font-bold text-[#10221C]">Total Paid / Due</span>
                            <span className="font-black text-lg text-[#10221C]">{pesos(total)}</span>
                        </div>
                    </div>

                    {/* Venue Location & Contact */}
                    {booking.facility && (
                        <div className="text-xs text-gray-500 p-3 rounded-xl bg-gray-50 space-y-1">
                            <p className="font-bold text-[#10221C]">{booking.facility.name}</p>
                            <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /> {[booking.facility.address, booking.facility.city, booking.facility.province].filter(Boolean).join(', ')}</p>
                            {booking.facility.phone_number && (
                                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" /> {booking.facility.phone_number}</p>
                            )}
                        </div>
                    )}

                    {/* Dialog Footer Actions */}
                    <div className="pt-2 flex justify-between items-center gap-3">
                        {booking.status === 'pending' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDetailsOpen(false);
                                    setIsCancelOpen(true);
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800"
                            >
                                Cancel this booking
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            type="button"
                            onClick={() => setIsDetailsOpen(false)}
                            className="px-4 py-2 rounded-xl bg-[#101F1A] text-[#D6FF3F] text-xs font-bold hover:bg-[#18342b] transition"
                        >
                            Close Ticket
                        </button>
                    </div>
                </div>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog
                isOpen={isCancelOpen}
                onClose={() => setIsCancelOpen(false)}
                title="Cancel Reservation?"
                subtitle={`Booking #${booking.id} on ${dateFormatted}`}
                icon={XCircle}
                iconVariant="coral"
                confirmText={isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
                confirmVariant="coral"
                onConfirm={handleConfirmCancel}
                isLoading={isCancelling}
                size="md"
            >
                <div className="text-sm text-gray-600 space-y-2">
                    <p>Are you sure you want to cancel this reservation for <strong>{booking.court?.name}</strong> at <strong>{booking.facility?.name}</strong>?</p>
                    <p className="text-xs text-gray-400">Your reserved time slot ({timeFormatted(booking.start_time)} – {timeFormatted(booking.end_time)}) will be released for other players.</p>
                </div>
            </Dialog>
        </>
    );
}

export function EmptyPlayerBookings({ message = 'You have no bookings yet.' }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border-2 border-dashed border-[#101F1A]/15 bg-white p-10 text-center shadow-xs"
        >
            <div className="w-14 h-14 rounded-2xl bg-[#D6FF3F]/40 border border-[#D6FF3F] text-[#10221C] flex items-center justify-center mx-auto mb-3">
                <CalendarCheck size={28} className="text-[#101F1A]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-base font-bold text-[#101F1A]">{message}</p>
            <p className="mt-1 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                Ready for a match? Find a court in your area and reserve your spot in just a few clicks.
            </p>
            <Link 
                href="/" 
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-[#D6FF3F] hover:bg-[#18342b] transition shadow-md shadow-[#101F1A]/10 active:scale-[0.98]"
            >
                Find & Book Courts
            </Link>
        </motion.div>
    );
}
