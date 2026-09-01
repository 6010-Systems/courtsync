import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth } = usePage().props;
    const userName = auth?.user?.name ?? 'User';

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Dashboard"
                    subtitle={`Welcome back, ${userName}`}
                />
            }
        >
            <Head title="Dashboard" />

            <div className="rounded-2xl border border-[#101F1A]/10 bg-white p-8 shadow-sm">
                <p className="font-semibold text-[#101F1A]">Welcome back to CourtSync! 🎾</p>
                <p className="mt-1 text-xs text-[#101F1A]/60">Your venue management dashboard overview will be rendered here.</p>
            </div>
        </AuthenticatedLayout>
    );
}
