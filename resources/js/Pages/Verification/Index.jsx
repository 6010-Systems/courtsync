import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function VerificationIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Verification"
                    subtitle="Review player identity documents and compliance"
                />
            }
        >
            <Head title="Verification" />
        </AuthenticatedLayout>
    );
}
