import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#0D0F12]">Dashboard</h1>
                        <p className="text-xs text-[#6B7280] mt-0.5">Welcome back to CourtSync</p>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
                <p className="text-[#374151] font-medium">You're logged in! 🎉</p>
                <p className="text-sm text-[#9CA3AF] mt-1">Your CourtSync dashboard will appear here.</p>
            </div>
        </AuthenticatedLayout>
    );
}
