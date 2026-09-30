import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Dialog from '@/Components/Dialog';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState, useMemo } from 'react';
import {
    Building2,
    MapPin,
    Shield,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    Search,
    Edit3,
    ExternalLink,
    Users,
    FileText,
    XCircle,
    HelpCircle,
    Sparkles,
    ShieldCheck
} from 'lucide-react';

const STATUS_CONFIG = {
    APPROVED: {
        label: 'Approved',
        badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        dot: 'bg-amber-500 animate-pulse',
        icon: Clock,
    },
    SUBMITTED: {
        label: 'Submitted',
        badgeClass: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
        dot: 'bg-blue-500',
        icon: FileText,
    },
    REJECTED: {
        label: 'Rejected',
        badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    SUSPENDED: {
        label: 'Suspended',
        badgeClass: 'bg-neutral-500/15 text-neutral-700 border-neutral-500/30',
        dot: 'bg-neutral-500',
        icon: AlertTriangle,
    },
    DRAFT: {
        label: 'Draft',
        badgeClass: 'bg-stone-500/15 text-stone-700 border-stone-500/30',
        dot: 'bg-stone-400',
        icon: HelpCircle,
    },
};

export default function Facilities({ facilities = [], owners = [] }) {
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

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

    const hasAddChanges = useMemo(() => {
        return Boolean(
            addData.user_id ||
            addData.name?.trim() ||
            addData.address?.trim() ||
            addData.city?.trim() ||
            addData.province?.trim() ||
            addData.country?.trim() ||
            addData.contact_number?.trim()
        );
    }, [addData]);

    const hasEditChanges = useMemo(() => {
        if (!editingFacility) return false;
        return (
            String(editData.user_id || '') !== String(editingFacility.user_id || '') ||
            (editData.name || '').trim() !== (editingFacility.name || '').trim() ||
            (editData.slug || '').trim() !== (editingFacility.slug || '').trim() ||
            (editData.address || '').trim() !== (editingFacility.address || '').trim() ||
            (editData.city || '').trim() !== (editingFacility.city || '').trim() ||
            (editData.province || '').trim() !== (editingFacility.province || '').trim() ||
            (editData.country || '').trim() !== (editingFacility.country || '').trim() ||
            (editData.contact_number || '').trim() !== (editingFacility.contact_number || '').trim() ||
            editData.verification_status !== (editingFacility.verification_status || '')
        );
    }, [editData, editingFacility]);

    const handleCancelFacilityAttempt = async () => {
        const isDirty = addingFacility ? hasAddChanges : hasEditChanges;
        if (isDirty) {
            const confirmed = await confirm({
                title: 'Discard Changes?',
                message: 'You have unsaved changes in this facility form. Are you sure you want to discard them?',
                confirmText: 'Discard Changes',
                cancelText: 'Keep Editing',
                type: 'warning',
            });
            if (!confirmed) return;
        }
        if (addingFacility) closeAddModal();
        else closeEditModal();
    };

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('admin.facilities.store'), {
            onSuccess: () => {
                toast.success('Facility created successfully');
                closeAddModal();
            },
            onError: () => {
                toast.error('Failed to create facility. Please check the fields.');
            }
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        update(route('admin.facilities.update', editingFacility.id), {
            onSuccess: () => {
                toast.success('Facility updated successfully');
                closeEditModal();
            },
            onError: () => {
                toast.error('Failed to update facility. Please check the fields.');
            }
        });
    };

    // KPI Metrics calculation
    const stats = useMemo(() => {
        const total = facilities.length;
        const approved = facilities.filter(f => f.verification_status === 'APPROVED').length;
        const pending = facilities.filter(f => ['UNDER_REVIEW', 'SUBMITTED'].includes(f.verification_status)).length;
        const totalOwners = new Set(facilities.map(f => f.user_id).filter(Boolean)).size || owners.length;

        return { total, approved, pending, totalOwners };
    }, [facilities, owners]);

    // Filtered facilities
    const filteredFacilities = useMemo(() => {
        return facilities.filter(f => {
            const matchesQuery =
                !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.owner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.owner?.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' || f.verification_status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [facilities, searchQuery, statusFilter]);

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Facilities Management"
                    subtitle="Cross-platform oversight, facility details, ownership, and verification states"
                    actions={
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-colors hover:bg-[#162923] cursor-pointer"
                        >
                            <Plus size={14} strokeWidth={2.4} />
                            <span>Add Facility</span>
                        </button>
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Admin - Facilities" />

            <div className="w-full space-y-4 pb-2">
                {/* ── KPI Strip ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: Total Facilities */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Total Facilities
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#101F1A]/[0.05] text-[#101F1A] shadow-2xs">
                                <Building2 size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {stats.total}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <ShieldCheck size={12} className="text-[#101F1A]/40" />
                            <span>System-wide venues</span>
                        </div>
                    </div>

                    {/* Card 2: Approved / Live */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-emerald-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Approved & Verified
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 shadow-2xs border border-emerald-100">
                                <CheckCircle2 size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700">
                                {stats.approved}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-emerald-700">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Live on search directory</span>
                        </div>
                    </div>

                    {/* Card 3: Pending Queue */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-amber-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Verification Queue
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 shadow-2xs border border-amber-100">
                                <Clock size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-amber-800">
                                {stats.pending}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-amber-700">
                            <span>Pending staff or docs</span>
                        </div>
                    </div>

                    {/* Card 4: Venue Owners */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#D6FF3F]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Facility Owners
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/35 text-[#101F1A] shadow-2xs border border-[#D6FF3F]/60">
                                <Users size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {stats.totalOwners}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <Sparkles size={12} className="text-[#101F1A]/40" />
                            <span>Registered partners</span>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar & Filter Bar ─────────────────────────────────── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search facility name, owner, city, or email..."
                            className="w-full rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/40 pl-9 pr-8 py-1.5 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] text-xs font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Status Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        {[
                            { id: 'ALL', label: 'All', count: stats.total },
                            { id: 'APPROVED', label: 'Approved', count: stats.approved },
                            { id: 'UNDER_REVIEW', label: 'Under Review', count: stats.pending },
                            { id: 'DRAFT', label: 'Draft', count: facilities.filter(f => f.verification_status === 'DRAFT').length },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id)}
                                className={[
                                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer',
                                    statusFilter === filter.id
                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                        : 'bg-[#F5F2EA] text-[#101F1A]/70 hover:bg-[#E8E4D9] hover:text-[#101F1A]',
                                ].join(' ')}
                            >
                                <span>{filter.label}</span>
                                <span className={[
                                    'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                                    statusFilter === filter.id ? 'bg-[#D6FF3F] text-[#101F1A]' : 'bg-[#101F1A]/10 text-[#101F1A]',
                                ].join(' ')}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Elevated Table View ──────────────────────────────────── */}
                <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 shadow-card backdrop-blur-md overflow-hidden">
                    {facilities.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <Building2 size={32} className="mx-auto text-[#101F1A]/30 mb-3" />
                            <h3 className="text-base font-black text-[#101F1A]">No Facilities Registered</h3>
                            <p className="text-xs text-[#101F1A]/60 mt-1 max-w-sm mx-auto">
                                No sports facilities have been created on the platform yet.
                            </p>
                            <button
                                onClick={openAddModal}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#101F1A] px-4 py-2 text-xs font-bold text-[#D6FF3F] hover:bg-[#162923] transition-all cursor-pointer"
                            >
                                <Plus size={14} /> Add Facility
                            </button>
                        </div>
                    ) : filteredFacilities.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <Building2 size={24} className="mx-auto text-[#101F1A]/30 mb-2" />
                            <h4 className="text-sm font-bold text-[#101F1A]">No matching facilities</h4>
                            <p className="text-xs text-[#101F1A]/60 mt-0.5">Try clearing your filters or search keywords.</p>
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                                className="mt-3 text-xs font-bold text-[#101F1A] underline underline-offset-4 cursor-pointer"
                            >
                                Reset search
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#101F1A]/5 text-left text-xs">
                                <thead className="bg-[#F5F2EA]/70 text-[#101F1A]/70 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th scope="col" className="px-5 py-3.5">Facility</th>
                                        <th scope="col" className="px-5 py-3.5">Owner</th>
                                        <th scope="col" className="px-5 py-3.5">Location</th>
                                        <th scope="col" className="px-5 py-3.5">Status</th>
                                        <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#101F1A]/5 font-medium">
                                    {filteredFacilities.map((f) => {
                                        const config = STATUS_CONFIG[f.verification_status] || STATUS_CONFIG.DRAFT;
                                        return (
                                            <tr key={f.id} className="hover:bg-[#F5F2EA]/40 transition-colors">
                                                {/* Facility Column */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-[#101F1A]/5 flex items-center justify-center text-[#101F1A] font-black text-xs shrink-0">
                                                            <Building2 size={15} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-[#101F1A]">{f.name}</div>
                                                            <div className="text-[11px] text-[#101F1A]/50">
                                                                {f.slug ? `/f/${f.slug}` : 'No slug assigned'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Owner Column */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="text-xs font-bold text-[#101F1A]">{f.owner?.name || 'Unassigned'}</div>
                                                    <div className="text-[11px] text-[#101F1A]/60">{f.owner?.email || 'N/A'}</div>
                                                </td>

                                                {/* Location Column */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#101F1A]">
                                                        <MapPin size={12} className="text-[#101F1A]/40 shrink-0" />
                                                        <span>{f.city}, {f.province}</span>
                                                    </div>
                                                    <div className="text-[11px] text-[#101F1A]/50 truncate max-w-xs">{f.address}</div>
                                                </td>

                                                {/* Status Column */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${config.badgeClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                        <span>{config.label}</span>
                                                    </span>
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-5 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {f.verification_status === 'APPROVED' && f.slug && (
                                                            <a
                                                                href={route('facility.show', f.slug)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#101F1A] bg-[#101F1A]/5 hover:bg-[#101F1A]/10 rounded-lg transition-colors"
                                                            >
                                                                <ExternalLink size={12} />
                                                                <span>View</span>
                                                            </a>
                                                        )}
                                                        <button 
                                                            onClick={() => openEditModal(f)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            <Edit3 size={12} />
                                                            <span>Edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Form Dialog Content (Add & Edit) ─────────────────────────── */}
            {(addingFacility || editingFacility) && (
                <Dialog 
                    isOpen={true} 
                    onClose={handleCancelFacilityAttempt} 
                    closeOnClickOutside={false}
                    size="2xl"
                >
                    <form onSubmit={addingFacility ? submitAdd : submitEdit} className="p-4 sm:p-5">
                        <div className="pb-2.5 mb-3 border-b border-[#101F1A]/10">
                            <h2 className="text-base font-black text-[#101F1A]">
                                {addingFacility ? 'Add New Facility' : `Edit Facility: ${editingFacility?.name}`}
                            </h2>
                            <p className="text-[11px] text-[#101F1A]/60 mt-0.5">
                                {addingFacility ? 'Register a venue and assign it to an owner.' : 'Update venue information and verification status.'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                                <InputLabel value="Facility Owner *" />
                                <select
                                    value={addingFacility ? addData.user_id : editData.user_id}
                                    onChange={(e) => addingFacility ? setAddData('user_id', e.target.value) : setEditData('user_id', e.target.value)}
                                    className="mt-1 block h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white py-2 px-3.5 text-xs font-medium text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] shadow-2xs transition-all cursor-pointer"
                                    required
                                >
                                    <option value="">Select an Owner</option>
                                    {owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                                    ))}
                                </select>
                                <InputError message={addingFacility ? addErrors.user_id : editErrors.user_id} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Facility Name *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.name : editData.name}
                                    onChange={(e) => addingFacility ? setAddData('name', e.target.value) : setEditData('name', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. Metro Sports Arena"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.name : editErrors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="URL Slug (Optional)" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.slug : editData.slug}
                                    onChange={(e) => addingFacility ? setAddData('slug', e.target.value) : setEditData('slug', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. metro-sports-arena"
                                />
                                <InputError message={addingFacility ? addErrors.slug : editErrors.slug} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel value="Street Address *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.address : editData.address}
                                    onChange={(e) => addingFacility ? setAddData('address', e.target.value) : setEditData('address', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. 100 Main Boulevard"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.address : editErrors.address} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="City *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.city : editData.city}
                                    onChange={(e) => addingFacility ? setAddData('city', e.target.value) : setEditData('city', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. Cebu City"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.city : editErrors.city} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Province / State *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.province : editData.province}
                                    onChange={(e) => addingFacility ? setAddData('province', e.target.value) : setEditData('province', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. Cebu"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.province : editErrors.province} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Country *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.country : editData.country}
                                    onChange={(e) => addingFacility ? setAddData('country', e.target.value) : setEditData('country', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. Philippines"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.country : editErrors.country} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value="Contact Phone *" />
                                <TextInput
                                    type="text"
                                    value={addingFacility ? addData.contact_number : editData.contact_number}
                                    onChange={(e) => addingFacility ? setAddData('contact_number', e.target.value) : setEditData('contact_number', e.target.value)}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. +63 912 345 6789"
                                    required
                                />
                                <InputError message={addingFacility ? addErrors.contact_number : editErrors.contact_number} className="mt-1" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <InputLabel value="Verification Status *" />
                                <select
                                    value={addingFacility ? addData.verification_status : editData.verification_status}
                                    onChange={(e) => addingFacility ? setAddData('verification_status', e.target.value) : setEditData('verification_status', e.target.value)}
                                    className="mt-1 block h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white py-2 px-3.5 text-xs font-bold text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] shadow-2xs transition-all cursor-pointer"
                                    required
                                >
                                    <option value="DRAFT">DRAFT — Pending initial documents</option>
                                    <option value="SUBMITTED">SUBMITTED — Waiting admin review</option>
                                    <option value="UNDER_REVIEW">UNDER REVIEW — In active audit</option>
                                    <option value="APPROVED">APPROVED — Active and public</option>
                                    <option value="REJECTED">REJECTED — Needs revisions</option>
                                    <option value="SUSPENDED">SUSPENDED — Blocked from booking</option>
                                </select>
                                <InputError message={addingFacility ? addErrors.verification_status : editErrors.verification_status} className="mt-0.5" />
                            </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#101F1A]/10 flex justify-end gap-2">
                            <SecondaryButton onClick={handleCancelFacilityAttempt} className="text-xs font-bold !py-1.5 !px-3.5">
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton 
                                type="submit"
                                className="!bg-[#101F1A] !text-[#D6FF3F] hover:!bg-[#162923] text-xs font-bold !py-1.5 !px-4 disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
                                disabled={
                                    (addingFacility ? addProcessing : editProcessing) ||
                                    (addingFacility
                                        ? (!hasAddChanges || !addData.name?.trim() || !addData.user_id)
                                        : (!hasEditChanges || !editData.name?.trim() || !editData.user_id))
                                }
                            >
                                {addingFacility ? 'Create Facility' : 'Save Changes'}
                            </PrimaryButton>
                        </div>
                    </form>
                </Dialog>
            )}
        </AuthenticatedLayout>
    );
}
