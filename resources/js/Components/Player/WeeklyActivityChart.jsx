import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function WeeklyActivityChart({ 
    data = [], 
    totalHours = 38.5,
}) {
    const [showTable, setShowTable] = useState(false);

    // 8-week historical activity dataset
    const chartData = data.length > 0 ? data : [
        { week: 'W1', label: 'Oct 6', hours: 3.0, games: 2 },
        { week: 'W2', label: 'Oct 13', hours: 4.5, games: 3 },
        { week: 'W3', label: 'Oct 20', hours: 6.0, games: 4 },
        { week: 'W4', label: 'Oct 27', hours: 1.5, games: 1 },
        { week: 'W5', label: 'Nov 3', hours: 4.5, games: 3 },
        { week: 'W6', label: 'Nov 10', hours: 3.0, games: 2 },
        { week: 'W7', label: 'Nov 17', hours: 5.0, games: 3 },
        { week: 'W8', label: 'This Wk', hours: 4.5, games: 3, isCurrent: true },
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="rounded-xl bg-[#101F1A] text-white p-2.5 text-xs shadow-xl border border-[#D6FF3F]/30">
                    <p className="font-bold text-[#D6FF3F]">{item.label || item.week}</p>
                    <p className="font-semibold mt-0.5">{item.hours} hrs on court</p>
                    {item.games && (
                        <p className="text-[11px] text-[#F5F2EA]/75 mt-0.5">{item.games} matches played</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <motion.div 
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl bg-white border border-[#10221C]/6 p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:border-[#10221C]/15 transition-all overflow-hidden"
        >
            {/* Background Athletic Dot-Matrix Graphic Watermark */}
            <div className="pointer-events-none absolute -right-2 -top-2 w-28 h-28 opacity-[0.04] text-[#10221C]">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                    {[10, 25, 40, 55, 70, 85].flatMap(x =>
                        [10, 25, 40, 55, 70, 85].map(y => (
                            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />
                        ))
                    )}
                </svg>
            </div>

            {/* Header */}
            <div className="relative z-10 flex items-start justify-between gap-3 mb-3">
                <div>
                    <span className="text-[11px] font-bold text-[#10221C]/50 uppercase tracking-widest block">
                        Weekly Activity
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#10221C] tracking-tight mt-0.5">
                        {totalHours} <span className="text-xs font-bold text-[#10221C]/50">Total Hours (8 Wks)</span>
                    </h3>
                </div>

                <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowTable(!showTable)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#10221C]/10 bg-gray-50 text-[#10221C]/70 hover:text-[#10221C] hover:bg-gray-100 transition text-xs flex items-center cursor-pointer shrink-0"
                    title={showTable ? 'View as Bar Chart' : 'View as Accessible Data Table'}
                    aria-label={showTable ? 'Switch to Bar Chart view' : 'Switch to Data Table view'}
                >
                    <span className="font-bold text-[11px]">{showTable ? 'View Chart' : 'View Table'}</span>
                </motion.button>
            </div>

            {/* Accessible Data Table View (Toggleable) */}
            {showTable ? (
                <div className="relative z-10 my-2 overflow-x-auto rounded-xl border border-gray-100 bg-[#FAF9F5] p-2 text-xs">
                    <table className="w-full text-left" aria-label="Weekly match hours data">
                        <thead>
                            <tr className="border-b border-gray-200/70 text-[10px] uppercase font-bold text-[#10221C]/50">
                                <th className="p-1.5">Week</th>
                                <th className="p-1.5 text-right">Hours</th>
                                <th className="p-1.5 text-right">Matches</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-bold text-[#10221C]">
                            {chartData.map((row) => (
                                <tr key={row.week} className={row.isCurrent ? 'bg-[#D6FF3F]/20' : ''}>
                                    <td className="p-1.5 font-bold">{row.label}</td>
                                    <td className="p-1.5 text-right font-black">{row.hours}h</td>
                                    <td className="p-1.5 text-right text-[#10221C]/60">{row.games}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Recharts Bar Chart */
                <div className="relative z-10 h-44 sm:h-52 w-full my-1 min-w-0" aria-hidden="true">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                        <BarChart data={chartData} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}>
                            <XAxis 
                                dataKey="week" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#10221C', opacity: 0.55, fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#10221C', opacity: 0.45, fontSize: 10, fontWeight: 600 }}
                                unit="h"
                                domain={[0, 'dataMax + 1']}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 34, 28, 0.04)', radius: 8 }} />
                            <Bar 
                                dataKey="hours" 
                                radius={[6, 6, 2, 2]} 
                                animationDuration={800}
                                animationEasing="ease-out"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.isCurrent ? '#D6FF3F' : '#c8ed38'}
                                        stroke="rgba(16, 34, 28, 0.08)"
                                        strokeWidth={0.75}
                                        opacity={entry.isCurrent ? 1 : 0.85}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Accessible Fallback Notice */}
            <div className="relative z-10 mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#10221C]/50 font-medium">
                <span>Active week: <strong className="text-[#10221C]">4.5 hrs</strong></span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                    8 Wk Streak
                </span>
            </div>
        </motion.div>
    );
}
