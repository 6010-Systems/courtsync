import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function FacilitiesIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Facilities"
                    subtitle="Manage venue complexes, courts, and amenities"
                />
            }
        >
            <Head title="Facilities" />
        </AuthenticatedLayout>
    );
}
