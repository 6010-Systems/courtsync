import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function CalendarIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Calendar"
                    subtitle="View court schedules and availability"
                />
            }
        >
            <Head title="Calendar" />
        </AuthenticatedLayout>
    );
}
