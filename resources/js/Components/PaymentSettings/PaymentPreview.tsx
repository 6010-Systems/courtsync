import React, { useState } from 'react';
import { Check, Copy, QrCode } from 'lucide-react';
import { PaymentPreviewProps } from './types';

export const PaymentPreview: React.FC<PaymentPreviewProps> = ({
    method,
    accountName,
    accountNumber,
    qrPreviewUrl,
    facilityName,
}) => {
    const [copied, setCopied] = useState(false);
    const methodName = method === 'gcash' ? 'GCash' : 'Maya';

    const handleCopy = () => {
        if (!accountNumber) return;
        navigator.clipboard?.writeText(accountNumber.replace(/\s+/g, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="lg:sticky lg:top-20 flex flex-col gap-3">
            {/* Dark Forest Panel */}
            <div className="overflow-hidden rounded-2xl border border-[#10221C]/20 bg-[#10221C] p-4 sm:p-6 text-[#F5F2EA] shadow-xl">
                {/* Panel Header */}
                <div className="pb-3 sm:pb-4 border-b border-white/10">
                    <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight">
                        What players see
                    </h2>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-[#F5F2EA]/60">
                        Preview of the checkout step during court reservation.
                    </p>
                </div>

                {/* Simulated Customer Checkout Card (Phone-proportioned) */}
                <div className="mt-3.5 sm:mt-4 max-w-sm mx-auto rounded-2xl border border-white/15 bg-[#162923] p-3.5 sm:p-5 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 sm:pb-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-5 sm:h-6 px-2 items-center justify-center rounded-md bg-[#D6FF3F] text-[#10221C] font-black text-[11px] sm:text-xs shrink-0">
                                {methodName}
                            </span>
                            <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                                {facilityName || 'CourtSync Facility'}
                            </span>
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-medium text-white/50 shrink-0">
                            Manual Transfer
                        </span>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-4 sm:my-5 flex flex-col items-center justify-center">
                        {qrPreviewUrl ? (
                            <div className="flex flex-col items-center">
                                <div className="w-40 h-40 sm:w-48 sm:h-48 max-w-[190px] aspect-square rounded-xl bg-white p-2.5 shadow-md border border-white/20 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={qrPreviewUrl}
                                        alt={`${methodName} QR Code`}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                                <span className="mt-2 text-[10px] sm:text-[11px] font-medium text-white/60">
                                    Scan with {methodName} app
                                </span>
                            </div>
                        ) : (
                            /* Empty State: Clear Instructional Placeholder */
                            <div className="flex w-full max-w-[190px] aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/[0.03] p-3.5 text-center">
                                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white/70 mb-2">
                                    <QrCode size={20} strokeWidth={1.8} />
                                </div>
                                <p className="text-xs font-bold text-white/90">No QR Code</p>
                                <p className="mt-1 text-[10px] sm:text-[11px] text-white/50 leading-snug">
                                    Upload your {methodName} QR to display it to players.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Account Details Box */}
                    <div className="space-y-2 rounded-xl bg-black/25 p-2.5 sm:p-3 border border-white/10">
                        {/* Account Name */}
                        <div>
                            <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/50">
                                Account Name
                            </span>
                            <p className="mt-0.5 text-xs sm:text-sm font-bold text-white truncate">
                                {accountName ? (
                                    accountName
                                ) : (
                                    <span className="italic font-normal text-white/40">
                                        Not provided
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Account Number */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <div className="min-w-0 pr-2">
                                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white/50">
                                    {methodName} Number
                                </span>
                                <p className="mt-0.5 font-mono text-xs sm:text-sm font-bold text-[#D6FF3F] tracking-wider truncate">
                                    {accountNumber ? (
                                        accountNumber
                                    ) : (
                                        <span className="italic font-normal text-white/40 font-sans">
                                            Not provided
                                        </span>
                                    )}
                                </p>
                            </div>

                            {accountNumber && (
                                <button
                                    type="button"
                                    onClick={handleCopy}
                                    title="Copy number"
                                    className="flex items-center gap-1 rounded-lg bg-white/10 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-white hover:bg-white/20 transition-colors shrink-0"
                                >
                                    {copied ? (
                                        <>
                                            <Check size={11} className="text-[#D6FF3F]" />
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

                    {/* Customer Instruction */}
                    <p className="mt-2.5 sm:mt-3 text-center text-[10px] sm:text-[11px] text-white/50">
                        Players send the payment screenshot during checkout to confirm their slot.
                    </p>
                </div>
            </div>
        </div>
    );
};
