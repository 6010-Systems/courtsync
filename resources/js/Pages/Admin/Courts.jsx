import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head } from '@inertiajs/react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import SportIcon from '@/Components/Bookings/SportIcon';
import { useState, useMemo } from 'react';
import {
    Layers,
    Search,
    Building2,
    CheckCircle2,
    Activity,
    AlertTriangle,
    Clock,
    PhilippinePeso,
    X,
    Shield
} from 'lucide-react';

export default function Courts({ facilities = [] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const totalCourts = facilities.reduce((sum, f) => sum + (f.courts?.length || 0), 0);
    const facilitiesWithCourts = facilities.filter(f => (f.courts || []).length > 0);

    const stats = useMemo(() => {
        let available = 0;
        let openPlay = 0;
        let blocked = 0;

        facilities.forEach(f => {
            (f.courts || []).forEach(c => {
                if (c.status === 'AVAILABLE') available++;
                else if (c.status === 'OPEN_PLAY') openPlay++;
                else blocked++;
            });
        });

        return { available, openPlay, blocked };
    }, [facilities]);

    // Filter courts across facilities
    const filteredFacilities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return facilities
            .map(f => {
                const matchedCourts = (f.courts || []).filter(court => {
                    const matchesSearch =
                        !query ||
                        court.name.toLowerCase().includes(query) ||
                        (court.type && court.type.toLowerCase().includes(query)) ||
                        f.name.toLowerCase().includes(query) ||
                        (f.owner?.name && f.owner.name.toLowerCase().includes(query));

                    const matchesStatus =
                        statusFilter === 'ALL' || court.status === statusFilter;

                    return matchesSearch && matchesStatus;
                });

                return {
                    ...f,
                    filteredCourts: matchedCourts,
                };
            })
            .filter(f => f.filteredCourts.length > 0);
    }, [facilities, searchQuery, statusFilter]);

    const totalFilteredCourts = filteredFacilities.reduce(
        (sum, f) => sum + (f.filteredCourts?.length || 0),
        0
    );

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Platform Courts"
                    subtitle="Cross-facility overview of all registered courts, sports, and live statuses"
                    actions={
                        <div className="flex items-center gap-2 rounded-lg bg-[#101F1A]/5 px-3 py-1.5 text-xs font-bold text-[#101F1A]">
                            <Shield size={14} className="text-[#101F1A]" />
                            <span>System Administrator</span>
                        </div>
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Platform Courts" />

            <div className="w-full space-y-4 pb-2">
                {/* ── KPI Strip (Matching Bookings/Dashboard) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Total System Courts
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#101F1A]/[0.05] text-[#101F1A] shadow-2xs">
                                <Layers size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {totalCourts}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <Building2 size={12} className="text-[#101F1A]/40" />
                            <span>Across {facilities.length} registered venues</span>
                        </div>
                    </div>

                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#D6FF3F]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Active Available
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
                            <span>Ready for reservations</span>
                        </div>
                    </div>

                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-blue-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Open Play Sessions
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
                            <span>Drop-in & open sessions</span>
                        </div>
                    </div>

                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#FF5A36]/40">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Maintenance / Blocked
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
                            <span>Restricted or offline</span>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by court, sport, venue, or owner..."
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
                                        ? 'bg-[#D6FF3F] text-[#101F1A] shadow-xs'
                                        : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/40'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Main Content ── */}
                {facilitiesWithCourts.length === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-[#101F1A]/5 text-[#101F1A]/40 flex items-center justify-center mx-auto mb-2.5">
                            <Layers size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-[#101F1A] mb-1">No Courts Registered</h3>
                        <p className="text-xs text-[#101F1A]/50">
                            No facility owners have registered any courts yet.
                        </p>
                    </div>
                ) : totalFilteredCourts === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-10 text-center shadow-card backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-[#101F1A]/5 text-[#101F1A]/40 flex items-center justify-center mx-auto mb-2.5">
                            <Search size={18} />
                        </div>
                        <h3 className="text-sm font-bold text-[#101F1A] mb-1">No matching courts found</h3>
                        <p className="text-xs text-[#101F1A]/50 mb-4">
                            Try adjusting your filter parameters or search query.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#101F1A]/5 text-[#101F1A] hover:bg-[#101F1A]/10 transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredFacilities.map((facility) => (
                            <div key={facility.id} className="rounded-xl border border-[#101F1A]/10 bg-white/95 shadow-card backdrop-blur-md overflow-hidden">
                                {/* Facility Header */}
                                <div className="px-4 py-3 bg-[#F5F2EA]/40 border-b border-[#101F1A]/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-white border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] shadow-2xs">
                                            <Building2 size={13} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-[#101F1A]">
                                                {facility.name}
                                            </h3>
                                            <p className="text-[10px] text-[#101F1A]/50 font-medium">
                                                Owner: <span className="font-bold text-[#101F1A]/80">{facility.owner?.name ?? '—'}</span> • {facility.city || facility.province || 'Philippines'}
                                            </p>
                                        </div>
                                    </div>

                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#101F1A]/10 text-[#101F1A]/70 shadow-2xs self-start sm:self-auto">
                                        {facility.filteredCourts.length} {facility.filteredCourts.length === 1 ? 'Court' : 'Courts'}
                                    </span>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#101F1A]/5">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">Court Name</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">Sport</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">Schedule</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">Hourly Rate</th>
                                                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-[#101F1A]/50 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#101F1A]/5 bg-white text-xs">
                                            {facility.filteredCourts.map((court) => (
                                                <tr key={court.id} className="hover:bg-[#F5F2EA]/30 transition-colors">
                                                    <td className="px-4 py-2.5 font-bold text-[#101F1A]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-md bg-[#F5F2EA] border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] shrink-0">
                                                                <Building2 size={12} />
                                                            </div>
                                                            <div>
                                                                <div>{court.name}</div>
                                                                {court.description && (
                                                                    <div className="text-[10px] font-normal text-[#101F1A]/40 truncate max-w-xs">{court.description}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[#101F1A]/70 font-medium">
                                                        {court.type || <span className="text-[#101F1A]/40 italic">Standard</span>}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-[#101F1A]/60 font-medium">
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={11} className="text-[#101F1A]/40" />
                                                            <span>{court.time_range || 'Venue standard'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 font-bold text-[#101F1A]">
                                                        {court.hourly_rate ? `₱${Number(court.hourly_rate).toFixed(2)} / hr` : '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs ${COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE}`}>
                                                            {COURT_STATUS_LABELS[court.status] || court.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
