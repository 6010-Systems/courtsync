import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import DateRangeFilter from '@/Components/Dashboard/DateRangeFilter';
import StatCard from '@/Components/Dashboard/StatCard';
import RevenueHeroCard from '@/Components/Dashboard/RevenueHeroCard';
import CourtUtilizationCard from '@/Components/Dashboard/CourtUtilizationCard';
import PeakBookingHoursCard from '@/Components/Dashboard/PeakBookingHoursCard';
import NextSessionsCard from '@/Components/Dashboard/NextSessionsCard';
import PaymentSplitCard from '@/Components/Dashboard/PaymentSplitCard';
import CourtRevenueCard from '@/Components/Dashboard/CourtRevenueCard';
import PopularDaysCard from '@/Components/Dashboard/PopularDaysCard';
import ShareQrCard from '@/Components/Dashboard/ShareQrCard';
import {
  MOCK_REVENUE_BY_RANGE,
  MOCK_PAYMENT_SPLIT,
  MOCK_COURT_REVENUE,
  MOCK_HOURS,
  MOCK_COURTS,
  MOCK_HEATMAP,
  MOCK_NEXT_SESSIONS,
  MOCK_POPULAR_DAYS,
} from '@/Components/Dashboard/constants';
import { Users, Clock, CalendarCheck } from 'lucide-react';

export default function Dashboard() {
  const { auth } = usePage().props;
  const user = auth?.user;
  const userName = user?.name ? user.name.split(' ')[0] : 'Mikko';

  const [dateRange, setDateRange] = useState('This Week');

  // Dynamic revenue data based on selected timeframe
  const activeRevenueData = MOCK_REVENUE_BY_RANGE[dateRange] || MOCK_REVENUE_BY_RANGE['This Week'];

  const handlePayout = () => {
    alert('Opening Payout Transfer modal...');
  };

  const handleExport = () => {
    alert('Exporting revenue report (CSV)...');
  };

  const handleAddSession = () => {
    try {
      router.visit('/bookings');
    } catch {
      alert('Navigating to New Booking screen...');
    }
  };

  const handleSelectSession = (session) => {
    if (session?.type === 'view_all') {
      try {
        router.visit('/bookings');
      } catch {
        // fallback
      }
      return;
    }
    alert(`Viewing session details for ${session.name} (${session.court})`);
  };

  const handleDownloadQr = () => {
    alert('Generating high-resolution printable QR code poster...');
  };

  return (
    <AuthenticatedLayout
      header={
        <PageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${userName} • Bogo Sports Center performance overview`}
          actions={
            <DateRangeFilter
              range={dateRange}
              onRangeChange={setDateRange}
            />
          }
        />
      }
    >
      <Head title="Facility Dashboard" />

      {/* Main Grid Container with cohesive gap-4 spacing */}
      <div className="space-y-4">
        {/* Row 1: Dynamic Revenue Hero + Court Utilization */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
          <div className="xl:col-span-2">
            <RevenueHeroCard
              totalRevenue={activeRevenueData.totalRevenue}
              delta={activeRevenueData.delta}
              comparisonText={activeRevenueData.comparisonText}
              chartData={activeRevenueData.trend}
              onPayout={handlePayout}
              onExport={handleExport}
            />
          </div>

          <div>
            <CourtUtilizationCard
              percentage={72}
              delta={13}
              activeCourts={4}
              totalCourts={4}
              peakWindow="5–8 PM"
            />
          </div>
        </div>

        {/* Row 2: Secondary Metric Stat Cards strictly adhering to brand theme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
          <StatCard
            label="Bookings Today"
            value="24"
            delta={8}
            sub="18 online · 6 walk-in"
            icon={CalendarCheck}
            iconVariant="volt"
          />
          <StatCard
            label="Avg. Session Length"
            value="1h 25m"
            delta={4}
            sub="↑ vs 1h 20m last period"
            icon={Clock}
            iconVariant="forest"
          />
          <StatCard
            label="New Customers"
            value="9"
            delta={-3}
            good={false}
            sub="vs 12 last period"
            icon={Users}
            iconVariant="coral"
          />
        </div>

        {/* Row 3: Peak Hours Heatmap + Next Check-in Sessions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
          <div className="xl:col-span-2">
            <PeakBookingHoursCard
              hours={MOCK_HOURS}
              courts={MOCK_COURTS}
              heatmap={MOCK_HEATMAP}
              delta={6}
              timeframe={dateRange.toLowerCase()}
            />
          </div>

          <div>
            <NextSessionsCard
              sessions={MOCK_NEXT_SESSIONS}
              onAddSession={handleAddSession}
              onSelectSession={handleSelectSession}
            />
          </div>
        </div>

        {/* Row 4: Payment Split + Revenue by Court + Popular Days */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
          <PaymentSplitCard paymentSplit={MOCK_PAYMENT_SPLIT} />
          <CourtRevenueCard courtRevenue={MOCK_COURT_REVENUE} />
          <PopularDaysCard days={MOCK_POPULAR_DAYS} />
        </div>

        {/* Row 5: Promotional QR Booking Card */}
        <div>
          <ShareQrCard
            facilityName="Bogo Sports Center"
            bookingUrl="https://courtsync.app/bogo-sports"
            onDownload={handleDownloadQr}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
