import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

import { useState } from 'react';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Dashboard({ user }) {
    const [activeStep, setActiveStep] = useState(
        user.status === 'PENDING_VERIFICATION' && user.facility && !user.facility.verification ? 2 : 1
    );

    // Form for Staff Invite (Owners only)
    const { data: staffData, setData: setStaffData, post: postStaff, processing: staffProcessing, errors: staffErrors, reset: resetStaff } = useForm({
        name: '',
        email: '',
    });

    const submitStaff = (e) => {
        e.preventDefault();
        postStaff(route('facility.staff.store'), {
            onSuccess: () => resetStaff(),
        });
    };

    // Form for Step 1: Facility Details
    const { data: facilityData, setData: setFacilityData, post: postFacility, processing: facilityProcessing, errors: facilityErrors } = useForm({
        name: user.facility?.name || '',
        address: user.facility?.address || '',
        city: user.facility?.city || '',
        province: user.facility?.province || '',
        country: user.facility?.country || '',
        contact_number: user.facility?.contact_number || '',
        description: user.facility?.description || '',
    });

    const submitFacility = (e) => {
        e.preventDefault();
        postFacility(route('facility.store'), {
            onSuccess: () => {
                if (user.status === 'PENDING_VERIFICATION') setActiveStep(2);
            }
        });
    };

    // Form for Step 2: Verification Documents
    const { data: verificationData, setData: setVerificationData, post: postVerification, processing: verificationProcessing, errors: verificationErrors } = useForm({
        government_id_type: 'PASSPORT',
        government_id_number: '',
        government_id_image_path: '',
        business_permit_path: '',
        business_registration_path: '',
        proof_of_ownership_path: '',
    });

    const submitVerification = (e) => {
        e.preventDefault();
        postVerification(route('facility.verification.store'));
    };

    if (user.role === 'FACILITY_OWNER') {
        // Step 1: Missing Facility Details OR user clicked Previous
        if (!user.facility || (user.status === 'PENDING_VERIFICATION' && !user.facility.verification && activeStep === 1)) {
            return (
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Setup Facility</h2>}>
                    <Head title="Setup Facility" />
                    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-8 shadow-sm rounded-lg border border-gray-200">
                            <h2 className="text-2xl font-bold mb-2 text-[#10221C]">Register Your Facility</h2>
                            <p className="text-gray-500 mb-6">Step 1 of 2: Please provide your facility's core information.</p>
                            
                            <form onSubmit={submitFacility} className="flex flex-col gap-4">
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
                                
                                <div className="mt-4 flex justify-end">
                                    <PrimaryButton disabled={facilityProcessing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                        Save & Continue
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }

        // Step 2: Missing Verification Documents (Only for PENDING_VERIFICATION)
        if (user.status === 'PENDING_VERIFICATION' && user.facility && !user.facility.verification && activeStep === 2) {
            return (
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Submit Documents</h2>}>
                    <Head title="Submit Verification" />
                    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-8 shadow-sm rounded-lg border border-gray-200">
                            <h2 className="text-2xl font-bold mb-2 text-[#10221C]">Verification Documents</h2>
                            <p className="text-gray-500 mb-6">Step 2 of 2: Please provide URLs to your required verification documents.</p>
                            
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
                                
                                <div className="mt-4 flex justify-between items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setActiveStep(1)} 
                                        className="text-sm text-gray-600 hover:text-gray-900 underline decoration-gray-300 underline-offset-4"
                                    >
                                        ← Previous
                                    </button>
                                    <PrimaryButton disabled={verificationProcessing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                        Submit Documents
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }

        // Step 3: Waiting for Admin Approval (Only for PENDING_VERIFICATION)
        if (user.status === 'PENDING_VERIFICATION') {
            return (
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">In Review</h2>}>
                    <Head title="Pending Review" />
                    <div className="py-12 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-6">
                                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-[#10221C]">Application Under Review</h2>
                            <p className="text-gray-600">Your facility and verification documents have been submitted successfully. An administrator will review your application shortly.</p>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }
    }

    if (user.role === 'FACILITY_STAFF' && user.status === 'PENDING_VERIFICATION') {
        return (
            <AuthenticatedLayout>
                <Head title="Waiting for Verification" />
                <div className="py-12 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-bold text-gray-900">Waiting for Verification</h3>
                        <p className="mt-1 text-sm text-gray-500">Your account is pending verification. Please wait for an administrator or facility owner to link your account to a facility.</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-[#10221C]">
                            Welcome back to {user.facility ? user.facility.name : 'CourtSync'}, {user.name}!
                        </h2>
                    </div>
                    {user.status === 'VERIFIED' && (
                        <div className="flex items-center gap-2 bg-[#D6FF3F]/30 text-[#10221C] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-[#D6FF3F]">
                            <svg className="w-4 h-4 text-[#10221C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            VERIFIED ACCOUNT
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {/* Dashboard Metrics Placeholders */}
                {user.role === 'FACILITY_OWNER' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Bookings</div>
                            <div className="text-5xl font-display text-[#10221C]">124</div>
                            <div className="text-sm text-green-600 mt-2 font-medium">↑ 12% from last week</div>
                        </div>
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Revenue</div>
                            <div className="text-5xl font-display text-[#10221C]">$4,502</div>
                            <div className="text-sm text-green-600 mt-2 font-medium">↑ 8% from last week</div>
                        </div>
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Courts</div>
                            <div className="text-5xl font-display text-[#10221C]">4</div>
                            <div className="text-sm text-gray-400 mt-2 font-medium">All systems operational</div>
                        </div>
                    </div>
                )}

            </div>
        </AuthenticatedLayout>
    );
}
