const BAR_COLORS = {
    mon: 'rgba(214, 255, 63, 0.45)',
    tue: 'rgba(214, 255, 63, 0.7)',
    wed: 'rgba(214, 255, 63, 0.45)',
    thu: 'rgba(214, 255, 63, 0.7)',
    fri: 'rgba(214, 255, 63, 0.45)',
    sat: 'rgba(214, 255, 63, 0.7)',
    sun: 'rgba(214, 255, 63, 0.45)',
};

export default function WeekdayBars({ weekdays }) {
    const max = Math.max(0, ...weekdays.map((day) => day.count));
    const busiest = weekdays.filter((day) => max > 0 && day.count === max);
    const allZero = max === 0;

    return (
        <section className="flex h-full flex-col rounded-xl border border-[#101F1A]/10 bg-white p-4 md:p-6">
            <h2 className="text-sm font-bold text-[#101F1A]">Bookings by weekday</h2>
            <p className="mt-1 text-xs text-[#101F1A]/60">Last 17 weeks</p>

            <div className="mt-4 flex h-40 items-end gap-2">
                {weekdays.map((day) => (
                    <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-xs font-bold text-[#101F1A]">{day.count}</span>
                        <div className="flex h-24 w-full items-end">
                            <div
                                className="w-full rounded-md"
                                style={{
                                    height: day.count === 0 ? '6px' : `${Math.max(12, (day.count / max) * 100)}%`,
                                    backgroundColor: day.count === 0 ? 'rgba(214, 255, 63, 0.22)' : (max > 0 && day.count === max ? '#D6FF3F' : BAR_COLORS[day.key] ?? '#D6FF3F'),
                                }}
                            />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                            {day.label}
                        </span>
                    </div>
                ))}
            </div>

            {allZero ? (
                <p className="mt-4 text-xs text-[#101F1A]/60">No bookings in this period</p>
            ) : (
                <p className="mt-4 text-xs font-medium text-[#101F1A]">
                    Most active · {busiest.map((day) => day.name).join(', ')} · {max} {max === 1 ? 'booking' : 'bookings'}
                </p>
            )}
        </section>
    );
}
