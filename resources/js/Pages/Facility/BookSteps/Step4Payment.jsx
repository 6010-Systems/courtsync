import React, { useState, useEffect, useRef } from 'react';
import { Phone, Check, Copy, Building2, UploadCloud, FileCheck, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPeso } from '@/Components/MetricCard';

export default function Step4Payment({ 
    totalPrice, 
    subtotal, 
    bookingFee, 
    paymentMethod, 
    setPaymentMethod, 
    proofFile, 
    setProofFile, 
    facility 
}) {
    const [copied, setCopied] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const handleFileChange = (e) => {
        setUploadError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File size exceeds 5MB limit. Please choose a smaller image.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            setUploadError('Only image files (JPEG, PNG, WebP) are supported.');
            return;
        }

        setProofFile(file);
    };

    const handleCopyNumber = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const gcashName = facility?.gcash_name;
    const gcashNumber = facility?.gcash_number;
    const gcashQrUrl = facility?.gcash_qr_url;
    
    const mayaName = facility?.maya_name;
    const mayaNumber = facility?.maya_number;
    const mayaQrUrl = facility?.maya_qr_url;

    const currentNumber = paymentMethod === 'gcash' ? gcashNumber : mayaNumber;
    const currentName = paymentMethod === 'gcash' ? gcashName : mayaName;
    const currentQrUrl = paymentMethod === 'gcash' ? gcashQrUrl : mayaQrUrl;

    return (
        <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-5 border-b border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-[#10221C] mb-1">Select Payment Method</h2>
                    <p className="text-sm text-gray-500">Choose how you'd like to pay for your reservation.</p>
                </div>
                <div className="text-left sm:text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total Amount</span>
                    <span className="text-2xl sm:text-3xl font-black text-[#10221C]">{formatPeso(totalPrice)}</span>
                    {bookingFee > 0 && (
                        <span className="block text-[10px] font-medium text-gray-400 mt-0.5">
                            Includes {formatPeso(bookingFee)} booking fee
                        </span>
                    )}
                </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="mb-8">
                <div className="grid grid-cols-3 gap-2 bg-[#F5F2EA]/80 p-1.5 rounded-2xl max-w-xl mx-auto border border-[#101F1A]/5">
                    <button 
                        type="button"
                        onClick={() => setPaymentMethod('gcash')}
                        className={`relative py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === 'gcash' ? 'text-[#005CEE] font-black' : 'text-[#10221C]/60 hover:text-[#10221C]'
                        }`}
                    >
                        {paymentMethod === 'gcash' && (
                            <motion.div
                                layoutId="activePaymentTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-blue-100"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#005CEE]" />
                            GCash
                        </span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => setPaymentMethod('maya')}
                        className={`relative py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === 'maya' ? 'text-[#01C96F] font-black' : 'text-[#10221C]/60 hover:text-[#10221C]'
                        }`}
                    >
                        {paymentMethod === 'maya' && (
                            <motion.div
                                layoutId="activePaymentTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-emerald-100"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#01C96F]" />
                            Maya
                        </span>
                    </button>

                    <button 
                        type="button"
                        onClick={() => {
                            setPaymentMethod('pay_at_facility');
                            setProofFile(null);
                        }}
                        className={`relative py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                            paymentMethod === 'pay_at_facility' ? 'text-[#10221C] font-black' : 'text-[#10221C]/60 hover:text-[#10221C]'
                        }`}
                    >
                        {paymentMethod === 'pay_at_facility' && (
                            <motion.div
                                layoutId="activePaymentTab"
                                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-[#10221C]/10"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            Pay at Venue
                        </span>
                    </button>
                </div>
            </div>

            {/* Payment Content Area */}
            <div className="flex flex-col md:flex-row gap-8 items-stretch">
                {/* Left Card: Payment Instructions / QR */}
                <div className="w-full md:w-1/2 flex flex-col">
                    <AnimatePresence mode="wait">
                        {paymentMethod === 'pay_at_facility' ? (
                            <motion.div 
                                key="pay-facility"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 bg-gradient-to-b from-[#FAF9F5] to-white rounded-2xl border border-[#10221C]/10 p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-[#D6FF3F]/40 border border-[#D6FF3F] flex items-center justify-center text-[#10221C] mb-4">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#10221C]">Pay at the Facility Counter</h3>
                                    <p className="mt-2 text-xs sm:text-sm text-[#10221C]/70 leading-relaxed">
                                        No online transfer required. You can pay with cash, GCash, or card directly at the venue reception when you arrive for your game.
                                    </p>

                                    <div className="mt-5 space-y-2.5">
                                        <div className="flex items-start gap-2.5 text-xs text-[#10221C]/80">
                                            <div className="w-5 h-5 rounded-full bg-[#10221C]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                                            <span>Your slot will be reserved immediately upon confirmation.</span>
                                        </div>
                                        <div className="flex items-start gap-2.5 text-xs text-[#10221C]/80">
                                            <div className="w-5 h-5 rounded-full bg-[#10221C]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                                            <span>Arrive 10–15 minutes early and present your name or booking reference.</span>
                                        </div>
                                        <div className="flex items-start gap-2.5 text-xs text-[#10221C]/80">
                                            <div className="w-5 h-5 rounded-full bg-[#10221C]/5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                                            <span>Settle the payment of <strong className="text-[#10221C]">{formatPeso(totalPrice)}</strong> at the desk.</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-[#10221C]/5 flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Instant reservation hold — ready to play!</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key={`pay-${paymentMethod}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center"
                            >
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    {paymentMethod === 'gcash' ? 'GCash Merchant Details' : 'Maya Merchant Details'}
                                </p>

                                {currentQrUrl ? (
                                    <div className={`p-3 rounded-2xl border mb-5 flex items-center justify-center w-[220px] h-[220px] bg-white ${
                                        paymentMethod === 'gcash' ? 'border-blue-100 shadow-sm shadow-blue-50' : 'border-emerald-100 shadow-sm shadow-emerald-50'
                                    }`}>
                                        <img
                                            src={currentQrUrl}
                                            alt={`${paymentMethod} QR Code`}
                                            className="h-full w-full rounded-xl object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full max-w-[280px] p-5 rounded-2xl bg-gray-50 border border-gray-100 text-center mb-5">
                                        <Phone className={`w-8 h-8 mx-auto mb-2 ${paymentMethod === 'gcash' ? 'text-blue-500' : 'text-emerald-500'}`} />
                                        <p className="text-xs font-semibold text-gray-500">Scan QR not available</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Please transfer directly using the mobile number below</p>
                                    </div>
                                )}

                                <div className="text-center w-full">
                                    <h4 className="text-base font-bold text-[#10221C]">
                                        {currentName || `${facility?.name} (Front Desk)`}
                                    </h4>
                                    
                                    {currentNumber ? (
                                        <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-gray-50 border-gray-200">
                                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                                            <span className="font-mono font-bold text-sm text-[#10221C]">{currentNumber}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyNumber(currentNumber)}
                                                className="ml-1 text-xs text-gray-500 hover:text-[#10221C] transition p-1 rounded hover:bg-gray-200/60"
                                                title="Copy phone number"
                                            >
                                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 mt-1">Contact venue for account number</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Card: Upload Proof or Counter Confirmation */}
                <div className="w-full md:w-1/2 flex flex-col">
                    {paymentMethod === 'pay_at_facility' ? (
                        <div className="flex-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-[#D6FF3F]/30 border border-[#D6FF3F] text-[#10221C] flex items-center justify-center mb-3">
                                <FileCheck className="w-7 h-7 text-[#10221C]" />
                            </div>
                            <h3 className="font-bold text-[#10221C] text-base mb-1">No Receipt Required</h3>
                            <p className="text-xs sm:text-sm text-gray-500 max-w-xs mb-4">
                                You chose to pay at the venue. You do not need to upload any payment screenshot now.
                            </p>
                            <div className="w-full bg-[#FAF9F5] p-4 rounded-xl border border-gray-100 text-left text-xs text-[#10221C]/75 space-y-1">
                                <p className="font-bold text-[#10221C]">Next Step:</p>
                                <p>Click <strong>Confirm & Complete Booking</strong> below to submit your reservation.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-[#FAFAF8] p-6 rounded-2xl border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-[#10221C] mb-1 text-sm sm:text-base">Upload Payment Receipt</h3>
                                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                    Please attach a screenshot of your successful GCash or Maya transfer for verification.
                                </p>

                                {uploadError && (
                                    <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{uploadError}</span>
                                    </div>
                                )}

                                <label className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                                    proofFile 
                                        ? 'border-[#D6FF3F] bg-[#D6FF3F]/10 hover:bg-[#D6FF3F]/20' 
                                        : 'border-gray-300 hover:border-[#10221C]/30 hover:bg-white bg-white/60'
                                }`}>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/png,image/jpeg,image/webp" 
                                        onChange={handleFileChange} 
                                    />
                                    
                                    {proofFile ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-[#D6FF3F] text-[#10221C] flex items-center justify-center mb-2 shadow-xs">
                                                <Check className="w-5 h-5 stroke-[3]" />
                                            </div>
                                            <span className="text-sm font-bold text-[#10221C] truncate max-w-full px-2">
                                                {proofFile.name}
                                            </span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">
                                                ({(proofFile.size / 1024).toFixed(0)} KB)
                                            </span>
                                            <span className="text-xs text-gray-600 mt-2 font-semibold underline underline-offset-2">
                                                Click to replace receipt
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-[#10221C]">Upload Transfer Screenshot</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WebP up to 5MB</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {proofFile && (
                                <button
                                    type="button"
                                    onClick={() => setProofFile(null)}
                                    className="mt-3 text-xs text-rose-600 font-bold hover:text-rose-700 flex items-center justify-center gap-1 self-center"
                                >
                                    <X className="w-3.5 h-3.5" /> Remove file
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
