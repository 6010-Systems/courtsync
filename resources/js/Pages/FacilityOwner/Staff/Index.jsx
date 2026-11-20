import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import MetricCard, { formatCount } from '@/Components/MetricCard';
import { Head, Link, useForm, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import Modal from '@/Components/Modal';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState, useMemo } from 'react';
import {
    Building2,
    Calendar,
    ChevronDown,
    Loader2,
    Mail,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    Users,
    X,
} from 'lucide-react';

function getInitials(name) {
    return String(name || '?')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function Staff({ auth }) {
    const user = auth.user;
    const { confirm } = useConfirm();
    const toast = useToast();

    // Get all approved facilities
    const approvedFacilities = useMemo(
        () => user.facilities?.filter((f) => f.verification_status === 'APPROVED') || [],
        [user.facilities]
    );

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFacilityId, setSelectedFacilityId] = useState('ALL');
    const [reassigningId, setReassigningId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Flatten all staff across all facilities with facility name
    const allStaff = useMemo(() => {
        return (user.facilities || []).flatMap((facility) =>
            (facility.staff || []).map((staff) => ({
                ...staff,
                facility_name: facility.name,
            }))
        );
    }, [user.facilities]);

    // Metric summary counts
    const totalStaffCount = allStaff.length;
    const assignedFacilitiesCount = useMemo(() => {
        const facilitySet = new Set(allStaff.map((s) => s.facility_id).filter(Boolean));
        return facilitySet.size;
    }, [allStaff]);
    const staffWithPermissionsCount = useMemo(() => {
        return allStaff.filter((s) => Array.isArray(s.permissions) && s.permissions.length > 0).length;
    }, [allStaff]);

    // Filtered staff list
    const filteredStaff = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return allStaff.filter((staff) => {
            const matchesSearch =
                !query ||
                staff.name.toLowerCase().includes(query) ||
                staff.email.toLowerCase().includes(query) ||
                (staff.facility_name && staff.facility_name.toLowerCase().includes(query));

            const matchesFacility =
                selectedFacilityId === 'ALL' ||
                String(staff.facility_id) === String(selectedFacilityId);

            return matchesSearch && matchesFacility;
        });
    }, [allStaff, searchQuery, selectedFacilityId]);

    // Form setup for inviting staff
    const {
        data: staffData,
        setData: setStaffData,
        post: postStaff,
        processing: staffProcessing,
        errors: staffErrors,
        reset: resetStaff,
        clearErrors: clearStaffErrors,
    } = useForm({
        name: '',
        email: '',
        facility_id: approvedFacilities[0]?.id || '',
    });

    const openInviteModal = () => {
        clearStaffErrors();
        resetStaff();
        setStaffData('facility_id', approvedFacilities[0]?.id || '');
        setShowInviteModal(true);
    };

    const closeInviteModal = () => {
        if (staffProcessing) return;
        setShowInviteModal(false);
        resetStaff();
        clearStaffErrors();
    };

    const submitStaff = (e) => {
        e.preventDefault();
        postStaff(route('facility.staff.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Staff member invited successfully.');
                closeInviteModal();
            },
            onError: () => {
                toast.error('Failed to invite staff member. Please check form inputs.');
            },
        });
    };

    const handleDelete = async (staff) => {
        const confirmed = await confirm({
            title: `Remove ${staff.name}?`,
            message: `Are you sure you want to permanently remove ${staff.name} from facility staff? They will lose access to all facility tools immediately.`,
            confirmText: 'Remove Staff',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (!confirmed) return;

        setDeletingId(staff.id);

        router.delete(route('facility.staff.destroy', staff.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${staff.name} has been removed from staff.`);
                setDeletingId(null);
            },
            onError: () => {
                toast.error('Failed to remove staff member.');
                setDeletingId(null);
            },
        });
    };

    const handleReassign = (staff, facilityId) => {
        if (String(staff.facility_id) === String(facilityId)) return;

        setReassigningId(staff.id);

        router.put(
            route('facility.staff.facility.update', staff.id),
            { facility_id: facilityId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Staff facility assignment updated.`);
                    setReassigningId(null);
                },
                onError: () => {
                    toast.error('Failed to update facility assignment.');
                    setReassigningId(null);
                },
            }
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedFacilityId('ALL');
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Staff & Team"
                    subtitle="Manage facility staff accounts, facility assignments, and granular permissions"
                    actions={
                        approvedFacilities.length > 0 ? (
                            <button
                                type="button"
                                onClick={openInviteModal}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                            >
                                <Plus size={15} className="text-[#D6FF3F]" />
                                <span>Invite Staff Member</span>
                            </button>
                        ) : null
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Staff & Team Management" />

            <div className="w-full space-y-5 pb-6">
                {/* ── Summary Metrics ── */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                    <MetricCard
                        label="Total Staff"
                        value={formatCount(totalStaffCount)}
                        hint="Active team members"
                        icon={Users}
                        accent="lime"
                    />
                    <MetricCard
                        label="Assigned Facilities"
                        value={formatCount(assignedFacilitiesCount)}
                        hint="Facilities with dedicated staff"
                        icon={Building2}
                        accent="lime"
                    />
                    <MetricCard
                        label="Access Configured"
                        value={formatCount(staffWithPermissionsCount)}
                        hint="Staff with granted module permissions"
                        icon={ShieldCheck}
                        accent="lime"
                    />
                </div>

                {/* ── Filter & Search Toolbar ── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                            <Search
                                size={15}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40"
                                aria-hidden="true"
                            />
                            <TextInput
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search staff name, email, or facility..."
                                className="w-full pl-9 pr-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Facility Selector Filter */}
                        {approvedFacilities.length > 1 && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedFacilityId}
                                    onChange={(e) => setSelectedFacilityId(e.target.value)}
                                    className="h-10 rounded-xl border-[#101F1A]/15 bg-white pl-3 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all cursor-pointer"
                                    aria-label="Filter staff by facility"
                                >
                                    <option value="ALL">All Facilities</option>
                                    {approvedFacilities.map((facility) => (
                                        <option key={facility.id} value={facility.id}>
                                            {facility.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Table & Content Area ── */}
                {totalStaffCount === 0 ? (
                    /* Zero Staff Empty State */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A]">
                            <Users size={28} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No staff members yet</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            Invite facility managers, receptionists, or front-desk staff to help operate your courts and reservations.
                        </p>
                        {approvedFacilities.length > 0 && (
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={openInviteModal}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                                >
                                    <Plus size={15} className="text-[#D6FF3F]" />
                                    <span>Invite First Staff Member</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : filteredStaff.length === 0 ? (
                    /* Filter Mismatch Empty State */
                    <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F2EA] text-[#101F1A]/40">
                            <Search size={26} strokeWidth={2} />
                        </div>
                        <h3 className="mt-4 text-base font-black text-[#101F1A]">No matching staff members</h3>
                        <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                            No team members matched your search "{searchQuery}".
                        </p>
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-colors"
                            >
                                <X size={14} />
                                <span>Clear search</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Staff Directory Table & Cards */
                    <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/60 text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/70">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Staff Member</th>
                                        <th scope="col" className="px-6 py-4">Assigned Facility</th>
                                        <th scope="col" className="px-6 py-4">Access & Permissions</th>
                                        <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5">
                                    {filteredStaff.map((staff) => {
                                        const isReassigning = reassigningId === staff.id;
                                        const isDeleting = deletingId === staff.id;
                                        const permissionsCount = staff.permissions?.length ?? 0;

                                        return (
                                            <tr
                                                key={`desktop-${staff.id}`}
                                                className="hover:bg-[#F5F2EA]/30 transition-colors"
                                            >
                                                {/* Staff Info */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101F1A] text-[11px] font-bold text-[#D6FF3F] shadow-2xs">
                                                            {getInitials(staff.name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-[#101F1A]">{staff.name}</div>
                                                            <div className="text-xs text-[#101F1A]/60">{staff.email}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Facility Assignment */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {approvedFacilities.length > 1 ? (
                                                        <div className="relative inline-flex items-center">
                                                            <select
                                                                value={staff.facility_id}
                                                                disabled={isReassigning}
                                                                onChange={(e) => handleReassign(staff, e.target.value)}
                                                                className="rounded-lg border border-[#101F1A]/10 bg-[#101F1A]/5 py-1 pl-2.5 pr-7 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer disabled:opacity-50"
                                                            >
                                                                {approvedFacilities.map((f) => (
                                                                    <option key={f.id} value={f.id}>
                                                                        {f.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {isReassigning && (
                                                                <Loader2 size={13} className="ml-2 animate-spin text-[#101F1A]/60" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/10 bg-[#101F1A]/5 px-2.5 py-1 text-xs font-bold text-[#101F1A]">
                                                            <Building2 size={12} className="text-[#101F1A]/50" />
                                                            <span>{staff.facility_name}</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Permissions */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={route('facility.staff.permissions.edit', staff.id)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-all"
                                                    >
                                                        <ShieldCheck size={13} className="text-[#101F1A]/70" />
                                                        <span>
                                                            {permissionsCount > 0
                                                                ? `Permissions (${permissionsCount})`
                                                                : 'Grant Access (None)'}
                                                        </span>
                                                    </Link>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        type="button"
                                                        disabled={isDeleting}
                                                        onClick={() => handleDelete(staff)}
                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 transition-all disabled:opacity-50"
                                                    >
                                                        {isDeleting ? (
                                                            <>
                                                                <Loader2 size={13} className="animate-spin" />
                                                                <span>Removing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 size={13} />
                                                                <span>Remove Staff</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-[#101F1A]/5">
                            {filteredStaff.map((staff) => {
                                const isReassigning = reassigningId === staff.id;
                                const isDeleting = deletingId === staff.id;
                                const permissionsCount = staff.permissions?.length ?? 0;

                                return (
                                    <div key={`mobile-${staff.id}`} className="p-4 bg-white space-y-3.5">
                                        {/* Header Row: Initials, Name & Permissions */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101F1A] text-xs font-bold text-[#D6FF3F] shadow-2xs shrink-0">
                                                    {getInitials(staff.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[#101F1A] text-sm truncate">
                                                        {staff.name}
                                                    </div>
                                                    <div className="text-xs text-[#101F1A]/60 truncate">
                                                        {staff.email}
                                                    </div>
                                                </div>
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold shrink-0 ${
                                                    permissionsCount > 0
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}
                                            >
                                                {permissionsCount > 0 ? `${permissionsCount} Perms` : 'No Access'}
                                            </span>
                                        </div>

                                        {/* Facility Assignment Container */}
                                        <div className="rounded-xl border border-[#101F1A]/5 bg-[#F5F2EA]/40 p-2.5 text-xs flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50">
                                                Facility
                                            </span>
                                            {approvedFacilities.length > 1 ? (
                                                <select
                                                    value={staff.facility_id}
                                                    disabled={isReassigning}
                                                    onChange={(e) => handleReassign(staff, e.target.value)}
                                                    className="rounded-lg border border-[#101F1A]/10 bg-white py-1 pl-2.5 pr-7 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]"
                                                >
                                                    {approvedFacilities.map((f) => (
                                                        <option key={f.id} value={f.id}>
                                                            {f.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="font-bold text-[#101F1A] truncate">
                                                    {staff.facility_name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Buttons Row */}
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Link
                                                href={route('facility.staff.permissions.edit', staff.id)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#101F1A]/15 bg-white py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] min-h-[44px]"
                                            >
                                                <ShieldCheck size={14} className="text-[#101F1A]/70" />
                                                <span>Permissions</span>
                                            </Link>
                                            <button
                                                type="button"
                                                disabled={isDeleting}
                                                onClick={() => handleDelete(staff)}
                                                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100/70 min-h-[44px] disabled:opacity-50"
                                            >
                                                {isDeleting ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Invite Staff Modal ── */}
            <Modal show={showInviteModal} onClose={closeInviteModal} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#101F1A]/10">
                        <div>
                            <h3 className="text-base font-black text-[#101F1A]">Invite New Staff Member</h3>
                            <p className="text-xs text-[#101F1A]/60 mt-0.5">
                                Add a team member to manage your facility courts and bookings.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeInviteModal}
                            className="rounded-lg p-1 text-[#101F1A]/40 hover:text-[#101F1A] hover:bg-[#F5F2EA] transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={submitStaff} className="mt-5 space-y-4">
                        {/* Facility Select */}
                        <div>
                            <InputLabel htmlFor="invite_facility" value="Assigned Facility" className="text-xs font-bold text-[#101F1A]" />
                            <select
                                id="invite_facility"
                                value={staffData.facility_id}
                                onChange={(e) => setStaffData('facility_id', e.target.value)}
                                className="mt-1.5 block w-full rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]"
                            >
                                <option value="" disabled>Select Facility</option>
                                {approvedFacilities.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={staffErrors.facility_id} className="mt-1 text-xs" />
                        </div>

                        {/* Staff Name */}
                        <div>
                            <InputLabel htmlFor="invite_name" value="Full Name" className="text-xs font-bold text-[#101F1A]" />
                            <TextInput
                                id="invite_name"
                                type="text"
                                value={staffData.name}
                                onChange={(e) => setStaffData('name', e.target.value)}
                                placeholder="e.g. Maria Santos"
                                className="mt-1.5 block w-full"
                            />
                            <InputError message={staffErrors.name} className="mt-1 text-xs" />
                        </div>

                        {/* Staff Email */}
                        <div>
                            <InputLabel htmlFor="invite_email" value="Email Address" className="text-xs font-bold text-[#101F1A]" />
                            <TextInput
                                id="invite_email"
                                type="email"
                                value={staffData.email}
                                onChange={(e) => setStaffData('email', e.target.value)}
                                placeholder="e.g. staff@example.com"
                                className="mt-1.5 block w-full"
                            />
                            <InputError message={staffErrors.email} className="mt-1 text-xs" />
                        </div>

                        <p className="text-[11px] text-[#101F1A]/50 bg-[#F5F2EA]/60 p-2.5 rounded-lg border border-[#101F1A]/5">
                            Note: New staff members are created with default zero access. Once invited, you can configure granular permissions from the Access column.
                        </p>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#101F1A]/10">
                            <button
                                type="button"
                                onClick={closeInviteModal}
                                disabled={staffProcessing}
                                className="rounded-xl border border-[#101F1A]/15 bg-white px-4 py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs hover:bg-[#F5F2EA] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={staffProcessing}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors disabled:opacity-50"
                            >
                                {staffProcessing ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Sending Invite...</span>
                                    </>
                                ) : (
                                    <span>Send Invite</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
