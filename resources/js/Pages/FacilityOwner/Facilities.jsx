import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm, Link, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState, useEffect, useMemo } from 'react';
import {
    Building2,
    MapPin,
    Phone,
    Layers,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Plus,
    Search,
    Sparkles,
    ExternalLink,
    Edit3,
    Trash2,
    Filter,
    ShieldCheck,
    FileText,
    Camera,
    ChevronRight,
    XCircle,
    HelpCircle
} from 'lucide-react';

const STATUS_BADGES = {
    APPROVED: {
        label: 'Approved & Live',
        bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        bg: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
        dot: 'bg-amber-500 animate-pulse',
        icon: Clock,
    },
    SUBMITTED: {
        label: 'Submitted',
        bg: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
        dot: 'bg-blue-500',
        icon: FileText,
    },
    REJECTED: {
        label: 'Changes Required',
        bg: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    SUSPENDED: {
        label: 'Suspended',
        bg: 'bg-neutral-500/15 text-neutral-700 border-neutral-500/30',
        dot: 'bg-neutral-500',
        icon: AlertTriangle,
    },
    DRAFT: {
        label: 'Draft Setup',
        bg: 'bg-stone-500/15 text-stone-700 border-stone-500/30',
        dot: 'bg-stone-400',
        icon: HelpCircle,
    },
};

export default function Facilities({ auth, facilities = [] }) {
    const user = auth.user;
    const { confirm } = useConfirm();
    const toast = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [createdFacilityId, setCreatedFacilityId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Form for Step 1: Facility Details
    const { data: facilityData, setData: setFacilityData, post: postFacility, processing: facilityProcessing, errors: facilityErrors, reset: resetFacility } = useForm({
        facility_id: '',
        name: '',
        slug: '',
        address: '',
        city: '',
        province: '',
        country: '',
        contact_number: '',
        description: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editingFacilityId, setEditingFacilityId] = useState(null);
    const [editingFacilityStatus, setEditingFacilityStatus] = useState('');

    const submitFacility = (e) => {
        e.preventDefault();
        
        postFacility(route('facility.store'), {
            onSuccess: (page) => {
                toast.success(isEditing ? 'Facility details updated' : 'Facility registered. Please submit verification documents.');
                if (isEditing) {
                    setActiveStep(2);
                } else {
                    const newFacilities = page.props.facilities;
                    const latestFacility = newFacilities?.[newFacilities.length - 1];
                    if (latestFacility) {
                        setCreatedFacilityId(latestFacility.id);
                    }
                    setActiveStep(2);
                }
            },
            onError: () => {
                toast.error('Please check the form for errors');
            }
        });
    };

    const openEditFacility = (facility) => {
        setIsEditing(true);
        setIsAdding(true);
        setActiveStep(1);
        setEditingFacilityId(facility.id);
        setCreatedFacilityId(facility.id);
        setEditingFacilityStatus(facility.verification_status);
        
        setFacilityData({
            facility_id: facility.id,
            name: facility.name,
            slug: facility.slug || '',
            address: facility.address,
            city: facility.city,
            province: facility.province,
            country: facility.country,
            contact_number: facility.contact_number,
            description: facility.description || '',
        });

        if (facility.verification) {
            setVerificationData({
                facility_id: facility.id,
                government_id_type: facility.verification.government_id_type || 'PASSPORT',
                government_id_number: facility.verification.government_id_number || '',
                government_id_image_path: facility.verification.government_id_image_path || '',
                business_permit_path: facility.verification.business_permit_path || '',
                business_registration_path: facility.verification.business_registration_path || '',
                proof_of_ownership_path: facility.verification.proof_of_ownership_path || '',
                facility_photos: facility.verification.facility_photos || [''],
            });
        } else {
            resetVerification();
        }
    };

    const deleteFacility = async (id, name) => {
        const confirmed = await confirm({
            title: `Delete ${name || 'Facility'}?`,
            message: 'This will permanently delete the facility, its courts, staff memberships, and submitted verification data. This action cannot be undone.',
            confirmText: 'Delete Facility',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (!confirmed) return;

        router.delete(route('facility.destroy', id), {
            onSuccess: () => {
                toast.success('Facility deleted successfully');
                setIsAdding(false);
                setIsEditing(false);
            },
            onError: () => {
                toast.error('Failed to delete facility. Please try again.');
            }
        });
    };

    // Form for Step 2: Verification Documents
    const { data: verificationData, setData: setVerificationData, post: postVerification, processing: verificationProcessing, errors: verificationErrors, reset: resetVerification, transform: transformVerification } = useForm({
        facility_id: '',
        government_id_type: 'PASSPORT',
        government_id_number: '',
        government_id_image_path: '',
        business_permit_path: '',
        business_registration_path: '',
        proof_of_ownership_path: '',
        facility_photos: [''],
    });

    useEffect(() => {
        transformVerification((data) => ({
            ...data,
            facility_id: createdFacilityId,
        }));
    }, [createdFacilityId, transformVerification]);

    const handlePhotoChange = (index, value) => {
        const newPhotos = [...verificationData.facility_photos];
        newPhotos[index] = value;
        setVerificationData('facility_photos', newPhotos);
    };

    const addPhotoField = () => {
        setVerificationData('facility_photos', [...verificationData.facility_photos, '']);
    };

    const removePhotoField = (index) => {
        const newPhotos = verificationData.facility_photos.filter((_, i) => i !== index);
        setVerificationData('facility_photos', newPhotos.length ? newPhotos : ['']);
    };

    const submitVerification = (e) => {
        e.preventDefault();
        
        postVerification(route('facility.verification.store'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Verification documents submitted for review');
                setIsAdding(false);
                setIsEditing(false);
                setActiveStep(1);
                resetFacility();
                resetVerification();
                setCreatedFacilityId(null);
            },
            onError: () => {
                toast.error('Failed to submit verification documents. Please check required fields.');
            }
        });
    };

    // Computed KPI Metrics
    const stats = useMemo(() => {
        const total = facilities.length;
        const approved = facilities.filter(f => f.verification_status === 'APPROVED').length;
        const pending = facilities.filter(f => ['UNDER_REVIEW', 'SUBMITTED', 'DRAFT'].includes(f.verification_status)).length;
        const totalCourts = facilities.reduce((sum, f) => sum + (f.courts_count || (f.courts?.length || 0)), 0);

        return { total, approved, pending, totalCourts };
    }, [facilities]);

    // Filtered facilities list
    const filteredFacilities = useMemo(() => {
        return facilities.filter(f => {
            const matchesQuery =
                !searchQuery ||
                f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.province?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' || f.verification_status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [facilities, searchQuery, statusFilter]);

    if (isAdding) {
        if (activeStep === 1) {
            return (
                <AuthenticatedLayout
                    header={
                        <PageHeader
                            title={isEditing ? 'Edit Facility' : 'Add New Facility'}
                            subtitle="Step 1 of 2: Core facility details, address, and contact info"
                            actions={
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setIsEditing(false); resetFacility(); }}
                                    className="text-xs font-bold text-[#101F1A]/70 hover:text-[#101F1A] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            }
                            showSearch={false}
                            showNotifications={false}
                        />
                    }
                >
                    <Head title="Setup Facility" />
                    <div className="py-4 max-w-3xl mx-auto">
                        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-card rounded-2xl border border-[#101F1A]/10">
                            {/* Step Indicator */}
                            <div className="mb-6 pb-5 border-b border-[#101F1A]/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center font-black text-sm">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-[#101F1A]">
                                            {isEditing ? 'Update Facility Information' : 'Core Facility Details'}
                                        </h2>
                                        <p className="text-xs text-[#101F1A]/60">
                                            {isEditing ? 'Modify basic details or location' : 'Enter basic venue profile and address'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 bg-[#F5F2EA] px-2.5 py-1 rounded-lg">
                                    Step 1 of 2
                                </span>
                            </div>
                            
                            <form onSubmit={submitFacility} className="flex flex-col gap-4.5">
                                {isEditing && editingFacilityStatus === 'APPROVED' && (
                                    <div>
                                        <InputLabel htmlFor="slug" value="Custom URL Slug (Optional)" />
                                        <TextInput
                                            id="slug"
                                            value={facilityData.slug}
                                            onChange={(e) => setFacilityData('slug', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. metro-badminton-center"
                                        />
                                        <p className="text-[11px] text-[#101F1A]/50 mt-1">Public booking URL: /f/{facilityData.slug || 'slug'}</p>
                                        <InputError message={facilityErrors.slug} className="mt-1" />
                                    </div>
                                )}
                                <div>
                                    <InputLabel htmlFor="name" value="Facility Name *" />
                                    <TextInput
                                        id="name"
                                        value={facilityData.name}
                                        onChange={(e) => setFacilityData('name', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        placeholder="e.g. CourtSync Sports Arena"
                                        required
                                    />
                                    <InputError message={facilityErrors.name} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="address" value="Street Address *" />
                                    <TextInput
                                        id="address"
                                        value={facilityData.address}
                                        onChange={(e) => setFacilityData('address', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        placeholder="e.g. 123 Sports Complex Way"
                                        required
                                    />
                                    <InputError message={facilityErrors.address} className="mt-1" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="city" value="City *" />
                                        <TextInput
                                            id="city"
                                            value={facilityData.city}
                                            onChange={(e) => setFacilityData('city', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. Cebu City"
                                            required
                                        />
                                        <InputError message={facilityErrors.city} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="province" value="Province / State *" />
                                        <TextInput
                                            id="province"
                                            value={facilityData.province}
                                            onChange={(e) => setFacilityData('province', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. Cebu"
                                            required
                                        />
                                        <InputError message={facilityErrors.province} className="mt-1" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="country" value="Country *" />
                                        <TextInput
                                            id="country"
                                            value={facilityData.country}
                                            onChange={(e) => setFacilityData('country', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. Philippines"
                                            required
                                        />
                                        <InputError message={facilityErrors.country} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="contact_number" value="Contact Phone *" />
                                        <TextInput
                                            id="contact_number"
                                            value={facilityData.contact_number}
                                            onChange={(e) => setFacilityData('contact_number', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. +63 912 345 6789"
                                            required
                                        />
                                        <InputError message={facilityErrors.contact_number} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="description" value="Facility Description (Optional)" />
                                    <textarea
                                        id="description"
                                        value={facilityData.description}
                                        onChange={(e) => setFacilityData('description', e.target.value)}
                                        className="mt-1 block w-full rounded-xl border border-[#101F1A]/15 bg-white p-3 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] shadow-2xs transition-all"
                                        rows="3"
                                        placeholder="Briefly describe available amenities, parking, operating guidelines, or special equipment."
                                    />
                                    <InputError message={facilityErrors.description} className="mt-1" />
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-[#101F1A]/10 flex justify-between items-center">
                                    {isEditing ? (
                                        <button 
                                            type="button" 
                                            onClick={() => setActiveStep(2)} 
                                            className="text-xs font-bold text-[#101F1A]/70 hover:text-[#101F1A] flex items-center gap-1 cursor-pointer"
                                        >
                                            Next: Verification Documents <ChevronRight size={14} />
                                        </button>
                                    ) : <div></div>}
                                    <PrimaryButton disabled={facilityProcessing} className="!bg-[#101F1A] hover:!bg-[#162923] text-[#D6FF3F] font-bold text-xs py-2 px-5">
                                        {isEditing ? 'Save Details' : 'Continue to Documents →'}
                                    </PrimaryButton>
                                </div>
                            </form>
                            
                            {isEditing && (
                                <div className="mt-8 pt-6 border-t border-rose-200">
                                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
                                        <AlertTriangle size={14} />
                                        <span>Danger Zone</span>
                                    </div>
                                    <p className="text-xs text-[#101F1A]/60 mb-4">
                                        Deleting this facility will permanently remove all associated courts, schedules, staff memberships, and submitted verification data.
                                    </p>
                                    <button 
                                        type="button"
                                        onClick={() => deleteFacility(editingFacilityId, facilityData.name)}
                                        className="px-3.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                                    >
                                        Delete Facility
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }

        if (activeStep === 2) {
            return (
                <AuthenticatedLayout
                    header={
                        <PageHeader
                            title={isEditing ? 'Update Verification Documents' : 'Submit Documents'}
                            subtitle="Step 2 of 2: Upload government ID, permits, and facility photos"
                            actions={
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setIsEditing(false); }}
                                    className="text-xs font-bold text-[#101F1A]/70 hover:text-[#101F1A] transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                            }
                            showSearch={false}
                            showNotifications={false}
                        />
                    }
                >
                    <Head title="Submit Verification" />
                    <div className="py-4 max-w-3xl mx-auto">
                        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-card rounded-2xl border border-[#101F1A]/10">
                            {/* Step Indicator */}
                            <div className="mb-6 pb-5 border-b border-[#101F1A]/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-[#D6FF3F] text-[#101F1A] flex items-center justify-center font-black text-sm shadow-2xs">
                                        2
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-[#101F1A]">
                                            {isEditing ? 'Verification Documents' : 'Submit Verification Files'}
                                        </h2>
                                        <p className="text-xs text-[#101F1A]/60">
                                            Documents are encrypted and reviewed by platform admins for compliance.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 bg-[#F5F2EA] px-2.5 py-1 rounded-lg">
                                    Step 2 of 2
                                </span>
                            </div>
                            
                            <form onSubmit={submitVerification} className="flex flex-col gap-4.5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="government_id_type" value="Government ID Type *" />
                                        <select
                                            id="government_id_type"
                                            value={verificationData.government_id_type}
                                            onChange={(e) => setVerificationData('government_id_type', e.target.value)}
                                            className="mt-1 block w-full rounded-xl border border-[#101F1A]/15 bg-white py-2 px-3 text-xs font-medium text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] shadow-2xs transition-all"
                                        >
                                            <option value="PASSPORT">Passport</option>
                                            <option value="DRIVERS_LICENSE">Driver's License</option>
                                            <option value="NATIONAL_ID">National ID / PhilID</option>
                                            <option value="UMID">UMID / SSS</option>
                                        </select>
                                        <InputError message={verificationErrors.government_id_type} className="mt-1" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="government_id_number" value="ID Number *" />
                                        <TextInput
                                            id="government_id_number"
                                            value={verificationData.government_id_number}
                                            onChange={(e) => setVerificationData('government_id_number', e.target.value)}
                                            className="mt-1 block w-full text-xs font-medium"
                                            placeholder="e.g. P1234567A"
                                            required
                                        />
                                        <InputError message={verificationErrors.government_id_number} className="mt-1" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="government_id_image_path" value="Government ID Image URL *" />
                                    <TextInput
                                        id="government_id_image_path"
                                        placeholder="https://example.com/id-scan.jpg"
                                        value={verificationData.government_id_image_path}
                                        onChange={(e) => setVerificationData('government_id_image_path', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        required
                                    />
                                    <InputError message={verificationErrors.government_id_image_path} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="business_permit_path" value="Mayor's / Business Permit URL *" />
                                    <TextInput
                                        id="business_permit_path"
                                        placeholder="https://example.com/business-permit.pdf"
                                        value={verificationData.business_permit_path}
                                        onChange={(e) => setVerificationData('business_permit_path', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        required
                                    />
                                    <InputError message={verificationErrors.business_permit_path} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="business_registration_path" value="DTI / SEC Registration URL *" />
                                    <TextInput
                                        id="business_registration_path"
                                        placeholder="https://example.com/sec-dti-registration.pdf"
                                        value={verificationData.business_registration_path}
                                        onChange={(e) => setVerificationData('business_registration_path', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        required
                                    />
                                    <InputError message={verificationErrors.business_registration_path} className="mt-1" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="proof_of_ownership_path" value="Proof of Ownership / Lease Contract URL *" />
                                    <TextInput
                                        id="proof_of_ownership_path"
                                        placeholder="https://example.com/lease-or-title.pdf"
                                        value={verificationData.proof_of_ownership_path}
                                        onChange={(e) => setVerificationData('proof_of_ownership_path', e.target.value)}
                                        className="mt-1 block w-full text-xs font-medium"
                                        required
                                    />
                                    <InputError message={verificationErrors.proof_of_ownership_path} className="mt-1" />
                                </div>
                                
                                <div className="mt-4 border-t border-[#101F1A]/10 pt-5">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#101F1A]">Facility Photos</h3>
                                            <p className="text-[11px] text-[#101F1A]/60">Provide direct image URLs showing courts and amenities.</p>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={addPhotoField}
                                            className="text-xs font-bold text-[#101F1A] hover:text-[#101F1A]/80 flex items-center gap-1 bg-[#101F1A]/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Plus size={13} strokeWidth={2.4} /> Add Photo URL
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2.5">
                                        {verificationData.facility_photos.map((photo, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <TextInput 
                                                        type="url" 
                                                        placeholder="https://example.com/court-interior.jpg" 
                                                        value={photo} 
                                                        onChange={(e) => handlePhotoChange(index, e.target.value)} 
                                                        className="block w-full text-xs font-medium" 
                                                    />
                                                    <InputError message={verificationErrors[`facility_photos.${index}`]} className="mt-1" />
                                                </div>
                                                {verificationData.facility_photos.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removePhotoField(index)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                        aria-label="Remove photo"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-[#101F1A]/10 flex justify-between items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveStep(1)} 
                                        className="text-xs font-bold text-[#101F1A]/70 hover:text-[#101F1A] transition-colors cursor-pointer"
                                    >
                                        ← Back to Details
                                    </button>
                                    <PrimaryButton disabled={verificationProcessing} className="!bg-[#101F1A] hover:!bg-[#162923] text-[#D6FF3F] font-bold text-xs py-2 px-5">
                                        {isEditing ? 'Update Documents' : 'Submit Application'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="My Facilities"
                    subtitle="Manage venue registrations, verification status, and public pages"
                    actions={
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                resetFacility();
                                resetVerification();
                                setActiveStep(1);
                                setIsAdding(true);
                            }}
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
            <Head title="Facilities" />

            <div className="w-full space-y-4 pb-2">
                {/* ── KPI Strip ────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: Total Facilities */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Total Venues
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
                            <span>Owner Portfolio</span>
                        </div>
                    </div>

                    {/* Card 2: Approved / Live */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-emerald-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Verified & Active
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
                            <span>Public booking enabled</span>
                        </div>
                    </div>

                    {/* Card 3: Pending Review */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-amber-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Pending / Review
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
                            <span>Awaiting verification</span>
                        </div>
                    </div>

                    {/* Card 4: Total Courts */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#D6FF3F]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Managed Courts
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/35 text-[#101F1A] shadow-2xs border border-[#D6FF3F]/60">
                                <Layers size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {stats.totalCourts}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <Sparkles size={12} className="text-[#101F1A]/40" />
                            <span>Across all venues</span>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar & Filter Bar ─────────────────────────────────── */}
                {facilities.length > 0 && (
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter facilities by name, city, or province..."
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

                        {/* Status Filter Chips */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                            {[
                                { id: 'ALL', label: 'All Venues', count: stats.total },
                                { id: 'APPROVED', label: 'Approved', count: stats.approved },
                                { id: 'UNDER_REVIEW', label: 'Review', count: stats.pending },
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
                )}

                {/* ── Facilities Cards Grid ─────────────────────────────────── */}
                {facilities.length === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md max-w-lg mx-auto my-10">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A] border border-[#D6FF3F] shadow-2xs mb-4">
                            <Building2 size={24} strokeWidth={2.2} />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-[#101F1A] mb-1.5">No Facilities Yet</h2>
                        <p className="text-xs font-medium text-[#101F1A]/60 max-w-sm mx-auto mb-6">
                            You haven't registered any sports facilities yet. Add your first venue to start configuring courts and booking schedules.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(false);
                                resetFacility();
                                resetVerification();
                                setActiveStep(1);
                                setIsAdding(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-[#D6FF3F] shadow-subtle hover:bg-[#162923] transition-all cursor-pointer"
                        >
                            <Plus size={15} strokeWidth={2.4} />
                            <span>Add Your First Facility</span>
                        </button>
                    </div>
                ) : filteredFacilities.length === 0 ? (
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white/90 p-8 text-center shadow-card backdrop-blur-md">
                        <Building2 size={24} className="mx-auto text-[#101F1A]/40 mb-2" />
                        <h3 className="text-sm font-bold text-[#101F1A]">No facilities found</h3>
                        <p className="text-xs text-[#101F1A]/60 mt-0.5">Try adjusting your search query or filter chips.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                            className="mt-3 text-xs font-bold text-[#101F1A] underline underline-offset-4 cursor-pointer"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFacilities.map((facility) => {
                            const badge = STATUS_BADGES[facility.verification_status] || STATUS_BADGES.DRAFT;
                            const BadgeIcon = badge.icon;
                            const courtsCount = facility.courts_count ?? (facility.courts?.length || 0);

                            return (
                                <div
                                    key={facility.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-[#101F1A]/10 bg-white/95 p-5 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/25"
                                >
                                    <div>
                                        {/* Header Row */}
                                        <div className="flex items-start justify-between gap-2.5 mb-3">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base font-black tracking-tight text-[#101F1A] group-hover:text-[#101F1A]/80 transition-colors">
                                                    {facility.name}
                                                </h3>
                                                {facility.slug && (
                                                    <span className="text-[10px] font-medium text-[#101F1A]/50">
                                                        /f/{facility.slug}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={[
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0',
                                                badge.bg,
                                            ].join(' ')}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                <span>{badge.label}</span>
                                            </span>
                                        </div>

                                        {/* Address & Contact Details */}
                                        <div className="space-y-1.5 my-3 text-xs font-medium text-[#101F1A]/70">
                                            <p className="flex items-start gap-2">
                                                <MapPin size={13} className="mt-0.5 shrink-0 text-[#101F1A]/40" />
                                                <span className="line-clamp-2">{facility.address}, {facility.city}, {facility.province}</span>
                                            </p>
                                            {facility.contact_number && (
                                                <p className="flex items-center gap-2">
                                                    <Phone size={13} className="shrink-0 text-[#101F1A]/40" />
                                                    <span>{facility.contact_number}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Quick Metrics Badge Strip */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-[#101F1A]/5">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F2EA] px-2.5 py-1 text-[11px] font-bold text-[#101F1A]">
                                                <Layers size={12} className="text-[#101F1A]/60" />
                                                <span>{courtsCount} {courtsCount === 1 ? 'Court' : 'Courts'}</span>
                                            </span>
                                            {facility.verification_status === 'APPROVED' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                                                    <ShieldCheck size={11} /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="mt-5 pt-3.5 border-t border-[#101F1A]/10 flex items-center justify-between gap-2">
                                        {facility.verification_status === 'APPROVED' && facility.slug ? (
                                            <a
                                                href={route('facility.show', facility.slug)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-bold text-[#101F1A] hover:text-[#101F1A]/70 transition-colors"
                                            >
                                                <span>Public Page</span>
                                                <ExternalLink size={12} />
                                            </a>
                                        ) : (
                                            <span className="text-[11px] font-medium text-[#101F1A]/40">
                                                {facility.verification_status === 'APPROVED' ? 'No slug set' : 'Awaiting approval'}
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                href={route('facility.courts')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#101F1A] bg-[#101F1A]/5 hover:bg-[#101F1A]/10 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Layers size={12} />
                                                <span>Courts</span>
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => openEditFacility(facility)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#101F1A] bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Edit3 size={12} strokeWidth={2.2} />
                                                <span>Edit</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
