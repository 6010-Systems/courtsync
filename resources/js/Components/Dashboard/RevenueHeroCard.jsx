import React, { memo } from 'react';
import { Download, Wallet } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import Delta from './Delta';
import { DASHBOARD_THEME, MOCK_REVENUE_TREND } from './constants';

/**
 * Custom Tooltip for Revenue Sparkline
 */
const CustomRevenueTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="bg-[#101F1A] border border-[#D6FF3F]/30 rounded-lg px-2.5 py-1.5 shadow-xl text-left pointer-events-none">
        <p className="text-[10px] text-[#F5F2EA]/60 font-medium">{item.time || item.label || 'Day'}</p>
        <p className="text-xs font-bold text-[#D6FF3F]">
          ₱{typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * RevenueHeroCard - Prominent total revenue card with sparkline & booking-source sub-strip
 *
 * @param {string|number} totalRevenue - Formatted revenue amount (e.g., '₱82,450')
 * @param {number} [delta] - Percentage growth
 * @param {string} [comparisonText] - Comparison subtext
 * @param {Array} [chartData] - Array of { v: number, time?: string }
 * @param {object} [bookingSources] - { online, walkIn, staff } booking counts
 * @param {function} [onPayout] - Payout action callback
 * @param {function} [onExport] - Export action callback
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function RevenueHeroCardComponent({
  totalRevenue = '₱82,450',
  delta = 12,
  comparisonText = 'vs ₱73,600 last period',
  chartData = MOCK_REVENUE_TREND,
  bookingSources = { online: 2884, walkIn: 1432, staff: 562 },
  onPayout,
  onExport,
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div
        className={`rounded-xl p-5 flex flex-col relative overflow-hidden h-[200px] animate-pulse ${className}`}
        style={{ backgroundColor: DASHBOARD_THEME.FOREST_2 }}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="h-10 w-44 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const sources = [
    { label: 'Online', value: bookingSources.online, color: DASHBOARD_THEME.LIME },
    { label: 'Walk-in', value: bookingSources.walkIn, color: DASHBOARD_THEME.CORAL },
    { label: 'Staff', value: bookingSources.staff, color: DASHBOARD_THEME.MUTED_SAGE },
  ];

  return (
    <div
      className={`rounded-xl flex flex-col relative overflow-hidden shadow-card text-[#F5F2EA] ${className}`}
      style={{ backgroundColor: DASHBOARD_THEME.FOREST_2 }}
    >
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(#D6FF3F 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Main metric area */}
      <div className="relative z-10 p-5 pb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5F2EA]/50">
            Total Revenue
          </span>
          <div className="flex items-baseline gap-3 mt-1 flex-wrap">
            <span className="text-[38px] sm:text-[42px] font-black leading-none tracking-tight text-[#F5F2EA]">
              {totalRevenue}
            </span>
            {delta !== undefined && (
              <Delta value={delta} good={delta >= 0} badge size="xs"
                className="bg-[#D6FF3F]/15 text-[#D6FF3F] border-[#D6FF3F]/30" />
            )}
          </div>
          {comparisonText && (
            <p className="text-[11px] text-[#F5F2EA]/50 mt-1.5 font-medium">{comparisonText}</p>
          )}
        </div>

        {/* Icon-only action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPayout}
            title="Payout"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 hover:brightness-105 cursor-pointer"
            style={{ backgroundColor: DASHBOARD_THEME.LIME, color: DASHBOARD_THEME.FOREST }}
          >
            <Wallet size={15} strokeWidth={2.3} />
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Export"
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#F5F2EA] bg-[#F5F2EA]/10 hover:bg-[#F5F2EA]/20 transition-all duration-150 active:scale-95 border border-white/8 cursor-pointer"
          >
            <Download size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Sparkline — full-width, bleeds into card */}
      <div className="relative z-0 flex-1 min-h-[80px] w-full mt-auto flex items-end">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 25 }}>
            <defs>
              <linearGradient id="heroRevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DASHBOARD_THEME.LIME} stopOpacity={0.45} />
                <stop offset="100%" stopColor={DASHBOARD_THEME.LIME} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<CustomRevenueTooltip />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={DASHBOARD_THEME.LIME}
              strokeWidth={2.5}
              fill="url(#heroRevGradient)"
              activeDot={{ r: 4, fill: DASHBOARD_THEME.LIME, stroke: DASHBOARD_THEME.FOREST_2, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Sources sub-strip */}
      <div
        className="relative z-10 flex items-stretch divide-x divide-white/10 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        {sources.map((src) => (
          <div key={src.label} className="flex-1 flex flex-col items-center justify-center py-3 px-2">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: src.color }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5F2EA]/50">
                {src.label}
              </span>
            </div>
            <span className="text-base font-black text-[#F5F2EA] mt-0.5 tabular-nums">
              {src.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const RevenueHeroCard = memo(RevenueHeroCardComponent);
export default RevenueHeroCard;
