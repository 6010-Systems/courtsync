import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Check, X, Eye, FileText, AlertCircle } from 'lucide-react';

export default function Payments({ auth, payments }) {
    const [processingId, setProcessingId] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', bookingId: null, title: '', message: '', btnText: '', btnColor: '' });

    const handleVerify = (bookingId) => {
        setConfirmModal({
            isOpen: true,
            type: 'verify',
            bookingId: bookingId,
            title: 'Verify Payment',
            message: 'Are you sure you want to verify this payment and confirm the booking? The time slot will be permanently locked.',
            btnText: 'Yes, Verify Payment',
            btnColor: 'bg-[#10221C] hover:bg-[#1a362d] text-white'
        });
    };

    const handleReject = (bookingId) => {
        setConfirmModal({
            isOpen: true,
            type: 'reject',
            bookingId: bookingId,
            title: 'Reject Payment',
            message: 'Are you sure you want to reject this payment? The booking will be cancelled and the time slot will instantly reopen for others.',
            btnText: 'Yes, Reject Payment',
            btnColor: 'bg-red-600 hover:bg-red-700 text-white'
        });
    };

    const executeAction = () => {
        const { type, bookingId } = confirmModal;
        setProcessingId(bookingId);
        setConfirmModal({ ...confirmModal, isOpen: false });

        if (type === 'verify') {
            router.post(route('bookings.verify', bookingId), {}, {
                onFinish: () => setProcessingId(null),
            });
        } else if (type === 'reject') {
            router.post(route('bookings.reject', bookingId), {}, {
                onFinish: () => setProcessingId(null),
            });
        }
    };

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'verified': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Payments Tracking</h2>}
        >
            <Head title="Payments Tracking" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            
                            {payments.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                                    <FileText className="w-12 h-12 mb-3 text-gray-300" />
                                    <p className="text-lg font-medium">No payments found.</p>
                                    <p className="text-sm">When users book and pay, they will appear here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-600">
                                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs">
                                            <tr>
                                                <th className="px-6 py-4">Player</th>
                                                <th className="px-6 py-4">Court</th>
                                                <th className="px-6 py-4">Date & Time</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Proof</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.map((payment) => {
                                                const formatTime = (timeStr) => {
                                                    if (!timeStr) return '';
                                                    const [hourStr, minuteStr] = timeStr.split(':');
                                                    const hour = parseInt(hourStr, 10);
                                                    const ampm = hour >= 12 ? 'PM' : 'AM';
                                                    const formattedHour = hour % 12 || 12;
                                                    return `${formattedHour}:${minuteStr} ${ampm}`;
                                                };
                                                
                                                const startTime = formatTime(payment.booking?.start_time);
                                                const endTime = formatTime(payment.booking?.end_time);
                                                
                                                return (
                                                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-blue-600">
                                                        {payment.booking?.guest_name || payment.user?.name || 'Guest'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-gray-900">
                                                            {payment.booking?.court?.name || 'Unknown Court'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-medium text-gray-800">{payment.booking?.date}</span>
                                                            <span className="text-xs text-gray-500">{startTime} - {endTime}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-[#10221C]">₱{Number(payment.amount).toFixed(2)}</span>
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider">{payment.payment_method}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {payment.proof_path ? (
                                                            <button 
                                                                onClick={() => setSelectedImage(payment.proof_path.startsWith('http') ? payment.proof_path : `/storage/${payment.proof_path}`)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View Receipt
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">No receipt</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(payment.status)}`}>
                                                            {payment.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {payment.status === 'pending' && (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button 
                                                                    onClick={() => handleVerify(payment.booking_id)}
                                                                    disabled={processingId === payment.booking_id}
                                                                    className="inline-flex items-center gap-1 bg-[#10221C] text-white hover:bg-[#1a362d] px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                                                                >
                                                                    <Check className="w-3.5 h-3.5" />
                                                                    Verify
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleReject(payment.booking_id)}
                                                                    disabled={processingId === payment.booking_id}
                                                                    className="inline-flex items-center gap-1 bg-white text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {payment.status === 'verified' && (
                                                            <span className="text-xs text-gray-400 italic flex items-center justify-end gap-1">
                                                                <Check className="w-3.5 h-3.5 text-green-500" /> Payment Secured
                                                            </span>
                                                        )}
                                                        {payment.status === 'rejected' && (
                                                            <span className="text-xs text-gray-400 italic flex items-center justify-end gap-1">
                                                                <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Cancelled
                                                            </span>
                                                        )}
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
                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <img 
                            src={selectedImage} 
                            alt="Payment Receipt" 
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Beautiful Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10221C]/40 backdrop-blur-sm" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                    <div 
                        className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-md p-8 transform transition-all"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 mx-auto ${confirmModal.type === 'verify' ? 'bg-[#D6FF3F]/20 text-[#10221C]' : 'bg-red-100 text-red-600'}`}>
                            {confirmModal.type === 'verify' ? <Check className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                        </div>
                        
                        <h3 className="text-xl font-black text-center text-[#10221C] mb-3">
                            {confirmModal.title}
                        </h3>
                        <p className="text-sm text-center text-gray-500 mb-8 leading-relaxed px-4">
                            {confirmModal.message}
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={executeAction}
                                className={`w-full py-3.5 rounded-xl font-bold transition-all ${confirmModal.btnColor}`}
                            >
                                {confirmModal.btnText}
                            </button>
                            <button 
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="w-full py-3.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
