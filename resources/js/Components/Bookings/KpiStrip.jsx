import React from 'react';
import TrendBadge from './TrendBadge';
import { CalendarCheck, Activity, AlertTriangle, PhilippinePeso } from 'lucide-react';

export default function KpiStrip({ kpis }) {
    if (!kpis) return null;

    const cards = [
        {
            key: 'bookingsToday',
            data: kpis.bookingsToday,
            icon: CalendarCheck,
            iconBg: 'bg-[#D6FF3F]/20 text-[#101F1A]',
            accentBorder: 'hover:border-[#D6FF3F]',
        },
        {
            key: 'courtUtilization',
            data: kpis.courtUtilization,
            icon: Activity,
            iconBg: 'bg-[#10B981]/20 text-[#0E7A56]',
            accentBorder: 'hover:border-[#10B981]',
        },
        {
            key: 'cancellationRate',
            data: kpis.cancellationRate,
            icon: AlertTriangle,
            iconBg: 'bg-[#FF5A36]/20 text-[#B8391D]',
            accentBorder: 'hover:border-[#FF5A36]',
        },
        {
            key: 'revenueToday',
            data: kpis.revenueToday,
            icon: PhilippinePeso,
            iconBg: 'bg-[#D6FF3F] text-[#101F1A]',
            accentBorder: 'hover:border-[#D6FF3F]',
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-3.5">
            {cards.map(({ key, data, icon: Icon, iconBg, accentBorder }) => (
                <div
                    key={key}
                    className={[
                        'group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-2.5 sm:p-3 lg:p-3.5 shadow-card backdrop-blur-md transition-all duration-200 hover-lift',
                        accentBorder,
                    ].join(' ')}
                >
                    {/* Top row: Small Uppercase Label + Icon */}
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70 truncate">
                            {data.label}
                        </span>
                        <div className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-lg ${iconBg} shadow-2xs`}>
                            <Icon size={13} strokeWidth={2.4} />
                        </div>
                    </div>

                    {/* Middle: Value Number */}
                    <div className="my-1 sm:my-1.5">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#101F1A] leading-tight">
                            {data.value}
                        </div>
                    </div>

                    {/* Bottom: Trend Badge + Contextual Text */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 sm:pt-1.5 border-t border-[#101F1A]/5 text-[10px] sm:text-[11px]">
                        <TrendBadge
                            delta={data.delta}
                            polarity={data.polarity}
                        />
                        <span className="font-medium text-[#101F1A]/60 truncate">
                            {data.comparisonText}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
