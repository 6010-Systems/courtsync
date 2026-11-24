import { Moon, Sun } from 'lucide-react';

import { formatCourtTime } from '@/Components/CourtCard';
import { formatPeso } from '@/Components/MetricCard';
import { planRates } from '@/Utils/rateQuote';

function inclusionLabel(plan) {
    if (plan.kind === 'ADDON') {
        return 'Per paddle, per hour';
    }

    const items = ['Court'];

    if (plan.includes_ball) {
        items.push('ball');
    }

    if (Number(plan.included_paddles) > 0) {
        const count = Number(plan.included_paddles);
        items.push(`${count} ${count === 1 ? 'paddle' : 'paddles'}`);
    }

    return items.join(', ');
}

/**
 * Public rate card (mirrors the printed poster): packages with day/night rates
 * plus any hourly add-ons the facility offers.
 */
export default function RateCard({ plans = [], courts = null, className = '' }) {
    const offeredIds = courts
        ? new Set(courts.flatMap((court) => (court.rate_plans || []).map((plan) => plan.id)))
        : null;

    const visiblePlans = (plans || []).filter((plan) => !offeredIds || offeredIds.has(plan.id));
    const courtPlans = visiblePlans.filter((plan) => plan.kind !== 'ADDON');
    const addonPlans = visiblePlans.filter((plan) => plan.kind === 'ADDON');

    if (courtPlans.length === 0 && addonPlans.length === 0) {
        return null;
    }

    return (
        <section className={`rounded-2xl border border-[#10221C]/10 bg-white p-6 shadow-sm sm:p-8 ${className}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-[#10221C] sm:text-3xl">Rates</h2>
                    <p className="mt-0.5 text-xs text-[#10221C]/60 sm:text-sm">
                        Court rental, all-in packages and add-on rentals. Rates are per hour.
                    </p>
                </div>
                {courtPlans[0]?.night_start_time && (
                    <span className="rounded-full bg-[#F5F2EA] px-3 py-1 text-[11px] font-bold text-[#10221C]/70">
                        Night rate {formatCourtTime(courtPlans[0].night_start_time)} – {formatCourtTime(courtPlans[0].day_start_time || '05:00')}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {courtPlans.map((plan) => {
                    const { day, night } = planRates(plan);

                    return (
                        <article
                            key={plan.id}
                            className="rounded-2xl border border-[#10221C]/10 bg-[#F5F2EA]/60 p-4 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-black text-[#10221C]">{plan.name}</h3>
                                    <p className="mt-0.5 text-[11px] font-medium text-[#10221C]/60">
                                        {plan.description || inclusionLabel(plan)}
                                    </p>
                                </div>
                                {Number(plan.included_paddles) > 0 && (
                                    <span className="shrink-0 rounded-full bg-[#D6FF3F] px-2 py-0.5 text-[10px] font-black text-[#10221C]">
                                        +{plan.included_paddles} paddles
                                    </span>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                        <Sun size={12} aria-hidden="true" /> Day
                                    </p>
                                    <p className="mt-0.5 text-lg font-black text-[#10221C]">
                                        {formatPeso(day)}
                                        <span className="text-[11px] font-medium text-[#10221C]/60">/hr</span>
                                    </p>
                                    <p className="text-[10px] font-medium text-amber-800/80">
                                        {formatCourtTime(plan.day_start_time || '05:00')} – {formatCourtTime(plan.night_start_time || '17:00')}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-indigo-200/70 bg-indigo-50 px-3 py-2">
                                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-800">
                                        <Moon size={12} aria-hidden="true" /> Night
                                    </p>
                                    <p className="mt-0.5 text-lg font-black text-[#10221C]">
                                        {night === null ? (
                                            <span className="text-sm font-bold text-[#10221C]/60">Same rate</span>
                                        ) : (
                                            <>
                                                {formatPeso(night)}
                                                <span className="text-[11px] font-medium text-[#10221C]/60">/hr</span>
                                            </>
                                        )}
                                    </p>
                                    <p className="text-[10px] font-medium text-indigo-800/80">
                                        {formatCourtTime(plan.night_start_time || '17:00')} – {formatCourtTime(plan.day_start_time || '02:00')} (next day)
                                    </p>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
            {addonPlans.length > 0 && (
                <div className="mt-4 rounded-2xl border border-[#10221C]/10 bg-[#10221C] p-4 text-white sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Add-ons</p>
                            <p className="mt-0.5 text-sm font-bold">
                                {addonPlans.map((plan) => plan.name).join(' · ')}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {addonPlans.map((plan) => (
                                <span
                                    key={plan.id}
                                    className="rounded-xl bg-white/10 px-3 py-1.5 text-sm font-black text-[#D6FF3F]"
                                >
                                    {formatPeso(planRates(plan).day)}
                                    <span className="text-[11px] font-medium text-white/60">/hr each</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
