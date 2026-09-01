import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { useState } from 'react';

export default function Users({ users }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
    });
    
    // Quick way to read flash messages if there's any setup in HandleInertiaRequests
    const flash = usePage().props.flash || {};

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.users.store'), {
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
            header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">User Management</h2>}
        >
            <Head title="Admin - Users" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {/* Add User Card */}
                <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-[#10221C] mb-2">Add Facility Owner</h3>
                    <p className="text-sm text-gray-500 mb-6">Invite a new facility owner by providing their email address. They will be automatically verified and can log in via Google.</p>
                    
                    <form onSubmit={submit} className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="flex-1 max-w-xs">
                            <TextInput
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className="block w-full"
                                placeholder="Owner Name"
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
                                placeholder="owner@example.com"
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>
                        <PrimaryButton
                            className="!bg-[#10221C] !text-white hover:!bg-[#1A332B] h-[42px]"
                            disabled={processing}
                        >
                            Invite Owner
                        </PrimaryButton>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {u.avatar ? (
                                                <img className="h-10 w-10 rounded-full border border-gray-200" src={u.avatar} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-[#D6FF3F] text-[#10221C] flex items-center justify-center font-bold text-sm">
                                                    {u.name.charAt(0)}
                                                </div>
                                            )}
                                            <div className="ml-4 max-w-[300px]">
                                                <div className="text-sm font-semibold text-gray-900 truncate">{u.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{u.email}</div>
                                                {u.facility && (
                                                    <div 
                                                        className="text-xs text-gray-400 mt-0.5 truncate" 
                                                        title={`${u.facility.name} - ${u.facility.address}, ${u.facility.city}`}
                                                    >
                                                        📍 {u.facility.name} - {u.facility.city}, {u.facility.province}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                            {u.role ? u.role.replace('_', ' ') : 'USER'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border ${
                                            u.status === 'VERIFIED' 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {u.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEditModal(u)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => openDeleteModal(u)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
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
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
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
