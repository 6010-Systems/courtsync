import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import MetricCard, { formatCount } from '@/Components/MetricCard';
import { Head, router } from '@inertiajs/react';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState, useMemo, useEffect, useRef } from 'react';
import TextInput from '@/Components/TextInput';
import {
    Building2,
    Calendar,
    CheckCircle2,
    Copy,
    Filter,
    Loader2,
    Search,
    ShieldAlert,
    UserCheck,
    Users,
    X,
} from 'lucide-react';

function formatDate(value) {
    if (!value) return '—';
    return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getInitials(name) {
    return String(name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

const ITEMS_PER_PAGE = 12;

export default function Players({ auth, players = [], canManage }) {
    const { confirm } = useConfirm();
    const toast = useToast();

    const userFacilities = auth?.user?.facilities || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BANNED'
    const [selectedFacilityId, setSelectedFacilityId] = useState('ALL');
    const [processingId, setProcessingId] = useState(null);
    const [failedAvatars, setFailedAvatars] = useState(() => new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const searchTimerRef = useRef(null);

    // Debounce search input for Doherty threshold (<400ms) responsiveness
    const handleSearchChange = (value) => {
        setSearchQuery(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(value.trim());
        }, 250);
    };

    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, selectedFacilityId]);

    // High-level summary metrics
    const totalCount = players.length;
    const activeCount = useMemo(() => players.filter((p) => p.status === 'ACTIVE').length, [players]);
    const bannedCount = useMemo(() => players.filter((p) => p.status === 'BANNED').length, [players]);

    // Filtered players
    const filteredPlayers = useMemo(() => {
        return players.filter((player) => {
            const matchesSearch =
                !debouncedSearch ||
                player.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                player.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (player.facility_name && player.facility_name.toLowerCase().includes(debouncedSearch.toLowerCase()));

            const matchesStatus =
                statusFilter === 'ALL' ||
                player.status === statusFilter;

            const matchesFacility =
                selectedFacilityId === 'ALL' ||
                String(player.facility_id) === String(selectedFacilityId);

            return matchesSearch && matchesStatus && matchesFacility;
        });
    }, [players, debouncedSearch, statusFilter, selectedFacilityId]);

    // Client-side pagination
    const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE));
    const paginatedPlayers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPlayers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPlayers, currentPage]);

    const handleAvatarError = (id) => {
        setFailedAvatars((prev) => new Set(prev).add(id));
    };

    const handleCopyRegistrationLink = (facilitySlug) => {
        const targetSlug =
            facilitySlug ||
            (selectedFacilityId !== 'ALL'
                ? userFacilities.find((f) => String(f.id) === String(selectedFacilityId))?.slug
                : userFacilities[0]?.slug) ||
            players[0]?.facility_slug;

        if (!targetSlug) {
            toast.error('No facility slug available to copy.');
            return;
        }

        const url = `${window.location.origin}/${targetSlug}/register`;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                toast.success('Facility player registration link copied to clipboard!');
            })
            .catch(() => {
                toast.error('Failed to copy link to clipboard.');
            });
    };

    const handleToggleBan = async (player) => {
        const isBanned = player.status === 'BANNED';
        const action = isBanned ? 'Unban' : 'Ban';

        const confirmed = await confirm({
            title: `${action} Player: ${player.name}?`,
            message: isBanned
                ? `Restore booking privileges for ${player.name}? They will be able to book courts and join activities at ${player.facility_name}.`
                : `Are you sure you want to ban ${player.name}? They will be immediately blocked from booking courts at ${player.facility_name}. Existing bookings will need to be cancelled manually.`,
            confirmText: isBanned ? 'Restore Player' : 'Ban Player',
            cancelText: 'Cancel',
            type: isBanned ? 'info' : 'danger',
        });

        if (!confirmed) return;

        setProcessingId(player.id);

        router.post(
            route('facility.players.toggle-ban', player.id),
            {
                facility_id: player.facility_id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Player ${player.name} is now ${isBanned ? 'active' : 'banned'}.`);
                    setProcessingId(null);
                },
                onError: () => {
                    toast.error(`Failed to ${action.toLowerCase()} player.`);
                    setProcessingId(null);
                },
            }
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDebouncedSearch('');
        setStatusFilter('ALL');
        setSelectedFacilityId('ALL');
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Players"
                    subtitle="Manage registered players, joined facilities, and booking permissions"
                    actions={
                        userFacilities.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => handleCopyRegistrationLink()}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                            >
                                <Copy size={14} className="text-[#D6FF3F]" />
                                <span>Copy Registration Link</span>
                            </button>
                        ) : null
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Players Directory" />

            <div className="w-full space-y-5 pb-6">
                {/* ── Stat Summary Cards (Hick's & Miller's chunking) ── */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                    <MetricCard
                        label="Total Players"
                        value={formatCount(totalCount)}
                        hint="Registered across all facilities"
                        icon={Users}
                        accent="lime"
                    />
                    <MetricCard
                        label="Active Players"
                        value={formatCount(activeCount)}
                        hint="Eligible to book and participate"
                        icon={UserCheck}
                        accent="lime"
                    />
                    <MetricCard
                        label="Banned Players"
                        value={formatCount(bannedCount)}
                        hint={bannedCount > 0 ? 'Restricted from booking' : 'No restricted players'}
                        icon={ShieldAlert}
                        accent="red"
                        alert={bannedCount > 0}
                    />
                </div>

                {/* ── Filter & Search Bar ── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40"
                                aria-hidden="true"
                            />
                            <TextInput
                                type="text"
                                placeholder="Search by player name, email, or facility..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-9 pr-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => handleSearchChange('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Multi-Facility Filter (if owner owns > 1 facility) */}
                            {userFacilities.length > 1 && (
                                <div className="relative">
                                    <select
                                        value={selectedFacilityId}
                                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                                        className="h-10 rounded-xl border-[#101F1A]/15 bg-white pl-3 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                                        aria-label="Filter by facility"
                                    >
                                        <option value="ALL">All Facilities</option>
                                        {userFacilities.map((facility) => (
                                            <option key={facility.id} value={facility.id}>
                                                {facility.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter Chips */}
                            <div className="inline-flex rounded-xl bg-[#F5F2EA]/80 p-1 border border-[#101F1A]/5">
                                {[
                                    { key: 'ALL', label: 'All' },
                                    { key: 'ACTIVE', label: 'Active' },
                                    { key: 'BANNED', label: 'Banned' },
                                ].map((tab) => {
                                    const isActive = statusFilter === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setStatusFilter(tab.key)}
                                            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                                isActive
                                                    ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                                    : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>

                {/* ── Table & Content Area ── */}
                {totalCount === 0 ? (
                    /* Zero Players Empty State (Actionable peak-end experience) */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A]">
                            <Users size={28} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No registered players yet</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            Players will appear here once they register or make reservations through your facility booking link.
                        </p>
                        {userFacilities.length > 0 && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => handleCopyRegistrationLink()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                                >
                                    <Copy size={14} className="text-[#D6FF3F]" />
                                    <span>Copy Player Registration Link</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : filteredPlayers.length === 0 ? (
                    /* Filter Mismatch Empty State */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2EA] text-[#101F1A]/40">
                            <Search size={26} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No matching players found</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            No players matched your active filters{debouncedSearch ? ` or search "${debouncedSearch}"` : ''}.
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-colors"
                            >
                                <X size={14} />
                                <span>Clear all filters</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Data Table & Mobile Cards */
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Player</th>
                                        <th scope="col" className="px-6 py-4">Facility Joined</th>
                                        <th scope="col" className="px-6 py-4">Joined Date</th>
                                        <th scope="col" className="px-6 py-4">Status</th>
                                        {canManage && <th scope="col" className="px-6 py-4 text-right">Action</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {paginatedPlayers.map((player) => {
                                        const isBanned = player.status === 'BANNED';
                                        const isProcessing = processingId === player.id;
                                        const hasAvatar = player.avatar && !failedAvatars.has(player.id);

                                        return (
                                            <tr
                                                key={`desktop-${player.id}-${player.facility_id}`}
                                                className={`transition-colors ${
                                                    isBanned
                                                        ? 'bg-rose-50/60 hover:bg-rose-50/90'
                                                        : 'hover:bg-[#F5F2EA]/30'
                                                }`}
                                            >
                                                {/* Player Info */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {hasAvatar ? (
                                                            <img
                                                                src={player.avatar}
                                                                alt={`${player.name}'s avatar`}
                                                                className="h-9 w-9 rounded-full object-cover border border-[#101F1A]/10"
                                                                referrerPolicy="no-referrer"
                                                                onError={() => handleAvatarError(player.id)}
                                                            />
                                                        ) : (
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101F1A] text-[11px] font-bold text-[#D6FF3F] shadow-2xs">
                                                                {getInitials(player.name)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-bold text-[#101F1A]">{player.name}</div>
                                                            <div className="text-xs text-[#101F1A]/60">{player.email}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Facility */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/10 bg-[#101F1A]/5 px-2.5 py-1 text-xs font-bold text-[#101F1A]">
                                                        <Building2 size={12} className="text-[#101F1A]/50" />
                                                        <span>{player.facility_name}</span>
                                                    </span>
                                                </td>

                                                {/* Joined Date */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-[#101F1A]/70 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={13} className="text-[#101F1A]/40" />
                                                        <span>{formatDate(player.created_at)}</span>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {isBanned ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                            <span>Banned</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span>Active</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action */}
                                                {canManage && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            type="button"
                                                            disabled={isProcessing}
                                                            onClick={() => handleToggleBan(player)}
                                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                                                                isBanned
                                                                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'
                                                                    : 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                                                            }`}
                                                        >
                                                            {isProcessing ? (
                                                                <>
                                                                    <Loader2 size={13} className="animate-spin" />
                                                                    <span>Updating...</span>
                                                                </>
                                                            ) : isBanned ? (
                                                                <>
                                                                    <CheckCircle2 size={13} />
                                                                    <span>Unban Player</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShieldAlert size={13} />
                                                                    <span>Ban Player</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-[#101F1A]/5">
                            {paginatedPlayers.map((player) => {
                                const isBanned = player.status === 'BANNED';
                                const isProcessing = processingId === player.id;
                                const hasAvatar = player.avatar && !failedAvatars.has(player.id);

                                return (
                                    <div
                                        key={`mobile-${player.id}-${player.facility_id}`}
                                        className={`p-4 space-y-3.5 transition-colors ${
                                            isBanned
                                                ? 'bg-rose-50/50 border-l-4 border-l-rose-500'
                                                : 'bg-white'
                                        }`}
                                    >
                                        {/* Header Row: Avatar, Name & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                {hasAvatar ? (
                                                    <img
                                                        src={player.avatar}
                                                        alt={`${player.name}'s avatar`}
                                                        className="h-10 w-10 rounded-full object-cover border border-[#101F1A]/10"
                                                        referrerPolicy="no-referrer"
                                                        onError={() => handleAvatarError(player.id)}
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101F1A] text-xs font-bold text-[#D6FF3F] shadow-2xs">
                                                        {getInitials(player.name)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-bold text-[#101F1A] text-sm">{player.name}</div>
                                                    <div className="text-xs text-[#101F1A]/60">{player.email}</div>
                                                </div>
                                            </div>

                                            {isBanned ? (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                    <span>Banned</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    <span>Active</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Facility & Joined Meta Container */}
                                        <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#101F1A]/5 bg-[#F5F2EA]/40 p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Facility
                                                </span>
                                                <span className="font-semibold text-[#101F1A] truncate block mt-0.5" title={player.facility_name}>
                                                    {player.facility_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block">
                                                    Joined Date
                                                </span>
                                                <span className="font-semibold text-[#101F1A] block mt-0.5">
                                                    {formatDate(player.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mobile Action Button (Controlled secondary styling) */}
                                        {canManage && (
                                            <div className="pt-0.5">
                                                <button
                                                    type="button"
                                                    disabled={isProcessing}
                                                    onClick={() => handleToggleBan(player)}
                                                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all disabled:opacity-50 min-h-[44px] ${
                                                        isBanned
                                                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'border border-rose-200 bg-rose-50/40 text-rose-700 hover:bg-rose-100/60'
                                                    }`}
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <Loader2 size={14} className="animate-spin" />
                                                            <span>Updating status...</span>
                                                        </>
                                                    ) : isBanned ? (
                                                        <>
                                                            <CheckCircle2 size={14} />
                                                            <span>Unban Player</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ShieldAlert size={14} />
                                                            <span>Ban Player</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#101F1A]/10 bg-[#F5F2EA]/40 px-6 py-3.5 text-xs">
                                <span className="font-medium text-[#101F1A]/60">
                                    Showing{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-bold text-[#101F1A]">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlayers.length)}
                                    </span>{' '}
                                    of <span className="font-bold text-[#101F1A]">{filteredPlayers.length}</span> players
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-2 font-bold text-[#101F1A]">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        className="rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
