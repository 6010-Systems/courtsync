import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, useForm } from '@inertiajs/react';
import { useToast } from '@/Components/ToastContext';
import { ArrowLeft, Check, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

const ACTIONS = ['view', 'create', 'edit', 'delete'];
const ACTION_LABELS = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

export default function StaffPermissions({ staff, matrix, permissions }) {
    const toast = useToast();
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        permissions: permissions || [],
    });

    const isChecked = (key) => key !== null && data.permissions.includes(key);

    const toggle = (key) => {
        if (key === null) return;
        setData(
            'permissions',
            data.permissions.includes(key)
                ? data.permissions.filter((k) => k !== key)
                : [...data.permissions, key]
        );
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('facility.staff.permissions.update', staff.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Staff permissions updated successfully.');
            },
            onError: () => {
                toast.error('Failed to update permissions.');
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title={`Permissions — ${staff.name}`}
                    subtitle={`Manage granular access controls for ${staff.email}`}
                    actions={
                        <Link
                            href={route('facility.staff')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all"
                        >
                            <ArrowLeft size={14} />
                            <span>Back to Team</span>
                        </Link>
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title={`Permissions — ${staff.name}`} />

            <div className="max-w-5xl mx-auto space-y-5 pb-6">
                {/* ── Context & Info Banner ── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white p-5 shadow-card">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D6FF3F]/30 text-[#101F1A]">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[#101F1A]">
                                Granular Staff Access Control
                            </h3>
                            <p className="mt-1 text-xs text-[#101F1A]/60">
                                Configure the exact actions <span className="font-bold text-[#101F1A]">{staff.name}</span> ({staff.email}) can perform within your facility. Unchecked modules are enforced and blocked server-side.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Permissions Form & Matrix ── */}
                <form onSubmit={submit} className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Module Name</th>
                                        {ACTIONS.map((action) => (
                                            <th key={action} scope="col" className="px-6 py-4 text-center">
                                                {ACTION_LABELS[action]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {Object.entries(matrix).map(([moduleName, actions]) => (
                                        <tr key={moduleName} className="hover:bg-[#F5F2EA]/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-[#101F1A] text-xs">
                                                {moduleName}
                                            </td>
                                            {ACTIONS.map((action) => {
                                                const key = actions[action];
                                                const checked = isChecked(key);

                                                return (
                                                    <td key={action} className="px-6 py-4 text-center">
                                                        {key === null ? (
                                                            <span className="text-xs text-[#101F1A]/20 select-none">
                                                                —
                                                            </span>
                                                        ) : (
                                                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggle(key)}
                                                                    className="h-4.5 w-4.5 rounded border-[#101F1A]/20 text-[#101F1A] focus:ring-1 focus:ring-[#D6FF3F] accent-[#101F1A] cursor-pointer"
                                                                />
                                                                <span className="sr-only">
                                                                    {action} {moduleName}
                                                                </span>
                                                            </label>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-[#101F1A]/60">
                            {data.permissions.length} permission{data.permissions.length === 1 ? '' : 's'} enabled
                        </div>
                        <div className="flex items-center gap-3">
                            {recentlySuccessful && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                    <CheckCircle2 size={14} />
                                    <span>Permissions Saved</span>
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Permissions</span>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
