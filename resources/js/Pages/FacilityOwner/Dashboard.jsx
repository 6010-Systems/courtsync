import ActivityHeatmap from '@/Components/ActivityHeatmap';
// @deprecated — replaced by PaymentSplitCard / RevenueHeroCard sparkline
// import BookingsTrend from '@/Components/BookingsTrend';
// @deprecated — replaced by bento grid StatCards
// import DashboardStats from '@/Components/DashboardStats';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
// @deprecated — replaced by PopularDaysCard
// import WeekdayBars from '@/Components/WeekdayBars';
import { CourtRevenueCard } from '@/Components/Dashboard/CourtRevenueCard';
import { CourtUtilizationCard } from '@/Components/Dashboard/CourtUtilizationCard';
import {
    MOCK_COURT_REVENUE,
    MOCK_COURT_STATUSES,
    MOCK_NEXT_SESSIONS,
    MOCK_PAYMENT_SPLIT,
    MOCK_POPULAR_DAYS,
    MOCK_REVENUE_BY_RANGE,
} from '@/Components/Dashboard/constants';
import { NextSessionsCard } from '@/Components/Dashboard/NextSessionsCard';
import { PaymentSplitCard } from '@/Components/Dashboard/PaymentSplitCard';
import { PopularDaysCard } from '@/Components/Dashboard/PopularDaysCard';
import { RevenueHeroCard } from '@/Components/Dashboard/RevenueHeroCard';
import StatCard from '@/Components/Dashboard/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Banknote,
    Building2,
    CalendarCheck,
    Clock,
    Plus,
    Users,
} from 'lucide-react';

function Card({ className = '', children }) {
    return (
        <div className={`rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card md:p-6 ${className}`}>
            {children}
        </div>
    );
}

function NoticeCard({ tone = 'warning', title, description, action }) {
    const palette = tone === 'warning'
        ? { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600' }
        : { bg: 'bg-[#F5F2EA]', border: 'border-[#101F1A]/10', icon: 'bg-[#D6FF3F]/30 text-[#101F1A]' };

    return (
        <div className={`rounded-xl border ${palette.border} ${palette.bg} p-4 shadow-card md:p-6`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
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

function PlaceholderPanel({ title, children }) {
    return (
        <section className="flex h-full flex-col rounded-xl border border-dashed border-[#101F1A]/20 bg-white p-4 md:p-6">
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#101F1A]">{title}</h2>
                <span className="ml-auto rounded-full bg-[#101F1A]/10 px-2 py-0.5 text-[10px] font-bold text-[#101F1A]/60">
                    Soon
                </span>
            </div>
            <div className="mt-4 flex-1">{children}</div>
            <p className="mt-4 text-xs text-[#101F1A]/60">Not available yet</p>
        </section>
    );
}

/**
 * ComingSoon — wraps any card with a grayscale overlay + centred "Coming Soon" badge.
 * The underlying card renders at full fidelity (mock data) but is visually muted.
 */
function ComingSoon({ children, className = '' }) {
    return (
        <div className={`relative h-full ${className}`}>
            {/* Card content — grayscaled */}
            <div className="grayscale opacity-60 pointer-events-none select-none h-full">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 rounded-xl bg-white/30 backdrop-blur-[1px]" />

            {/* Centred badge */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-1.5 bg-[#101F1A] text-[#D6FF3F] text-[11px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
                    Coming Soon
                </span>
            </div>
        </div>
    );
}

/**
 * PeriodSummaryCard — compact live-data summary for the last 30 days.
 * Sits beside the activity heatmap in Row 3 to balance the width.
 */
function PeriodSummaryCard({ bookings, bookingsDelta, revenue, revenueDelta, players, pending, className = '' }) {
    const fmt = (n) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

    const rows = [
        {
            label: 'Bookings',
            value: Number(bookings).toLocaleString('en-PH'),
            delta: bookingsDelta,
            sub:   'Last 30 days',
            accent: true,
        },
        {
            label: 'Revenue Collected',
            value: fmt(revenue),
            delta: revenueDelta,
            sub:   'Verified payments',
        },
        {
            label: 'Total Players',
            value: Number(players).toLocaleString('en-PH'),
            delta: null,
            sub:   'Registered accounts',
        },
        {
            label: 'Pending Bookings',
            value: Number(pending).toLocaleString('en-PH'),
            delta: null,
            sub:   'Awaiting confirmation',
            warn:  Number(pending) > 0,
        },
    ];

    return (
        <div
            className={`rounded-xl p-4 flex flex-col justify-between ${className}`}
            style={{ backgroundColor: '#10221C' }}
        >
            <div className="mb-2">
                <h3 className="text-sm font-bold text-[#F5F2EA]">Period Summary</h3>
                <p className="text-[10.5px] text-[#F5F2EA]/45 mt-0.5">Last 30 days vs prior</p>
            </div>

            <div className="flex-1 flex flex-col divide-y divide-white/[0.07]">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-1.5 gap-3 min-w-0">
                        <div className="min-w-0">
                            <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#F5F2EA]/45 truncate">
                                {row.label}
                            </p>
                            <p className={`text-[16px] font-black leading-tight mt-0.5 truncate tabular-nums ${
                                row.accent ? 'text-[#D6FF3F]' : row.warn ? 'text-[#FF5A36]' : 'text-[#F5F2EA]'
                            }`}>
                                {row.value}
                            </p>
                        </div>

                        {row.delta !== null && row.delta !== undefined && (
                            <div className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                row.delta >= 0
                                    ? 'bg-[#D6FF3F]/15 text-[#D6FF3F]'
                                    : 'bg-[#FF5A36]/15 text-[#FF5A36]'
                            }`}>
                                {row.delta >= 0 ? '+' : ''}{row.delta}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const BOOKING_SOURCES = { online: 2884, walkIn: 1432, staff: 562 };

function MetricsSummary({ metrics, playerHint }) {
    const revenueRange = MOCK_REVENUE_BY_RANGE['This Week'];

    // Derive KPI values from real metrics props where available
    const bookingsCount   = metrics?.bookings?.current ?? 247;
    const bookingsDelta   = metrics?.bookings?.current && metrics?.bookings?.previous
        ? Math.round(((metrics.bookings.current - metrics.bookings.previous) / Math.max(metrics.bookings.previous, 1)) * 100)
        : 15;
    const bookingsPrev    = metrics?.bookings?.previous ?? 214;

    const collectedCurrent  = Number(metrics?.collected?.current ?? 82450);
    const collectedPrevious = Number(metrics?.collected?.previous ?? 73600);
    const collectedDelta    = collectedPrevious > 0
        ? Math.round(((collectedCurrent - collectedPrevious) / collectedPrevious) * 100)
        : 12;

    const playersTotal  = metrics?.players?.total ?? 1432;
    const pendingTotal  = Number(metrics?.pending?.total ?? 18);

    // Transform metrics.weekdays into PopularDaysCard format
    const popularDays = metrics?.weekdays?.length
        ? metrics.weekdays.map((w) => ({
              day:      w.label,          // 'Mon', 'Tue', ...
              label:    w.name,           // 'Monday', 'Tuesday', ...
              bookings: w.count,
              level:    0,               // PopularDaysCard derives level from bookings
          }))
        : MOCK_POPULAR_DAYS;
    return (
        <div className="grid grid-cols-12 gap-2">

            {/* ── Row 0: Compact KPI Strip ──────────────────────────── */}
            <StatCard
                className="col-span-6 md:col-span-3"
                label="Bookings"
                value={bookingsCount.toLocaleString('en-PH')}
                delta={bookingsDelta}
                comparison={`vs. ${bookingsPrev.toLocaleString('en-PH')} last period`}
                icon={CalendarCheck}
                iconVariant="volt"
            />
            <StatCard
                className="col-span-6 md:col-span-3"
                label="Revenue"
                value={new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(collectedCurrent)}
                delta={collectedDelta}
                comparison={`vs. ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(collectedPrevious)}`}
                icon={Banknote}
                iconVariant="volt"
            />
            <StatCard
                className="col-span-6 md:col-span-3"
                label="Players"
                value={playersTotal.toLocaleString('en-PH')}
                comparison={playerHint ?? 'Total registered'}
                icon={Users}
                iconVariant="volt"
            />
            <StatCard
                className="col-span-6 md:col-span-3"
                label="Pending"
                value={pendingTotal.toLocaleString('en-PH')}
                delta={pendingTotal > 0 ? undefined : 0}
                comparison="Awaiting confirmation"
                icon={Clock}
                iconVariant={pendingTotal > 0 ? 'coral' : 'default'}
            />

            {/* ── Row 1: Hero + Right column ────────────────────────── */}
            <div className="col-span-12 md:col-span-7">
                <RevenueHeroCard
                    totalRevenue={new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(collectedCurrent)}
                    delta={collectedDelta}
                    comparisonText={`vs. ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(collectedPrevious)} last period`}
                    chartData={metrics?.revenue_trend ?? revenueRange.trend}
                    bookingSources={metrics?.sources ?? BOOKING_SOURCES}
                    className="h-full"
                />
            </div>
            <div className="col-span-12 md:col-span-5 grid grid-rows-2 gap-2">
                {metrics?.weekdays ? (
                    <PopularDaysCard days={popularDays} className="h-full" />
                ) : (
                    <ComingSoon>
                        <PopularDaysCard days={popularDays} className="h-full" />
                    </ComingSoon>
                )}
                <ComingSoon>
                    <CourtUtilizationCard
                        percentage={72}
                        delta={13}
                        activeCourts={4}
                        totalCourts={4}
                        peakWindow="5–8 PM"
                        targetPct={80}
                        className="h-full"
                    />
                </ComingSoon>
            </div>

            {/* ── Row 2: Operations strip ───────────────────────────── */}
            <div className="col-span-12 md:col-span-5">
                <ComingSoon>
                    <NextSessionsCard
                        sessions={MOCK_NEXT_SESSIONS}
                        courtStatuses={MOCK_COURT_STATUSES}
                        className="h-full"
                    />
                </ComingSoon>
            </div>
            <div className="col-span-12 md:col-span-4">
                <ComingSoon>
                    <PaymentSplitCard
                        paymentSplit={MOCK_PAYMENT_SPLIT}
                        className="h-full"
                    />
                </ComingSoon>
            </div>
            <div className="col-span-12 md:col-span-3">
                <ComingSoon>
                    <CourtRevenueCard courtRevenue={MOCK_COURT_REVENUE} className="h-full" />
                </ComingSoon>
            </div>

            {/* ── Row 3: Booking Activity Heatmap + Period Summary ──── */}
            <div className="col-span-12 md:col-span-8">
                {metrics?.heatmap?.days ? (
                    <ActivityHeatmap days={metrics.heatmap.days} />
                ) : (
                    <ComingSoon>
                        <ActivityHeatmap days={Array.from({ length: 119 }, (_, i) => {
                            const d = new Date(2026, 3, 1);
                            d.setDate(d.getDate() + i);
                            return { date: d.toISOString().slice(0, 10), count: 0 };
                        })} />
                    </ComingSoon>
                )}
            </div>
            <div className="col-span-12 md:col-span-4">
                <PeriodSummaryCard
                    bookings={bookingsCount}
                    bookingsDelta={bookingsDelta}
                    revenue={collectedCurrent}
                    revenueDelta={collectedDelta}
                    players={playersTotal}
                    pending={pendingTotal}
                    className="h-full"
                />
            </div>

        </div>
    );
}

export default function FacilityOwnerDashboard({ user, metrics = null }) {
    // ── Facility owner: no verified account yet ────────────────────────
    if (user.role === 'FACILITY_OWNER' && user.status !== 'VERIFIED') {
        return (
            <AuthenticatedLayout inset="dashboard" header={<PageHeader title="Dashboard" subtitle="Welcome to CourtSync" actions={null} showSearch={false} showNotifications={false} />}>
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
            <AuthenticatedLayout inset="dashboard" header={<PageHeader title="Dashboard" subtitle="Welcome to CourtSync" actions={null} showSearch={false} showNotifications={false} />}>
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
                        <PrimaryButton className="gap-2">
                            <Plus size={16} />
                            Add Your First Facility
                        </PrimaryButton>
                    </Link>
                </Card>
            </AuthenticatedLayout>
        );
    }

    const facilities = user.facilities ?? [];
    const pendingFacilities = facilities.filter(f => f.verification_status !== 'APPROVED');

    return (
        <AuthenticatedLayout
            inset="dashboard"
            header={
                <PageHeader
                    title="Dashboard"
                    subtitle={
                        user.role === 'FACILITY_STAFF'
                            ? `Staff portal for ${user.work_facility?.name ?? 'your assigned facility'}`
                            : 'Here’s what’s happening across your facilities'
                    }
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 md:gap-6">
                {/* Facility owner: per-facility verification banners */}
                {pendingFacilities.map(facility => (
                    <NoticeCard
                        key={facility.id}
                        title={`Facility Status: ${facility.verification_status.replace('_', ' ')}`}
                        description={STATUS_COPY[facility.verification_status] ?? 'Please check your facility details.'}
                        action={
                            <Link href={route('facilities.index')} className="w-full shrink-0 md:w-auto">
                                <PrimaryButton className="min-h-11 w-full md:w-auto !bg-[#101F1A] hover:!bg-[#1a382d]">
                                    Go to Facilities
                                </PrimaryButton>
                            </Link>
                        }
                    />
                ))}

                {user.role === 'FACILITY_STAFF' && !user.work_facility && (
                    <NoticeCard
                        title="No facility assigned"
                        description="You are not assigned to a facility yet."
                    />
                )}

                {metrics && (
                    <MetricsSummary
                        metrics={metrics}
                        playerHint={user.role === 'FACILITY_STAFF' ? 'At this facility' : 'On approved facilities'}
                    />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
