import React, { useState, useRef, useEffect } from 'react';
import Sheet from '@/Components/Sheet';
import SportIcon from '@/Components/Bookings/SportIcon';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import {
    PhilippinePeso,
    Clock,
    Building2,
    Calendar,
    Edit3,
    Layers,
    Sun,
    Zap,
    Users,
    ChevronDown,
    ArrowUpRight,
    ShieldCheck,
    MapPin,
    User,
    CheckCircle2,
    Activity,
    AlertTriangle,
    XCircle,
    X,
    Sparkles,
    Info,
    ExternalLink,
    BadgeCheck,
} from 'lucide-react';
import { router } from '@inertiajs/react';
import { useToast } from '@/Components/ToastContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80';

const STATUS_CONFIG = {
    AVAILABLE: {
        label: 'Available for Bookings',
        shortLabel: 'Available',
        style: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        badgeColor: 'bg-emerald-500',
        icon: CheckCircle2,
        description: 'Open for online and walk-in reservations',
    },
    OPEN_PLAY: {
        label: 'Open Play Session Active',
        shortLabel: 'Open Play',
        style: 'bg-blue-50 text-blue-800 border-blue-200/80',
        badgeColor: 'bg-blue-500',
        icon: Activity,
        description: 'Drop-in social play without fixed court booking',
    },
    BLOCKED: {
        label: 'Temporarily Blocked',
        shortLabel: 'Blocked',
        style: 'bg-amber-50 text-amber-800 border-amber-200/80',
        badgeColor: 'bg-amber-500',
        icon: AlertTriangle,
        description: 'Reserved for tournament, maintenance, or internal event',
    },
    NOT_AVAILABLE: {
        label: 'Offline / Under Maintenance',
        shortLabel: 'Offline',
        style: 'bg-stone-100 text-stone-700 border-stone-200/80',
        badgeColor: 'bg-stone-500',
        icon: XCircle,
        description: 'Temporarily offline or undergoing surface repair',
    },
};

/**
 * Derives realistic court specifications based on court sport type and description.
 */
function getCourtSpecs(court) {
    const desc = (court.description || '').toLowerCase();
    const type = (court.type || '').toLowerCase();

    let surface = 'Standard Sport Acrylic Hard Court';
    let surfaceTag = 'Hard Court';
    if (desc.includes('hardwood') || desc.includes('wood') || type.includes('basketball')) {
        surface = 'Olympic Canadian Maple Hardwood';
        surfaceTag = 'Hardwood';
    } else if (desc.includes('turf') || type.includes('futsal')) {
        surface = 'Shock-Pad Synthetic Turf (40mm)';
        surfaceTag = 'Turf';
    } else if (desc.includes('acrylic') || type.includes('tennis')) {
        surface = 'Plexipave Cushion Multi-Layer Acrylic';
        surfaceTag = 'Cushion Acrylic';
    } else if (desc.includes('taraflex') || type.includes('badminton') || type.includes('volleyball')) {
        surface = 'BWF Certified Taraflex Point-Elastic Mat';
        surfaceTag = 'Taraflex Mat';
    } else if (type.includes('pickleball')) {
        surface = 'Cushioned Sport Resin with Anti-Glare Finish';
        surfaceTag = 'Sport Resin';
    } else if (type.includes('table tennis')) {
        surface = 'Competition ITTF Rubberized Floor Mat';
        surfaceTag = 'Rubberized Mat';
    }

    const isIndoor = !desc.includes('outdoor');
    const hasLighting = !desc.includes('no light') && !desc.includes('day only');

    let capacity = '2 - 4 Players';
    let format = 'Singles & Doubles';
    if (type.includes('basketball') || type.includes('futsal')) {
        capacity = '10 - 14 Players';
        format = 'Full Team Match (5v5)';
    } else if (type.includes('volleyball')) {
        capacity = '12 - 16 Players';
        format = 'Team Match (6v6)';
    }

    const amenities = [
        { label: isIndoor ? 'Climate-Controlled Airflow' : 'Covered Outdoor Arena', icon: isIndoor ? Building2 : Sun },
        { label: hasLighting ? '500+ Lux LED Arena Lighting' : 'Natural Daylight', icon: Zap },
        { label: 'Non-Marking Footwear Required', icon: ShieldCheck },
        { label: `${capacity} (${format})`, icon: Users },
    ];

    return { surface, surfaceTag, isIndoor, hasLighting, capacity, format, amenities };
}

export default function CourtDetailsSheet({
    isOpen = false,
    onClose = () => {},
    court: courtProp,
    facility: facilityProp,
    courtImage,
    can = {},
    onEdit = () => {},
}) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('specs'); // 'specs' | 'venue'
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

    // Keep cached references so the sheet animates out gracefully during close
    const activeCourtRef = useRef(courtProp);
    const activeFacilityRef = useRef(facilityProp);
    if (courtProp) activeCourtRef.current = courtProp;
    if (facilityProp) activeFacilityRef.current = facilityProp;

    const court = courtProp || activeCourtRef.current;
    const facility = facilityProp || activeFacilityRef.current;

    // Local optimistic status
    const [currentStatus, setCurrentStatus] = useState(court?.status || 'AVAILABLE');

    useEffect(() => {
        if (court?.status) {
            setCurrentStatus(court.status);
        }
    }, [court?.status]);

    if (!court) return null;

    const specs = getCourtSpecs(court);
    const currentStatusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.AVAILABLE;
    const StatusIcon = currentStatusConfig.icon;

    const handleQuickStatusChange = (newStatus) => {
        if (newStatus === currentStatus) {
            setStatusDropdownOpen(false);
            return;
        }

        const previousStatus = currentStatus;
        // Optimistic UI update for sub-100ms instant feedback (Doherty Threshold)
        setCurrentStatus(newStatus);
        setIsUpdatingStatus(true);
        setStatusDropdownOpen(false);

        router.put(
            route('facility.courts.update', court.id),
            {
                facility_id: facility?.id || court.facility_id,
                name: court.name,
                type: court.type,
                time_range: court.time_range,
                description: court.description,
                hourly_rate: court.hourly_rate,
                status: newStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Court status updated to "${STATUS_CONFIG[newStatus]?.shortLabel || newStatus}"`);
                    setIsUpdatingStatus(false);
                },
                onError: () => {
                    // Rollback on failure
                    setCurrentStatus(previousStatus);
                    toast.error('Failed to update status. Please try again.');
                    setIsUpdatingStatus(false);
                },
            }
        );
    };

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            closeOnClickOutside={true}
            header={
                <div className="border-b border-[#101F1A]/10 px-5 py-3 bg-[#FAF8F5] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Compact Sport Icon Avatar */}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] shadow-2xs">
                            <SportIcon sport={court.type} size={15} className="text-[#D6FF3F]" />
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-sm font-bold text-[#101F1A] tracking-tight truncate">
                                    {court.name}
                                </h2>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider ${currentStatusConfig.style}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatusConfig.badgeColor} animate-pulse`} />
                                    <span>{currentStatusConfig.shortLabel}</span>
                                </span>
                            </div>

                            <p className="text-[11px] text-[#101F1A]/50 truncate font-medium mt-0.5">
                                <span>{facility?.name || 'Venue'}</span>
                                <span className="mx-1">•</span>
                                <span>{court.type || 'Court'}</span>
                                {(facility?.city || facility?.province) && (
                                    <>
                                        <span className="mx-1">•</span>
                                        <span>{facility?.city || facility?.province}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            }
            footer={
                <div className="px-5 py-3 bg-[#FAF8F5] border-t border-[#101F1A]/10 flex items-center justify-between gap-3">
                    {/* Status Changer or Indicator */}
                    {can.edit ? (
                        <div className="relative">
                            <button
                                type="button"
                                disabled={isUpdatingStatus}
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#101F1A]/10 bg-white text-xs font-semibold text-[#101F1A] hover:bg-[#F5F2EA] transition cursor-pointer shadow-2xs disabled:opacity-60"
                                title="Change live court operational status"
                            >
                                <span className={`w-2 h-2 rounded-full ${currentStatusConfig.badgeColor}`} />
                                <span className="text-[#101F1A]/55 font-normal">Status:</span>
                                <span className="font-bold">{currentStatusConfig.shortLabel}</span>
                                <ChevronDown size={12} className="text-[#101F1A]/40 ml-0.5" />
                            </button>

                            {statusDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setStatusDropdownOpen(false)}
                                    />
                                    <div className="absolute left-0 bottom-full mb-1.5 w-52 rounded-xl border border-[#101F1A]/10 bg-white p-1.5 shadow-elevated z-30 animate-fade-in">
                                        <div className="px-2 py-1 text-[10px] font-bold text-[#101F1A]/40 uppercase tracking-wider border-b border-[#101F1A]/5 mb-1">
                                            Update Court Status
                                        </div>
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                            const ItemIcon = config.icon;
                                            const isSelected = currentStatus === key;
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => handleQuickStatusChange(key)}
                                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-[#101F1A] text-[#D6FF3F]'
                                                            : 'text-[#101F1A] hover:bg-[#F5F2EA]/80'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <ItemIcon size={13} className={isSelected ? 'text-[#D6FF3F]' : config.badgeColor.replace('bg-', 'text-')} />
                                                        <span>{config.shortLabel}</span>
                                                    </div>
                                                    {isSelected && <BadgeCheck size={13} className="text-[#D6FF3F]" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-[#101F1A]/60 font-medium">
                            <StatusIcon size={13} className={currentStatusConfig.badgeColor.replace('bg-', 'text-')} />
                            <span>{currentStatusConfig.label}</span>
                        </div>
                    )}

                    {/* Actions: Clean title-case button, redundant Close button removed */}
                    <div className="flex items-center justify-end">
                        {can.edit ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(court, facility);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D6FF3F] text-[#101F1A] hover:bg-[#c4ec32] text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                            >
                                <Edit3 size={13} className="text-[#101F1A]" />
                                <span>Edit Court Specs</span>
                            </button>
                        ) : (
                            route().has('facility.bookings') && (
                                <a
                                    href={route('facility.bookings', { court_id: court.id })}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                >
                                    <Calendar size={13} />
                                    <span>View Timetable</span>
                                </a>
                            )
                        )}
                    </div>
                </div>
            }
        >
            <div className="p-5 sm:p-6 space-y-5">
                {/* 1. Media Hero Banner with Gradient Fade */}
                <div className="relative -mx-5 -mt-5 sm:-mx-6 sm:-mt-6 h-36 sm:h-40 overflow-hidden bg-[#101F1A]">
                    <img
                        src={courtImage || DEFAULT_IMAGE}
                        alt={court.name}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                        onError={(e) => {
                            e.currentTarget.src = DEFAULT_IMAGE;
                        }}
                    />

                    {/* Aesthetic gradient overlay to fade into white content */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to bottom, rgba(16,31,26,0.25) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.65) 80%, #ffffff 100%)',
                        }}
                    />

                    {/* Floating Venue Tag */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-[#101F1A]/85 text-[#F5F2EA] text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-xs">
                            <Building2 size={12} className="text-[#D6FF3F]" />
                            <span className="truncate max-w-[190px]">{facility?.name || 'Registered Venue'}</span>
                        </span>
                    </div>

                    {/* Floating Environment Tag */}
                    <div className="absolute top-4 right-4 z-10">
                        <span className="inline-flex items-center gap-1 bg-white/95 text-[#101F1A] text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md border border-[#101F1A]/10 shadow-xs">
                            {specs.isIndoor ? 'Indoor Arena' : 'Outdoor Court'}
                        </span>
                    </div>
                </div>

                {/* 2. Key Operational Metrics Strip (3 Chunked Cards) */}
                <div className="grid grid-cols-3 gap-2.5 -mt-7 relative z-10">
                    {/* Hourly Rate */}
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white p-3 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#101F1A]/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span>Rate</span>
                            <PhilippinePeso size={13} className="text-[#FF5A36]" />
                        </div>
                        <div>
                            <div className="font-bold text-lg sm:text-xl text-[#101F1A] tracking-tight">
                                {court.hourly_rate ? `₱${Number(court.hourly_rate).toFixed(0)}` : 'Free'}
                            </div>
                            <p className="text-[10px] text-[#101F1A]/50 font-medium">per 60m session</p>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white p-3 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#101F1A]/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span>Schedule</span>
                            <Clock size={13} className="text-[#101F1A]/40" />
                        </div>
                        <div>
                            <div className="font-bold text-xs text-[#101F1A] truncate" title={court.time_range || 'Venue Standard Hours'}>
                                {court.time_range || 'Standard'}
                            </div>
                            <p className="text-[10px] text-emerald-700 font-bold truncate flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                                <span>Open for play</span>
                            </p>
                        </div>
                    </div>

                    {/* Capacity & Format */}
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white p-3 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#101F1A]/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span>Players</span>
                            <Users size={13} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="font-bold text-xs sm:text-sm text-[#101F1A] truncate">
                                {specs.capacity}
                            </div>
                            <p className="text-[10px] text-[#101F1A]/50 font-medium truncate">{court.type || 'Court'}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Segmented Navigation Tabs (Hick's Law: Reduces clutter via progressive disclosure) */}
                <div role="tablist" aria-label="Court Details Sections" className="flex items-center gap-1 rounded-xl border border-[#101F1A]/10 bg-[#F5F2EA]/80 p-1 shadow-2xs">
                    <button
                        type="button"
                        role="tab"
                        id="tab-specs"
                        aria-selected={activeTab === 'specs'}
                        aria-controls="panel-specs"
                        onClick={() => setActiveTab('specs')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[34px] ${
                            activeTab === 'specs'
                                ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/50'
                        }`}
                    >
                        <Layers size={13} />
                        <span>Specs & Equipment</span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        id="tab-venue"
                        aria-selected={activeTab === 'venue'}
                        aria-controls="panel-venue"
                        onClick={() => setActiveTab('venue')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[34px] ${
                            activeTab === 'venue'
                                ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/50'
                        }`}
                    >
                        <Building2 size={13} />
                        <span>Venue & Schedule</span>
                    </button>
                </div>

                {/* 4. Tab Content A: Specifications & Equipment */}
                {activeTab === 'specs' && (
                    <div id="panel-specs" role="tabpanel" aria-labelledby="tab-specs" className="space-y-4 animate-fade-in">
                        {/* Court Specifications Grid */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-[#101F1A]/60">
                                    Playing Surface & Infrastructure
                                </h3>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                    Standard Certified
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF8F5] p-3 flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center shrink-0 mt-0.5">
                                        <Layers size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">Surface Material</div>
                                        <div className="text-xs font-bold text-[#101F1A] truncate" title={specs.surface}>
                                            {specs.surface}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF8F5] p-3 flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center shrink-0 mt-0.5">
                                        <Sun size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">Environment</div>
                                        <div className="text-xs font-bold text-[#101F1A] truncate">
                                            {specs.isIndoor ? 'Indoor (Climate Controlled)' : 'Covered Outdoor Court'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF8F5] p-3 flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center shrink-0 mt-0.5">
                                        <Zap size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">Arena Lighting</div>
                                        <div className="text-xs font-bold text-[#101F1A] truncate">
                                            {specs.hasLighting ? '500+ Lux Pro LED Lighting' : 'Natural Daylight'}
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF8F5] p-3 flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center shrink-0 mt-0.5">
                                        <ShieldCheck size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50">Footwear Rule</div>
                                        <div className="text-xs font-bold text-[#101F1A] truncate">
                                            Non-marking shoes required
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Court Amenities Chips */}
                        <div>
                            <h3 className="text-xs font-bold text-[#101F1A]/70 mb-2">
                                Venue Court Features
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {specs.amenities.map((item, idx) => {
                                    const IconComponent = item.icon;
                                    return (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#101F1A]/10 text-xs font-medium text-[#101F1A]/80 shadow-2xs"
                                        >
                                            <IconComponent size={12} className="text-[#101F1A]/50" />
                                            <span>{item.label}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description & House Rules */}
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <Info size={13} className="text-[#101F1A]/50" />
                                <h3 className="text-xs font-bold text-[#101F1A]/70">
                                    Overview & Rules
                                </h3>
                            </div>
                            <div className="rounded-xl border border-[#101F1A]/10 bg-white p-3.5 text-xs text-[#101F1A]/75 leading-relaxed font-sans shadow-2xs">
                                {court.description || 'Verified competition-standard playing court. Non-marking indoor shoes strictly required. Please arrive 10 minutes ahead of scheduled time.'}
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Tab Content B: Venue & Schedule */}
                {activeTab === 'venue' && (
                    <div id="panel-venue" role="tabpanel" aria-labelledby="tab-venue" className="space-y-4 animate-fade-in">
                        {/* Venue Overview Card */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF8F5] p-4 shadow-2xs space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shrink-0">
                                        <Building2 size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-[#101F1A]">
                                            {facility?.name || 'Registered Sports Venue'}
                                        </h4>
                                        <p className="text-[11px] text-[#101F1A]/60 flex items-center gap-1 mt-0.5">
                                            <MapPin size={11} className="text-[#101F1A]/40 shrink-0" />
                                            <span>{facility?.address || `${facility?.city || 'Philippines'}, ${facility?.province || ''}`}</span>
                                        </p>
                                    </div>
                                </div>

                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                    Verified Venue
                                </span>
                            </div>

                            {facility?.owner && (
                                <div className="pt-2.5 border-t border-[#101F1A]/10 flex items-center justify-between text-xs">
                                    <span className="text-[#101F1A]/50 font-medium flex items-center gap-1">
                                        <User size={12} className="text-[#101F1A]/40" />
                                        Owner / Manager
                                    </span>
                                    <span className="font-bold text-[#101F1A]">
                                        {facility.owner.name}
                                    </span>
                                </div>
                            )}

                            {facility?.phone && (
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#101F1A]/50 font-medium">Contact Hotline</span>
                                    <span className="font-bold text-[#101F1A] font-mono">{facility.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Court Timetable & Schedule Card */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shrink-0 shadow-xs">
                                    <Calendar size={17} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-[#101F1A]">
                                        Live Court Schedule
                                    </div>
                                    <p className="text-[11px] text-[#101F1A]/55">
                                        Inspect booked slots, drop-in sessions, and open hours
                                    </p>
                                </div>
                            </div>

                            {route().has('facility.bookings') ? (
                                <a
                                    href={route('facility.bookings', { court_id: court.id })}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D6FF3F] text-[#101F1A] hover:bg-[#c2ea2e] text-xs font-bold transition shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Timetable</span>
                                    <ArrowUpRight size={13} />
                                </a>
                            ) : (
                                <span className="text-xs text-[#101F1A]/50 italic">Standard Hours</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Sheet>
    );
}
