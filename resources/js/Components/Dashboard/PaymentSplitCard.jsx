import React, { memo, useMemo } from 'react';
import { WalletCards, Sparkles } from 'lucide-react';
import { DASHBOARD_THEME, MOCK_PAYMENT_SPLIT } from './constants';

/**
 * PaymentSplitCard - Breakdown of revenue by payment method with brand Volt leader highlight
 *
 * @param {Array} [paymentSplit=MOCK_PAYMENT_SPLIT] - Array of { label, value, pct, color, isPrimary }
 * @param {boolean} [loading=false] - Skeleton loader state
 * @param {string} [className] - Custom classes
 */
function PaymentSplitCardComponent({
  paymentSplit = MOCK_PAYMENT_SPLIT,
  loading = false,
  className = '',
}) {
  const totalAmount = useMemo(() => {
    return paymentSplit.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [paymentSplit]);

  const topMethod = useMemo(() => {
    if (!paymentSplit.length) return null;
    return [...paymentSplit].sort((a, b) => b.pct - a.pct)[0];
  }, [paymentSplit]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-[#10221C]/10 p-5 shadow-subtle h-full ${className}`}>
        <div className="h-4 w-40 bg-stone-200 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-stone-200 rounded animate-pulse" />
                <div className="h-3 w-14 bg-stone-200 rounded animate-pulse" />
              </div>
              <div className="h-2 w-full bg-stone-200 rounded-full animate-pulse" />
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
              <WalletCards size={14} strokeWidth={2.3} />
            </div>
            <h3 className="text-sm font-bold text-[#101F1A]">Revenue by Payment</h3>
          </div>
          {topMethod && (
            <span className="text-[10px] font-black text-[#101F1A] bg-[#D6FF3F] px-2 py-0.5 rounded-md border border-[#101F1A]/20 shadow-xs flex items-center gap-1">
              <Sparkles size={10} className="text-[#101F1A]" />
              {topMethod.label} Top ({topMethod.pct}%)
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {paymentSplit.map((p) => {
            const isTop = p.isPrimary || (topMethod && topMethod.label === p.label);

            return (
              <div key={p.label} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs transition-transform group-hover:scale-125 ${
                        isTop ? 'ring-1 ring-[#101F1A]/30' : ''
                      }`}
                      style={{ backgroundColor: p.color }}
                    />
                    <span className={`text-xs ${isTop ? 'font-black text-[#101F1A]' : 'font-bold text-stone-700'}`}>
                      {p.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-semibold text-[11px]">
                      ₱{p.value.toLocaleString()}
                    </span>
                    <span className={`w-8 text-right tabular-nums text-xs ${isTop ? 'font-black text-[#101F1A]' : 'font-bold text-stone-700'}`}>
                      {p.pct}%
                    </span>
                  </div>
                </div>
                <div
                  className={`h-2.5 rounded-full overflow-hidden p-[1px] border ${
                    isTop
                      ? 'bg-[#101F1A]/10 border-[#101F1A]/15'
                      : 'bg-stone-100 border-stone-200/60'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isTop ? 'shadow-xs border border-[#101F1A]/20' : ''
                    }`}
                    style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#10221C]/10 flex items-center justify-between text-xs font-semibold text-[#10221C]">
        <span className="text-stone-600 font-bold text-xs">Total Processed</span>
        <span className="text-base font-black text-[#101F1A] tracking-tight">
          ₱{totalAmount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export const PaymentSplitCard = memo(PaymentSplitCardComponent);
export default PaymentSplitCard;
