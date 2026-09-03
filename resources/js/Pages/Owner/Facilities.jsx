import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState, useEffect } from 'react';

export default function Facilities({ auth, facilities }) {
    const user = auth.user;
    const [isAdding, setIsAdding] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [createdFacilityId, setCreatedFacilityId] = useState(null);

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
                if (isEditing) {
                    setActiveStep(2);
                } else {
                    const newFacilities = page.props.facilities;
                    const latestFacility = newFacilities[newFacilities.length - 1];
                    if (latestFacility) {
                        setCreatedFacilityId(latestFacility.id);
                    }
                    setActiveStep(2);
                }
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

    const deleteFacility = (id) => {
        if (confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
            router.delete(route('facility.destroy', id), {
                onSuccess: () => {
                    setIsAdding(false);
                    setIsEditing(false);
                }
            });
        }
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
        facility_photos: [''], // Array of photos
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
        
        // We use transform to ensure the facility_id is attached to the request payload
        // since useForm's post method doesn't take a data argument directly.
        postVerification(route('facility.verification.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setIsAdding(false);
                setIsEditing(false); // Make sure editing mode is turned off!
                setActiveStep(1);
                resetFacility();
                resetVerification();
                setCreatedFacilityId(null);
            }
        });
    };

    if (isAdding) {
        if (activeStep === 1) {
            return (
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Add New Facility</h2>}>
                    <Head title="Setup Facility" />
                    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-8 shadow-sm rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-[#10221C]">{isEditing ? 'Edit Facility' : 'Register Facility'}</h2>
                                    <p className="text-gray-500">{isEditing ? 'Update your facility details.' : 'Step 1 of 2: Please provide your facility\'s core information.'}</p>
                                </div>
                                <button onClick={() => { setIsAdding(false); setIsEditing(false); resetFacility(); }} className="text-gray-500 hover:text-gray-700">Cancel</button>
                            </div>
                            
                            <form onSubmit={submitFacility} className="flex flex-col gap-4">
                                {isEditing && editingFacilityStatus === 'APPROVED' && (
                                    <div>
                                        <InputLabel htmlFor="slug" value="Custom URL Slug (Optional)" />
                                        <TextInput id="slug" value={facilityData.slug} onChange={(e) => setFacilityData('slug', e.target.value)} className="mt-1 block w-full" placeholder="e.g. my-awesome-facility" />
                                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep your current URL or enter a custom one.</p>
                                        <InputError message={facilityErrors.slug} className="mt-2" />
                                    </div>
                                )}
                                <div>
                                    <InputLabel htmlFor="name" value="Facility Name" />
                                    <TextInput id="name" value={facilityData.name} onChange={(e) => setFacilityData('name', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={facilityErrors.name} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="address" value="Street Address" />
                                    <TextInput id="address" value={facilityData.address} onChange={(e) => setFacilityData('address', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={facilityErrors.address} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="city" value="City" />
                                        <TextInput id="city" value={facilityData.city} onChange={(e) => setFacilityData('city', e.target.value)} className="mt-1 block w-full" />
                                        <InputError message={facilityErrors.city} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="province" value="Province / State" />
                                        <TextInput id="province" value={facilityData.province} onChange={(e) => setFacilityData('province', e.target.value)} className="mt-1 block w-full" />
                                        <InputError message={facilityErrors.province} className="mt-2" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="country" value="Country" />
                                        <TextInput id="country" value={facilityData.country} onChange={(e) => setFacilityData('country', e.target.value)} className="mt-1 block w-full" />
                                        <InputError message={facilityErrors.country} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="contact_number" value="Contact Number" />
                                        <TextInput id="contact_number" value={facilityData.contact_number} onChange={(e) => setFacilityData('contact_number', e.target.value)} className="mt-1 block w-full" />
                                        <InputError message={facilityErrors.contact_number} className="mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="description" value="Description (Optional)" />
                                    <textarea
                                        id="description"
                                        value={facilityData.description}
                                        onChange={(e) => setFacilityData('description', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        rows="3"
                                    />
                                    <InputError message={facilityErrors.description} className="mt-2" />
                                </div>
                                
                                <div className="mt-4 flex justify-between items-center">
                                    {isEditing ? (
                                        <button 
                                            type="button" 
                                            onClick={() => setActiveStep(2)} 
                                            className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            Next: Edit Verification Documents →
                                        </button>
                                    ) : <div></div>}
                                    <PrimaryButton disabled={facilityProcessing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                        {isEditing ? 'Save Details' : 'Save & Continue'}
                                    </PrimaryButton>
                                </div>
                            </form>
                            
                            {isEditing && (
                                <div className="mt-8 pt-6 border-t border-red-100">
                                    <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                                    <p className="text-sm text-gray-500 mb-4">Deleting this facility will permanently remove all associated data, including staff and verification documents.</p>
                                    <button 
                                        onClick={() => deleteFacility(editingFacilityId)}
                                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 font-medium text-sm transition"
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
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Submit Documents</h2>}>
                    <Head title="Submit Verification" />
                    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-8 shadow-sm rounded-lg border border-gray-200">
                            <h2 className="text-2xl font-bold mb-2 text-[#10221C]">{isEditing ? 'Update Verification Documents' : 'Verification Documents'}</h2>
                            <p className="text-gray-500 mb-6">{isEditing ? 'Update your facility\'s verification documents here. Note: Updating documents may return your facility to UNDER REVIEW status.' : 'Step 2 of 2: Please provide URLs to your required verification documents.'}</p>
                            
                            <form onSubmit={submitVerification} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="government_id_type" value="ID Type" />
                                        <select
                                            id="government_id_type"
                                            value={verificationData.government_id_type}
                                            onChange={(e) => setVerificationData('government_id_type', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        >
                                            <option value="PASSPORT">Passport</option>
                                            <option value="DRIVERS_LICENSE">Driver's License</option>
                                            <option value="NATIONAL_ID">National ID</option>
                                        </select>
                                        <InputError message={verificationErrors.government_id_type} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="government_id_number" value="ID Number" />
                                        <TextInput id="government_id_number" value={verificationData.government_id_number} onChange={(e) => setVerificationData('government_id_number', e.target.value)} className="mt-1 block w-full" />
                                        <InputError message={verificationErrors.government_id_number} className="mt-2" />
                                    </div>
                                </div>
                                <div>
                                    <InputLabel htmlFor="government_id_image_path" value="ID Image URL" />
                                    <TextInput id="government_id_image_path" placeholder="https://example.com/id.jpg" value={verificationData.government_id_image_path} onChange={(e) => setVerificationData('government_id_image_path', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={verificationErrors.government_id_image_path} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="business_permit_path" value="Business Permit URL" />
                                    <TextInput id="business_permit_path" placeholder="https://example.com/permit.pdf" value={verificationData.business_permit_path} onChange={(e) => setVerificationData('business_permit_path', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={verificationErrors.business_permit_path} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="business_registration_path" value="Business Registration URL" />
                                    <TextInput id="business_registration_path" placeholder="https://example.com/registration.pdf" value={verificationData.business_registration_path} onChange={(e) => setVerificationData('business_registration_path', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={verificationErrors.business_registration_path} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="proof_of_ownership_path" value="Proof of Ownership URL" />
                                    <TextInput id="proof_of_ownership_path" placeholder="https://example.com/proof.pdf" value={verificationData.proof_of_ownership_path} onChange={(e) => setVerificationData('proof_of_ownership_path', e.target.value)} className="mt-1 block w-full" />
                                    <InputError message={verificationErrors.proof_of_ownership_path} className="mt-2" />
                                </div>
                                
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-[#10221C]">Facility Photos</h3>
                                        <button 
                                            type="button" 
                                            onClick={addPhotoField}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                            + Add Another Photo
                                        </button>
                                    </div>
                                    <InputError message={verificationErrors.facility_photos} className="mb-2" />
                                    
                                    {verificationData.facility_photos.map((photo, index) => (
                                        <div key={index} className="flex gap-2 mb-3 items-start">
                                            <div className="flex-1">
                                                <TextInput 
                                                    placeholder="https://example.com/photo.jpg" 
                                                    value={photo} 
                                                    onChange={(e) => handlePhotoChange(index, e.target.value)} 
                                                    className="block w-full" 
                                                />
                                                <InputError message={verificationErrors[`facility_photos.${index}`]} className="mt-1" />
                                            </div>
                                            {verificationData.facility_photos.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removePhotoField(index)}
                                                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md transition"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-4 flex justify-between items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveStep(1)} 
                                        className="text-sm text-gray-600 hover:text-gray-900 underline decoration-gray-300 underline-offset-4"
                                    >
                                        ← {isEditing ? 'Back to Details' : 'Previous'}
                                    </button>
                                    <PrimaryButton disabled={verificationProcessing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                        {isEditing ? 'Update Documents' : 'Submit Documents'}
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
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-[#10221C]">My Facilities</h2>
                    <PrimaryButton onClick={() => setIsAdding(true)} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                        + Add Facility
                    </PrimaryButton>
                </div>
            }
        >
            <Head title="Facilities" />

            <div className="max-w-7xl mx-auto">
                {facilities.length === 0 ? (
                    <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200 mt-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-[#10221C]">No Facilities Yet</h2>
                        <p className="text-gray-500 mb-6">You haven't registered any facilities. Add your first facility to get started.</p>
                        <PrimaryButton onClick={() => setIsAdding(true)} className="!bg-[#10221C] hover:!bg-[#1a382d]">Add Your First Facility</PrimaryButton>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {facilities.map(facility => (
                            <div key={facility.id} className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-[#10221C]">{facility.name}</h3>
                                        {facility.verification_status === 'APPROVED' ? (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-[#D6FF3F]/30 text-[#10221C] border border-[#D6FF3F] rounded-full uppercase">Approved</span>
                                        ) : facility.verification_status === 'REJECTED' ? (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 rounded-full uppercase">Rejected</span>
                                        ) : facility.verification_status === 'SUBMITTED' ? (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 rounded-full uppercase">Submitted</span>
                                        ) : facility.verification_status === 'UNDER_REVIEW' ? (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded-full uppercase">Under Review</span>
                                        ) : facility.verification_status === 'SUSPENDED' ? (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 rounded-full uppercase">Suspended</span>
                                        ) : (
                                            <span className="px-2 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full uppercase">Draft</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2 flex items-start gap-2">
                                        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{facility.address}, {facility.city}, {facility.province}</span>
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    {facility.verification_status === 'APPROVED' && facility.slug ? (
                                        <a href={route('facility.show', facility.slug)} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                            View Public Page
                                        </a>
                                    ) : (
                                        <span className="text-sm text-gray-400">Page not active</span>
                                    )}
                                    <button onClick={() => openEditFacility(facility)} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                        Edit Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
