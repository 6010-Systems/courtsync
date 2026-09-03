import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Staff({ auth }) {
    const user = auth.user;
    
    // Get all approved facilities
    const approvedFacilities = user.facilities?.filter(f => f.verification_status === 'APPROVED') || [];

    const { data: staffData, setData: setStaffData, post: postStaff, processing: staffProcessing, errors: staffErrors, reset: resetStaff } = useForm({
        name: '',
        email: '',
        facility_id: approvedFacilities[0]?.id || '',
    });

    const submitStaff = (e) => {
        e.preventDefault();
        postStaff(route('facility.staff.store'), {
            onSuccess: () => resetStaff(),
        });
    };



    const handleDelete = (staff) => {
        if (confirm(`Are you sure you want to permanently remove ${staff.name}? This action cannot be undone.`)) {
            router.delete(route('facility.staff.destroy', staff.id), {
                preserveScroll: true,
            });
        }
    };

    // Flatten all staff across all facilities with facility name
    const allStaff = (user.facilities || []).flatMap(facility => 
        (facility.staff || []).map(staff => ({
            ...staff,
            facility_name: facility.name,
        }))
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-[#10221C]">
                            Team Management
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title="Team Management" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                <div className="bg-white p-8 shadow-sm rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-[#10221C]">Your Staff</h3>
                            <p className="text-sm text-gray-500">Manage your facility staff members.</p>
                        </div>
                    </div>

                    <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h4 className="text-md font-semibold text-gray-800 mb-4">Invite New Staff</h4>
                        <form onSubmit={submitStaff} className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                            <div className="flex-1 max-w-xs">
                                <select
                                    value={staffData.facility_id}
                                    onChange={e => setStaffData('facility_id', e.target.value)}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    <option value="" disabled>Select Facility</option>
                                    {approvedFacilities.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <InputError message={staffErrors.facility_id} className="mt-2" />
                            </div>
                            <div className="flex-1 max-w-xs">
                                <TextInput id="staff_name" value={staffData.name} onChange={e => setStaffData('name', e.target.value)} placeholder="Staff Name" className="block w-full" />
                                <InputError message={staffErrors.name} className="mt-2" />
                            </div>
                            <div className="flex-1 max-w-xs">
                                <TextInput id="staff_email" type="email" value={staffData.email} onChange={e => setStaffData('email', e.target.value)} placeholder="staff@example.com" className="block w-full" />
                                <InputError message={staffErrors.email} className="mt-2" />
                            </div>
                            <PrimaryButton disabled={staffProcessing} className="!bg-[#10221C] hover:!bg-[#1a382d] h-[42px]">
                                Send Invite
                            </PrimaryButton>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Facility</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allStaff.length > 0 ? (
                                    allStaff.map((staff) => (
                                        <tr key={staff.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                    {staff.facility_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleDelete(staff)}
                                                    className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition px-3 py-1.5 rounded-md"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No staff members yet. Invite one above!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
