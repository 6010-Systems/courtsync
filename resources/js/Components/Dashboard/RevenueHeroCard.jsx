import React, { memo } from 'react';
import { Wallet, Download } from 'lucide-react';
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
 * RevenueHeroCard - Prominent total revenue overview with sparkline & quick actions
 *
 * @param {string|number} totalRevenue - Formatted or raw revenue amount (e.g., '₱82,450')
 * @param {number} [delta=12] - Percentage growth
 * @param {string} [comparisonText='vs ₱73,600 last period'] - Comparison subtext
 * @param {Array} [chartData=MOCK_REVENUE_TREND] - Array of { v: number, time?: string }
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
  onPayout,
  onExport,
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div
        className={`rounded-xl p-6 flex flex-col justify-between relative overflow-hidden h-[180px] bg-[#10221C] animate-pulse ${className}`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-white/10 rounded" />
            <div className="h-10 w-44 bg-white/10 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-white/10 rounded-lg" />
            <div className="h-8 w-20 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-6 flex flex-col justify-between relative overflow-hidden shadow-card text-[#F5F2EA] ${className}`}
      style={{ backgroundColor: DASHBOARD_THEME.FOREST_2 }}
    >
      {/* Background Court Grid Texture Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: 'radial-gradient(#D6FF3F 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="flex items-start justify-between flex-wrap gap-4 relative z-10">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5F2EA]/50">
            Total Revenue
          </span>
          <div className="flex items-baseline gap-3 mt-1.5 flex-wrap">
            <span
              className="text-[#F5F2EA] text-[36px] sm:text-[42px] font-black leading-none tracking-tight"
            >
              {totalRevenue}
            </span>
            {delta !== undefined && (
              <span className="inline-flex items-center">
                <Delta value={delta} good={delta >= 0} badge size="sm" className="bg-[#D6FF3F]/15 text-[#D6FF3F] border-[#D6FF3F]/30" />
              </span>
            )}
          </div>
          {comparisonText && (
            <p className="text-xs text-[#F5F2EA]/60 mt-2 font-medium">
              {comparisonText}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            type="button"
            onClick={onPayout}
            className="flex items-center gap-1.5 text-xs font-bold rounded-xl px-3.5 py-2 transition-all duration-150 active:scale-95 shadow-subtle hover:brightness-105 cursor-pointer"
            style={{ backgroundColor: DASHBOARD_THEME.LIME, color: DASHBOARD_THEME.FOREST }}
          >
            <Wallet size={14} strokeWidth={2.5} />
            Payout
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3.5 py-2 bg-[#F5F2EA]/10 text-[#F5F2EA] hover:bg-[#F5F2EA]/20 transition-all duration-150 active:scale-95 border border-white/5 cursor-pointer"
          >
            <Download size={14} strokeWidth={2} />
            Export
          </button>
        </div>
      </div>

      {/* Interactive Sparkline Area Chart */}
      <div className="h-20 min-h-[80px] -mx-3 -mb-3 mt-4 relative z-0">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="heroRevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={DASHBOARD_THEME.LIME} stopOpacity={0.4} />
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
    </div>
  );
}

export const RevenueHeroCard = memo(RevenueHeroCardComponent);
export default RevenueHeroCard;
