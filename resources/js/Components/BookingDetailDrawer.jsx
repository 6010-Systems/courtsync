import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, User, Banknote, ShieldCheck, Check, Sparkles } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function BookingDetailDrawer({ isOpen, onClose, booking, mode = 'view' }) {
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

    const isSuccess = mode === 'success';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#10221C]/40 backdrop-blur-sm z-40"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto flex flex-col relative">
                            
                            {/* Top Section */}
                            <div className="bg-[#101F1A] px-5 py-6 flex flex-col items-center text-center relative">

                                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-3 text-[#D6FF3F] shadow-inner">
                                    {isSuccess ? (
                                        <Check size={28} strokeWidth={3} />
                                    ) : (
                                        <ShieldCheck size={28} strokeWidth={2.5} />
                                    )}
                                </div>
                                
                                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                                    {isSuccess ? 'Booking Added Successfully!' : 'Booking Details'}
                                </h2>
                                
                                {isSuccess ? (
                                    <p className="text-white/70 text-sm leading-tight">
                                        {booking.user?.name || booking.guest_name || 'Walk-in player'} has been registered in the system.
                                    </p>
                                ) : (
                                    <span className="px-3 py-1 bg-[#D6FF3F] text-[#101F1A] text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                                        {booking.status}
                                    </span>
                                )}
                            </div>

                            {/* Bottom Section (Details) */}
                            <div className="p-4 bg-[#F8F9FA]">
                                <div className="space-y-2 mb-4">
                                    
                                    {/* Main Info Card */}
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                                                <User size={12} /> Player Info
                                            </span>
                                            {booking.user?.email && (
                                                <span className="text-[9px] bg-[#D6FF3F]/20 text-[#10221C] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Registered</span>
                                            )}
                                        </div>
                                        <div className="text-[15px] font-black text-[#10221C] truncate">
                                            {booking.user?.name || booking.guest_name || 'Walk-in'}
                                            {booking.user?.email && (
                                                <span className="text-gray-400 font-medium text-[12px] ml-1.5">
                                                    • {booking.user.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2-Column Details: Date & Time */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <Calendar size={12} /> Date
                                            </span>
                                            <span className="text-[14px] font-bold text-[#10221C] truncate">
                                                {formatDate(booking.date)}
                                            </span>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <Clock size={12} /> Time
                                            </span>
                                            <span className="text-[13px] font-bold text-[#10221C] truncate">
                                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Court and Price */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-center overflow-hidden">
                                            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium uppercase tracking-wide mb-0.5">
                                                <MapPin size={12} /> Court
                                            </span>
                                            <span className="text-[14px] font-black text-[#10221C] truncate">
                                                {booking.court?.name || 'Unknown'}
                                            </span>
                                        </div>
                                        <div className="bg-[#D6FF3F] p-2 rounded-xl shadow-md flex flex-col justify-center relative overflow-hidden group">
                                            <Banknote size={48} className="absolute -right-3 -bottom-3 text-[#10221C]/10 group-hover:scale-110 transition-transform duration-300" />
                                            <span className="flex items-center gap-1.5 text-[11px] text-[#10221C]/60 font-bold uppercase tracking-wide mb-0.5 relative z-10">
                                                Total Price
                                            </span>
                                            <span className="text-lg font-black text-[#10221C] leading-tight truncate relative z-10">
                                                ₱{Number(booking.total_price).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer / Actions */}
                                {isSuccess && (
                                    <div className="pt-3 border-t border-[#10221C]/10 flex items-center gap-2 text-sm text-green-700 font-medium bg-green-50/50 -mx-4 -mb-4 p-4">
                                        <Sparkles size={16} className="text-green-600" />
                                        <span>Booking successfully confirmed and logged.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
