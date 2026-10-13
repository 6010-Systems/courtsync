import React, { useState, useEffect, memo } from 'react';
import { Activity } from 'lucide-react';
import Delta from './Delta';
import { DASHBOARD_THEME } from './constants';

/**
 * CourtUtilizationCard - Semicircle arc gauge (half-donut) with animated count-up
 *
 * Inspired by the "Repeat Customer Rate" semicircle gauge pattern.
 *
 * @param {number} [percentage=72] - Utilization 0-100
 * @param {number} [delta] - Trend percentage
 * @param {number} [activeCourts=4] - Currently active courts
 * @param {number} [totalCourts=4] - Total courts
 * @param {string} [peakWindow='5–8 PM'] - Peak load time window
 * @param {number} [targetPct=80] - Target percentage for subtext
 * @param {boolean} [loading=false] - Skeleton loader
 * @param {string} [className] - Custom classes
 */
function CourtUtilizationCardComponent({
  percentage = 72,
  delta = 13,
  activeCourts = 4,
  totalCourts = 4,
  peakWindow = '5–8 PM',
  targetPct = 80,
  loading = false,
  className = '',
}) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const clamped = Math.min(100, Math.max(0, percentage));

  // Smooth count-up ease-out on mount / value change
  useEffect(() => {
    let startTs = null;
    const duration = 1000;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(Math.round(eased * clamped));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [clamped]);

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-4 flex flex-col items-center justify-center gap-3 shadow-subtle h-full ${className}`}>
        <div className="w-28 h-16 bg-stone-200 rounded-t-full animate-pulse" />
        <div className="h-4 w-16 bg-stone-200 rounded animate-pulse" />
        <div className="h-3 w-24 bg-stone-200/60 rounded animate-pulse" />
      </div>
    );
  }

  // ── Semicircle SVG math ─────────────────────────────────────────
  // viewBox 0 0 120 65, arc from (10, 60) to (110, 60) along a semicircle
  // radius = 50, centre = (60, 60)
  const r = 50;
  const cx = 60;
  const cy = 60;
  const strokeWidth = 8;
  // Full semicircle arc length = π × r ≈ 157.08
  const arcLen = Math.PI * r;
  const trackDash = `${arcLen} ${arcLen}`;
  // Active arc offset: 0 = full, arcLen = empty
  const activeOffset = arcLen - (animatedPct / 100) * arcLen;

  // Colour: green above target, coral below
  const arcColour = animatedPct >= targetPct ? DASHBOARD_THEME.LIME : DASHBOARD_THEME.CORAL;

  return (
    <div
      className={`group bg-white rounded-xl border border-[#10221C]/12 p-4 flex flex-col items-center justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/25 ${className}`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
            <Activity size={14} strokeWidth={2.3} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
            Court Utilization
          </span>
        </div>
        {delta !== undefined && <Delta value={delta} />}
      </div>

      {/* Semicircle gauge */}
      <div className="relative flex items-center justify-center w-full mt-1">
        <svg viewBox="0 0 120 65" className="w-36 h-20" aria-label={`Court utilization: ${animatedPct}%`}>
          {/* Background track arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(16, 34, 28, 0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={arcColour}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={trackDash}
            strokeDashoffset={activeOffset}
            className="transition-all duration-75 ease-out"
          />
        </svg>

        {/* Centered percentage label */}
        <div className="absolute bottom-1 flex flex-col items-center pointer-events-none">
          <span className="text-[28px] font-black text-[#101F1A] leading-none tracking-tight tabular-nums">
            {animatedPct}%
          </span>
        </div>
      </div>

      {/* Subtext */}
      <div className="w-full text-center -mt-1">
        <p className="text-[11px] text-stone-500 font-medium leading-snug">
          {animatedPct >= targetPct
            ? `On track for ${targetPct}% target`
            : `${activeCourts} of ${totalCourts} courts active · peak ${peakWindow}`}
        </p>
      </div>
    </div>
  );
}

export const CourtUtilizationCard = memo(CourtUtilizationCardComponent);
export default CourtUtilizationCard;
