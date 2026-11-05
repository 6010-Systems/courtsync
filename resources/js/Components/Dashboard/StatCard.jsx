import React, { memo, isValidElement } from 'react';
import Delta from './Delta';

/**
 * StatCard - Compact KPI metric card with 2-row layout
 *
 * Layout:
 *   Row A: label (left)  |  icon badge (right)
 *   Row B: value + delta pill inline
 *          comparison subtext below
 *
 * @param {string} label - Metric label
 * @param {string|number} value - Primary metric display
 * @param {string} [unit] - Metric unit appended after value
 * @param {number|string} [delta] - Percentage change (inline next to value)
 * @param {boolean} [good] - Semantic override for delta colour
 * @param {string} [comparison] - Muted subtext e.g. 'vs. 214 last period'
 * @param {string} [sub] - Alias for comparison (legacy compat)
 * @param {React.ReactNode|React.ComponentType} [icon] - Lucide icon
 * @param {string} [iconVariant='default'] - 'volt' | 'forest' | 'coral' | 'default'
 * @param {React.ReactNode} [children] - Extra visual slot (sparkline, mini chart)
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {function} [onClick] - Click handler
 * @param {string} [className] - Custom classes
 */
function StatCardComponent({
  label,
  value,
  unit,
  delta,
  good,
  comparison,
  sub,         // legacy alias
  icon: Icon,
  iconVariant = 'default',
  children,
  loading = false,
  onClick,
  className = '',
}) {
  // ── Loading skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-4 flex flex-col justify-between gap-3 shadow-subtle ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-stone-200/80 rounded animate-pulse" />
          <div className="h-7 w-7 bg-stone-200/60 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <div className="h-8 w-20 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-10 bg-stone-200/60 rounded-full animate-pulse" />
          </div>
          <div className="h-3 w-28 bg-stone-200/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const isInteractive = typeof onClick === 'function';
  const comparisonText = comparison ?? sub ?? null;

  // ── Icon badge styles ────────────────────────────────────────────
  const getIconStyles = () => {
    switch (iconVariant) {
      case 'volt':
        return 'bg-[#D6FF3F]/35 text-[#101F1A] border-[#D6FF3F]/50';
      case 'forest':
        return 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A] shadow-xs';
      case 'coral':
        return 'bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/25';
      default:
        return 'bg-[#101F1A]/[0.05] text-[#101F1A] border-[#101F1A]/10';
    }
  };

  const renderIcon = () => {
    if (!Icon) return null;
    if (isValidElement(Icon)) return Icon;
    const IconComponent = Icon;
    return <IconComponent size={14} strokeWidth={2.3} />;
  };

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={`group bg-white rounded-xl border border-[#10221C]/12 p-4 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 ${
        isInteractive
          ? 'cursor-pointer hover:border-[#10221C]/30 hover:shadow-card hover:-translate-y-0.5'
          : 'hover:border-[#10221C]/20'
      } ${className}`}
    >
      {/* Row A — label + icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 truncate">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getIconStyles()}`}
          >
            {renderIcon()}
          </div>
        )}
      </div>

      {/* Row B — value + delta + comparison */}
      <div className="mt-2 min-w-0">
        {/* Value + inline delta */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-[30px] font-black leading-none text-[#101F1A] tracking-tight truncate">
            {value}
            {unit && <span className="text-xs font-semibold ml-1 text-stone-500">{unit}</span>}
          </div>
          {delta !== undefined && <Delta value={delta} good={good} badge size="xs" />}
        </div>

        {/* Comparison subtext */}
        {comparisonText && (
          <p className="text-[11px] text-stone-500 font-medium mt-1 truncate">
            {comparisonText}
          </p>
        )}

        {/* Extra visual slot */}
        {children && <div className="mt-2 shrink-0">{children}</div>}
      </div>
    </div>
  );
}

export const StatCard = memo(StatCardComponent);
export default StatCard;
