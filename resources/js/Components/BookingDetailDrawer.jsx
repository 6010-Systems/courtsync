import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, User, Banknote, ShieldCheck } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function BookingDetailDrawer({ isOpen, onClose, booking }) {
    if (!booking) return null;

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (timeString) => {
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        confirmed: 'bg-[#D6FF3F]/20 text-[#10221C] border-[#D6FF3F]/50',
        completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        cancelled: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#10221C]/40 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0.5 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0.5 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-[#10221C]/10"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[#10221C]/10 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-black text-[#10221C]">Booking Details</h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">ID: #{booking.id}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Status & Price */}
                            <div className="bg-[#10221C] rounded-2xl p-5 text-white shadow-subtle relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <ShieldCheck size={100} />
                                </div>
                                <div className="relative z-10 flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Status</p>
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border ${statusColors[booking.status] || statusColors.pending}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1">Total Price</p>
                                        <p className="text-3xl font-black text-[#D6FF3F] leading-none">₱{Number(booking.total_price).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <Calendar size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
                                        <p className="text-sm font-bold text-[#10221C]">{formatDate(booking.date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <Clock size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time</p>
                                        <p className="text-sm font-bold text-[#10221C]">{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <MapPin size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Court</p>
                                        <p className="text-sm font-bold text-[#10221C]">{booking.court?.name || 'Unknown Court'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                        <User size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Player</p>
                                        <p className="text-sm font-bold text-[#10221C]">{booking.user?.name || booking.guest_name}</p>
                                        {booking.user?.email && <p className="text-xs text-gray-500">{booking.user.email}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-[#10221C]/10 bg-gray-50/50">
                            <div className="flex gap-3">
                                {booking.status === 'pending' && (
                                    <PrimaryButton className="flex-1 justify-center !bg-[#10221C] text-[#D6FF3F]">
                                        Verify Payment
                                    </PrimaryButton>
                                )}
                                {booking.status !== 'cancelled' && (
                                    <button className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
