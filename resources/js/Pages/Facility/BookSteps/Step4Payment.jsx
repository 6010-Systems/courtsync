import React, { useState, useEffect, useRef } from 'react';
import { 
    Check, 
    Copy, 
    Info, 
    Lightbulb, 
    Phone, 
    ShieldCheck, 
    UploadCloud, 
    X, 
    FileImage, 
    QrCode, 
    CheckCircle2,
    Maximize2, 
    Download
} from 'lucide-react';

import Modal from '@/Components/Modal';
import { formatPeso } from '@/Components/MetricCard';
import { GCashLogo, MayaLogo } from '@/Components/Icons/PaymentLogos';

const PAYMENT_TIPS = [
    'Take a screenshot of the QR code, open your e-wallet app, and select "Scan from Gallery".',
    'Alternatively, copy the exact mobile number and transfer via Express Send (GCash) or Send Money (Maya).',
    'Make sure to transfer the exact amount and save the confirmation receipt.',
];

/**
 * Robust clipboard copy helper with fallback
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
        // Fallback failed
    }

    document.body.removeChild(textarea);
};

export default function Step4Payment({ 
    totalPrice = 0, 
    subtotal = 0, 
    bookingFee = 0, 
    paymentMethod = 'gcash', 
    setPaymentMethod = () => {}, 
    proofFile = null, 
    setProofFile = () => {}, 
    facility = null 
}) {
    const hasDefaulted = useRef(false);
    const copiedTimeout = useRef(null);
    const amountCopiedTimeout = useRef(null);
    const fileInputRef = useRef(null);

    const [numberCopied, setNumberCopied] = useState(false);
    const [amountCopied, setAmountCopied] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showQrZoom, setShowQrZoom] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState('');

    // Facility payment configurations
    const gcashName = facility?.gcash_name;
    const gcashNumber = facility?.gcash_number;
    const gcashQrUrl = facility?.gcash_qr_url;
    
    const mayaName = facility?.maya_name;
    const mayaNumber = facility?.maya_number;
    const mayaQrUrl = facility?.maya_qr_url;

    const isWalletMethod = paymentMethod === 'gcash' || paymentMethod === 'maya';
    const activeName = paymentMethod === 'gcash' ? (gcashName || facility?.name) : (mayaName || facility?.name);
    const activeNumber = paymentMethod === 'gcash' ? gcashNumber : mayaNumber;
    const activeQrUrl = paymentMethod === 'gcash' ? gcashQrUrl : mayaQrUrl;

    // Handle live preview of uploaded receipt
    useEffect(() => {
        if (!proofFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(proofFile);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [proofFile]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
            if (amountCopiedTimeout.current) clearTimeout(amountCopiedTimeout.current);
        };
    }, []);

    useEffect(() => {
        setNumberCopied(false);
        if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
    }, [paymentMethod]);

    // Auto-select valid wallet on mount if present
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

    const handleCopyNumber = () => {
        if (!activeNumber) return;
        copyTextToClipboard(activeNumber, () => {
            setNumberCopied(true);
            if (copiedTimeout.current) clearTimeout(copiedTimeout.current);
            copiedTimeout.current = setTimeout(() => setNumberCopied(false), 2000);
        });
    };

    const handleCopyAmount = () => {
        const rawAmount = String(totalPrice.toFixed(2));
        copyTextToClipboard(rawAmount, () => {
            setAmountCopied(true);
            if (amountCopiedTimeout.current) clearTimeout(amountCopiedTimeout.current);
            amountCopiedTimeout.current = setTimeout(() => setAmountCopied(false), 2000);
        });
    };

    const validateAndSetFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setFileError('Please select a valid image receipt (JPG, PNG, WebP).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setFileError('File exceeds 10MB limit. Please upload a smaller screenshot.');
            return;
        }
        setFileError('');
        setProofFile(file);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        const k = 1024;
        if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
        return `${(bytes / (k * k)).toFixed(1)} MB`;
    };

    return (
        <div className="p-3 sm:p-5 max-w-4xl mx-auto h-full flex flex-col justify-between">
            {/* Lean Step Header */}
            <div className="flex items-center justify-between pb-2 mb-2 sm:mb-3 border-b border-[#101F1A]/6">
                <div>
                    <h2 className="text-base sm:text-xl font-black text-[#101F1A] tracking-tight">
                        Payment & Verification
                    </h2>
                    <p className="text-[10px] sm:text-xs text-[#101F1A]/60">
                        Transfer the amount and upload your payment receipt screenshot.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setShowInstructions(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#101F1A]/12 bg-white text-[10px] sm:text-[11px] font-bold text-[#101F1A] hover:bg-[#FAF9F5] transition shadow-2xs cursor-pointer shrink-0"
                >
                    <Info size={12} className="text-[#101F1A]/60" />
                    <span>How to pay</span>
                </button>
            </div>

            {/* Main Content: Responsive Stacking for Mobile & 2-Column Bento for Desktop */}
            <div className="flex flex-col md:grid md:grid-cols-12 gap-3 sm:gap-4 items-stretch flex-1 min-h-0 pb-1 sm:pb-0">
                {/* MOBILE ONLY: Prominent Amount Banner (Visible on mobile, hidden on md+) */}
                <div className="md:hidden bg-[#FAF9F5] rounded-xl border border-[#101F1A]/10 p-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <span className="block text-[8px] font-black uppercase tracking-wider text-[#101F1A]/60">
                                Exact Amount to Transfer
                            </span>
                            <span className="text-lg font-black text-[#101F1A] tracking-tight">
                                {formatPeso(totalPrice)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyAmount}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#101F1A] hover:text-white text-xs font-bold text-[#101F1A] border border-[#101F1A]/10 transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
                        >
                            {amountCopied ? (
                                <>
                                    <Check size={12} strokeWidth={3} className="text-emerald-500" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={12} />
                                    <span>Copy Amount</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* LEFT COLUMN: Payment Method Switcher & QR / Account Details (6 cols on md) */}
                <div className="md:col-span-6 flex flex-col justify-between bg-white rounded-2xl border border-[#101F1A]/10 p-3 sm:p-4 shadow-2xs">
                    <div>
                        {/* Method Tabs Segmented Bar */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF9F5] border border-[#101F1A]/8 rounded-xl mb-2 sm:mb-2.5">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('gcash')}
                                className={`flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    paymentMethod === 'gcash'
                                        ? 'bg-white shadow-xs text-[#005CEE] border border-blue-100 ring-1 ring-blue-500/10'
                                        : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/50'
                                }`}
                            >
                                <GCashLogo size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('maya')}
                                className={`flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                    paymentMethod === 'maya'
                                        ? 'bg-white shadow-xs text-[#101F1A] border border-emerald-100 ring-1 ring-emerald-500/10'
                                        : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/50'
                                }`}
                            >
                                <MayaLogo size={16} />
                            </button>
                        </div>

                        {/* QR Display Area */}
                        <div className="flex flex-col items-center text-center">
                            {activeQrUrl ? (
                                <div className="w-full flex flex-col items-center">
                                    <div 
                                        onClick={() => setShowQrZoom(true)}
                                        className="relative p-2 bg-white rounded-xl border border-[#101F1A]/10 shadow-xs flex items-center justify-center w-full max-w-[190px] sm:max-w-[230px] h-[175px] sm:h-[205px] mb-1.5 cursor-pointer group hover:border-[#101F1A]/25 transition-all hover:shadow-sm"
                                        title="Click to zoom QR Code"
                                    >
                                        {/* Subtle, Aesthetic Corner Framing Reticles */}
                                        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#101F1A]/25 rounded-tl-[4px] pointer-events-none group-hover:border-[#101F1A]/40 transition-colors" />
                                        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[#101F1A]/25 rounded-tr-[4px] pointer-events-none group-hover:border-[#101F1A]/40 transition-colors" />
                                        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[#101F1A]/25 rounded-bl-[4px] pointer-events-none group-hover:border-[#101F1A]/40 transition-colors" />
                                        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#101F1A]/25 rounded-br-[4px] pointer-events-none group-hover:border-[#101F1A]/40 transition-colors" />

                                        {/* Centered QR Code Image */}
                                        <img 
                                            src={activeQrUrl} 
                                            alt={`${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} QR`}
                                            className="w-full h-full object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
                                        />
                                    </div>

                                    {/* Action links under QR */}
                                    <div className="flex items-center gap-2.5 text-[10px] mb-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowQrZoom(true)}
                                            className="text-[#101F1A] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                        >
                                            <Maximize2 size={10} className="text-[#101F1A]/60" />
                                            <span>Full QR</span>
                                        </button>
                                        <span className="text-gray-300">•</span>
                                        <a 
                                            href={activeQrUrl} 
                                            download={`${paymentMethod}-qr-code`}
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[#101F1A] font-bold hover:underline inline-flex items-center gap-1"
                                        >
                                            <Download size={10} className="text-[#101F1A]/60" />
                                            <span>Save</span>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full max-w-[190px] sm:max-w-[230px] h-[175px] rounded-xl bg-[#FAF9F5] border-2 border-dashed border-[#101F1A]/15 flex flex-col items-center justify-center p-3 mb-2">
                                    <div className="w-9 h-9 rounded-full bg-[#101F1A]/5 flex items-center justify-center text-[#101F1A] mb-1.5">
                                        <QrCode size={18} className="text-[#101F1A]/70" />
                                    </div>
                                    <span className="text-xs font-bold text-[#101F1A]">Direct Transfer</span>
                                    <span className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                                        Send to mobile number below
                                    </span>
                                </div>
                            )}

                            {/* Account Identity Meta */}
                            <div className="w-full mt-0.5">
                                <span className="block text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                    Account Name
                                </span>
                                <h4 className="text-xs sm:text-sm font-black text-[#101F1A] leading-tight truncate px-2" title={activeName}>
                                    {activeName || 'Venue Account'}
                                </h4>

                                {/* Copyable Mobile Number Pill */}
                                <div className="mt-1.5 inline-flex items-center gap-1.5 pl-3 pr-1 py-0.5 rounded-full bg-[#FAF9F5] border border-[#101F1A]/10 max-w-full">
                                    <Phone size={11} className="text-[#101F1A]/50 shrink-0" />
                                    <span className="font-mono text-xs font-bold text-[#101F1A] tracking-wider truncate">
                                        {activeNumber || 'Contact venue'}
                                    </span>
                                    {activeNumber && (
                                        <button
                                            type="button"
                                            onClick={handleCopyNumber}
                                            className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white hover:bg-[#101F1A] hover:text-white text-[10px] font-bold text-[#101F1A] border border-[#101F1A]/10 transition shadow-2xs cursor-pointer active:scale-95"
                                        >
                                            {numberCopied ? (
                                                <>
                                                    <Check size={11} strokeWidth={3} className="text-emerald-500" />
                                                    <span>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={11} />
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compact Step indicator guide */}
                    <div className="pt-2 border-t border-[#101F1A]/6 flex items-center justify-between text-[10px] text-gray-400">
                        <span>1. Open wallet</span>
                        <span>•</span>
                        <span>2. Scan/Send</span>
                        <span>•</span>
                        <span>3. Upload proof</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Amount Card (Desktop) + Upload Receipt Zone (6 cols on md) */}
                <div className="md:col-span-6 flex flex-col justify-between gap-2.5">
                    {/* DESKTOP ONLY Amount to Pay Card (Hidden on mobile to avoid duplication) */}
                    <div className="hidden md:block bg-[#FAF9F5] rounded-2xl border border-[#101F1A]/10 p-3 sm:p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-wider text-[#101F1A]/60">
                                    Exact Amount to Transfer
                                </span>
                                <span className="text-xl sm:text-2xl font-black text-[#101F1A] tracking-tight">
                                    {formatPeso(totalPrice)}
                                </span>
                                <p className="text-[9px] text-gray-400 font-medium">
                                    Subtotal: {formatPeso(subtotal)} {bookingFee > 0 ? `· Fee: ${formatPeso(bookingFee)}` : '· Free fee'}
                                </p>
                            </div>

                            {/* 1-Tap Copy Exact Amount Button */}
                            <button
                                type="button"
                                onClick={handleCopyAmount}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#101F1A] hover:text-white text-xs font-bold text-[#101F1A] border border-[#101F1A]/10 transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                title="Copy exact amount for payment app"
                            >
                                {amountCopied ? (
                                    <>
                                        <Check size={12} strokeWidth={3} className="text-emerald-500" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={12} />
                                        <span>Copy Amount</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Proof of Payment Upload Dropzone */}
                    <div className="bg-white rounded-2xl border border-[#101F1A]/10 p-3 sm:p-3.5 shadow-2xs flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                                <FileImage size={13} className="text-[#101F1A]" />
                                <h3 className="text-xs font-black text-[#101F1A] uppercase tracking-wide">
                                    Upload Payment Proof
                                </h3>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                proofFile 
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-900 border border-amber-200/80 animate-pulse'
                            }`}>
                                {proofFile ? 'Attached' : 'Required'}
                            </span>
                        </div>

                        {/* Interactive Dropzone / Preview Area */}
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl transition-all cursor-pointer p-2.5 sm:p-3 text-center my-1 ${
                                proofFile
                                    ? 'border-emerald-500/40 bg-emerald-50/20 hover:bg-emerald-50/40'
                                    : isDragging
                                        ? 'border-[#101F1A] bg-[#101F1A]/5 scale-[0.99]'
                                        : 'border-[#101F1A]/15 bg-[#FAF9F5] hover:border-[#101F1A]/35 hover:bg-white'
                            }`}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg,image/png,image/webp" 
                                onChange={handleFileChange} 
                            />

                            {proofFile ? (
                                <div className="flex items-center gap-2.5 text-left">
                                    {/* Receipt Image Thumbnail Preview */}
                                    <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#101F1A]/10 bg-white shrink-0 shadow-2xs">
                                        {previewUrl ? (
                                            <img 
                                                src={previewUrl} 
                                                alt="Receipt preview" 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <FileImage size={16} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* File metadata & Change control */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1">
                                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                            <span className="text-xs font-bold text-[#101F1A] truncate" title={proofFile.name}>
                                                {proofFile.name}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-gray-500 mt-0.5">
                                            {formatFileSize(proofFile.size)} · Click to change file
                                        </p>
                                    </div>

                                    {/* Clear Button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProofFile(null);
                                        }}
                                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                                        title="Remove file"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-1">
                                    <div className="w-8 h-8 rounded-full bg-white border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] mb-1 shadow-2xs">
                                        <UploadCloud size={16} className="text-[#101F1A]/70" />
                                    </div>
                                    <p className="text-xs font-bold text-[#101F1A]">
                                        Tap to browse or drop receipt
                                    </p>
                                    <p className="text-[9px] text-gray-400 mt-0.5">
                                        Supports JPG, PNG, WebP up to 10MB
                                    </p>
                                </div>
                            )}
                        </div>

                        {fileError && (
                            <p className="text-[10px] font-bold text-rose-600 px-1 py-0.5 mt-0.5">
                                {fileError}
                            </p>
                        )}

                        {/* Security Callout */}
                        <div className="mt-2 pt-2 border-t border-[#101F1A]/6 flex items-center gap-1.5 text-[10px] text-[#101F1A]/70">
                            <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                            <span>Payment receipt is verified directly by facility management.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* High-Resolution Fullscreen QR Modal */}
            <Modal show={showQrZoom} onClose={() => setShowQrZoom(false)} maxWidth="sm">
                <div className="p-5 sm:p-6 bg-white flex flex-col items-center text-center">
                    <div className="w-full flex items-center justify-between pb-3 border-b border-[#101F1A]/10 mb-4">
                        <div className="flex items-center gap-2">
                            {paymentMethod === 'gcash' ? <GCashLogo size={18} /> : <MayaLogo size={18} />}
                            <span className="text-xs font-black uppercase tracking-wider text-[#101F1A]">QR Code</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowQrZoom(false)}
                            className="p-1 rounded-lg text-gray-400 hover:text-[#101F1A] hover:bg-gray-100 transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Expanded QR Image */}
                    <div className="p-3 bg-white rounded-2xl border border-[#101F1A]/10 shadow-lg max-w-[320px] w-full aspect-square flex items-center justify-center mb-4">
                        <img 
                            src={activeQrUrl} 
                            alt={`${paymentMethod} full QR`}
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <h4 className="text-sm font-black text-[#101F1A]">{activeName}</h4>
                    {activeNumber && (
                        <p className="font-mono text-xs font-bold text-gray-500 mt-0.5">{activeNumber}</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 w-full flex items-center justify-center gap-3">
                        <a 
                            href={activeQrUrl} 
                            download={`${paymentMethod}-qr-code`}
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101F1A] text-[#D6FF3F] text-xs font-black shadow-md hover:bg-[#1a382d] transition cursor-pointer"
                        >
                            <Download size={13} />
                            <span>Save to Gallery</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setShowQrZoom(false)}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#101F1A] text-xs font-bold transition cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Payment Instructions Modal */}
            <Modal show={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md">
                <div className="flex max-h-[85vh] flex-col">
                    <div className="flex items-start justify-between gap-3 border-b border-[#101F1A]/10 px-5 py-4 bg-[#FAF9F5]">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#101F1A] text-[#D6FF3F]">
                                <Info size={16} />
                            </span>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wide text-[#101F1A]">Payment Instructions</h3>
                                <p className="text-[11px] text-gray-500">Step-by-step payment verification</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowInstructions(false)}
                            aria-label="Close payment instructions"
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="overflow-y-auto px-5 py-4 space-y-4">
                        <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAF9F5] p-4">
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#101F1A]">
                                <Lightbulb size={13} className="text-[#101F1A]/70" />
                                Quick Steps
                            </p>
                            <ul className="mt-2 space-y-2">
                                {PAYMENT_TIPS.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                                        <span className="w-4 h-4 rounded-full bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {activeNumber && (
                            <div className="flex items-center justify-between gap-2 rounded-xl border border-[#101F1A]/10 bg-white p-3">
                                <div>
                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                        {paymentMethod === 'gcash' ? 'GCash Number' : 'Maya Number'}
                                    </span>
                                    <span className="font-mono text-sm font-black text-[#101F1A]">{activeNumber}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyNumber}
                                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold bg-[#101F1A] text-white hover:bg-[#1a382d] transition cursor-pointer"
                                >
                                    {numberCopied ? (
                                        <>
                                            <Check size={12} strokeWidth={3} className="text-[#D6FF3F]" />
                                            <span>Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#101F1A]/8 bg-[#FAF9F5] px-5 py-3">
                        <button
                            type="button"
                            onClick={() => setShowInstructions(false)}
                            className="w-full rounded-xl bg-[#101F1A] px-4 py-2 text-xs font-black text-[#D6FF3F] hover:bg-[#1a382d] transition cursor-pointer shadow-md"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
