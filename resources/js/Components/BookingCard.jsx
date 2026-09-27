import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { useConfirm } from '@/Components/ConfirmContext';
import { router } from '@inertiajs/react';

export default function BookingCard({ booking, onClick }) {
    const { confirm } = useConfirm();
    const statusColors = {
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
        confirmed: 'bg-[#D6FF3F]/20 text-[#10221C] border-[#D6FF3F]/50',
        completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };

    const formatTime = (timeString) => {
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <motion.div 
            whileHover={{ y: -2, scale: 1.01 }}
            onClick={onClick}
            className="bg-white border border-[#10221C]/12 rounded-2xl p-4 shadow-subtle cursor-pointer hover:border-[#10221C]/30 transition-colors flex flex-col gap-4"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-[#10221C] font-black text-lg">{booking.court?.name || 'Unknown Court'}</h3>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium mt-1">
                        <Calendar size={12} />
                        <span>{formatDate(booking.date)}</span>
                        <span className="mx-1">•</span>
                        <Clock size={12} />
                        <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                    </div>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md border ${statusColors[booking.status] || statusColors.pending}`}>
                    {booking.status}
                </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#10221C]/5 flex items-center justify-center shrink-0">
                        <User size={14} className="text-[#10221C]" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#10221C]">{booking.user?.name || booking.guest_name}</p>
                        <p className="text-[10px] text-gray-500">Player</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-[#10221C]">₱{Number(booking.total_price).toLocaleString()}</p>
                </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-row items-center gap-2 pt-2 border-t border-[#10221C]/5 mt-1">
                {booking.status === 'pending' && (
                    <button
                        onClick={async (e) => { 
                            e.stopPropagation();
                            const ok = await confirm({
                                title: 'Verify Payment',
                                message: 'Are you sure you want to mark this booking as paid and confirmed?',
                                confirmText: 'Verify Payment',
                                type: 'success'
                            });
                            if (ok) router.patch(route('bookings.update', booking.id), { status: 'confirmed' }, { preserveScroll: true });
                        }}
                        className="flex-[2] py-2 bg-[#10221C] text-[#D6FF3F] text-xs font-bold rounded-lg hover:bg-[#1a352b] transition-colors text-center"
                    >
                        Verify Payment
                    </button>
                )}
                {booking.status !== 'cancelled' && (
                    <button
                        onClick={async (e) => { 
                            e.stopPropagation();
                            const ok = await confirm({
                                title: 'Cancel Booking',
                                message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
                                confirmText: 'Cancel Booking',
                                type: 'warning'
                            });
                            if (ok) router.patch(route('bookings.update', booking.id), { status: 'cancelled' }, { preserveScroll: true });
                        }}
                        className="flex-1 py-2 bg-gray-50 text-gray-500 hover:text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors text-center"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </motion.div>
    );
}
