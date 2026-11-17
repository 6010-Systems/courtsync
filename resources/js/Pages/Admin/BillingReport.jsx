import BillingReportView from '@/Components/BillingReportView';
import { Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';

export default function BillingReport(props) {
    return (
        <BillingReportView
            {...props}
            title="Billing Report"
            subtitle="Manage the monthly booking-fee collection and billing status for every facility"
            reportRoute="admin.reports.billing"
            billingStatusRoute="admin.reports.billing.status"
            canManageBilling
            headerAction={
                <Link
                    href={route('admin.facilities')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#101F1A]/15 bg-white px-3.5 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                >
                    <Building2 size={14} strokeWidth={2.4} />
                    <span>Facilities</span>
                </Link>
            }
        />
    );
}
