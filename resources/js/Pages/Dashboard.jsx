import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    CalendarCheck,
    Clock,
    CreditCard,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';

// ── Shared card shell — matches Profile/Edit.jsx's design language ─────────
function Card({ className = '', children }) {
    return (
        <div className={`rounded-xl border border-[#101F1A]/10 bg-white p-6 shadow-card ${className}`}>
            {children}
        </div>
    );
}

function StatCard({ label, value, icon: Icon, soon = false }) {
    return (
        <Card className={soon ? 'opacity-60' : ''}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                <Icon size={14} className="text-[#101F1A]" />
                <span>{label}</span>
                {soon && (
                    <span className="ml-auto rounded-full bg-[#101F1A]/10 px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal text-[#101F1A]/60">
                        Soon
                    </span>
                )}
            </div>
            <div className="mt-3 text-3xl font-black text-[#101F1A]">
                {soon ? '—' : value}
            </div>
        </Card>
    );
}

function NoticeCard({ tone = 'warning', title, description, action }) {
    const palette = tone === 'warning'
        ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' }
        : { bg: 'bg-[#F5F2EA]', border: 'border-[#101F1A]/10', icon: 'bg-[#D6FF3F]/30 text-[#101F1A]' };

    return (
        <div className={`rounded-xl border ${palette.border} ${palette.bg} p-6 shadow-card`}>
            <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${palette.icon}`}>
                    <AlertTriangle size={22} />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#101F1A]">{title}</h3>
                    <p className="mt-1 text-sm text-[#101F1A]/70">{description}</p>
                </div>
                {action}
            </div>
        </div>
    );
}

const STATUS_COPY = {
    DRAFT: 'This facility is a draft. Complete registration and submit verification documents to go live.',
    SUBMITTED: 'Your verification documents have been submitted and are awaiting review by an administrator.',
    UNDER_REVIEW: "Your facility is currently under review by our team. We'll notify you once it's approved.",
    REJECTED: 'Your facility verification was rejected. Please review your documents and try again.',
    SUSPENDED: 'This facility has been suspended by an administrator.',
};

export default function Dashboard({ user, adminStats }) {
    // ── Facility owner: no verified account yet ────────────────────────
    if (user.role === 'FACILITY_OWNER' && user.status !== 'VERIFIED') {
        return (
            <AuthenticatedLayout header={<PageHeader title="Dashboard" subtitle="Welcome to CourtSync" actions={null} showSearch={false} showNotifications={false} />}>
                <Head title="Dashboard" />
                <NoticeCard
                    title="Account Pending Verification"
                    description="Your account is currently under review by our administrators. You'll be able to add and manage facilities once it's verified."
                />
            </AuthenticatedLayout>
        );
    }

    // ── Facility owner: verified, but hasn't registered a facility ─────
    if (user.role === 'FACILITY_OWNER' && (!user.facilities || user.facilities.length === 0)) {
        return (
            <AuthenticatedLayout header={<PageHeader title="Dashboard" subtitle="Welcome to CourtSync" actions={null} showSearch={false} showNotifications={false} />}>
                <Head title="Dashboard" />
                <Card className="flex flex-col items-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D6FF3F] text-[#101F1A] shadow-sm ring-2 ring-[#101F1A]/10">
                        <Building2 size={28} />
                    </div>
                    <h2 className="mt-5 text-xl font-bold text-[#101F1A]">Welcome to CourtSync!</h2>
                    <p className="mt-2 max-w-md text-sm text-[#101F1A]/60">
                        You haven't registered any facilities yet. Add your first facility to start managing staff, players, and bookings.
                    </p>
                    <Link href={route('facilities.index')} className="mt-6">
                        <PrimaryButton className="!bg-[#101F1A] hover:!bg-[#1a382d]">
                            Go to Facilities
                        </PrimaryButton>
                    </Link>
                </Card>
            </AuthenticatedLayout>
        );
    }

    // ── Facility staff: not yet linked to an active facility ───────────
    if (user.role === 'FACILITY_STAFF' && user.status === 'PENDING_VERIFICATION') {
        return (
            <AuthenticatedLayout header={<PageHeader title="Dashboard" subtitle="Welcome to CourtSync" actions={null} showSearch={false} showNotifications={false} />}>
                <Head title="Dashboard" />
                <NoticeCard
                    title="Waiting for Verification"
                    description="Your account is pending verification. Please wait for an administrator or facility owner to link your account to a facility."
                />
            </AuthenticatedLayout>
        );
    }

    const approvedFacilities = user.role === 'FACILITY_OWNER'
        ? (user.facilities || []).filter(f => f.verification_status === 'APPROVED')
        : [];
    const pendingFacilities = user.role === 'FACILITY_OWNER'
        ? (user.facilities || []).filter(f => f.verification_status !== 'APPROVED')
        : [];

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={`Welcome back, ${user.name}`}
                    subtitle={
                        user.role === 'ADMIN'
                            ? 'Platform overview'
                            : user.role === 'FACILITY_STAFF'
                                ? user.work_facility?.name ?? 'No facility assigned'
                                : 'Here’s what’s happening across your facilities'
                    }
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4">
                {/* Facility owner: per-facility verification banners */}
                {pendingFacilities.map(facility => (
                    <NoticeCard
                        key={facility.id}
                        title={`Facility Status: ${facility.verification_status.replace('_', ' ')}`}
                        description={STATUS_COPY[facility.verification_status] ?? 'Please check your facility details.'}
                        action={
                            <Link href={route('facilities.index')} className="shrink-0">
                                <PrimaryButton className="!bg-[#101F1A] hover:!bg-[#1a382d]">
                                    Go to Facilities
                                </PrimaryButton>
                            </Link>
                        }
                    />
                ))}

                {/* Facility owner: real stats across approved facilities */}
                {user.role === 'FACILITY_OWNER' && approvedFacilities.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Approved Facilities" value={approvedFacilities.length} icon={Building2} />
                        <StatCard label="Staff Members" value={approvedFacilities.reduce((sum, f) => sum + (f.staff_count ?? 0), 0)} icon={UserCheck} />
                        <StatCard label="Registered Players" value={approvedFacilities.reduce((sum, f) => sum + (f.players_count ?? 0), 0)} icon={Users} />
                        <StatCard label="Bookings" icon={CalendarCheck} soon />
                    </div>
                )}

                {/* Facility staff: stats scoped to their assigned facility */}
                {user.role === 'FACILITY_STAFF' && user.work_facility && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard label="Registered Players" value={user.work_facility.players_count ?? 0} icon={Users} />
                        <StatCard label="Staff Members" value={user.work_facility.staff_count ?? 0} icon={UserCheck} />
                        <StatCard label="Bookings" icon={CalendarCheck} soon />
                    </div>
                )}

                {/* Admin: platform-wide stats */}
                {user.role === 'ADMIN' && adminStats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard label="Facility Owners" value={adminStats.totalOwners} icon={UserCheck} />
                        <StatCard label="Facility Staff" value={adminStats.totalStaff} icon={UserCheck} />
                        <StatCard label="Registered Players" value={adminStats.totalPlayers} icon={Users} />
                        <StatCard label="Approved Facilities" value={adminStats.approvedFacilities} icon={Building2} />
                        <StatCard label="Total Facilities" value={adminStats.totalFacilities} icon={Building2} />
                        <StatCard label="Pending Verifications" value={adminStats.pendingVerifications} icon={ShieldCheck} />
                    </div>
                )}

                {/* Coming-soon revenue tile — kept honest with the sidebar's disabled Payments module */}
                {(user.role === 'FACILITY_OWNER' && approvedFacilities.length > 0) && (
                    <Card className="flex items-center gap-3 opacity-60">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#101F1A]/5 text-[#101F1A]/50">
                            <CreditCard size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#101F1A]/70">Revenue tracking</p>
                            <p className="text-xs text-[#101F1A]/50">Payments module is not built yet — coming soon.</p>
                        </div>
                        <Clock size={16} className="ml-auto text-[#101F1A]/30" />
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
