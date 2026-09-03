import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import SportIcon from '@/Components/Bookings/SportIcon';
import { useState, useMemo } from 'react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import {
    Plus,
    Search,
    Clock,
    PhilippinePeso,
    Building2,
    Activity,
    Edit3,
    Trash2,
    X,
    Filter,
    Layers,
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    CalendarCheck,
    Target,
    Sparkles,
    ChevronRight,
    CircleDot
} from 'lucide-react';

const SPORT_PRESETS = [
    { name: 'Badminton', sport: 'Badminton' },
    { name: 'Pickleball', sport: 'Pickleball' },
    { name: 'Tennis', sport: 'Tennis' },
    { name: 'Basketball', sport: 'Basketball' },
    { name: 'Volleyball', sport: 'Volleyball' },
    { name: 'Futsal', sport: 'Futsal' },
    { name: 'Table Tennis', sport: 'Table Tennis' },
];

const TIME_PRESETS = [
    '6:00 AM - 10:00 PM',
    '7:00 AM - 11:00 PM',
    '8:00 AM - 9:00 PM',
    '24 Hours / Open Daily',
];

export default function Courts({ facilities = [], can = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState(null);
    const [courtToDelete, setCourtToDelete] = useState(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedFacilityId, setSelectedFacilityId] = useState('ALL');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        facility_id: facilities[0]?.id || '',
        name: '',
        type: '',
        time_range: '',
        description: '',
        hourly_rate: '',
        status: 'AVAILABLE',
    });

    const openAddModal = (defaultFacilityId) => {
        reset();
        clearErrors();
        setData({
            facility_id: defaultFacilityId || facilities[0]?.id || '',
            name: '',
            type: '',
            time_range: '',
            description: '',
            hourly_rate: '',
            status: 'AVAILABLE',
        });
        setEditingCourt(null);
        setIsModalOpen(true);
    };

    const openEditModal = (court, facility) => {
        reset();
        clearErrors();
        setEditingCourt(court);
        setData({
            facility_id: facility.id,
            name: court.name || '',
            type: court.type || '',
            time_range: court.time_range || '',
            description: court.description || '',
            hourly_rate: court.hourly_rate ?? '',
            status: court.status || 'AVAILABLE',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCourt(null);
        reset();
        clearErrors();
    };

    const submitForm = (e) => {
        e.preventDefault();

        if (editingCourt) {
            put(route('facility.courts.update', editingCourt.id), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        } else {
            post(route('facility.courts.store'), {
                onSuccess: () => closeModal(),
                preserveScroll: true,
            });
        }
    };

    const confirmDelete = () => {
        if (!courtToDelete) return;
        router.delete(route('facility.courts.destroy', courtToDelete.id), {
            preserveScroll: true,
            onSuccess: () => setCourtToDelete(null),
        });
    };

    // Aggregated statistics for KPI strip matching Bookings/Dashboard
    const stats = useMemo(() => {
        let total = 0;
        let available = 0;
        let openPlay = 0;
        let blocked = 0;

        facilities.forEach(f => {
            (f.courts || []).forEach(c => {
                total++;
                if (c.status === 'AVAILABLE') available++;
                else if (c.status === 'OPEN_PLAY') openPlay++;
                else blocked++;
            });
        });

        return {
            total,
            available,
            openPlay,
            blocked,
            facilitiesCount: facilities.length,
        };
    }, [facilities]);

    // Filtered facilities and courts
    const filteredFacilities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return facilities
            .filter(f => selectedFacilityId === 'ALL' || String(f.id) === String(selectedFacilityId))
            .map(f => {
                const matchedCourts = (f.courts || []).filter(court => {
                    const matchesSearch =
                        !query ||
                        court.name.toLowerCase().includes(query) ||
                        (court.type && court.type.toLowerCase().includes(query)) ||
                        (court.description && court.description.toLowerCase().includes(query)) ||
                        f.name.toLowerCase().includes(query);

                    const matchesStatus =
                        statusFilter === 'ALL' || court.status === statusFilter;

                    return matchesSearch && matchesStatus;
                });

                return {
                    ...f,
                    filteredCourts: matchedCourts,
                };
            })
            .filter(f => selectedFacilityId !== 'ALL' || f.filteredCourts.length > 0 || !searchQuery);
    }, [facilities, searchQuery, statusFilter, selectedFacilityId]);

    const totalFilteredCourts = filteredFacilities.reduce(
        (sum, f) => sum + (f.filteredCourts?.length || 0),
        0
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center font-bold text-sm shadow-2xs">
                            <Layers size={15} strokeWidth={2.4} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-[#101F1A]">
                                Courts
                            </h2>
                            <p className="text-xs text-[#101F1A]/60 font-medium">
                                Manage courts, sports allocations, operating schedules, and rates
                            </p>
                        </div>
                    </div>

                    {can.create && facilities.length > 0 && (
                        <button
                            onClick={() => openAddModal()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={2.4} />
                            <span>Add Court</span>
                        </button>
                    )}
                </div>
            }
        >
            <Head title="Courts" />

            <div className="w-full space-y-5 pb-12">
                {/* ── KPI Strip (Styled exactly like Bookings KpiStrip & Dashboard StatCards) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: Total Courts */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Total Courts
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#101F1A]/[0.05] text-[#101F1A] shadow-2xs">
                                <Layers size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {stats.total}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <Building2 size={12} className="text-[#101F1A]/40" />
                            <span>Across {stats.facilitiesCount} venue{stats.facilitiesCount === 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    {/* Card 2: Available Courts */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#D6FF3F]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Available Now
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/35 text-[#101F1A] shadow-2xs border border-[#D6FF3F]/60">
                                <CheckCircle2 size={14} strokeWidth={2.4} className="text-emerald-700" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700">
                                {stats.available}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-emerald-700">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ready for booking</span>
                        </div>
                    </div>

                    {/* Card 3: Open Play Sessions */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-blue-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Open Play
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shadow-2xs border border-blue-100">
                                <Activity size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-blue-700">
                                {stats.openPlay}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-blue-700">
                            <span>Drop-in & queue slots</span>
                        </div>
                    </div>

                    {/* Card 4: Maintenance / Blocked */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#FF5A36]/40">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Blocked / Offline
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5A36]/15 text-[#B8391D] shadow-2xs border border-[#FF5A36]/30">
                                <AlertTriangle size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#B8391D]">
                                {stats.blocked}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#B8391D]">
                            <span>Under maintenance or hold</span>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar & Filter Bar (Matching CalendarToolbar & QuickActionDock) ── */}
                {facilities.length > 0 && stats.total > 0 && (
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter courts by name, sport, or facility..."
                                className="w-full rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/40 pl-9 pr-8 py-1.5 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] p-0.5"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Facility Selector */}
                            {facilities.length > 1 && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/60 px-2 py-1 shadow-2xs">
                                    <Building2 size={13} className="text-[#101F1A]/50" />
                                    <select
                                        value={selectedFacilityId}
                                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                                        className="bg-transparent text-xs font-bold text-[#101F1A] border-none p-0 pr-5 focus:ring-0 focus:outline-none cursor-pointer"
                                    >
                                        <option value="ALL">All Venues ({facilities.length})</option>
                                        {facilities.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter Tabs (Matching Bookings segmented control) */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 p-0.5 shadow-2xs">
                                {[
                                    { key: 'ALL', label: 'All' },
                                    { key: 'AVAILABLE', label: 'Available' },
                                    { key: 'OPEN_PLAY', label: 'Open Play' },
                                    { key: 'BLOCKED', label: 'Blocked' },
                                    { key: 'NOT_AVAILABLE', label: 'Offline' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                            statusFilter === tab.key
                                                ? 'bg-white text-[#101F1A] shadow-xs'
                                                : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/40'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Main Court Content ── */}
                {facilities.length === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md max-w-lg mx-auto my-10">
                        <div className="w-12 h-12 rounded-xl bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center mx-auto mb-3">
                            <Building2 size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-base font-bold text-[#101F1A] mb-1.5">No Approved Facility</h3>
                        <p className="text-xs text-[#101F1A]/60 leading-relaxed">
                            You need an approved facility before courts, rates, and booking schedules can be configured.
                        </p>
                    </div>
                ) : stats.total === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md max-w-lg mx-auto my-10">
                        <div className="w-12 h-12 rounded-xl bg-[#D6FF3F]/35 text-[#101F1A] border border-[#D6FF3F]/60 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-base font-bold text-[#101F1A] mb-1.5">No Courts Created Yet</h3>
                        <p className="text-xs text-[#101F1A]/60 leading-relaxed mb-5">
                            Set up courts with sport types, hourly pricing, and availability so players can make reservations.
                        </p>
                        {can.create && (
                            <button
                                onClick={() => openAddModal()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] shadow-xs cursor-pointer"
                            >
                                <Plus size={14} strokeWidth={2.4} />
                                Add Your First Court
                            </button>
                        )}
                    </div>
                ) : totalFilteredCourts === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-10 text-center shadow-card backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-[#101F1A]/5 text-[#101F1A]/50 flex items-center justify-center mx-auto mb-2.5">
                            <Search size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-[#101F1A] mb-1">No matching courts found</h4>
                        <p className="text-xs text-[#101F1A]/50 mb-4">
                            Try adjusting your search query, status filter, or venue selector.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setSelectedFacilityId('ALL'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#101F1A]/5 text-[#101F1A] hover:bg-[#101F1A]/10 transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredFacilities.map((facility) => {
                            if (!facility.filteredCourts || facility.filteredCourts.length === 0) {
                                return null;
                            }

                            return (
                                <div key={facility.id} className="space-y-3">
                                    {/* Facility Header Strip */}
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-[#101F1A]/50" />
                                            <h3 className="text-sm font-bold text-[#101F1A]">
                                                {facility.name}
                                            </h3>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#101F1A]/5 text-[#101F1A]/70">
                                                {facility.filteredCourts.length} {facility.filteredCourts.length === 1 ? 'court' : 'courts'}
                                            </span>
                                        </div>

                                        {can.create && (
                                            <button
                                                onClick={() => openAddModal(facility.id)}
                                                className="text-xs font-bold text-[#101F1A] hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={13} strokeWidth={2.4} />
                                                Add court
                                            </button>
                                        )}
                                    </div>

                                    {/* Courts Grid — 4 cards per row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                                        {facility.filteredCourts.map((court) => {
                                            const statusStyle = COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE;
                                            const statusLabel = COURT_STATUS_LABELS[court.status] || court.status;

                                            return (
                                                <div
                                                    key={court.id}
                                                    className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/95 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20"
                                                >
                                                    <div>
                                                        {/* Top Row: Sport Icon Badge + Court Name + Status */}
                                                        <div className="flex items-start justify-between gap-2.5 mb-3">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-8 h-8 rounded-xl border border-[#101F1A]/10 bg-[#F5F2EA] flex items-center justify-center text-[#101F1A] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                                                    <SportIcon sport={court.type || 'Court'} size={15} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-bold text-sm text-[#101F1A] tracking-tight truncate">
                                                                        {court.name}
                                                                    </h4>
                                                                    <span className="text-[11px] font-medium text-[#101F1A]/60 block truncate">
                                                                        {court.type || 'Standard Court'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs shrink-0 ${statusStyle}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </div>

                                                        {/* Court Details Strip */}
                                                        <div className="space-y-1.5 mt-3 pt-2.5 border-t border-[#101F1A]/5">
                                                            {/* Rate */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-[#101F1A]/50 font-medium flex items-center gap-1">
                                                                    <PhilippinePeso size={12} className="text-[#101F1A]/40" />
                                                                    Rate
                                                                </span>
                                                                <span className="font-bold text-[#101F1A] bg-[#F5F2EA] px-2 py-0.5 rounded border border-[#101F1A]/5">
                                                                    {court.hourly_rate ? `₱${Number(court.hourly_rate).toFixed(2)} / hr` : 'Free / Not set'}
                                                                </span>
                                                            </div>

                                                            {/* Operating Hours */}
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-[#101F1A]/50 font-medium flex items-center gap-1">
                                                                    <Clock size={12} className="text-[#101F1A]/40" />
                                                                    Hours
                                                                </span>
                                                                <span className="font-medium text-[#101F1A]/80 truncate max-w-[150px]" title={court.time_range}>
                                                                    {court.time_range || 'Venue standard'}
                                                                </span>
                                                            </div>

                                                            {/* Description */}
                                                            {court.description && (
                                                                <p className="pt-1.5 text-[11px] text-[#101F1A]/60 line-clamp-2 leading-snug">
                                                                    {court.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Card Actions Footer */}
                                                    {(can.edit || can.delete) && (
                                                        <div className="mt-4 pt-2.5 border-t border-[#101F1A]/5 flex items-center justify-between">
                                                            {can.edit ? (
                                                                <button
                                                                    onClick={() => openEditModal(court, facility)}
                                                                    className="inline-flex items-center gap-1 text-xs font-bold text-[#101F1A] hover:bg-[#101F1A]/5 px-2 py-1 rounded-md transition cursor-pointer"
                                                                >
                                                                    <Edit3 size={12} />
                                                                    Edit
                                                                </button>
                                                            ) : <div />}

                                                            {can.delete && (
                                                                <button
                                                                    onClick={() => setCourtToDelete(court)}
                                                                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition cursor-pointer"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Add / Edit Court Modal ── */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="xl">
                <form onSubmit={submitForm} className="p-6 bg-white flex flex-col gap-4">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[#101F1A]/10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center font-bold text-sm shadow-2xs">
                                {editingCourt ? <Edit3 size={15} /> : <Plus size={15} strokeWidth={2.4} />}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-[#101F1A]">
                                    {editingCourt ? 'Edit Court' : 'Add New Court'}
                                </h3>
                                <p className="text-xs text-[#101F1A]/60 font-medium">
                                    {editingCourt ? 'Update court specifications and availability' : 'List a new court under your sports venue'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={closeModal}
                            className="text-[#101F1A]/40 hover:text-[#101F1A] p-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Facility Selection */}
                    {facilities.length > 1 && (
                        <div>
                            <InputLabel htmlFor="facility_id" value="Venue / Facility *" />
                            <select
                                id="facility_id"
                                value={data.facility_id}
                                onChange={(e) => setData('facility_id', e.target.value)}
                                disabled={!!editingCourt}
                                className="mt-1 block w-full rounded-lg border-[#101F1A]/15 shadow-2xs focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-xs font-bold disabled:bg-stone-100 cursor-pointer"
                            >
                                {facilities.map((f) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.facility_id} className="mt-1" />
                        </div>
                    )}

                    {/* Name & Sport Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <InputLabel htmlFor="name" value="Court Name / Identifier *" />
                            <TextInput
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                                placeholder="e.g. Court 1"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="type" value="Sport / Court Category" />
                            <TextInput
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="mt-1 block w-full text-xs"
                                placeholder="e.g. Badminton"
                            />
                            <InputError message={errors.type} className="mt-1" />
                        </div>
                    </div>

                    {/* Quick Sport Pills */}
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block mb-1.5">
                            Quick Select Sport:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {SPORT_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset.name}
                                    onClick={() => setData('type', preset.name)}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                        data.type === preset.name
                                            ? 'bg-[#101F1A] text-[#D6FF3F] shadow-2xs'
                                            : 'bg-[#F5F2EA] text-[#101F1A] hover:bg-stone-200/70 border border-[#101F1A]/5'
                                    }`}
                                >
                                    <SportIcon sport={preset.sport} size={11} />
                                    <span>{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rate & Operating Hours */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <InputLabel htmlFor="hourly_rate" value="Hourly Rate (PHP ₱)" />
                            <div className="relative mt-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/50 font-bold text-xs">₱</span>
                                <TextInput
                                    id="hourly_rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.hourly_rate}
                                    onChange={(e) => setData('hourly_rate', e.target.value)}
                                    className="pl-7 block w-full text-xs font-bold"
                                    placeholder="350.00"
                                />
                            </div>
                            <InputError message={errors.hourly_rate} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="time_range" value="Operating Schedule" />
                            <TextInput
                                id="time_range"
                                value={data.time_range}
                                onChange={(e) => setData('time_range', e.target.value)}
                                className="mt-1 block w-full text-xs"
                                placeholder="6:00 AM - 10:00 PM"
                            />
                            <InputError message={errors.time_range} className="mt-1" />
                        </div>
                    </div>

                    {/* Quick Schedule Pills */}
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block mb-1.5">
                            Quick Schedule Presets:
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {TIME_PRESETS.map((preset) => (
                                <button
                                    type="button"
                                    key={preset}
                                    onClick={() => setData('time_range', preset)}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                                        data.time_range === preset
                                            ? 'bg-[#101F1A] text-white font-bold'
                                            : 'bg-[#F5F2EA] text-[#101F1A]/70 hover:bg-stone-200/70 border border-[#101F1A]/5'
                                    }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Selection */}
                    <div>
                        <InputLabel htmlFor="status" value="Operational Status" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                            {[
                                { key: 'AVAILABLE', label: 'Available', desc: 'Open for booking', activeStyle: 'border-emerald-500 text-emerald-700 bg-emerald-50/60' },
                                { key: 'OPEN_PLAY', label: 'Open Play', desc: 'Queue session', activeStyle: 'border-blue-500 text-blue-700 bg-blue-50/60' },
                                { key: 'BLOCKED', label: 'Blocked', desc: 'Reserved / Hold', activeStyle: 'border-amber-500 text-amber-700 bg-amber-50/60' },
                                { key: 'NOT_AVAILABLE', label: 'Offline', desc: 'Temporarily closed', activeStyle: 'border-rose-500 text-rose-700 bg-rose-50/60' },
                            ].map((item) => (
                                <button
                                    type="button"
                                    key={item.key}
                                    onClick={() => setData('status', item.key)}
                                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between text-xs font-bold transition cursor-pointer ${
                                        data.status === item.key
                                            ? `${item.activeStyle} border-2 shadow-2xs`
                                            : 'border-[#101F1A]/10 text-[#101F1A]/70 hover:border-[#101F1A]/20 bg-[#F5F2EA]/30'
                                    }`}
                                >
                                    <span>{item.label}</span>
                                    <span className="text-[10px] font-normal opacity-70 mt-0.5">
                                        {item.desc}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.status} className="mt-1" />
                    </div>

                    {/* Description */}
                    <div>
                        <InputLabel htmlFor="description" value="Description / Court Notes (Optional)" />
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="mt-1 block w-full rounded-lg border-[#101F1A]/15 shadow-2xs focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-xs"
                            rows="2"
                            placeholder="e.g. Taraflex flooring, air-conditioned, LED lights..."
                        />
                        <InputError message={errors.description} className="mt-1" />
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3.5 border-t border-[#101F1A]/10 flex items-center justify-end gap-2.5">
                        <SecondaryButton type="button" onClick={closeModal} className="!text-xs">
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing}
                            className="!bg-[#101F1A] hover:!bg-[#162923] !text-[#D6FF3F] !rounded-lg !px-4 !text-xs !font-bold"
                        >
                            {processing ? 'Saving...' : editingCourt ? 'Save Changes' : 'Create Court'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirmation Modal ── */}
            <Modal show={!!courtToDelete} onClose={() => setCourtToDelete(null)} maxWidth="md">
                <div className="p-6 bg-white">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3.5 border border-rose-100">
                        <ShieldAlert size={20} />
                    </div>
                    <h3 className="text-base font-bold text-[#101F1A] mb-1.5">
                        Remove "{courtToDelete?.name}"?
                    </h3>
                    <p className="text-xs text-[#101F1A]/60 mb-5 leading-relaxed">
                        Are you sure you want to permanently remove this court? Future reservations or allocations tied to this court will be affected.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <SecondaryButton onClick={() => setCourtToDelete(null)} className="!text-xs">
                            Cancel
                        </SecondaryButton>
                        <DangerButton onClick={confirmDelete} className="!text-xs !rounded-lg font-bold">
                            Delete Court
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
