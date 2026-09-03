import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useState } from 'react';

export default function Facilities({ facilities, owners }) {
    // Add Facility State
    const [addingFacility, setAddingFacility] = useState(false);
    const { data: addData, setData: setAddData, post, processing: addProcessing, errors: addErrors, reset: resetAdd } = useForm({
        user_id: '',
        name: '',
        slug: '',
        address: '',
        city: '',
        province: '',
        country: '',
        contact_number: '',
        description: '',
        verification_status: 'DRAFT',
    });

    const openAddModal = () => setAddingFacility(true);
    const closeAddModal = () => {
        setAddingFacility(false);
        resetAdd();
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('admin.facilities.store'), {
            onSuccess: () => closeAddModal(),
        });
    };

    // Edit Facility State
    const [editingFacility, setEditingFacility] = useState(null);
    const { data: editData, setData: setEditData, put: update, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        user_id: '',
        name: '',
        slug: '',
        address: '',
        city: '',
        province: '',
        country: '',
        contact_number: '',
        description: '',
        verification_status: '',
    });

    const openEditModal = (facility) => {
        setEditingFacility(facility);
        setEditData({
            user_id: facility.user_id,
            name: facility.name,
            slug: facility.slug || '',
            address: facility.address,
            city: facility.city,
            province: facility.province,
            country: facility.country,
            contact_number: facility.contact_number,
            description: facility.description || '',
            verification_status: facility.verification_status,
        });
    };

    const closeEditModal = () => {
        setEditingFacility(null);
        resetEdit();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        update(route('admin.facilities.update', editingFacility.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            case 'SUSPENDED': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'SUBMITTED': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold leading-tight text-[#10221C]">Facilities Management</h2>
                    <PrimaryButton onClick={openAddModal}>Add Facility</PrimaryButton>
                </div>
            }
        >
            <Head title="Admin - Facilities" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    {facilities.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50">
                            No facilities found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Facility</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {facilities.map((f) => (
                                        <tr key={f.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{f.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">Slug: {f.slug || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{f.owner?.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">{f.owner?.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{f.city}, {f.province}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{f.address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${getStatusColor(f.verification_status)}`}>
                                                    {f.verification_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => openEditModal(f)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal Content - Shared for Add and Edit */}
            {(addingFacility || editingFacility) && (
                <Modal show={true} onClose={addingFacility ? closeAddModal : closeEditModal} maxWidth="2xl">
                    <form onSubmit={addingFacility ? submitAdd : submitEdit} className="p-6">
                        <h2 className="text-xl font-bold text-[#10221C] mb-6">
                            {addingFacility ? 'Add New Facility' : 'Edit Facility'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Owner</label>
                                <select
                                    value={addingFacility ? addData.user_id : editData.user_id}
                                    onChange={(e) => addingFacility ? setAddData('user_id', e.target.value) : setEditData('user_id', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-[#D6FF3F] focus:ring-[#D6FF3F] rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">Select Owner</option>
                                    {owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                                    ))}
                                </select>
                                <InputError message={addingFacility ? addErrors.user_id : editErrors.user_id} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.name : editData.name}
                                    onChange={(e) => addingFacility ? setAddData('name', e.target.value) : setEditData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.name : editErrors.name} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Slug (Optional)</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.slug : editData.slug}
                                    onChange={(e) => addingFacility ? setAddData('slug', e.target.value) : setEditData('slug', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Leave blank to auto-generate if approved"
                                />
                                <InputError message={addingFacility ? addErrors.slug : editErrors.slug} className="mt-2" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.address : editData.address}
                                    onChange={(e) => addingFacility ? setAddData('address', e.target.value) : setEditData('address', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.address : editErrors.address} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.city : editData.city}
                                    onChange={(e) => addingFacility ? setAddData('city', e.target.value) : setEditData('city', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.city : editErrors.city} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Province</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.province : editData.province}
                                    onChange={(e) => addingFacility ? setAddData('province', e.target.value) : setEditData('province', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.province : editErrors.province} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.country : editData.country}
                                    onChange={(e) => addingFacility ? setAddData('country', e.target.value) : setEditData('country', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.country : editErrors.country} className="mt-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.contact_number : editData.contact_number}
                                    onChange={(e) => addingFacility ? setAddData('contact_number', e.target.value) : setEditData('contact_number', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.contact_number : editErrors.contact_number} className="mt-2" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select
                                    value={addingFacility ? addData.verification_status : editData.verification_status}
                                    onChange={(e) => addingFacility ? setAddData('verification_status', e.target.value) : setEditData('verification_status', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-[#D6FF3F] focus:ring-[#D6FF3F] rounded-md shadow-sm"
                                    required
                                >
                                    <option value="DRAFT">DRAFT</option>
                                    <option value="SUBMITTED">SUBMITTED</option>
                                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="REJECTED">REJECTED</option>
                                    <option value="SUSPENDED">SUSPENDED</option>
                                </select>
                                <InputError message={addingFacility ? addErrors.verification_status : editErrors.verification_status} className="mt-2" />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <SecondaryButton onClick={addingFacility ? closeAddModal : closeEditModal}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton 
                                className="!bg-[#10221C] !text-white hover:!bg-[#1A332B]"
                                disabled={addingFacility ? addProcessing : editProcessing}
                            >
                                Save Facility
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
