import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function BookingsIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Bookings"
                    subtitle="Manage court bookings and reservations"
                />
            }
        >
            <Head title="Bookings" />
        </AuthenticatedLayout>
    );
}
