import React, { memo, isValidElement } from 'react';
import Delta from './Delta';

/**
 * StatCard - Standard KPI metric card with brand-aligned icon badges
 *
 * @param {string} label - Title or metric label
 * @param {string|number} value - Primary metric display
 * @param {string} [unit] - Metric unit (e.g., 'm', 'courts', '%')
 * @param {number|string} [delta] - Percentage change
 * @param {boolean} [good] - Semantic override for delta
 * @param {string} [sub] - Subtext explanation (e.g. '18 online · 6 walk-in')
 * @param {React.ReactNode|React.ComponentType} [icon] - Lucide icon component or element
 * @param {string} [iconVariant='default'] - 'volt' | 'forest' | 'coral' | 'default'
 * @param {React.ReactNode} [children] - Extra visual slot (sparkline, mini chart)
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {function} [onClick] - Click handler if card is interactive
 * @param {string} [className] - Custom classes
 */
function StatCardComponent({
  label,
  value,
  unit,
  delta,
  good,
  sub,
  icon: Icon,
  iconVariant = 'default',
  children,
  loading = false,
  onClick,
  className = '',
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col justify-between gap-4 shadow-subtle ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 bg-stone-200/80 rounded animate-pulse" />
          <div className="h-4 w-12 bg-stone-200/60 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-20 bg-stone-200 rounded animate-pulse" />
          <div className="h-3 w-32 bg-stone-200/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const isInteractive = typeof onClick === 'function';

  // Brand-aligned icon container badges
  const getIconStyles = () => {
    switch (iconVariant) {
      case 'volt':
        return 'bg-[#D6FF3F]/35 text-[#101F1A] border-[#D6FF3F]/60';
      case 'forest':
        return 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A] shadow-xs';
      case 'coral':
        return 'bg-[#FF5A36]/15 text-[#FF5A36] border-[#FF5A36]/30';
      case 'default':
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
      className={`group bg-white rounded-xl border border-[#10221C]/12 p-5 flex flex-col justify-between gap-3 shadow-subtle h-full transition-all duration-200 ${
        isInteractive
          ? 'cursor-pointer hover:border-[#10221C]/30 hover:shadow-card hover:-translate-y-0.5'
          : 'hover:border-[#10221C]/20'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 shrink-0 ${getIconStyles()}`}
            >
              {renderIcon()}
            </div>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 truncate">
            {label}
          </span>
        </div>

        {delta !== undefined && <Delta value={delta} good={good} badge />}
      </div>

      <div className="flex items-end justify-between gap-3 pt-0.5">
        <div className="min-w-0">
          <div className="text-[32px] sm:text-[34px] font-black leading-none text-[#101F1A] tracking-tight truncate">
            {value}
            {unit && <span className="text-sm font-semibold font-sans ml-1 text-stone-500">{unit}</span>}
          </div>
          {sub && (
            <p className="text-xs text-stone-600 mt-1.5 leading-snug font-medium truncate">
              {sub}
            </p>
          )}
        </div>

        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}

export const StatCard = memo(StatCardComponent);
export default StatCard;
