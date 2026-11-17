import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import { Clock } from 'lucide-react';

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
 * The single court card presentation shared by the public facility page, the
 * owner and admin court managers, and the player facility page.
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
}) {
    const statusStyle = COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE;
    const statusLabel = COURT_STATUS_LABELS[court.status] || court.status;
    const isSplitPriced = court.pricing_mode === 'SPLIT' && court.day_rate && court.night_rate;
    const isBookable = court.status === 'AVAILABLE';
    const isInteractive = typeof onClick === 'function';

    const dayStart = isSplitPriced ? formatCourtTime(court.day_start_time || '06:00') : '';
    const nightStart = isSplitPriced ? formatCourtTime(court.night_start_time || '18:00') : '';

    const handleImageError = (event) => {
        if (fallbackImage && event.currentTarget.src !== fallbackImage) {
            event.currentTarget.src = fallbackImage;
        }
    };

    return (
        <article
            onClick={isInteractive ? onClick : undefined}
            className={[
                'group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
                isSelected
                    ? 'border-[#D6FF3F] ring-2 ring-[#D6FF3F] shadow-lg shadow-[#D6FF3F]/25 -translate-y-1'
                    : 'border-[#10221C]/10 hover:-translate-y-0.5 hover:border-[#D6FF3F] hover:shadow-xl',
                isDimmed ? 'bg-[#FAF9F5] opacity-90 hover:opacity-100' : '',
                isInteractive ? 'cursor-pointer' : '',
                className,
            ].join(' ')}
            style={style}
        >
            {/* Image Banner */}
            <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#10221C]">
                <img
                    src={image}
                    alt={court.name}
                    onError={handleImageError}
                    className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                        isDimmed ? 'opacity-85 grayscale-[25%]' : ''
                    }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10221C]/75 via-transparent to-black/10" />

                {/* Sport chip */}
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#10221C]/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#F5F2EA] backdrop-blur-md">
                    {court.type || 'Court'}
                </span>

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-md ${statusStyle}`}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                <div>
                    <h3 className="text-lg font-bold tracking-tight text-[#10221C]" title={court.name}>
                        {court.name}
                    </h3>
                    {court.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#10221C]/70">
                            {court.description}
                        </p>
                    )}
                </div>

                {/* Hours & rates */}
                <div className="space-y-2 rounded-xl border border-[#10221C]/10 bg-[#F5F2EA]/70 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[#10221C]/60">
                            <Clock size={12} className="shrink-0" />
                            Operating hours
                        </span>
                        <span className="truncate font-bold text-[#10221C]" title={court.time_range}>
                            {court.time_range || 'Venue standard'}
                        </span>
                    </div>

                    {isSplitPriced ? (
                        <>
                            <div className="flex items-center justify-between gap-2 border-t border-[#10221C]/10 pt-2 text-xs">
                                <span className="inline-flex shrink-0 items-center gap-1.5 font-bold text-amber-800">
                                    <span aria-hidden="true">☀️</span> Day rate
                                </span>
                                <span className="text-right font-bold text-[#10221C]">
                                    ₱{Number(court.day_rate).toFixed(0)}/hr
                                    {dayStart && (
                                        <span className="ml-1 font-medium text-[#10221C]/60">from {dayStart}</span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="inline-flex shrink-0 items-center gap-1.5 font-bold text-indigo-800">
                                    <span aria-hidden="true">🌙</span> Night rate
                                </span>
                                <span className="text-right font-bold text-[#10221C]">
                                    ₱{Number(court.night_rate).toFixed(0)}/hr
                                    {nightStart && (
                                        <span className="ml-1 font-medium text-[#10221C]/60">from {nightStart}</span>
                                    )}
                                </span>
                            </div>
                        </>
                    ) : court.hourly_rate ? (
                        <div className="flex items-center justify-between gap-2 border-t border-[#10221C]/10 pt-2 text-xs">
                            <span className="shrink-0 font-medium text-[#10221C]/60">Hourly rate</span>
                            <span className="font-bold text-[#10221C]">₱{Number(court.hourly_rate).toFixed(2)}/hr</span>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isBookable ? 'text-emerald-700' : 'text-[#10221C]/50'}`}>
                        {hint ?? (isBookable ? 'Ready to book' : 'Not bookable right now')}
                    </span>
                    {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
                </div>
            </div>
        </article>
    );
}
