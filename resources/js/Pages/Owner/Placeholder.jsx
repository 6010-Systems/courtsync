import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head } from '@inertiajs/react';

export default function Placeholder({ title }) {
    return (
        <DashboardLayout title={title}>
            <Head title={title} />

            <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-lg rounded-2xl border border-dashed border-brand-border px-8 py-16 text-center">
                    <p className="font-display text-2xl tracking-tight text-brand-dark">
                        {title}
                    </p>
                    <p className="mt-2 text-sm text-brand-text-muted">
                        This section is coming soon.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
