import MetricCard, { formatCount } from '@/Components/MetricCard';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Hourglass,
    UserCheck,
    Users,
    TrendingUp,
    AlertCircle,
    Sparkles,
} from 'lucide-react';

export default function AdminDashboard({ user, adminStats }) {
    return (
        <AuthenticatedLayout
            inset="dashboard"
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

            <div className="flex flex-col gap-4 md:gap-6">
                {/* Pending verifications alert banner */}
                {adminStats.pendingVerifications > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm md:p-6">
                        <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
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
                                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-amber-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-800 md:w-auto"
                            >
                                Review Queue
                            </Link>
                        </div>
                    </div>
                )}

                {/* KPI Metrics Grid */}
                <div>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                        Platform Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
                        <MetricCard
                            label="Pending verifications"
                            value={formatCount(adminStats.pendingVerifications)}
                            href={route('admin.verifications')}
                            alert={adminStats.pendingVerifications > 0}
                            icon={Hourglass}
                            accent="lime"
                        />
                        <MetricCard
                            label="Approved facilities"
                            value={formatCount(adminStats.approvedFacilities)}
                            href={route('admin.facilities')}
                            icon={Building2}
                            accent="lime"
                        />
                        <MetricCard
                            label="Facility owners"
                            value={formatCount(adminStats.totalOwners)}
                            href={route('admin.owners')}
                            icon={UserCheck}
                            accent="lime"
                        />
                        <MetricCard
                            label="Registered players"
                            value={formatCount(adminStats.totalPlayers)}
                            icon={Users}
                            accent="lime"
                        />
                    </div>
                </div>

                {/* Quick Navigation Cards */}
                <div>
                    <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                        Management Sections
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
                        <Link
                            href={route('admin.facilities')}
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card transition-all hover:border-[#101F1A]/30 md:p-6"
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
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card transition-all hover:border-[#101F1A]/30 md:p-6"
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
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card transition-all hover:border-[#101F1A]/30 md:p-6"
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
                            className="flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card transition-all hover:border-[#101F1A]/30 md:p-6"
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
