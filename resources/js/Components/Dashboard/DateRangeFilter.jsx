import React, { useState, useRef, useEffect, memo } from 'react';
import { CalendarDays, ChevronDown, Check } from 'lucide-react';
import { DEFAULT_DATE_RANGES } from './constants';

/**
 * DateRangeFilter - Date timeframe filter dropdown with clean color-only hover transitions
 *
 * @param {string} [range='This Week'] - Active selected range
 * @param {Array<string>} [ranges=DEFAULT_DATE_RANGES] - List of selectable ranges
 * @param {function} onRangeChange - Callback function triggered on range select
 * @param {string} [className] - Additional CSS classes
 */
function DateRangeFilterComponent({
  range = 'This Week',
  ranges = DEFAULT_DATE_RANGES,
  onRangeChange,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#101F1A]/10 bg-white/90 px-3 text-xs font-semibold text-[#101F1A] shadow-subtle transition-colors duration-150 hover:bg-white hover:border-[#101F1A]/25 focus-ring-volt cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <CalendarDays size={13} className="text-[#101F1A]/70" strokeWidth={2.2} />
        <span>{range}</span>
        <ChevronDown
          size={13}
          className={`text-[#101F1A]/50 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white p-1 shadow-elevated animate-fade-in">
          {ranges.map((r) => {
            const isSelected = r === range;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onRangeChange?.(r);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#F5F2EA] text-[#101F1A] font-bold'
                    : 'text-[#101F1A]/70 hover:bg-[#F5F2EA]/60 hover:text-[#101F1A]'
                }`}
              >
                <span>{r}</span>
                {isSelected && (
                  <Check size={13} className="text-[#101F1A] stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const DateRangeFilter = memo(DateRangeFilterComponent);
export default DateRangeFilter;
