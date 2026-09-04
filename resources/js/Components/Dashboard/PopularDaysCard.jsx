import React, { useState, memo, useMemo } from 'react';
import { CalendarRange, Sparkles } from 'lucide-react';
import { DASHBOARD_THEME, MOCK_POPULAR_DAYS } from './constants';

/**
 * PopularDaysCard - Visual dot-matrix demand chart with enhanced contrast
 *
 * @param {Array} [days=MOCK_POPULAR_DAYS] - Array of { day, label, level, bookings }
 * @param {number} [maxScale=8] - Maximum dots per column
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function PopularDaysCardComponent({
  days = MOCK_POPULAR_DAYS,
  maxScale = 8,
  loading = false,
  className = '',
}) {
  const [hoveredDay, setHoveredDay] = useState(null);

  const maxLevel = useMemo(() => {
    return Math.max(...days.map((d) => d.level || 0), 1);
  }, [days]);

  const peakDayObj = useMemo(() => {
    return days.find((d) => d.level === maxLevel);
  }, [days, maxLevel]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col justify-between shadow-subtle h-full ${className}`}>
        <div className="h-4 w-28 bg-stone-200 rounded animate-pulse mb-4" />
        <div className="flex items-end justify-between gap-2 h-36">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-2.5 h-24 bg-stone-200 rounded animate-pulse" />
              <div className="h-2.5 w-4 bg-stone-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/12 p-5 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#101F1A]/[0.05] border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A]">
              <CalendarRange size={14} strokeWidth={2.3} />
            </div>
            <h3 className="text-sm font-bold text-[#101F1A]">Popular Days</h3>
          </div>

          {peakDayObj && (
            <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-700" />
              {peakDayObj.label || peakDayObj.day} Peak
            </span>
          )}
        </div>

        {/* Matrix Dot Display */}
        <div className="flex items-end justify-between gap-2 h-36 px-1 pt-2">
          {days.map((d) => {
            const isPeak = d.level === maxLevel;
            const isHovered = hoveredDay && hoveredDay.day === d.day;

            return (
              <div
                key={d.day}
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`flex flex-col items-center gap-1.5 flex-1 cursor-pointer transition-all duration-150 rounded-xl py-1 ${
                  isHovered ? 'bg-stone-100 scale-105 shadow-xs' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex flex-col-reverse gap-1.5">
                  {Array.from({ length: maxScale }).map((_, i) => {
                    const isActive = i < d.level;
                    return (
                      <span
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          isActive
                            ? isPeak
                              ? 'bg-[#D6FF3F] shadow-xs border border-[#101F1A]/30 ring-1 ring-[#101F1A]/10'
                              : 'bg-[#101F1A] shadow-xs'
                            : 'bg-stone-200/75'
                        }`}
                      />
                    );
                  })}
                </div>
                <span
                  className={`text-[11px] font-bold transition-colors ${
                    isHovered
                      ? 'text-[#101F1A] font-black'
                      : isPeak
                      ? 'text-[#101F1A] font-black underline decoration-[#D6FF3F] decoration-2'
                      : 'text-stone-600'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-3 border-t border-[#10221C]/10 flex items-center justify-between text-[11px] text-stone-600">
        {hoveredDay ? (
          <div className="font-bold text-[#101F1A]">
            {hoveredDay.label || hoveredDay.day}:{' '}
            <span className="text-[#101F1A] font-black">{hoveredDay.bookings || hoveredDay.level * 5} bookings</span> avg
          </div>
        ) : (
          <span className="font-semibold text-stone-500">Weekend foot traffic is 2.4x higher than weekdays</span>
        )}
      </div>
    </div>
  );
}

export const PopularDaysCard = memo(PopularDaysCardComponent);
export default PopularDaysCard;
