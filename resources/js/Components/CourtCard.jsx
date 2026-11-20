import CourtRatePlans from '@/Components/CourtRatePlans';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES, STATUS_CONFIG } from '@/Utils/courtStatus';
import { offeredCourtPlans } from '@/Utils/rateQuote';
import { Clock, Sun, Moon, Check } from 'lucide-react';
import PickleballIcon from '@/Components/Icons/PickleballIcon';

/**
 * 12-hour label for a stored court time, e.g. "06:00:00" -> "6:00 AM".
 */
export function formatCourtTime(value) {
    if (!value) {
        return '';
    }

    const [hourString] = String(value).split(':');
    const hour = Number(hourString);

    if (Number.isNaN(hour)) {
        return String(value);
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${displayHour}:00 ${suffix}`;
}

/**
 * CourtCard presentation aligned with Facilities.jsx and Welcome.jsx:
 * - Edge-to-edge masked top image with 7-stop smooth white gradient dissolve
 * - Floating status badge (top-left) with animated status pulse dot
 * - Floating sport category pill (top-right)
 * - Negative margin card body for seamless typography blend
 * - Fixed h-10 pinned footer with uniform button heights
 */
export default function CourtCard({
    court,
    image,
    fallbackImage = null,
    onClick = null,
    isSelected = false,
    isDimmed = false,
    hint = null,
    actions = null,
    className = '',
    style = undefined,
    facility = null,
}) {
    const statusCfg = STATUS_CONFIG[court.status] || STATUS_CONFIG.AVAILABLE;
    const isSplitPriced = court.pricing_mode === 'SPLIT' && court.day_rate && court.night_rate;
    const offeredPlans = offeredCourtPlans(court, facility);
    const isBookable = court.status === 'AVAILABLE';
    const isInteractive = typeof onClick === 'function';

    const dayStart = isSplitPriced ? formatCourtTime(court.day_start_time || '06:00') : '';
    const nightStart = isSplitPriced
        ? formatCourtTime(court.night_start_time || '18:00')
        : offeredPlans[0]?.night_start_time
            ? formatCourtTime(offeredPlans[0].night_start_time)
            : '';

    const handleImageError = (event) => {
        if (fallbackImage && event.currentTarget.src !== fallbackImage) {
            event.currentTarget.src = fallbackImage;
        }
    };

    return (
        <article
            onClick={isInteractive ? onClick : undefined}
            className={[
                'group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-300',
                isSelected
                    ? 'border-[#10221C] ring-2 ring-[#10221C] shadow-xl shadow-[#10221C]/10 -translate-y-1'
                    : 'border-[#10221C]/10 hover:-translate-y-1 hover:border-[#10221C]/30 hover:shadow-md',
                isDimmed ? 'opacity-85 grayscale-[20%]' : '',
                isInteractive ? 'cursor-pointer' : '',
                className,
            ].filter(Boolean).join(' ')}
            style={style}
        >
            {/* Top Image: Edge-to-edge photography with clean fade */}
            <div className="relative h-44 sm:h-48 w-full shrink-0 overflow-hidden bg-[#101F1A]/5">
                <img
                    src={image}
                    alt={court.name}
                    loading="lazy"
                    onError={handleImageError}
                    className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                        isDimmed ? 'opacity-85 grayscale-[25%]' : ''
                    }`}
                />

                {/* Floating Status Badge — top-left */}
                <div className="absolute top-3 left-3 z-10">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-2xs border bg-white/95 transition-transform duration-300 group-hover:scale-105 ${statusCfg.text} ${statusCfg.border}`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                        <span style={{ color: statusCfg.color }}>{statusCfg.label}</span>
                    </span>
                </div>

                {/* Floating Sport / Category Pill & Selected Indicator — top-right */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    {isSelected && (
                        <span className="inline-flex items-center gap-1 bg-[#D6FF3F] text-[#10221C] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs border border-[#101F1A]/10">
                            <Check size={11} strokeWidth={3} />
                            Selected
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 bg-[#101F1A]/85 text-[#F5F2EA] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-2xs border border-white/10">
                        {court.type === 'Pickleball' && <PickleballIcon size={12} className="shrink-0" />}
                        <span>{court.type || 'Court'}</span>
                    </span>
                </div>

                {/* Clean gradient overlay dissolving into card body */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(16,31,26,0.25) 0%, rgba(16,31,26,0) 40%, rgba(255,255,255,0.7) 85%, #ffffff 100%)',
                    }}
                />
            </div>

            {/* Card Body */}
            <div className="-mt-3.5 sm:-mt-4 relative z-10 px-4 pb-3.5 sm:px-5 sm:pb-4 flex-1 flex flex-col justify-between">
                <div>
                    {/* Court Title */}
                    <div className="flex items-center justify-between gap-2 h-6 sm:h-7">
                        <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-[#10221C] group-hover:text-[#FF5A36] transition-colors truncate flex-1" title={court.name}>
                            {court.name}
                        </h3>
                    </div>

                    {/* Schedule / Hours */}
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#10221C]/75 truncate h-5">
                        <Clock size={12} className="text-[#FF5A36]/80 shrink-0" />
                        <span className="truncate" title={court.operating_schedules_label || court.time_range}>
                            {court.operating_schedules_label || court.time_range || 'Venue standard hours'}
                        </span>
                    </p>

                    {/* Description */}
                    <p className="mt-1.5 text-xs text-[#10221C]/70 line-clamp-2 leading-relaxed h-9 overflow-hidden">
                        {court.description || 'Quality sports court with verified playing surface and standard regulations.'}
                    </p>

                    {/* Pricing Strip */}
                    {offeredPlans.length > 0 ? (
                        <CourtRatePlans
                            plans={offeredPlans}
                            className="mt-2.5 border-t border-[#101F1A]/5 pt-2"
                        />
                    ) : (
                        <div className="mt-2.5 pt-2 border-t border-[#101F1A]/5 flex items-center justify-between gap-2">
                            {isSplitPriced ? (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-[#101F1A]/5">
                                        <Sun size={11} className="text-amber-600 shrink-0" />
                                        <span>Day: ₱{Number(court.day_rate).toFixed(0)}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF9F5] px-2 py-0.5 text-[10px] font-bold text-indigo-800 border border-[#101F1A]/5">
                                        <Moon size={11} className="text-indigo-600 shrink-0" />
                                        <span>Night: ₱{Number(court.night_rate).toFixed(0)}</span>
                                    </span>
                                </div>
                            ) : court.hourly_rate ? (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base sm:text-lg font-black text-[#10221C]">
                                        ₱{Number(court.hourly_rate).toFixed(0)}
                                    </span>
                                    <span className="text-xs text-[#10221C]/50 font-semibold">
                                        / hr
                                    </span>
                                </div>
                            ) : (
                                <span className="text-[11px] text-[#101F1A]/55 font-medium">Standard rate</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="mt-3 pt-2.5 border-t border-[#10221C]/6 flex items-center justify-between shrink-0 h-10">
                    <div>
                        {hint ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isBookable ? 'text-emerald-700' : 'text-[#10221C]/65'}`}>
                                {hint}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Instant Booking
                            </span>
                        )}
                    </div>
                    {actions ? (
                        <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {actions}
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
