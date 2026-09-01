import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Dashboard"
                    subtitle="Real-time venue availability & daily schedule"
                    badge="4 of 6 Courts Active"
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
