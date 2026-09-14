import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useState } from 'react';

export default function Staff({ users, facilities }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        facility_id: '',
    });
    
    const flash = usePage().props.flash || {};

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.staff.store'), {
            onSuccess: () => reset(),
        });
    };

    // Edit User State
    const [editingUser, setEditingUser] = useState(null);
    const { data: editData, setData: setEditData, put: update, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        name: '',
        role: '',
        status: ''
    });

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditData({
            name: user.name,
            role: user.role || 'USER',
            status: user.status || 'PENDING_VERIFICATION'
        });
    };

    const closeEditModal = () => {
        setEditingUser(null);
        resetEdit();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        update(route('admin.users.update', editingUser.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    // Delete User State
    const [deletingUser, setDeletingUser] = useState(null);
    const { delete: destroy, processing: deleteProcessing } = useForm();

    const openDeleteModal = (user) => {
        setDeletingUser(user);
    };

    const closeDeleteModal = () => {
        setDeletingUser(null);
    };

    const submitDelete = (e) => {
        e.preventDefault();
        destroy(route('admin.users.destroy', deletingUser.id), {
            onSuccess: () => closeDeleteModal(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Facility Staff</h2>}
        >
            <Head title="Admin - Staff" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {/* Add User Card */}
                <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-[#10221C] mb-2">Invite Facility Staff</h3>
                    <p className="text-sm text-gray-500 mb-6">Invite a new staff member and assign them to a specific facility.</p>
                    
                    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 max-w-xs">
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="block w-full"
                                placeholder="Staff Name"
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div className="flex-1 max-w-xs">
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full"
                                placeholder="staff@example.com"
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>
                        <div className="flex-1 max-w-xs">
                            <select
                                id="facility_id"
                                name="facility_id"
                                value={data.facility_id}
                                onChange={(e) => setData('facility_id', e.target.value)}
                                className="block w-full border-gray-300 focus:border-[#D6FF3F] focus:ring-[#D6FF3F] rounded-md shadow-sm h-[42px]"
                            >
                                <option value="" disabled>Select Facility</option>
                                {facilities.map(facility => (
                                    <option key={facility.id} value={facility.id}>{facility.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.facility_id} className="mt-2" />
                        </div>
                        <PrimaryButton
                            className="!bg-[#10221C] !text-white hover:!bg-[#1A332B] h-[42px]"
                            disabled={processing}
                        >
                            Invite Staff
                        </PrimaryButton>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Facility</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{user.work_facility?.name || 'Unassigned'}</div>
                                            <div className="text-xs text-gray-500">{user.work_facility?.owner?.name ? `Owner: ${user.work_facility.owner.name}` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${
                                                user.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                user.status === 'BANNED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openEditModal(user)} className="text-[#10221C] hover:text-[#1a382d] mr-4">Edit</button>
                                            <button onClick={() => openDeleteModal(user)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit User Modal */}
            <Modal show={editingUser !== null} onClose={closeEditModal}>
                <form onSubmit={submitEdit} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Edit User: {editingUser?.email}
                    </h2>
                    
                    <div className="mt-6">
                        <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">Name</label>
                        <TextInput
                            id="edit_name"
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData('name', e.target.value)}
                            className="mt-1 block w-full"
                        />
                        <InputError message={editErrors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <label htmlFor="edit_role" className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            id="edit_role"
                            value={editData.role}
                            onChange={(e) => setEditData('role', e.target.value)}
                            className="mt-1 block w-full border-gray-300 focus:border-[#D6FF3F] focus:ring-[#D6FF3F] rounded-md shadow-sm"
                        >
                            <option value="USER">USER</option>
                            <option value="FACILITY_OWNER">FACILITY OWNER</option>
                            <option value="FACILITY_STAFF">FACILITY STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                        <InputError message={editErrors.role} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="edit_status"
                            value={editData.status}
                            onChange={(e) => setEditData('status', e.target.value)}
                            className="mt-1 block w-full border-gray-300 focus:border-[#D6FF3F] focus:ring-[#D6FF3F] rounded-md shadow-sm"
                        >
                            <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                            <option value="VERIFIED">VERIFIED</option>
                            <option value="BANNED">BANNED</option>
                        </select>
                        <InputError message={editErrors.status} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeEditModal}>Cancel</SecondaryButton>
                        <PrimaryButton className="ms-3" disabled={editProcessing}>
                            Save Changes
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete User Modal */}
            <Modal show={deletingUser !== null} onClose={closeDeleteModal}>
                <form onSubmit={submitDelete} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        Are you sure you want to delete {deletingUser?.name}?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Once this user is deleted, all of their resources and data will be permanently deleted.
                    </p>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeDeleteModal}>Cancel</SecondaryButton>
                        <DangerButton className="ms-3" disabled={deleteProcessing}>
                            Delete User
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
