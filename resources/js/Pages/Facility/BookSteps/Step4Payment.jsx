import React, { useState } from 'react';
import { Phone } from 'lucide-react';

export default function Step4Payment({ totalPrice, paymentMethod, setPaymentMethod, proofFile, setProofFile, facility }) {
    
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

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-6 flex justify-between items-end  pb-5">
                <div>
                    <h2 className="text-2xl font-black text-[#10221C] mb-1">Payment Details</h2>
                    <p className="text-sm text-gray-500">Select a payment method and upload your receipt.</p>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Amount to Pay</span>
                    <span className="text-2xl font-black text-[#10221C]">₱{totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Premium GCash Payment Card */}
                <div className="w-full md:w-1/2 flex flex-col items-center">
                    
                    {/* Payment Method Tabs */}
                    <div className="bg-gray-100 p-1.5 rounded-full mb-6 flex space-x-1.5 w-full max-w-[340px]">
                        <button 
                            className={`flex-1 h-16 flex justify-center items-center rounded-full transition-all duration-200 ${paymentMethod === 'gcash' ? 'bg-white shadow-md' : 'hover:bg-gray-200'}`}
                            onClick={() => setPaymentMethod('gcash')}
                        >
                            <img 
                                src="https://logos-world.net/wp-content/uploads/2023/05/GCash-Logo.png" 
                                alt="GCash" 
                                className={`h-9 object-contain transition-all duration-200 ${paymentMethod === 'gcash' ? '' : 'grayscale opacity-40'}`} 
                            />
                        </button>
                        <button 
                            className={`flex-1 h-16 flex justify-center items-center rounded-full transition-all duration-200 ${paymentMethod === 'maya' ? 'bg-white shadow-md' : 'hover:bg-gray-200'}`}
                            onClick={() => setPaymentMethod('maya')}
                        >
                            <img 
                                src="https://assets-global.website-files.com/60c6db70dedd88514dfdf8e9/62ff6cd412d11d5bb2b55342_maya-logo.png" 
                                alt="Maya" 
                                className={`h-8 object-contain transition-all duration-200 ${paymentMethod === 'maya' ? '' : 'grayscale opacity-40'}`} 
                            />
                        </button>
                    </div>

                    <div className="bg-white rounded-[2rem]  shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden w-full max-w-[340px] relative transition-transform duration-300 min-h-[350px]">
                        {/* Body */}
                        {paymentMethod === 'gcash' || paymentMethod === 'maya' ? (
                        <div className="p-8 flex flex-col items-center bg-gradient-to-b from-white to-[#F8FAFC] h-full">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">Scan to Pay</p>
                            
                            <div className={`bg-white p-3 rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.05)] mb-8 ring-1 flex items-center justify-center ${paymentMethod === 'gcash' ? 'shadow-[0_0_20px_rgba(0,92,238,0.1)] ring-blue-50' : 'shadow-[0_0_20px_rgba(1,201,111,0.1)] ring-green-50'}`} style={{ width: '250px', height: '250px' }}>
                                <div className="rounded-2xl overflow-hidden relative" style={{ width: '180px', height: '180px', transform: 'scale(1.25)', transformOrigin: 'center' }}>
                                    {paymentMethod === 'gcash' ? (
                                        <img 
                                            src={gcashQrUrl} 
                                            alt="GCash QR Code" 
                                            className="max-w-none absolute"
                                            style={{
                                                width: '235%',
                                                maxWidth: 'none',
                                                top: '-231px',
                                                left: '-120px'
                                            }}
                                        />
                                    ) : (
                                        <img 
                                            src={mayaQrUrl} 
                                            alt="Maya QR Code" 
                                            className="max-w-none absolute"
                                            style={{
                                                width: '173%',
                                                maxWidth: 'none',
                                                top: '-105px',
                                                left: '-68px'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            
                            {/* Account Details */}
                            <div className="text-center w-full">
                                <h3 className="text-[19px] font-black text-[#10221C] mb-2">
                                    {paymentMethod === 'gcash' ? gcashName : mayaName}
                                </h3>
                                <div className={`inline-flex items-center justify-center space-x-2 px-4 py-1.5 rounded-full border ${paymentMethod === 'gcash' ? 'bg-[#EEF5FF] text-[#005CEE] border-[#DDEBFF]' : 'bg-[#E6F9F0] text-[#01C96F] border-[#CCF3E1]'}`}>
                                    <Phone className="w-4 h-4" />
                                    <span className="pl-2 font-semibold tracking-wide text-sm">
                                        {paymentMethod === 'gcash' ? gcashNumber : mayaNumber}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 h-full min-h-[350px] border-2 border-dashed border-gray-200">
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
                    <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-100">
                        <h3 className="font-bold text-[#10221C] mb-2 text-sm">Upload Proof of Payment</h3>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            Please upload a screenshot or photo of your payment receipt. Your booking will be confirmed once verified.
                        </p>
                        
                        <label className={`block w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
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
    );
}
