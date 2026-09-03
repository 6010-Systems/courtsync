import React, { memo } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * Delta - Trend & percentage change indicator
 *
 * @param {number|string} value - Percentage or change amount
 * @param {boolean} [good] - Override default semantic (true = green/emerald, false = rose/red)
 * @param {boolean} [badge=false] - Display as rounded pill badge with subtle background
 * @param {string} [size='sm'] - 'xs' | 'sm' | 'md'
 * @param {string} [prefix] - Custom prefix (+, $, etc.)
 * @param {string} [suffix='%'] - Suffix (% by default)
 * @param {string} [className] - Additional classes
 */
function DeltaComponent({
  value,
  good,
  badge = false,
  size = 'sm',
  prefix,
  suffix = '%',
  className = '',
}) {
  const numVal = typeof value === 'number' ? value : parseFloat(value);
  const isZero = isNaN(numVal) || numVal === 0;
  const isUp = numVal > 0;

  // Semantic color calculation
  const isPositiveSemantic = good !== undefined ? good : isUp;

  let colorClasses = 'text-emerald-700 dark:text-emerald-400';
  let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200/60';

  if (isZero) {
    colorClasses = 'text-stone-500 dark:text-stone-400';
    badgeBg = 'bg-stone-100 text-stone-600 border-stone-200';
  } else if (!isPositiveSemantic) {
    colorClasses = 'text-rose-600 dark:text-rose-400';
    badgeBg = 'bg-rose-50 text-rose-600 border-rose-200/60';
  }

  const iconSizes = {
    xs: 11,
    sm: 13,
    md: 15,
  };

  const textSizes = {
    xs: 'text-[10px] leading-tight',
    sm: 'text-xs font-semibold',
    md: 'text-sm font-semibold',
  };

  const Icon = isZero ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const formattedPrefix = prefix !== undefined ? prefix : isUp ? '+' : '';

  if (badge) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium transition-colors ${badgeBg} ${textSizes[size]} ${className}`}
        aria-label={`Change: ${formattedPrefix}${value}${suffix}`}
      >
        <Icon size={iconSizes[size]} strokeWidth={2.5} className="shrink-0" />
        <span>{formattedPrefix}{value}{suffix}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 tracking-tight ${colorClasses} ${textSizes[size]} ${className}`}
      aria-label={`Change: ${formattedPrefix}${value}${suffix}`}
    >
      <Icon size={iconSizes[size]} strokeWidth={2.5} className="shrink-0" />
      <span>{formattedPrefix}{value}{suffix}</span>
    </span>
  );
}

export const Delta = memo(DeltaComponent);
export default Delta;
