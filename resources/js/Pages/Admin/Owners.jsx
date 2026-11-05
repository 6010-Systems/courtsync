import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState } from 'react';

export default function Owners({ users }) {
    const { confirm } = useConfirm();
    const toast = useToast();
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
    });
    
    // Quick way to read flash messages if there's any setup in HandleInertiaRequests
    const flash = usePage().props.flash || {};

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.owners.store'), {
            onSuccess: () => {
                toast.success('Owner invited successfully');
                reset();
            },
            onError: () => {
                toast.error('Failed to invite owner. Please check details.');
            }
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
            onSuccess: () => {
                toast.success('Owner profile updated successfully');
                closeEditModal();
            },
            onError: () => {
                toast.error('Failed to update owner profile.');
            }
        });
    };

    const handleDeleteUser = async (user) => {
        const confirmed = await confirm({
            title: `Delete Owner: ${user.name}?`,
            message: `Are you sure you want to delete ${user.name}? All facilities, courts, and bookings owned by this user will be removed.`,
            confirmText: 'Delete Owner',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (!confirmed) return;

        router.delete(route('admin.users.destroy', user.id), {
            onSuccess: () => {
                toast.success(`Owner ${user.name} deleted successfully`);
            },
            onError: () => {
                toast.error('Failed to delete owner.');
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Facility Owners"
                    subtitle="Registered facility owners, verification statuses, and credentials"
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Admin - Owners" />

            <div className="flex flex-col gap-6 w-full">
                {/* Add User Card */}
                <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-[#10221C] mb-2">Invite Facility Owner</h3>
                    <p className="text-sm text-gray-500 mb-6">Invite a new facility owner by providing their email address.</p>
                    
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
                                                {u.facilities && u.facilities.length > 0 && (
                                                    <div 
                                                        className="text-xs text-gray-400 mt-0.5 truncate" 
                                                        title={`${u.facilities[0].name} - ${u.facilities[0].address}, ${u.facilities[0].city}`}
                                                    >
                                                        📍 {u.facilities[0].name} - {u.facilities[0].city}, {u.facilities[0].province} {u.facilities.length > 1 ? `(+${u.facilities.length - 1} more)` : ''}
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
                                        <button onClick={() => openEditModal(u)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</button>
                                        <button onClick={() => handleDeleteUser(u)} className="text-red-600 hover:text-red-900 cursor-pointer">Delete</button>
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
        </AuthenticatedLayout>
    );
}
