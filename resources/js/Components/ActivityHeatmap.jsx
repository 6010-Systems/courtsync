import { useState } from 'react';
import { HEATMAP_LEVELS } from '@/Components/Dashboard/constants';

// ---------------------------------------------------------------------------
// ActivityHeatmap — GitHub-style booking activity contribution graph
// Full-width: week columns stretch to fill available horizontal space.
// Cells are kept square via aspect-ratio; a min-width guard prevents
// columns from collapsing on very small viewports.
// ---------------------------------------------------------------------------

const DOW      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_SHOW = new Set([1, 3, 5]); // Mon / Wed / Fri
const MONTHS   = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getLevel(count, max) {
    // Always 0 for empty days
    if (!count || count <= 0 || max <= 0) return 0;
    // Linear scale from 1..max → level 1..4, ensuring max always hits level 4
    const ratio = count / max;                 // 0 < ratio ≤ 1
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.50) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

function parseWeeks(days) {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }
    return weeks;
}

function monthOf(dateStr) {
    return Number((dateStr ?? '').slice(5, 7)) - 1;
}

export default function ActivityHeatmap({ days }) {
    const [tooltip, setTooltip] = useState(null);

    if (!days || days.length === 0) return null;

    const weeks   = parseWeeks(days);
    // Enforce a baseline max of 10 so a single booking in a slow month doesn't show as level 4 (lime)
    const max     = Math.max(10, ...days.map((d) => d.count));
    const total   = days.reduce((s, d) => s + d.count, 0);
    const busiest = days.reduce((b, d) => (d.count > b.count ? d : b), days[0]);

    // Month-span labels: first week each month appears
    const monthSpans = [];
    weeks.forEach((week, wIdx) => {
        const m = monthOf(week[0]?.date);
        if (!monthSpans.length || monthSpans[monthSpans.length - 1].month !== m) {
            monthSpans.push({ month: m, weekIdx: wIdx });
        }
    });

    const GAP = 5;  // px — gap between cells (more breathing room)

    return (
        <section
            className="w-full rounded-xl p-5 md:p-6"
            style={{ backgroundColor: '#10221C' }}
            aria-label="Booking activity heatmap"
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-sm font-bold text-[#F5F2EA]">Booking Activity</h2>
                    <p className="text-[10.5px] text-[#F5F2EA]/45 mt-0.5">
                        {days.length} days · {total.toLocaleString()} bookings
                        {busiest.count > 0 && ` · Busiest: ${busiest.date} (${busiest.count})`}
                    </p>
                </div>
                <span className="text-[11px] font-black text-[#D6FF3F] tabular-nums shrink-0">
                    {total.toLocaleString()} total
                </span>
            </div>

            {/* ── Grid ───────────────────────────────────────────────── */}
            <div className="flex gap-2 w-full min-w-0" style={{ height: 175 }}>

                {/* Day-of-week label column — fixed width */}
                <div
                    className="flex flex-col shrink-0"
                    style={{ gap: GAP, paddingBottom: 0 }}
                >
                    {/* Spacer for the month label row */}
                    <div style={{ height: 16, marginBottom: GAP }} />

                    {DOW.map((label, i) => (
                        <div
                            key={label}
                            className={`flex items-center justify-end text-right leading-none ${
                                DOW_SHOW.has(i) ? 'text-[#F5F2EA]/40' : 'text-transparent select-none'
                            }`}
                            style={{
                                width: 28,
                                fontSize: 9,
                                fontWeight: 500,
                                flex: '1 1 0',
                                paddingRight: 4,
                            }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Week columns — stretch to fill all remaining width */}
                <div
                    className="flex min-w-0 flex-1"
                    style={{ gap: GAP }}
                >
                    {weeks.map((week, wIdx) => {
                        const span = monthSpans.find((s) => s.weekIdx === wIdx);

                        return (
                            <div
                                key={week[0]?.date ?? wIdx}
                                className="flex flex-col min-w-0 flex-1"
                                style={{ gap: GAP, minWidth: 8 }}
                            >
                                {/* Month label */}
                                <div
                                    className="overflow-visible whitespace-nowrap shrink-0 font-bold text-[#F5F2EA]/45"
                                    style={{ height: 16, fontSize: 9, lineHeight: '16px' }}
                                >
                                    {span ? MONTHS[span.month] : ''}
                                </div>

                                {/* 7 day cells — fill fixed-height column */}
                                {week.map((day, dIdx) => {
                                    const level  = getLevel(day.count, max);
                                    const colour = HEATMAP_LEVELS[level];

                                    return (
                                        <div
                                            key={day.date}
                                            role="gridcell"
                                            aria-label={`${day.date} (${DOW[dIdx]}): ${day.count} booking${day.count !== 1 ? 's' : ''}`}
                                            className="w-full flex-1 hover:opacity-70 transition-opacity duration-100 cursor-default"
                                            style={{
                                                backgroundColor: colour,
                                                borderRadius: 5,
                                                minHeight: 6,
                                            }}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltip({ date: day.date, count: day.count, dow: DOW[dIdx], rect });
                                            }}
                                            onMouseLeave={() => setTooltip(null)}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Legend ─────────────────────────────────────────────── */}
            <div className="mt-3 flex items-center justify-end gap-1.5">
                <span className="text-[10px] font-medium text-[#F5F2EA]/35 mr-0.5">Less</span>
                {HEATMAP_LEVELS.map((colour, i) => (
                    <span
                        key={i}
                        className="inline-block rounded-sm"
                        style={{ width: 11, height: 11, backgroundColor: colour, borderRadius: 5, flexShrink: 0 }}
                    />
                ))}
                <span className="text-[10px] font-medium text-[#F5F2EA]/35 ml-0.5">More</span>
            </div>

            {/* ── Tooltip ────────────────────────────────────────────── */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded-lg shadow-xl border text-left"
                    style={{
                        top:   tooltip.rect.top - 52,
                        left:  Math.max(8, tooltip.rect.left + tooltip.rect.width / 2 - 64),
                        backgroundColor: '#101F1A',
                        borderColor: 'rgba(214,255,63,0.25)',
                        minWidth: 128,
                    }}
                >
                    <p className="text-[10px] text-[#F5F2EA]/55 font-medium">
                        {tooltip.dow}, {tooltip.date}
                    </p>
                    <p className="text-xs font-black text-[#D6FF3F] mt-0.5">
                        {tooltip.count} booking{tooltip.count !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </section>
    );
}
