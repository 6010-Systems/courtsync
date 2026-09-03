import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function PaymentsIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Payments"
                    subtitle="Monitor transactions, invoices, and payment methods"
                />
            }
        >
            <Head title="Payments" />
        </AuthenticatedLayout>
    );
}
