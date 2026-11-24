import React, { useState, useEffect, useRef } from 'react';
import { Check, Copy, Info, Lightbulb, Phone, X } from 'lucide-react';
import Modal from '@/Components/Modal';

import { formatPeso } from '@/Components/MetricCard';

const PAYMENT_TIPS = [
    'Take a screenshot of the QR code, open your preferred payment app, and scan or upload the saved QR code to complete the payment.',
    'Alternatively, copy the payment number and use it in your wallet app.',
    'You can use GCash, PayMaya, or any other supported wallet app.',
];

/**
 * Older browsers and non-secure (http) origins don't expose the Clipboard API,
 * so fall back to a temporary, off-screen textarea + execCommand.
 */
const copyTextToClipboard = (value, onCopied) => {
    if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(value).then(onCopied).catch(() => copyViaTextarea(value, onCopied));

        return;
    }

    copyViaTextarea(value, onCopied);
};

const copyViaTextarea = (value, onCopied) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        onCopied();
    } catch (error) {
        // Clipboard access denied — nothing else we can do here.
    }

    document.body.removeChild(textarea);
};

export default function Step4Payment({ totalPrice, subtotal, bookingFee, paymentMethod, setPaymentMethod, proofFile, setProofFile, facility }) {
    const hasDefaulted = useRef(false);
    const copiedTimeout = useRef(null);
    const [numberCopied, setNumberCopied] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofFile(e.target.files[0]);
        }
    };

    // Fallback static details if facility owner hasn't set them yet
    const gcashName = facility?.gcash_name;
    const gcashNumber = facility?.gcash_number;
    const gcashQrUrl = facility?.gcash_qr_url;
    
    const mayaName = facility?.maya_name;
    const mayaNumber = facility?.maya_number;
    const mayaQrUrl = facility?.maya_qr_url;

    const isWalletMethod = paymentMethod === 'gcash' || paymentMethod === 'maya';
    const activeName = paymentMethod === 'gcash' ? gcashName : mayaName;
    const activeNumber = paymentMethod === 'gcash' ? gcashNumber : mayaNumber;
    const activeQrUrl = paymentMethod === 'gcash' ? gcashQrUrl : mayaQrUrl;

    useEffect(() => () => clearTimeout(copiedTimeout.current), []);

    useEffect(() => {
        setNumberCopied(false);
        clearTimeout(copiedTimeout.current);
    }, [paymentMethod]);

    const handleCopyNumber = () => {
        if (!activeNumber) return;

        copyTextToClipboard(activeNumber, () => {
            setNumberCopied(true);
            clearTimeout(copiedTimeout.current);
            copiedTimeout.current = setTimeout(() => setNumberCopied(false), 2000);
        });
    };

    // Auto-select a default payment method on arrival so a QR is shown immediately
    useEffect(() => {
        if (!hasDefaulted.current && paymentMethod === 'pay_at_facility') {
            if (gcashQrUrl || gcashName || gcashNumber) {
                setPaymentMethod('gcash');
            } else if (mayaQrUrl || mayaName || mayaNumber) {
                setPaymentMethod('maya');
            }
            hasDefaulted.current = true;
        }
    }, [paymentMethod, setPaymentMethod, gcashQrUrl, gcashName, gcashNumber, mayaQrUrl, mayaName, mayaNumber]);

    return (
        <>
        <div className="p-4 sm:p-8 lg:p-10">
            <div className="mb-3 flex items-start justify-between gap-2 sm:mb-5">
                <div className="min-w-0">
                    <h2 className="text-base font-black leading-tight text-[#10221C] sm:text-xl">Payment Details</h2>
                    <p className="mt-0.5 text-[10px] text-gray-500 sm:text-xs">Select a payment method and upload your receipt.</p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="text-right">
                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest sm:text-[10px]">Amount to Pay</span>
                        <span className="text-base font-black leading-tight text-[#10221C] sm:text-xl">{formatPeso(totalPrice)}</span>
                        {bookingFee > 0 && (
                            <span className="block text-[9px] font-medium text-gray-400 sm:text-[10px]">
                                Includes {formatPeso(bookingFee)} booking fee
                            </span>
                        )}
                    </div>

                    {isWalletMethod && (
                        <button
                            type="button"
                            onClick={() => setShowInstructions(true)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#10221C]/15 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#10221C]/70 transition-colors hover:border-[#10221C]/35 hover:text-[#10221C] cursor-pointer sm:text-[10px]"
                        >
                            <Info size={11} />
                            <span className="sm:hidden">How to pay</span>
                            <span className="hidden sm:inline">Payment Instructions</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-5 sm:gap-8 items-center">
                {/* Premium GCash Payment Card */}
                <div className="w-full md:w-1/2 flex flex-col items-center">
                    
                    {/* Payment Method Tabs */}
                    <div className="mb-3 flex w-full max-w-[200px] gap-1 rounded-full bg-gray-100 p-1 sm:mb-4 sm:max-w-[240px]">
                        <button 
                            className={`flex-1 h-9 sm:h-10 flex justify-center items-center rounded-full transition-all duration-200 ${paymentMethod === 'gcash' ? 'bg-white shadow-md' : 'hover:bg-gray-200'}`}
                            onClick={() => setPaymentMethod('gcash')}
                        >
                            <img 
                                src="https://logos-world.net/wp-content/uploads/2023/05/GCash-Logo.png" 
                                alt="GCash" 
                                className={`h-5 sm:h-6 object-contain transition-all duration-200 ${paymentMethod === 'gcash' ? '' : 'grayscale opacity-40'}`} 
                            />
                        </button>
                        <button 
                            className={`flex-1 h-9 sm:h-10 flex justify-center items-center rounded-full transition-all duration-200 ${paymentMethod === 'maya' ? 'bg-white shadow-md' : 'hover:bg-gray-200'}`}
                            onClick={() => setPaymentMethod('maya')}
                        >
                            <img 
                                src="https://assets-global.website-files.com/60c6db70dedd88514dfdf8e9/62ff6cd412d11d5bb2b55342_maya-logo.png" 
                                alt="Maya" 
                                className={`h-4 sm:h-5 object-contain transition-all duration-200 ${paymentMethod === 'maya' ? '' : 'grayscale opacity-40'}`} 
                            />
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem]  shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden w-full max-w-[340px] relative transition-transform duration-300 min-h-[300px] sm:min-h-[350px]">
                        {/* Body */}
                        {isWalletMethod ? (
                        <div className="p-5 sm:p-8 flex flex-col items-center bg-gradient-to-b from-white to-[#F8FAFC] h-full">
                            <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 sm:mb-5">Scan to Pay</p>
                            
                            <div className={`bg-white p-3 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.05)] mb-5 sm:mb-8 ring-1 flex items-center justify-center w-[190px] h-[190px] sm:w-[250px] sm:h-[250px] ${paymentMethod === 'gcash' ? 'shadow-[0_0_20px_rgba(0,92,238,0.1)] ring-blue-50' : 'shadow-[0_0_20px_rgba(1,201,111,0.1)] ring-green-50'}`}>
                                <img
                                    src={activeQrUrl}
                                    alt={paymentMethod === 'gcash' ? 'GCash QR Code' : 'Maya QR Code'}
                                    className="h-full w-full rounded-2xl object-contain"
                                />
                            </div>
                            
                            {/* Account Details */}
                            <div className="text-center w-full">
                                <h3 className="text-[19px] font-black text-[#10221C] mb-2">
                                    {activeName}
                                </h3>
                                <div className={`inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full border ${paymentMethod === 'gcash' ? 'bg-[#EEF5FF] text-[#005CEE] border-[#DDEBFF]' : 'bg-[#E6F9F0] text-[#01C96F] border-[#CCF3E1]'}`}>
                                    <Phone className="w-4 h-4" />
                                    <span className="pl-1 font-semibold tracking-wide text-sm">
                                        {activeNumber || 'Not set'}
                                    </span>
                                    {activeNumber && (
                                        <button
                                            type="button"
                                            onClick={handleCopyNumber}
                                            aria-label={`Copy ${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment number`}
                                            title={numberCopied ? 'Copied!' : 'Copy payment number'}
                                            className="ml-0.5 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-colors hover:bg-black/5 cursor-pointer"
                                        >
                                            {numberCopied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                                    <span>Copied</span>
                                                </>
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}
                                </div>
                                <span className="sr-only" role="status" aria-live="polite">
                                    {numberCopied ? 'Payment number copied to clipboard' : ''}
                                </span>
                            </div>
                        </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 h-full min-h-[300px] sm:min-h-[350px] border-2 border-dashed border-gray-200">
                                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <p className="text-sm font-bold text-gray-400 text-center">Please select a payment method above</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Proof of Payment Section */}
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <div className="bg-[#FAFAF8] p-4 rounded-2xl border border-gray-100 sm:p-5">
                        <h3 className="font-bold text-[#10221C] mb-2 text-sm">Upload Proof of Payment</h3>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Please upload a screenshot or photo of your payment receipt. Your booking will be confirmed once verified.
                        </p>
                        
                        <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 sm:p-6 ${
                            proofFile 
                                ? 'border-[#D6FF3F] bg-[#D6FF3F]/10 hover:bg-[#D6FF3F]/20' 
                                : 'border-gray-300 hover:border-gray-400 hover:bg-white bg-white/50'
                        }`}>
                            <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                            />
                            
                            {proofFile ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-[#D6FF3F] text-[#10221C] flex items-center justify-center mb-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-[#10221C] truncate max-w-full px-4">{proofFile.name}</span>
                                    <span className="text-xs text-gray-500 mt-1 font-medium hover:text-[#10221C]">Click to replace file</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2 group-hover:text-[#10221C] transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-[#10221C]">Click to upload screenshot</span>
                                    <span className="text-xs text-gray-400 mt-1">JPEG, PNG up to 5MB</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>
            </div>

        </div>

        {/* Payment Instructions Modal */}
        <Modal show={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md">
            <div className="flex max-h-[85vh] flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101F1A] text-[#D6FF3F]">
                            <Info size={16} />
                        </span>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wide text-[#10221C]">Payment Instructions</h3>
                            <p className="text-[11px] text-gray-500">How to complete your booking payment</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowInstructions(false)}
                        aria-label="Close payment instructions"
                        className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4">
                    <p className="text-xs leading-relaxed text-gray-600">
                        Please take a screenshot of the QR code, then scan or upload it using another supported wallet app to complete the payment. Alternatively, copy the payment number and use it in your wallet app.
                    </p>

                    <div className="mt-4 rounded-xl border border-gray-100 bg-[#FAFAF8] p-4">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10221C]/60">
                            <Lightbulb size={13} className="text-[#10221C]/50" />
                            Tips
                        </p>
                        <p className="mt-2 text-xs font-bold text-[#10221C]">How to pay:</p>
                        <ul className="mt-1.5 space-y-1.5">
                            {PAYMENT_TIPS.map((tip) => (
                                <li key={tip} className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#10221C]/30" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {activeNumber && (
                        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2">
                            <div>
                                <span className="block text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">
                                    {paymentMethod === 'gcash' ? 'GCash number' : 'Maya number'}
                                </span>
                                <span className="text-sm font-black text-[#10221C]">{activeNumber}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyNumber}
                                aria-label={`Copy ${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment number`}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold text-[#10221C]/70 transition-colors hover:bg-[#101F1A]/[0.06] hover:text-[#10221C] cursor-pointer"
                            >
                                {numberCopied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 bg-[#FAFAF8] px-5 py-3.5">
                    <button
                        type="button"
                        onClick={() => setShowInstructions(false)}
                        className="w-full rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923] cursor-pointer"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </Modal>
        </>
    );
}
