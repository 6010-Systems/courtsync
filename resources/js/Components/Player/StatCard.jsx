import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatCard({
    label,
    value,
    unit = '',
    icon: Icon,
    delta = null,
    deltaText = 'vs last month',
    higherIsBetter = true,
    subtitle = null,
    onClick = null,
    actionLabel = null,
    graphicType = 'court', // 'court' | 'target' | 'speed' | 'racket'
}) {
    const isClickable = typeof onClick === 'function';

    const getDeltaConfig = () => {
        if (delta === null || delta === undefined) {
            return {
                text: 'First month',
                tone: 'neutral',
                icon: Minus,
                classes: 'text-[#10221C]/60 bg-gray-50 border-gray-200/70',
            };
        }

        if (delta === 0) {
            return {
                text: '0.0%',
                tone: 'neutral',
                icon: Minus,
                classes: 'text-[#10221C]/70 bg-gray-50 border-gray-200/70',
            };
        }

        const isPositive = delta > 0;
        const isGood = higherIsBetter ? isPositive : !isPositive;
        const formatted = `${isPositive ? '+' : ''}${delta.toFixed(1)}%`;

        if (isGood) {
            return {
                text: formatted,
                tone: 'good',
                icon: isPositive ? TrendingUp : TrendingDown,
                classes: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
            };
        }

        return {
            text: formatted,
            tone: 'bad',
            icon: isPositive ? TrendingUp : TrendingDown,
            classes: 'text-[#FF5A36] bg-rose-50 border-[#FF5A36]/30',
        };
    };

    const deltaCfg = getDeltaConfig();
    const DeltaIcon = deltaCfg.icon;

    return (
        <motion.div
            whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={`group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 flex flex-col justify-between shadow-2xs transition-all duration-200 overflow-hidden ${
                isClickable ? 'cursor-pointer hover:border-[#10221C]/20 hover:shadow-xs' : 'hover:border-[#10221C]/15'
            }`}
        >
            {/* Background Athletic Line Geometry Graphic (Subtle SVG Watermark) */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.045] group-hover:opacity-[0.08] transition-opacity duration-300 text-[#10221C]">
                {graphicType === 'target' ? (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                        <circle cx="50" cy="50" r="42" strokeDasharray="4 4" />
                        <circle cx="50" cy="50" r="30" />
                        <circle cx="50" cy="50" r="16" />
                        <line x1="50" y1="0" x2="50" y2="100" />
                        <line x1="0" y1="50" x2="100" y2="50" />
                    </svg>
                ) : graphicType === 'speed' ? (
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" className="w-full h-full">
                        <line x1="0" y1="80" x2="100" y2="0" strokeWidth="4" />
                        <line x1="0" y1="95" x2="100" y2="15" strokeWidth="2" strokeDasharray="5 5" />
                        <line x1="0" y1="110" x2="100" y2="30" strokeWidth="3" />
                        <circle cx="80" cy="20" r="8" fill="currentColor" />
                    </svg>
                ) : (
                    /* Default Court Lines Watermark */
                    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                        <rect x="10" y="10" width="80" height="80" rx="4" />
                        <line x1="10" y1="50" x2="90" y2="50" strokeWidth="3" />
                        <line x1="50" y1="10" x2="50" y2="90" strokeDasharray="3 3" />
                        <line x1="28" y1="10" x2="28" y2="90" />
                        <line x1="72" y1="10" x2="72" y2="90" />
                        <circle cx="50" cy="50" r="14" />
                    </svg>
                )}
            </div>

            {/* Top Row: Label and Icon Badge */}
            <div className="relative z-10 flex items-start justify-between gap-3 mb-2.5">
                <span className="text-[11px] font-bold text-[#10221C]/50 uppercase tracking-widest leading-snug">
                    {label}
                </span>
                {Icon && (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#D6FF3F]/35 border border-[#D6FF3F]/70 text-[#10221C] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Icon size={17} strokeWidth={2.4} />
                    </div>
                )}
            </div>

            {/* Hero Metric Number with Animated Entrance */}
            <div className="relative z-10 my-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#10221C] tracking-tight leading-none">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-xs sm:text-sm font-bold text-[#10221C]/60">
                            {unit}
                        </span>
                    )}
                </div>
            </div>

            {/* Bottom Row: Delta Indicator or Subtitle */}
            <div className="relative z-10 mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                {subtitle ? (
                    <span className="text-xs font-semibold text-[#10221C]/65 truncate">
                        {subtitle}
                    </span>
                ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border tracking-tight ${deltaCfg.classes}`}>
                            <DeltaIcon size={11} strokeWidth={2.5} aria-hidden="true" />
                            <span>{deltaCfg.text}</span>
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-medium text-[#10221C]/45 truncate">
                            {deltaText}
                        </span>
                    </div>
                )}

                {actionLabel && (
                    <span className="text-[11px] font-bold text-[#10221C] group-hover:text-[#FF5A36] underline underline-offset-2 transition-colors shrink-0">
                        {actionLabel}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
