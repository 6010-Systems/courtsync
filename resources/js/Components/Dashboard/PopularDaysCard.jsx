import React, { useState, memo, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import { MOCK_POPULAR_DAYS } from './constants';

/**
 * PopularDaysCard - "Most Day Active" bar chart
 *
 * All bars are muted dark; the single peak bar renders in lime (#D6FF3F).
 * A floating label chip appears above the peak bar showing the booking count.
 *
 * @param {Array} [days=MOCK_POPULAR_DAYS] - Array of { day, label, level, bookings }
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function PopularDaysCardComponent({
  days = MOCK_POPULAR_DAYS,
  loading = false,
  className = '',
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const maxBookings = useMemo(() => Math.max(...days.map((d) => d.bookings || d.level * 5), 1), [days]);
  const peakDayObj  = useMemo(() => [...days].sort((a, b) => (b.bookings || b.level * 5) - (a.bookings || a.level * 5))[0], [days]);

  // ── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-4 flex flex-col justify-between shadow-subtle h-full ${className}`}>
        <div className="h-3.5 w-24 bg-stone-200 rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between gap-1.5 h-24">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-lg bg-stone-200 animate-pulse" style={{ height: `${30 + i * 8}%` }} />
              <div className="h-2.5 w-4 bg-stone-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeDay = hoveredDay ?? peakDayObj;

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/12 p-4 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#101F1A]/[0.06] border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A]">
            <BarChart2 size={14} strokeWidth={2.3} />
          </div>
          <h3 className="text-sm font-bold text-[#101F1A]">Most Day Active</h3>
        </div>

        {/* Live tooltip chip */}
        {activeDay && (
          <span className="text-[10px] font-black bg-[#101F1A] text-[#D6FF3F] px-2 py-0.5 rounded-md tabular-nums">
            {activeDay.bookings ?? (activeDay.level * 5)} bookings
          </span>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex items-end justify-between gap-1.5 h-24 px-0.5 pt-2">
        {days.map((d) => {
          const isPeak   = d.day === peakDayObj?.day;
          const isHover  = hoveredDay?.day === d.day;
          const bookings = d.bookings ?? d.level * 5;
          const heightPct = Math.max(8, (bookings / maxBookings) * 100);

          return (
            <div
              key={d.day}
              className="relative flex-1 flex flex-col items-center gap-1 group cursor-pointer"
              onMouseEnter={() => setHoveredDay(d)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Floating peak label above bar */}
              {isPeak && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#101F1A] whitespace-nowrap">
                  {bookings}
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-lg transition-all duration-200"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isPeak
                    ? '#D6FF3F'
                    : isHover
                    ? 'rgba(16, 34, 28, 0.25)'
                    : 'rgba(16, 34, 28, 0.12)',
                }}
              />

              {/* Day label */}
              <span
                className={`text-[10px] font-bold transition-colors ${
                  isPeak
                    ? 'text-[#101F1A] font-black'
                    : isHover
                    ? 'text-[#101F1A]'
                    : 'text-stone-400'
                }`}
              >
                {d.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-[#10221C]/8 text-[10.5px] text-stone-500 font-semibold">
        Weekend traffic is 2.4× higher than weekdays
      </div>
    </div>
  );
}

export const PopularDaysCard = memo(PopularDaysCardComponent);
export default PopularDaysCard;
