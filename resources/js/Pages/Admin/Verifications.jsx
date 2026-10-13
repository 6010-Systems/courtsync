import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm } from '@inertiajs/react';
import Dialog from '@/Components/Dialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useToast } from '@/Components/ToastContext';
import { useState } from 'react';

export default function Verifications({ verifications }) {
    const toast = useToast();
    // View Modal State
    const [viewingVerification, setViewingVerification] = useState(null);

    // Status Update Modal State
    const [updatingFacility, setUpdatingFacility] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const { data, setData, post, processing } = useForm({
        status: ''
    });

    const openViewModal = (verification) => setViewingVerification(verification);
    const closeViewModal = () => setViewingVerification(null);

    const openStatusModal = (facility, status) => {
        setUpdatingFacility(facility);
        setNewStatus(status);
        setData('status', status);
    };
    
    const closeStatusModal = () => {
        setUpdatingFacility(null);
        setNewStatus('');
    };

    const submitStatus = (e) => {
        e.preventDefault();
        post(route('admin.verifications.status', updatingFacility.id), {
            onSuccess: () => {
                toast.success(`Facility status updated to ${newStatus}`);
                closeStatusModal();
            },
            onError: () => {
                toast.error('Failed to update facility status');
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Facility Verifications"
                    subtitle="Review and verify business documents submitted by facility owners"
                    actions={null}
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Admin - Verifications" />

            <div className="flex flex-col gap-6 w-full">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <p className="text-sm text-gray-500">Review pending facility applications. You can view the documents and approve them here.</p>
                    </div>

                    {verifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50">
                            No verification applications pending.
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
                                    {verifications.map((v) => (
                                        <tr key={v.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{v.facility?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500 mt-1">ID: {v.government_id_type} - {v.government_id_number}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{v.facility?.owner?.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">{v.facility?.owner?.email || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{v.facility?.city}, {v.facility?.province}</div>
                                                <div className="text-xs text-gray-500">{v.facility?.address}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                    PENDING
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => openViewModal(v)}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                    title="View Documents"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => openStatusModal(v.facility, 'APPROVED')}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    title="Approve"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => openStatusModal(v.facility, 'REJECTED')}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Reject"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
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

            {/* View Verification Details Dialog */}
            <Dialog 
                isOpen={viewingVerification !== null} 
                onClose={closeViewModal} 
                closeOnClickOutside={false}
                size="3xl"
            >
                {viewingVerification && (
                    <div className="p-5">
                        <div className="pb-2.5 mb-3 border-b border-[#101F1A]/10">
                            <h2 className="text-base font-black text-[#101F1A]">
                                {viewingVerification.facility?.name} Documents
                            </h2>
                        </div>
                        
                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            <div>
                                <h3 className="text-xs font-bold text-[#101F1A] uppercase tracking-wide mb-1.5 border-b border-[#101F1A]/10 pb-1">Government ID ({viewingVerification.government_id_type})</h3>
                                <p className="text-xs text-[#101F1A]/70 mb-2 font-medium">Number: {viewingVerification.government_id_number}</p>
                                {viewingVerification.government_id_image_path ? (
                                    <img src={viewingVerification.government_id_image_path} alt="Government ID" className="w-full rounded-xl border border-[#101F1A]/10 shadow-2xs" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.government_id_image_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.government_id_image_path}</a>` }} />
                                ) : <p className="text-[#101F1A]/40 text-xs italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-[#101F1A] uppercase tracking-wide mb-1.5 border-b border-[#101F1A]/10 pb-1">Business Permit</h3>
                                {viewingVerification.business_permit_path ? (
                                    <img src={viewingVerification.business_permit_path} alt="Business Permit" className="w-full rounded-xl border border-[#101F1A]/10 shadow-2xs" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.business_permit_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.business_permit_path}</a>` }} />
                                ) : <p className="text-[#101F1A]/40 text-xs italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-[#101F1A] uppercase tracking-wide mb-1.5 border-b border-[#101F1A]/10 pb-1">Business Registration</h3>
                                {viewingVerification.business_registration_path ? (
                                    <img src={viewingVerification.business_registration_path} alt="Business Registration" className="w-full rounded-xl border border-[#101F1A]/10 shadow-2xs" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.business_registration_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.business_registration_path}</a>` }} />
                                ) : <p className="text-[#101F1A]/40 text-xs italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-[#101F1A] uppercase tracking-wide mb-1.5 border-b border-[#101F1A]/10 pb-1">Proof of Ownership</h3>
                                {viewingVerification.proof_of_ownership_path ? (
                                    <img src={viewingVerification.proof_of_ownership_path} alt="Proof of Ownership" className="w-full rounded-xl border border-[#101F1A]/10 shadow-2xs" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.proof_of_ownership_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.proof_of_ownership_path}</a>` }} />
                                ) : <p className="text-[#101F1A]/40 text-xs italic">Not Provided</p>}
                            </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#101F1A]/10 flex justify-end">
                            <SecondaryButton onClick={closeViewModal} className="!text-xs font-bold !py-1.5 !px-4">Close</SecondaryButton>
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Update Status Confirmation Dialog */}
            <Dialog 
                isOpen={updatingFacility !== null} 
                onClose={closeStatusModal} 
                closeOnClickOutside={false}
                size="md"
            >
                <form onSubmit={submitStatus} className="p-5">
                    <h2 className="text-base font-black text-[#101F1A] mb-2">
                        {newStatus === 'APPROVED' ? 'Approve' : 'Reject'} Facility?
                    </h2>
                    <p className="text-xs text-[#101F1A]/70 mb-5 leading-relaxed">
                        Are you sure you want to {newStatus === 'APPROVED' ? 'approve' : 'reject'} <strong>{updatingFacility?.name}</strong>? 
                        {newStatus === 'APPROVED' ? ' This will instantly give the owner full access to the platform.' : ''}
                    </p>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#101F1A]/10">
                        <SecondaryButton onClick={closeStatusModal} className="!text-xs font-bold !py-1.5 !px-3.5">Cancel</SecondaryButton>
                        <PrimaryButton 
                            className={newStatus === 'APPROVED' ? "!bg-emerald-600 hover:!bg-emerald-700 !text-white !text-xs font-bold !py-1.5 !px-4" : "!bg-rose-600 hover:!bg-rose-700 !text-white !text-xs font-bold !py-1.5 !px-4"}
                            disabled={processing}
                        >
                            Yes, {newStatus === 'APPROVED' ? 'Approve' : 'Reject'} Facility
                        </PrimaryButton>
                    </div>
                </form>
            </Dialog>
        </AuthenticatedLayout>
    );
}
