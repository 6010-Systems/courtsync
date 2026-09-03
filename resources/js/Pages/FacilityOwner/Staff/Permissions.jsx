import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

const ACTIONS = ['view', 'create', 'edit', 'delete'];
const ACTION_LABELS = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

export default function StaffPermissions({ staff, matrix, permissions }) {
    const { data, setData, put, processing, recentlySuccessful } = useForm({
        permissions,
    });

    const isChecked = (key) => key !== null && data.permissions.includes(key);

    const toggle = (key) => {
        if (key === null) return;
        setData('permissions', data.permissions.includes(key)
            ? data.permissions.filter((k) => k !== key)
            : [...data.permissions, key]);
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('facility.staff.permissions.update', staff.id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Permissions</h2>}
        >
            <Head title={`Permissions — ${staff.name}`} />

            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <div>
                    <Link href={route('facility.staff')} className="text-sm text-gray-500 hover:text-gray-800 font-medium">
                        ← Back to Team Management
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-[#10221C]">Permissions — {staff.name}</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Control exactly what {staff.name} ({staff.email}) can view, create, edit, or delete within your facility. Unchecked boxes are blocked server-side, not just hidden in the UI.
                    </p>
                </div>

                <form onSubmit={submit}>
                    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Module</th>
                                        {ACTIONS.map((action) => (
                                            <th key={action} className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                {ACTION_LABELS[action]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(matrix).map(([moduleName, actions]) => (
                                        <tr key={moduleName} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{moduleName}</td>
                                            {ACTIONS.map((action) => {
                                                const key = actions[action];
                                                return (
                                                    <td key={action} className="px-6 py-4 text-center">
                                                        {key === null ? (
                                                            <span className="text-gray-300">—</span>
                                                        ) : (
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked(key)}
                                                                onChange={() => toggle(key)}
                                                                className="h-4 w-4 rounded border-gray-300 text-[#10221C] focus:ring-[#D6FF3F]"
                                                            />
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

                    <div className="mt-4 flex items-center gap-3">
                        <PrimaryButton disabled={processing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                            Save Permissions
                        </PrimaryButton>
                        {recentlySuccessful && (
                            <span className="text-sm text-green-600 font-medium">Saved</span>
                        )}
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
