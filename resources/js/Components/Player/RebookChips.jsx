import React from 'react';
import { ArrowRight } from 'lucide-react';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function RebookChips({ 
    suggestions = [
        { 
            id: 1, 
            court: 'Center Court', 
            facility: 'Bogo City Sports & Pickleball Hub', 
            sport: 'Pickleball', 
            time: 'Sat 8:00 AM', 
            slug: 'courtsync-premier-arena',
            courtId: 3 
        },
        { 
            id: 2, 
            court: 'Court 1', 
            facility: 'Cebu Smash Badminton Arena', 
            sport: 'Badminton', 
            time: 'Sun 4:00 PM', 
            slug: 'courtsync-premier-arena',
            courtId: 1 
        },
        { 
            id: 3, 
            court: 'Court 2', 
            facility: 'Mandaue Metro Play Arena', 
            sport: 'Basketball', 
            time: 'Wed 6:00 PM', 
            slug: 'metro-play-complex',
            courtId: 2 
        },
    ] 
}) {
    if (!suggestions || suggestions.length === 0) return null;

    const handleRebook = (suggestion) => {
        if (suggestion.slug) {
            router.get(route('facility.book', { 
                facility: suggestion.slug,
                court: suggestion.courtId,
                from: 'dashboard',
            }));
        } else {
            router.get(route('dashboard'));
        }
    };

    return (
        <div className="group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 shadow-2xs overflow-hidden">
            {/* Background Graphic Watermark */}
            <div className="pointer-events-none absolute -right-6 -bottom-6 w-28 h-28 opacity-[0.03] text-[#10221C]">
                <svg viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="40" />
                </svg>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
                <div>
                    <span className="text-xs font-black text-[#10221C] uppercase tracking-wider">
                        Play Again <span className="text-[#10221C]/50 font-semibold">(Quick Rebook)</span>
                    </span>
                </div>
                <span className="text-[11px] text-[#10221C]/50 font-medium hidden sm:inline">
                    Prefilled from your past matches
                </span>
            </div>

            {/* Chips: Mobile-friendly swipeable carousel, desktop 3-col grid with subtle borders */}
            <div className="relative z-10 flex overflow-x-auto pb-1.5 -mx-1 px-1 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 gap-3 no-scrollbar snap-x snap-mandatory">
                {suggestions.map((item) => (
                    <motion.button
                        key={item.id}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.18 }}
                        type="button"
                        onClick={() => handleRebook(item)}
                        className="group/chip min-w-[240px] sm:min-w-0 snap-start text-left p-3 rounded-xl border border-[#10221C]/6 bg-white hover:border-[#10221C]/20 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#10221C] text-[#D6FF3F] shrink-0">
                                {item.sport}
                            </span>
                            <span className="text-[11px] font-bold text-[#10221C]/60 truncate">
                                {item.time}
                            </span>
                        </div>

                        <div className="my-1">
                            <p className="font-display font-black text-sm text-[#10221C] group-hover/chip:text-[#FF5A36] transition-colors truncate">
                                {item.court}
                            </p>
                            <p className="text-xs text-[#10221C]/65 font-medium truncate mt-0.5">
                                {item.facility}
                            </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#10221C]/6 flex items-center justify-between text-xs text-[#10221C] font-bold">
                            <span className="text-[11px] text-[#10221C]/60 group-hover/chip:text-[#10221C]">One-click book</span>
                            <ArrowRight size={13} className="text-[#10221C]/50 group-hover/chip:text-[#FF5A36] group-hover/chip:translate-x-1 transition-all" />
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
