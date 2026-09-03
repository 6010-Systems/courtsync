import React, { useState, memo } from 'react';
import { Flame, Info } from 'lucide-react';
import Delta from './Delta';
import { DASHBOARD_THEME, MOCK_HOURS, MOCK_COURTS, MOCK_HEATMAP } from './constants';

/**
 * PeakBookingHoursCard - Interactive 2D heatmap matrix themed to CourtSync Volt/Forest tokens
 *
 * @param {Array} [hours=MOCK_HOURS] - Array of hour labels (e.g. ['8A', '10A', ...])
 * @param {Array} [courts=MOCK_COURTS] - Array of court names
 * @param {Array<Array<number>>} [heatmap=MOCK_HEATMAP] - 2D matrix of occupancy values (0..1)
 * @param {number} [delta=6] - Trend percentage
 * @param {string} [timeframe='last 7 days'] - Subtitle timeframe
 * @param {string} [className] - Custom classes
 */
function PeakBookingHoursCardComponent({
  hours = MOCK_HOURS,
  courts = MOCK_COURTS,
  heatmap = MOCK_HEATMAP,
  delta = 6,
  timeframe = 'last 7 days',
  className = '',
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Theme-based cell styling helper
  const getCellThemeStyles = (intensity) => {
    if (intensity >= 0.8) {
      // Peak load: signature CourtSync Volt / Lime highlight
      return {
        backgroundColor: DASHBOARD_THEME.LIME,
        opacity: 1,
        borderColor: 'rgba(16, 31, 26, 0.15)',
      };
    }
    if (intensity >= 0.55) {
      // High load: Deep forest high-opacity
      return {
        backgroundColor: DASHBOARD_THEME.FOREST,
        opacity: 0.75,
        borderColor: 'transparent',
      };
    }
    if (intensity >= 0.3) {
      // Medium load: Moderate forest tint
      return {
        backgroundColor: DASHBOARD_THEME.FOREST,
        opacity: 0.35,
        borderColor: 'transparent',
      };
    }
    // Low load: Subtle muted tint
    return {
      backgroundColor: DASHBOARD_THEME.FOREST,
      opacity: 0.10,
      borderColor: 'transparent',
    };
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#10221C]/10 p-5 flex flex-col justify-between shadow-subtle h-full transition-all duration-200 hover:border-[#10221C]/20 ${className}`}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
              <Flame size={15} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#10221C]">Peak Booking Hours</h3>
              <p className="text-xs text-[#10221C]/50 mt-0.5">Court occupancy by hour, {timeframe}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hoveredCell ? (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#101F1A] text-white text-[11px] font-medium shadow-sm animate-fade-in">
                <span className="text-[#D6FF3F] font-bold">{hoveredCell.court}</span>
                <span className="text-white/40">·</span>
                <span>{hoveredCell.hour}</span>
                <span className="text-white/40">·</span>
                <span className="font-bold text-[#D6FF3F]">{Math.round(hoveredCell.intensity * 100)}% load</span>
              </div>
            ) : (
              delta !== undefined && <Delta value={delta} />
            )}
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-2.5 pt-1">
          {/* Court Names (Y-Axis) */}
          <div className="flex flex-col justify-between text-[11px] font-semibold text-[#10221C]/60 py-0.5 pr-1 shrink-0">
            {courts.map((court) => (
              <span key={court} className="h-8 flex items-center">
                {court}
              </span>
            ))}
          </div>

          {/* Heatmap Cells */}
          <div className="flex-1 flex flex-col gap-1.5">
            {heatmap.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-7 gap-1.5">
                {row.map((intensity, colIndex) => {
                  const courtName = courts[rowIndex] || `Court ${rowIndex + 1}`;
                  const hourLabel = hours[colIndex] || `${colIndex}`;
                  const isPeak = intensity >= 0.8;
                  const isHovered =
                    hoveredCell &&
                    hoveredCell.row === rowIndex &&
                    hoveredCell.col === colIndex;

                  const cellStyle = getCellThemeStyles(intensity);

                  return (
                    <div
                      key={colIndex}
                      onMouseEnter={() =>
                        setHoveredCell({
                          court: courtName,
                          hour: hourLabel,
                          intensity,
                          row: rowIndex,
                          col: colIndex,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${courtName} @ ${hourLabel}: ${Math.round(intensity * 100)}% booked`}
                      className={`h-8 rounded-lg cursor-pointer transition-all duration-150 border relative ${
                        isHovered
                          ? 'z-10 shadow-xs ring-2 ring-[#101F1A] border-[#101F1A]'
                          : 'hover:border-[#101F1A]/40'
                      }`}
                      style={cellStyle}
                    />
                  );
                })}
              </div>
            ))}

            {/* Hour Labels (X-Axis) */}
            <div className="grid grid-cols-7 gap-1.5 mt-1">
              {hours.map((hour) => (
                <span key={hour} className="text-[10px] font-bold text-center text-[#10221C]/45">
                  {hour}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-[#10221C]/5 flex items-center justify-between text-[11px] text-[#10221C]/55 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Info size={12} className="text-[#10221C]/40" />
          <span>Hover cell for exact court capacity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#10221C]/50 font-medium">Low (10%)</span>
          <div className="flex gap-1 items-center">
            <span className="w-3.5 h-3.5 rounded bg-[#101F1A]/10 border border-black/5" />
            <span className="w-3.5 h-3.5 rounded bg-[#101F1A]/35" />
            <span className="w-3.5 h-3.5 rounded bg-[#101F1A]/75" />
            <span className="w-3.5 h-3.5 rounded bg-[#D6FF3F] border border-[#101F1A]/20 shadow-xs" />
          </div>
          <span className="text-[10px] text-[#101F1A] font-bold">Peak (80%+)</span>
        </div>
      </div>
    </div>
  );
}

export const PeakBookingHoursCard = memo(PeakBookingHoursCardComponent);
export default PeakBookingHoursCard;
