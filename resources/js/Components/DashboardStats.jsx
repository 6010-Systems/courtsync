import { formatCount, formatPeso, percentDelta } from '@/Components/MetricCard';

const LATER = ['Court utilization', 'Peak hour', 'Repeat players', 'Cancellations'];

function weeklySeries(days) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const points = [];

    for (let index = 0; index < days.length; index += 7) {
        const week = days.slice(index, index + 7);
        const date = week[0]?.date ?? '';
        const count = week.reduce((total, day) => total + day.count, 0);
        const label = date
            ? `${months[Number(date.slice(5, 7)) - 1]} ${Number(date.slice(8, 10))}`
            : '';

        points.push({ count, label });
    }

    return points;
}

function DeltaPill({ delta }) {
    if (delta === null) {
        return null;
    }

    return (
        <span className="mb-1 rounded-full bg-[#101F1A] px-2.5 py-1 text-xs font-bold text-[#D6FF3F]">
            {delta > 0 ? `+${delta}%` : `${delta}%`}
        </span>
    );
}

function BookingsCard({ metrics }) {
    const points = weeklySeries(metrics.heatmap.days);
    const peak = Math.max(0, ...points.map((point) => point.count));
    const peakIndex = Math.max(0, points.findIndex((point) => peak > 0 && point.count === peak));
    const width = 100;
    const height = 36;
    const xAt = (index) => (points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width);
    const yAt = (count) => (peak === 0 ? height - 2 : height - 4 - (count / peak) * (height - 8));
    const line = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xAt(index)} ${yAt(point.count)}`)
        .join(' ');
    const delta = percentDelta(metrics.bookings.current, metrics.bookings.previous);
    const ticks = [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]].filter(Boolean);

    return (
        <article className="flex flex-col rounded-3xl bg-[#D6FF3F] p-4 md:col-span-3 md:p-6">
            <h3 className="text-sm font-medium text-[#101F1A]/70">Bookings</h3>
            <div className="mt-3 flex items-end gap-3">
                <p className="text-5xl font-black tracking-tight text-[#101F1A]">
                    {formatCount(metrics.bookings.current)}
                </p>
                <DeltaPill delta={delta} />
            </div>
            <p className="mt-2 text-xs text-[#101F1A]/60">
                Last 30 days · {formatCount(metrics.bookings.previous)} in the previous 30
            </p>

            <div className="relative mt-5 pt-6">
                {peak > 0 && (
                    <span
                        className="absolute top-0 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#101F1A]"
                        style={{ left: `${xAt(peakIndex)}%` }}
                    >
                        {peak}
                    </span>
                )}
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="h-16 w-full"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label={peak === 0 ? 'No bookings in the last 17 weeks' : `Busiest week ${points[peakIndex]?.label}, ${peak} bookings`}
                >
                    {peak > 0 && (
                        <line
                            x1={xAt(peakIndex)}
                            x2={xAt(peakIndex)}
                            y1="0"
                            y2={height}
                            stroke="#101F1A"
                            strokeOpacity="0.12"
                            strokeWidth="10"
                        />
                    )}
                    <path
                        d={line}
                        fill="none"
                        stroke="#101F1A"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    {peak > 0 && (
                        <circle cx={xAt(peakIndex)} cy={yAt(peak)} r="2.4" fill="#ffffff" stroke="#101F1A" strokeWidth="1" />
                    )}
                </svg>
            </div>
            <div className="mt-1 flex justify-between text-[11px] font-medium text-[#101F1A]/55">
                {ticks.map((point, index) => (
                    <span key={`${point.label}-${index}`}>{point.label}</span>
                ))}
            </div>
        </article>
    );
}

function CollectedCard({ metrics }) {
    const current = Number(metrics.collected.current);
    const previous = Number(metrics.collected.previous);
    const max = Math.max(current, previous, 0);
    const delta = percentDelta(metrics.collected.current, metrics.collected.previous);
    const bars = [
        { key: 'now', label: '30 days', value: current, lead: true },
        { key: 'prior', label: 'Prior', value: previous, lead: false },
    ];

    return (
        <article className="flex flex-col rounded-3xl bg-white p-4 shadow-[0_12px_40px_-24px_rgba(16,31,26,0.45)] md:col-span-3 md:p-6">
            <h3 className="text-sm font-medium text-[#101F1A]/55">Collected</h3>
            <div className="mt-3 flex items-end gap-3">
                <p className="text-4xl font-black tracking-tight text-[#101F1A] md:text-5xl">
                    {formatPeso(metrics.collected.current)}
                </p>
                <DeltaPill delta={delta} />
            </div>

            <div className="mt-6 flex h-40 items-end gap-3">
                {bars.map((bar) => {
                    const height = max === 0 ? 12 : Math.max(18, (bar.value / max) * 100);

                    return (
                        <div key={bar.key} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                            <p className="mb-2 truncate text-sm font-bold text-[#101F1A]">{formatPeso(bar.value)}</p>
                            <div
                                className="w-full rounded-2xl"
                                style={{
                                    height: `${height}%`,
                                    background: bar.lead
                                        ? '#D6FF3F'
                                        : 'repeating-linear-gradient(-45deg, rgba(214,255,63,0.95) 0 7px, rgba(214,255,63,0.28) 7px 14px)',
                                }}
                            />
                            <p className="mt-2 text-center text-xs font-medium text-[#101F1A]/50">{bar.label}</p>
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function PlayersCard({ metrics, playerHint }) {
    return (
        <article className="flex h-full flex-col rounded-3xl bg-white p-4 shadow-[0_12px_40px_-24px_rgba(16,31,26,0.45)] md:col-span-3 md:p-6">
            <h3 className="text-sm font-medium text-[#101F1A]/55">Players</h3>
            <p className="mt-3 text-5xl font-black tracking-tight text-[#101F1A]">
                {formatCount(metrics.players.total)}
            </p>
            <div className="mt-6 rounded-2xl bg-[#F5F2EA] px-4 py-3">
                <p className="text-sm font-semibold text-[#101F1A]">{playerHint}</p>
            </div>
        </article>
    );
}

function PendingCard({ metrics }) {
    const total = Number(metrics.pending.total);

    return (
        <article className="flex h-full flex-col justify-between rounded-3xl bg-white p-4 shadow-[0_12px_40px_-24px_rgba(16,31,26,0.45)] md:col-span-3 md:p-6">
            <div>
                <h3 className="text-sm font-medium text-[#101F1A]/55">Pending</h3>
                <p className="mt-3 text-5xl font-black tracking-tight text-[#101F1A]">{formatCount(total)}</p>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-[#F5F2EA] px-4 py-3">
                <p className="text-sm font-semibold text-[#101F1A]">Awaiting confirmation</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${total > 0 ? 'bg-[#D6FF3F] text-[#101F1A]' : 'bg-white text-[#101F1A]/50'}`}>
                    {formatCount(total)}
                </span>
            </div>
        </article>
    );
}

export default function DashboardStats({ metrics, playerHint }) {
    return (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-6">
            <BookingsCard metrics={metrics} />
            <CollectedCard metrics={metrics} />
            <PlayersCard metrics={metrics} playerHint={playerHint} />
            <PendingCard metrics={metrics} />
            <article className="rounded-3xl bg-white p-4 shadow-[0_12px_40px_-24px_rgba(16,31,26,0.45)] md:col-span-6 md:p-6">
                <h3 className="text-sm font-medium text-[#101F1A]/55">Not tracked yet</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LATER.map((label) => (
                        <div key={label} className="rounded-2xl bg-[#F5F2EA] px-3 py-3">
                            <p className="text-sm font-semibold text-[#101F1A]">{label}</p>
                            <p className="mt-1 text-xs text-[#101F1A]/45">Not available yet</p>
                        </div>
                    ))}
                </div>
            </article>
        </section>
    );
}
