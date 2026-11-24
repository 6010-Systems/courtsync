import React from 'react';
import { Check } from 'lucide-react';
import { MethodTileProps } from './types';

export const MethodTile: React.FC<MethodTileProps> = ({
    id,
    name,
    subtitle,
    selected,
    isConfigured,
    onSelect,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onSelect(id);
        }
    };

    return (
        <div
            role="radio"
            aria-checked={selected}
            aria-label={`${name} payment method`}
            tabIndex={0}
            onClick={() => onSelect(id)}
            onKeyDown={handleKeyDown}
            className={`
                group relative flex min-h-[84px] sm:min-h-[92px] w-full flex-col justify-between rounded-xl p-3 sm:p-4 text-left
                transition-all duration-150 cursor-pointer select-none
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C] focus-visible:ring-offset-2
                ${
                    selected
                        ? 'border-2 border-[#10221C] bg-[#D6FF3F]/15 shadow-xs'
                        : 'border border-[#10221C]/15 bg-white hover:border-[#10221C]/30 hover:bg-[#10221C]/[0.02]'
                }
            `}
        >
            {/* Top row: Method Chip & Radio Indicator */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span
                        className={`
                            flex h-6 sm:h-7 px-2 sm:px-2.5 items-center justify-center rounded-lg font-bold text-xs uppercase tracking-wider shrink-0
                            ${
                                id === 'gcash'
                                    ? 'bg-[#10221C] text-[#D6FF3F]'
                                    : 'bg-[#10221C] text-white'
                            }
                        `}
                    >
                        {name}
                    </span>

                    {/* Status Pill */}
                    {isConfigured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#10221C]/10 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#10221C] whitespace-nowrap">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10221C]" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#10221C]/[0.05] px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium text-[#10221C]/50 whitespace-nowrap">
                            Not set up
                        </span>
                    )}
                </div>

                {/* Radio selection circle */}
                <div
                    className={`
                        flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full transition-all
                        ${
                            selected
                                ? 'bg-[#10221C] text-[#D6FF3F]'
                                : 'border-2 border-[#10221C]/25 bg-transparent group-hover:border-[#10221C]/40'
                        }
                    `}
                >
                    {selected && <Check size={10} strokeWidth={3} className="sm:hidden" />}
                    {selected && <Check size={11} strokeWidth={3} className="hidden sm:block" />}
                </div>
            </div>

            {/* Description */}
            <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-xs text-[#10221C]/60 line-clamp-1">
                {subtitle || 'Accept QR code and mobile payments'}
            </p>
        </div>
    );
};
