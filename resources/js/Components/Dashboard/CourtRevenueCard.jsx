import React, { useState, memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy } from 'lucide-react';
import { DASHBOARD_THEME, MOCK_COURT_REVENUE } from './constants';

/**
 * Custom Tooltip for Court Revenue Pie
 */
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#101F1A] border border-[#D6FF3F]/50 rounded-xl px-3 py-2 shadow-xl text-left pointer-events-none">
        <p className="text-[11px] text-[#F5F2EA]/80 font-bold">{data.name}</p>
        <p className="text-xs font-black text-[#D6FF3F] mt-0.5">
          ₱{typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * CourtRevenueCard - Revenue breakdown by individual court & sport adhering strictly to brand palette
 *
 * @param {Array} [courtRevenue=MOCK_COURT_REVENUE] - Array of { name, sport, value, color, isPrimary }
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function CourtRevenueCardComponent({
  courtRevenue = MOCK_COURT_REVENUE,
  loading = false,
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const totalRevenue = useMemo(() => {
    return courtRevenue.reduce((acc, c) => acc + (c.value || 0), 0);
  }, [courtRevenue]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col items-center shadow-subtle ${className}`}>
        <div className="h-4 w-32 bg-stone-200 rounded self-start animate-pulse mb-3" />
        <div className="w-32 h-32 rounded-full bg-stone-200 animate-pulse my-2" />
        <div className="w-full space-y-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-3 w-full bg-stone-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/12 p-5 flex flex-col items-center justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      <div className="w-full flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
            <Trophy size={14} strokeWidth={2.3} />
          </div>
          <h3 className="text-sm font-bold text-[#101F1A]">Revenue by Court</h3>
        </div>
      </div>

      {/* Donut Chart with Brand Volt highlight on top court */}
      <div className="w-full h-36 min-h-[144px] relative my-1">
        <ResponsiveContainer width="100%" height={144}>
          <PieChart>
            <Tooltip content={<CustomPieTooltip />} />
            <Pie
              data={courtRevenue}
              dataKey="value"
              innerRadius={38}
              outerRadius={60}
              paddingAngle={4}
              strokeWidth={1}
              stroke="#101F1A15"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {courtRevenue.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="transition-all duration-200 cursor-pointer"
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.35}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Legend with Brand Primary Highlight */}
      <div className="w-full flex flex-col gap-1.5 pt-1 border-t border-[#10221C]/10">
        {courtRevenue.map((c, i) => {
          const sharePct = totalRevenue > 0 ? Math.round((c.value / totalRevenue) * 100) : 0;
          const isHighlighted = activeIndex === i;
          const isTop = c.isPrimary || i === 0;

          return (
            <div
              key={c.name}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isHighlighted ? 'bg-stone-100' : 'hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ${
                    isTop ? 'ring-1 ring-[#101F1A]/40' : ''
                  }`}
                  style={{ backgroundColor: c.color }}
                />
                <span className={`text-xs truncate ${isTop ? 'font-black text-[#101F1A]' : 'font-bold text-stone-700'}`}>
                  {c.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs ${isTop ? 'font-black text-[#101F1A]' : 'font-bold text-stone-700'}`}>
                  ₱{(c.value / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] text-stone-500 font-extrabold w-7 text-right">
                  {sharePct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CourtRevenueCard = memo(CourtRevenueCardComponent);
export default CourtRevenueCard;
