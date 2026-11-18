import { Moon, Sun } from 'lucide-react';

import { formatPeso } from '@/Components/MetricCard';
import { planRates } from '@/Utils/rateQuote';

/**
 * 12-hour label for a stored time, e.g. "05:00:00" -> "5:00 AM".
 */
function formatHour(value) {
    const [hourString] = String(value || '').split(':');
    const hour = Number(hourString);

    if (Number.isNaN(hour)) {
        return String(value || '');
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:00 ${suffix}`;
}

/**
 * Short inclusion line, e.g. "Court, ball & 4 paddles".
 */
function inclusionLabel(plan) {
    if (plan.description) {
        return plan.description;
    }

    if (plan.kind === 'ADDON') {
        return 'Per paddle, per hour';
    }

    const items = ['Court'];

    if (plan.includes_ball) {
        items.push('ball');
    }

    const paddles = Number(plan.included_paddles || 0);

    if (paddles > 0) {
        items.push(`${paddles} ${paddles === 1 ? 'paddle' : 'paddles'}`);
    }

    return items.join(', ');
}

/**
 * Day/night price boxes for one or more rate-card packages.
 * Mirrors the printed poster so players can see the price under the court.
 */
export default function CourtRatePlans({ plans = [], className = '' }) {
    if (!plans || plans.length === 0) {
        return null;
    }

    return (
        <div className={`space-y-1.5 ${className}`}>
            {plans.map((plan) => {
                const { day, night } = planRates(plan);
                const includedPaddles = Number(plan.included_paddles || 0);

                return (
                    <div key={plan.id} className="rounded-xl border border-[#10221C]/10 bg-[#FAF9F5] p-2">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[11px] font-black text-[#10221C]">{plan.name}</p>
                            {includedPaddles > 0 && (
                                <span className="shrink-0 rounded-full bg-[#D6FF3F] px-1.5 py-0.5 text-[8px] font-black text-[#10221C]">
                                    +{includedPaddles} paddles
                                </span>
                            )}
                        </div>

                        <p className="truncate text-[9px] font-medium text-[#10221C]/55">
                            {inclusionLabel(plan)}
                        </p>

                        <div className="mt-1 grid grid-cols-2 gap-1">
                            <div className="rounded-lg border border-amber-200/70 bg-amber-50 px-1.5 py-1">
                                <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-amber-800">
                                    <Sun size={9} aria-hidden="true" /> Day
                                </p>
                                <p className="text-[13px] font-black leading-tight text-[#10221C]">
                                    {formatPeso(day)}
                                    <span className="text-[8px] font-medium text-[#10221C]/60">/hr</span>
                                </p>
                                <p className="text-[8px] font-medium text-amber-800/70">
                                    from {formatHour(plan.day_start_time || '05:00')}
                                </p>
                            </div>

                            <div className="rounded-lg border border-indigo-200/70 bg-indigo-50 px-1.5 py-1">
                                <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-indigo-800">
                                    <Moon size={9} aria-hidden="true" /> Night
                                </p>
                                <p className="text-[13px] font-black leading-tight text-[#10221C]">
                                    {night === null ? (
                                        <span className="text-[10px] font-bold text-[#10221C]/60">Same</span>
                                    ) : (
                                        <>
                                            {formatPeso(night)}
                                            <span className="text-[8px] font-medium text-[#10221C]/60">/hr</span>
                                        </>
                                    )}
                                </p>
                                <p className="text-[8px] font-medium text-indigo-800/70">
                                    from {formatHour(plan.night_start_time || '17:00')}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
