import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const LIME = '#D6FF3F';

function weekLabel(date) {
    if (!date) {
        return '';
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[Number(date.slice(5, 7)) - 1];
    const day = Number(date.slice(8, 10));

    return `${month} ${day}`;
}

function weeklyPoints(days) {
    const points = [];

    for (let index = 0; index < days.length; index += 7) {
        const week = days.slice(index, index + 7);
        const count = week.reduce((total, day) => total + day.count, 0);

        points.push({
            label: weekLabel(week[0]?.date ?? ''),
            count,
        });
    }

    return points;
}

function TrendTooltip({ active, payload }) {
    if (!active || !payload?.length) {
        return null;
    }

    const count = payload[0].value;

    return (
        <div className="rounded-lg border border-[#D6FF3F] bg-[#F7FBE8] px-2.5 py-1.5 text-xs text-[#101F1A] shadow-sm">
            <p className="font-bold text-[#101F1A]">
                {count} {count === 1 ? 'booking' : 'bookings'}
            </p>
            <p className="text-[#101F1A]/55">Week of {payload[0].payload.label}</p>
        </div>
    );
}

function TrendDot({ cx, cy, payload, peak }) {
    if (!payload?.count) {
        return null;
    }

    const isPeak = payload.count === peak;

    return (
        <circle
            cx={cx}
            cy={cy}
            r={isPeak ? 5 : 3}
            fill={isPeak ? LIME : 'rgba(214, 255, 63, 0.55)'}
            stroke="#ffffff"
            strokeWidth={2}
        />
    );
}

export default function BookingsTrend({ days }) {
    const points = weeklyPoints(days);
    const total = points.reduce((sum, point) => sum + point.count, 0);
    const peak = Math.max(0, ...points.map((point) => point.count));

    return (
        <section className="flex h-full flex-col rounded-xl border border-[#101F1A]/10 border-l-4 border-l-[#D6FF3F] bg-white p-4 md:p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-[#101F1A]">Bookings over time</h2>
                    <p className="mt-1 text-xs text-[#101F1A]/60">Weekly totals · last 17 weeks</p>
                </div>
                <span className="rounded-full bg-[#D6FF3F] px-2.5 py-1 text-xs font-bold text-[#101F1A]">
                    {total}
                </span>
            </div>

            <div className="mt-4 h-44 rounded-lg bg-[#F7FBE8] px-1 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="bookingsArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={LIME} stopOpacity={0.85} />
                                <stop offset="100%" stopColor={LIME} stopOpacity={0.08} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#5A756C" strokeOpacity={0.18} strokeDasharray="3 6" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#5A756C', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            minTickGap={28}
                        />
                        <YAxis hide domain={[0, peak === 0 ? 1 : 'dataMax + 1']} />
                        <Tooltip content={<TrendTooltip />} cursor={{ stroke: LIME, strokeWidth: 1 }} />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke={LIME}
                            strokeWidth={2.5}
                            fill="url(#bookingsArea)"
                            dot={<TrendDot peak={peak} />}
                            activeDot={{ r: 6, fill: LIME, stroke: '#101F1A', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p className="mt-3 text-xs text-[#101F1A]/60">
                {total === 0 ? 'No bookings in this period' : `Busiest week · ${peak} ${peak === 1 ? 'booking' : 'bookings'}`}
            </p>
        </section>
    );
}
