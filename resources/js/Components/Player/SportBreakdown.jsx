import React from 'react';
import { motion } from 'framer-motion';

export default function SportBreakdown({ 
    breakdown = [
        { sport: 'Pickleball', count: 14, pct: 58, color: '#D6FF3F', text: '#101F1A', border: '#10221C' },
        { sport: 'Basketball', count: 6, pct: 25, color: '#FF7A00', text: '#FFFFFF', border: '#10221C' },
        { sport: 'Badminton', count: 4, pct: 17, color: '#10B981', text: '#FFFFFF', border: '#10221C' },
    ] 
}) {
    const totalGames = breakdown.reduce((acc, item) => acc + item.count, 0);

    return (
        <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-[#10221C]/20 transition-all overflow-hidden"
        >
            {/* Background Athletic Watermark */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.035] text-[#10221C]">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                    <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
                    <line x1="50" y1="5" x2="50" y2="95" />
                    <line x1="10" y1="50" x2="90" y2="50" />
                </svg>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div>
                    <span className="text-[11px] font-bold text-[#10221C]/50 uppercase tracking-widest block">
                        Sport Breakdown
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#10221C] tracking-tight mt-0.5">
                        {totalGames} <span className="text-xs font-bold text-[#10221C]/50">Total Matches</span>
                    </h3>
                </div>
            </div>

            {/* List of Sports with Animated Horizontal Percentage Bars */}
            <div className="relative z-10 space-y-3.5 my-1">
                {breakdown.map((item, index) => (
                    <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#10221C]">{item.sport}</span>
                            <div className="flex items-center gap-2 font-semibold text-[#10221C]/60 text-[11px]">
                                <span>{item.count} games</span>
                                <span className="font-black text-[#10221C] bg-[#FAF9F5] px-1.5 py-0.5 rounded border border-[#10221C]/6">
                                    {item.pct}%
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar Container with Motion */}
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-[#10221C]/6 p-0.5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.pct}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                                className="h-full rounded-full border border-[#10221C]/10 shadow-2xs"
                                style={{
                                    backgroundColor: item.color,
                                }}
                                role="progressbar"
                                aria-valuenow={item.pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${item.sport}: ${item.pct}% of games`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Sport Tip */}
            <div className="relative z-10 mt-3 pt-2.5 border-t border-[#10221C]/6 text-[11px] font-medium text-[#10221C]/50 flex items-center justify-between">
                <span>Top Sport: <strong className="text-[#10221C] font-black">Pickleball</strong></span>
                <span className="text-[#FF5A36] font-bold">58% share</span>
            </div>
        </motion.div>
    );
}
