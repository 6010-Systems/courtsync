import React from 'react';
import { Head, Link } from '@inertiajs/react';

import Step1Court from './BookSteps/Step1Court';
import Step2DateTime from './BookSteps/Step2DateTime';
import Step3Confirm from './BookSteps/Step3Confirm';
import Step4Payment from './BookSteps/Step4Payment';
import { useBookingLogic } from './BookSteps/useBookingLogic';

export default function Book({ facility }) {
    const {
        selectableCourts,
        selectedCourtId, setSelectedCourtId,
        selectedDate, setSelectedDate,
        startTime, setStartTime,
        endTime, setEndTime,
        paymentMethod, setPaymentMethod,
        step, setStep,
        modal, closeModal,
        processing,
        selectedCourt,
        timeOptions,
        dates,
        goNext, goPrev,
        handleBooking,
        price, durationHours, totalPrice,
        formatTimeString, formatDateString,
        canGoNext, isCustomDate, canConfirm,
        proofFile, setProofFile
    } = useBookingLogic(facility);

    // STEP CONFIGURATION ARRAY
    const stepsData = [
        {
            id: 1,
            label: 'Select Court',
            component: <Step1Court 
                facilityName={facility.name}
                selectableCourts={selectableCourts}
                selectedCourtId={selectedCourtId}
                setSelectedCourtId={setSelectedCourtId}
            />
        },
        {
            id: 2,
            label: 'Date & Time',
            component: <Step2DateTime 
                selectedCourt={selectedCourt}
                price={price}
                dates={dates}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                isCustomDate={isCustomDate}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                timeOptions={timeOptions}
                durationHours={durationHours}
                formatDateString={formatDateString}
                formatTimeString={formatTimeString}
            />
        },
        {
            id: 3,
            label: 'Review',
            component: <Step3Confirm 
                selectedCourt={selectedCourt}
                price={price}
                selectedDate={selectedDate}
                formatDateString={formatDateString}
                startTime={startTime}
                endTime={endTime}
                formatTimeString={formatTimeString}
                durationHours={durationHours}
                totalPrice={totalPrice}
            />
        },
        {
            id: 4,
            label: 'Payment',
            component: <Step4Payment 
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                totalPrice={totalPrice}
                proofFile={proofFile}
                setProofFile={setProofFile}
                facility={facility}
            />
        }
    ];

    const currentStepData = stepsData.find(s => s.id === step) || stepsData[0];

    return (
        <div className="min-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C] flex flex-col">
            <Head title={`Book a Court - ${facility.name}`} />

            {/* Top Bar */}
            <div className="bg-[#F5F2EA] border-b border-gray-200/60 px-4 sm:px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link 
                        href={route('facility.show', facility.slug)}
                        className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#10221C] transition group"
                    >
                        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>You're booking at <strong className="text-[#10221C]">{facility.name}</strong></span>
                    </Link>
                   
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-[#F5F2EA] px-4 sm:px-6 pt-6 pb-2">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        {stepsData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                                    step > s.id ? 'bg-[#10221C] text-white' : 
                                    step === s.id ? 'bg-[#D6FF3F] text-[#10221C] shadow-md shadow-[#D6FF3F]/30' : 
                                    'bg-gray-200 text-gray-400'
                                }`}>
                                    {step > s.id ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    ) : s.id}
                                </div>
                                <span className={`text-xs font-bold hidden sm:block transition-colors ${step === s.id ? 'text-[#10221C]' : 'text-gray-400'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#D6FF3F] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${((step - 1) / (stepsData.length - 1)) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Main Wizard Content */}
            <div className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6 sm:py-8">
                <div className="w-full max-w-4xl">
                    
                    {selectableCourts.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold text-[#10221C] mb-2">No Courts Available</h3>
                            <p className="text-gray-500 text-sm">This facility hasn't listed any courts for booking yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            
                            {/* Render Active Step from Array */}
                            {currentStepData.component}

                            {/* Footer Navigation */}
                            <div className="px-6 sm:px-8 py-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-4">
                                {step > 1 ? (
                                    <button
                                        onClick={goPrev}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#10221C] transition px-4 py-2.5 rounded-lg hover:bg-gray-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                        Previous
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {step < stepsData.length ? (
                                    <button
                                        onClick={goNext}
                                        disabled={!canGoNext()}
                                        className={`inline-flex items-center gap-2 text-sm font-black px-6 py-2.5 rounded-lg transition-all duration-200 ${
                                            canGoNext() 
                                                ? 'bg-[#10221C] text-white hover:bg-[#1a362d] shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        Next
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleBooking}
                                        disabled={!canConfirm || processing}
                                        className={`inline-flex items-center gap-2 text-sm font-black px-6 py-2.5 rounded-lg transition-all duration-200 ${
                                            canConfirm && !processing 
                                                ? 'bg-[#10221C] text-white hover:bg-[#1a362d] shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Booking
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Result Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10221C]/40 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${modal.type === 'success' ? 'bg-[#D6FF3F] text-[#10221C] shadow-lg shadow-[#D6FF3F]/30' : 'bg-red-100 text-red-600 shadow-lg shadow-red-100/50'}`}>
                            {modal.type === 'success' ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            )}
                        </div>
                        <h4 className="text-2xl font-black text-[#10221C] mb-2">
                            {modal.type === 'success' ? 'Booking Confirmed!' : 'Booking Failed'}
                        </h4>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">{modal.message}</p>
                        
                        {modal.type === 'success' ? (
                            <Link 
                                href={route('facility.show', facility.slug)}
                                className="block w-full py-3.5 rounded-xl font-bold transition-all bg-[#10221C] text-white hover:bg-[#1a362d] hover:-translate-y-0.5 shadow-md text-center text-sm"
                            >
                                Return to Facility
                            </Link>
                        ) : (
                            <button 
                                onClick={closeModal}
                                className="w-full py-3.5 rounded-xl font-bold transition-all bg-gray-100 text-[#10221C] hover:bg-gray-200 text-sm"
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
