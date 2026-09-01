import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useState } from 'react';

export default function Verifications({ verifications }) {
    // View Modal State
    const [viewingVerification, setViewingVerification] = useState(null);

    // Approve Modal State
    const [approvingFacility, setApprovingFacility] = useState(null);
    const { post, processing } = useForm();

    const openViewModal = (verification) => setViewingVerification(verification);
    const closeViewModal = () => setViewingVerification(null);

    const openApproveModal = (facility) => setApprovingFacility(facility);
    const closeApproveModal = () => setApprovingFacility(null);

    const submitApprove = (e) => {
        e.preventDefault();
        post(route('admin.verifications.approve', approvingFacility.id), {
            onSuccess: () => closeApproveModal(),
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Facility Verifications</h2>}
        >
            <Head title="Admin - Verifications" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
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
                                                    onClick={() => openApproveModal(v.facility)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Approve"
                                                >
                                                    <svg className="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

            {/* View Documents Modal */}
            <Modal show={viewingVerification !== null} onClose={closeViewModal} maxWidth="2xl">
                {viewingVerification && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                {viewingVerification.facility?.name} Documents
                            </h2>
                            <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 border-b pb-1">Government ID ({viewingVerification.government_id_type})</h3>
                                <p className="text-sm text-gray-600 mb-2">Number: {viewingVerification.government_id_number}</p>
                                {viewingVerification.government_id_image_path ? (
                                    <img src={viewingVerification.government_id_image_path} alt="Government ID" className="w-full rounded border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.government_id_image_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.government_id_image_path}</a>` }} />
                                ) : <p className="text-gray-400 text-sm italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 border-b pb-1">Business Permit</h3>
                                {viewingVerification.business_permit_path ? (
                                    <img src={viewingVerification.business_permit_path} alt="Business Permit" className="w-full rounded border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.business_permit_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.business_permit_path}</a>` }} />
                                ) : <p className="text-gray-400 text-sm italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 border-b pb-1">Business Registration</h3>
                                {viewingVerification.business_registration_path ? (
                                    <img src={viewingVerification.business_registration_path} alt="Business Registration" className="w-full rounded border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.business_registration_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.business_registration_path}</a>` }} />
                                ) : <p className="text-gray-400 text-sm italic">Not Provided</p>}
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2 border-b pb-1">Proof of Ownership</h3>
                                {viewingVerification.proof_of_ownership_path ? (
                                    <img src={viewingVerification.proof_of_ownership_path} alt="Proof of Ownership" className="w-full rounded border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<a href="${viewingVerification.proof_of_ownership_path}" target="_blank" class="text-blue-600 hover:underline break-all">${viewingVerification.proof_of_ownership_path}</a>` }} />
                                ) : <p className="text-gray-400 text-sm italic">Not Provided</p>}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <SecondaryButton onClick={closeViewModal}>Close</SecondaryButton>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal show={approvingFacility !== null} onClose={closeApproveModal} maxWidth="md">
                <form onSubmit={submitApprove} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                        Approve Facility?
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to approve <strong>{approvingFacility?.name}</strong>? This will instantly give the owner full access to the platform, and their facility will be marked as verified.
                    </p>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeApproveModal}>Cancel</SecondaryButton>
                        <PrimaryButton 
                            className="!bg-green-600 hover:!bg-green-700 focus:!bg-green-700 active:!bg-green-800"
                            disabled={processing}
                        >
                            Yes, Approve Facility
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
