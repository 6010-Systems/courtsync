import BillingReportView from '@/Components/BillingReportView';
import { Link } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';

export default function Reports(props) {
    return (
        <BillingReportView
            {...props}
            title="Reports"
            subtitle="Monthly booking fees, collections, and booking breakdown for your facilities"
            reportRoute="facility.reports"
            headerAction={
                <Link
                    href={route('facility.calendar')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#101F1A]/15 bg-white px-3.5 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA]"
                >
                    <CalendarDays size={14} strokeWidth={2.4} />
                    <span>Calendar</span>
                </Link>
            }
        />
    );
}
