import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function ReportsIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Reports"
                    subtitle="View venue analytics, court utilization, and revenue reports"
                />
            }
        >
            <Head title="Reports" />
        </AuthenticatedLayout>
    );
}
