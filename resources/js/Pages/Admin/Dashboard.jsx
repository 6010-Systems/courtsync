import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    ShieldCheck,
    UserCheck,
    Users,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, href, alert = false, accent = false }) {
    const cardContent = (
        <div className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 ${
            accent 
                ? 'border-[#D6FF3F]/30 bg-[#101F1A] text-white shadow-lg' 
                : alert
                    ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                    : 'border-[#101F1A]/10 bg-white hover:border-[#101F1A]/20 hover:shadow-card'
        }`}>
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${accent ? 'text-[#D6FF3F]' : alert ? 'text-amber-800' : 'text-[#101F1A]/50'}`}>
                    {label}
                </span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    accent 
                        ? 'bg-[#D6FF3F]/15 text-[#D6FF3F]' 
                        : alert 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-[#101F1A]/5 text-[#101F1A]'
                }`}>
                    <Icon size={18} />
                </div>
            </div>
            
            <div className="mt-4 flex items-baseline justify-between">
                <div className={`text-3xl font-black ${accent ? 'text-white' : alert ? 'text-amber-900' : 'text-[#101F1A]'}`}>
                    {value}
                </div>
                {href && (
                    <span className={`flex items-center text-xs font-semibold ${accent ? 'text-[#D6FF3F]' : 'text-[#101F1A]/40 group-hover:text-[#101F1A]'}`}>
                        Manage <ArrowUpRight size={14} className="ml-0.5" />
                    </span>
                )}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{cardContent}</Link>;
    }

    return cardContent;
}

export default function AdminDashboard({ user, adminStats }) {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Platform Administration"
                    subtitle="System-wide overview, facilities verification, and user management"
                    actions={
                        <div className="flex items-center gap-2 rounded-lg bg-[#101F1A]/5 px-3 py-1.5 text-xs font-bold text-[#101F1A]">
                            <Sparkles size={14} className="text-[#101F1A]" />
                            <span>System Administrator</span>
                        </div>
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-6">
                {/* Pending verifications alert banner */}
                {adminStats.pendingVerifications > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-amber-950">
                                        {adminStats.pendingVerifications} Facility Verification {adminStats.pendingVerifications === 1 ? 'Application' : 'Applications'} Pending
                                    </h3>
                                    <p className="text-xs text-amber-800">
                                        New venue documents require administrative review before facilities can go live.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('admin.verifications')}
                                className="rounded-lg bg-amber-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-800 shrink-0"
                            >
                                Review Queue
                            </Link>
                        </div>
                    </div>
                )}

                {/* KPI Metrics Grid */}
                <div>
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                        Platform Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            label="Pending Verifications"
                            value={adminStats.pendingVerifications}
                            icon={ShieldCheck}
                            href={route('admin.verifications')}
                            alert={adminStats.pendingVerifications > 0}
                        />
                        <StatCard
                            label="Approved Facilities"
                            value={adminStats.approvedFacilities}
                            icon={Building2}
                            href={route('admin.facilities')}
                        />
                        <StatCard
                            label="Total Facilities"
                            value={adminStats.totalFacilities}
                            icon={Building2}
                            href={route('admin.facilities')}
                        />
                        <StatCard
                            label="Facility Owners"
                            value={adminStats.totalOwners}
                            icon={UserCheck}
                            href={route('admin.owners')}
                        />
                        <StatCard
                            label="Facility Staff"
                            value={adminStats.totalStaff}
                            icon={UserCheck}
                            href={route('admin.staff')}
                        />
                        <StatCard
                            label="Registered Players"
                            value={adminStats.totalPlayers}
                            icon={Users}
                        />
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div>
                    <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                        Management Sections
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            href={route('admin.facilities')}
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card transition-all hover:border-[#101F1A]/30"
                        >
                            <div>
                                <Building2 size={24} className="text-[#101F1A]" />
                                <h3 className="mt-3 text-sm font-bold text-[#101F1A]">Facilities Directory</h3>
                                <p className="mt-1 text-xs text-[#101F1A]/60">Manage all registered sports facilities across regions</p>
                            </div>
                            <span className="mt-4 text-xs font-bold text-[#101F1A] flex items-center">Open Directory →</span>
                        </Link>

                        <Link
                            href={route('admin.courts')}
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card transition-all hover:border-[#101F1A]/30"
                        >
                            <div>
                                <TrendingUp size={24} className="text-[#101F1A]" />
                                <h3 className="mt-3 text-sm font-bold text-[#101F1A]">Courts Directory</h3>
                                <p className="mt-1 text-xs text-[#101F1A]/60">Platform-wide overview of sports courts and statuses</p>
                            </div>
                            <span className="mt-4 text-xs font-bold text-[#101F1A] flex items-center">Open Courts →</span>
                        </Link>

                        <Link
                            href={route('admin.owners')}
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card transition-all hover:border-[#101F1A]/30"
                        >
                            <div>
                                <UserCheck size={24} className="text-[#101F1A]" />
                                <h3 className="mt-3 text-sm font-bold text-[#101F1A]">Facility Owners</h3>
                                <p className="mt-1 text-xs text-[#101F1A]/60">View and manage facility owner accounts & verification</p>
                            </div>
                            <span className="mt-4 text-xs font-bold text-[#101F1A] flex items-center">Manage Owners →</span>
                        </Link>

                        <Link
                            href={route('admin.staff')}
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card transition-all hover:border-[#101F1A]/30"
                        >
                            <div>
                                <Users size={24} className="text-[#101F1A]" />
                                <h3 className="mt-3 text-sm font-bold text-[#101F1A]">Venue Staff</h3>
                                <p className="mt-1 text-xs text-[#101F1A]/60">View facility staff accounts and venue assignments</p>
                            </div>
                            <span className="mt-4 text-xs font-bold text-[#101F1A] flex items-center">Manage Staff →</span>
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
