import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function TrendBadge({
    delta = 0,
    polarity = 'higher-is-better', // 'higher-is-better' | 'lower-is-better'
    className = '',
}) {
    if (delta === 0 || delta === null || delta === undefined) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-[#101F1A]/5 px-2 py-0.5 text-[11px] font-bold text-[#101F1A]/60 ${className}`}>
                <Minus size={12} strokeWidth={2.5} />
                <span>0.0%</span>
            </span>
        );
    }

    const isPositive = delta > 0;
    // Determine if this delta is "good" or "bad" based on metric polarity
    const isGood = polarity === 'lower-is-better' ? !isPositive : isPositive;

    const formattedDelta = `${isPositive ? '+' : ''}${delta.toFixed(1)}%`;
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <span
            className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-tight shadow-2xs transition-colors',
                isGood
                    ? 'bg-[#10B981]/15 text-[#0E7A56] border border-[#10B981]/20'
                    : 'bg-[#FF5A36]/15 text-[#B8391D] border border-[#FF5A36]/20',
                className,
            ].join(' ')}
        >
            <Icon size={12} strokeWidth={2.5} />
            <span>{formattedDelta}</span>
        </span>
    );
}
