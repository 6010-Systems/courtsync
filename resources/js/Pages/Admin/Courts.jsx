import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';

export default function Courts({ facilities }) {
    const facilitiesWithCourts = facilities.filter(f => (f.courts || []).length > 0);
    const totalCourts = facilities.reduce((sum, f) => sum + (f.courts?.length || 0), 0);

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Courts</h2>}
        >
            <Head title="Courts" />

            <div className="max-w-7xl mx-auto flex flex-col gap-6">
                <p className="text-sm text-gray-500">
                    {totalCourts} court{totalCourts === 1 ? '' : 's'} across {facilitiesWithCourts.length} facilit{facilitiesWithCourts.length === 1 ? 'y' : 'ies'}. Courts are managed by each facility's owner or staff.
                </p>

                {facilitiesWithCourts.length === 0 ? (
                    <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-2 text-[#10221C]">No Courts Yet</h2>
                        <p className="text-gray-500">No facility has registered any courts.</p>
                    </div>
                ) : (
                    facilitiesWithCourts.map((facility) => (
                        <div key={facility.id} className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-[#10221C]">{facility.name}</h3>
                                <span className="text-xs text-gray-500">Owner: {facility.owner?.name ?? '—'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Hours</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {facility.courts.map((court) => (
                                            <tr key={court.id}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{court.name}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{court.type || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{court.time_range || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">{court.hourly_rate ? `₱${Number(court.hourly_rate).toFixed(2)}/hr` : '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-[10px] font-bold border rounded-full uppercase whitespace-nowrap ${COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE}`}>
                                                        {COURT_STATUS_LABELS[court.status] || court.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
