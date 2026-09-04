import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function CourtsIndex() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Courts"
                    subtitle="Monitor court surfaces, conditions, and status"
                />
            }
        >
            <Head title="Courts" />
        </AuthenticatedLayout>
    );
}
