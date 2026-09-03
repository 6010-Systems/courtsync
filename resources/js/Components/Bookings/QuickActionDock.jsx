import React, { useState } from 'react';
import { Search, UserPlus, Filter, Clock, Check, Sparkles } from 'lucide-react';
import SportIcon from './SportIcon';
import { SPORTS_CONFIG } from './types';

export default function QuickActionDock({
    onSearchTrigger,
    onWalkInClick,
    selectedSport = 'ALL',
    onSelectSport,
    onJumpToNow,
}) {
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const sportsList = ['ALL', ...Object.keys(SPORTS_CONFIG)];

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
            <div className="relative flex items-center gap-1.5 rounded-full border border-white/15 bg-[#101F1A]/95 px-3 py-2 text-[#F5F2EA] shadow-elevated backdrop-blur-md">
                
                {/* 1. Quick Search Trigger */}
                <button
                    type="button"
                    onClick={onSearchTrigger}
                    title="Quick Search (⌘K)"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                    <Search size={16} />
                </button>

                <div className="h-4 w-px bg-white/15" />

                {/* 2. + Walk-in Shortcut CTA */}
                <button
                    type="button"
                    onClick={onWalkInClick}
                    title="Quick Walk-in Booking"
                    className="flex h-9 items-center gap-1.5 rounded-full bg-[#D6FF3F] px-3.5 text-xs font-bold text-[#101F1A] shadow-xs hover:bg-[#c2ea2e] hover:shadow-volt-glow transition-all press-scale cursor-pointer"
                >
                    <UserPlus size={15} strokeWidth={2.4} />
                    <span className="font-extrabold uppercase tracking-wide">+ Walk-in</span>
                </button>

                <div className="h-4 w-px bg-white/15" />

                {/* 3. Sport & Court Filter Trigger */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                        title="Filter by Sport"
                        className={[
                            'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors cursor-pointer',
                            selectedSport !== 'ALL'
                                ? 'bg-[#FF5A36] text-white shadow-xs'
                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                        ].join(' ')}
                    >
                        <Filter size={14} />
                        <span className="hidden sm:inline">
                            {selectedSport === 'ALL' ? 'Filter Sport' : selectedSport}
                        </span>
                    </button>

                    {/* Filter Popup Menu */}
                    {filterMenuOpen && (
                        <div
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 w-52 rounded-xl border border-white/15 bg-[#101F1A] p-2 shadow-elevated"
                            onMouseLeave={() => setFilterMenuOpen(false)}
                        >
                            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                                Filter by Sport
                            </p>
                            <div className="space-y-0.5 mt-1">
                                {sportsList.map((sport) => {
                                    const isSelected = selectedSport === sport;
                                    return (
                                        <button
                                            key={sport}
                                            type="button"
                                            onClick={() => {
                                                onSelectSport(sport);
                                                setFilterMenuOpen(false);
                                            }}
                                            className={[
                                                'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                                                isSelected
                                                    ? 'bg-[#D6FF3F] text-[#101F1A] font-bold'
                                                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                                            ].join(' ')}
                                        >
                                            <span className="flex items-center gap-2">
                                                <SportIcon sport={sport} size={14} />
                                                <span>{sport === 'ALL' ? 'All Sports' : sport}</span>
                                            </span>
                                            {isSelected && <Check size={14} strokeWidth={2.5} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-4 w-px bg-white/15" />

                {/* 4. Jump to Now Trigger */}
                <button
                    type="button"
                    onClick={onJumpToNow}
                    title="Jump to Current Time"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                    <Clock size={16} />
                </button>
            </div>
        </div>
    );
}
