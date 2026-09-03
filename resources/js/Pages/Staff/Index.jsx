import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function StaffIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Staff"
                    subtitle="Manage venue personnel, coaches, and shift rosters"
                />
            }
        >
            <Head title="Staff" />
        </AuthenticatedLayout>
    );
}
