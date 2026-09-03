import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function CustomersIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Customers"
                    subtitle="Manage venue players, profiles, and memberships"
                />
            }
        >
            <Head title="Customers" />
        </AuthenticatedLayout>
    );
}
