import React, { useState, useEffect, memo } from 'react';
import { Activity, Clock, Radio } from 'lucide-react';
import Delta from './Delta';
import { DASHBOARD_THEME } from './constants';

/**
 * CourtUtilizationCard - Animated radial utilization meter with live count-up & court availability strip
 *
 * @param {number} [percentage=72] - Utilization percentage 0-100
 * @param {number} [delta=13] - Trend percentage
 * @param {number} [activeCourts=4] - Number of currently active courts
 * @param {number} [totalCourts=4] - Total number of courts
 * @param {string} [peakWindow='5–8 PM'] - Peak load time window
 * @param {Array} [courtStatuses] - Live statuses per court
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function CourtUtilizationCardComponent({
  percentage = 72,
  delta = 13,
  activeCourts = 4,
  totalCourts = 4,
  peakWindow = '5–8 PM',
  courtStatuses = [
    { name: 'C1', sport: 'Badminton', time: '5:00P', active: true },
    { name: 'C2', sport: 'Futsal', time: '5:30P', active: true },
    { name: 'C3', sport: 'Pickleball', time: '7:00P', active: true },
    { name: 'C4', sport: 'Table Tennis', time: 'Free', active: false },
  ],
  loading = false,
  className = '',
}) {
  const [animatedPct, setAnimatedPct] = useState(0);

  const clampedTarget = Math.min(100, Math.max(0, percentage));

  // Smooth Count-Up & Stroke Animation on mount / percentage change
  useEffect(() => {
    let startTimestamp = null;
    const duration = 1000; // 1 second smooth ease-out

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic formula: 1 - pow(1 - progress, 3)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(Math.round(easedProgress * clampedTarget));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [clampedTarget]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col justify-between shadow-subtle h-full ${className}`}>
        <div className="flex justify-between">
          <div className="h-3 w-28 bg-stone-200 rounded animate-pulse" />
          <div className="h-4 w-10 bg-stone-200 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-4 my-2">
          <div className="w-16 h-16 rounded-full bg-stone-200 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-full bg-stone-200 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-stone-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate SVG Circle Stroke values (radius = 30, circumference ≈ 188.5)
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference;

  return (
    <div
      className={`group bg-white rounded-xl border border-[#10221C]/12 p-5 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Activity size={14} strokeWidth={2.3} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
            Court Utilization
          </span>
        </div>
        {delta !== undefined && <Delta value={delta} />}
      </div>

      {/* Center: Animated Gauge + Context */}
      <div className="flex items-center gap-3.5 my-1.5">
        {/* Radial Ring Gauge with Count-Up animation */}
        <div className="w-16 h-16 relative shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 filter drop-shadow-xs" viewBox="0 0 72 72">
            {/* Background Track */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="rgba(16, 34, 28, 0.08)"
              strokeWidth="7"
            />
            {/* Animated Active Progress */}
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={DASHBOARD_THEME.LIME}
              strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-75 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-black text-[#101F1A] leading-none tracking-tight tabular-nums">
              {animatedPct}%
            </span>
          </div>
        </div>

        {/* Status Details */}
        <div className="text-xs text-stone-700 leading-tight flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-[#101F1A] mb-1 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">{activeCourts} of {totalCourts} courts active</span>
          </div>
          <p className="text-stone-500 text-[11px] leading-snug">
            Peak capacity hits during{' '}
            <span className="inline-flex items-center gap-0.5 font-bold text-[#101F1A] bg-stone-100 px-1.5 py-0.5 rounded text-[10.5px]">
              <Clock size={10} className="text-[#101F1A]" />
              {peakWindow}
            </span>
          </p>
        </div>
      </div>

      {/* Bottom Compact Single-Row Strip: 4 Court Status Indicators */}
      <div className="pt-2 border-t border-[#10221C]/10">
        <div className="grid grid-cols-4 gap-1.5">
          {courtStatuses.map((c) => (
            <div
              key={c.name}
              title={`${c.name} (${c.sport}): ${c.active ? `Occupied (${c.time})` : 'Available'}`}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all duration-200 hover:scale-105 ${
                c.active
                  ? 'bg-[#101F1A]/[0.04] border-[#101F1A]/10 text-[#101F1A]'
                  : 'bg-emerald-50 border-emerald-200/90 text-emerald-900'
              }`}
            >
              <span className="text-[10.5px] font-black leading-none text-[#101F1A]">
                {c.name}
              </span>
              <span
                className={`mt-0.5 text-[9px] font-bold leading-none ${
                  c.active ? 'text-stone-600' : 'text-emerald-700 font-black'
                }`}
              >
                {c.active ? c.time : 'Free'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const CourtUtilizationCard = memo(CourtUtilizationCardComponent);
export default CourtUtilizationCard;
