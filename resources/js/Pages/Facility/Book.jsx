import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, Check, AlertCircle, RotateCcw } from 'lucide-react';

import Step1Court from './BookSteps/Step1Court';
import Step2DateTime from './BookSteps/Step2DateTime';
import Step3Confirm from './BookSteps/Step3Confirm';
import Step4Payment from './BookSteps/Step4Payment';
import { useBookingLogic } from './BookSteps/useBookingLogic';
import TimerIcon from '@/Components/TimerIcon';

export default function Book({ facility, preselectedCourtId = null }) {
    const isPlayer = usePage().props.auth.user?.role === 'PLAYER';
    const {
        selectableCourts,
        availabilityBanner,
        operatingDaysLabel,
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
        price, durationHours, subtotal, bookingFee, totalPrice, pricingSummary,
        addonsTotal, addonLines,
        courtPlans, addonPlans, selectedRatePlan, ratePlanId, setRatePlanId,
        addonQuantities, setAddonQuantity,
        formatTimeString, formatDateString,
        canGoNext, isCustomDate, canConfirm,
        proofFile, setProofFile,
        lockSecondsRemaining,
        lockTimeFormatted,
    } = useBookingLogic(facility, preselectedCourtId);

    // STEP CONFIGURATION ARRAY
    const stepsData = [
        {
            id: 1,
            label: 'Select Court',
            component: <Step1Court 
                facilityName={facility.name}
                facility={facility}
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
                pricingSummary={pricingSummary}
                totalPrice={totalPrice}
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
                bookingFee={bookingFee}
                formatDateString={formatDateString}
                formatTimeString={formatTimeString}
                courtPlans={courtPlans}
                addonPlans={addonPlans}
                selectedRatePlan={selectedRatePlan}
                ratePlanId={ratePlanId}
                setRatePlanId={setRatePlanId}
                addonQuantities={addonQuantities}
                setAddonQuantity={setAddonQuantity}
                addonsTotal={addonsTotal}
            />
        },
        {
            id: 3,
            label: 'Review',
            component: <Step3Confirm 
                selectedCourt={selectedCourt}
                price={price}
                pricingSummary={pricingSummary}
                selectedDate={selectedDate}
                formatDateString={formatDateString}
                startTime={startTime}
                endTime={endTime}
                formatTimeString={formatTimeString}
                durationHours={durationHours}
                subtotal={subtotal}
                bookingFee={bookingFee}
                totalPrice={totalPrice}
                addonsTotal={addonsTotal}
                addonLines={addonLines}
                setStep={setStep}
            />
        },
        {
            id: 4,
            label: 'Payment',
            component: <Step4Payment 
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                subtotal={subtotal}
                bookingFee={bookingFee}
                totalPrice={totalPrice}
                proofFile={proofFile}
                setProofFile={setProofFile}
                facility={facility}
            />
        }
    ];

    const currentStepData = stepsData.find(s => s.id === step) || stepsData[0];
    const progressPercent = (step / stepsData.length) * 100;

    return (
        <div className="min-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C] flex flex-col">
            <Head title={`Book a Court - ${facility.name}`} />

            {/* Top Bar */}
            <header className="bg-[#F5F2EA] border-b border-gray-200/60 px-4 sm:px-6 py-4 sticky top-0 z-30 backdrop-blur-md bg-[#F5F2EA]/90">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                    <Link 
                        href={route('facility.show', facility.slug)}
                        className="inline-flex items-center text-sm font-bold text-gray-600 hover:text-[#10221C] transition group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                        <span>You're booking at <strong className="text-[#10221C]">{facility.name}</strong></span>
                    </Link>

                    {/* Active Slot Lock Timer Badge */}
                    {step >= 3 && lockSecondsRemaining > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs border transition-colors ${
                                lockSecondsRemaining < 120
                                    ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                                    : lockSecondsRemaining < 240
                                        ? 'bg-amber-100 text-amber-900 border-amber-200'
                                        : 'bg-[#D6FF3F]/40 text-[#10221C] border-[#D6FF3F]'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Slot held: <span className="font-mono">{lockTimeFormatted}</span></span>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Progress Stepper */}
            <div className="bg-[#F5F2EA] px-4 sm:px-6 pt-5 pb-3 border-b border-gray-200/40">
                <div className="max-w-5xl lg:max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-2.5">
                        {stepsData.map((s) => (
                            <div key={s.id} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                                    step > s.id 
                                        ? 'bg-[#10221C] text-[#D6FF3F]' 
                                        : step === s.id 
                                            ? 'bg-[#D6FF3F] text-[#10221C] shadow-md shadow-[#D6FF3F]/30 ring-2 ring-[#10221C]' 
                                            : 'bg-gray-200/80 text-gray-400'
                                }`}>
                                    {step > s.id ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                                </div>
                                <span className={`text-xs font-bold hidden sm:block transition-colors ${step === s.id ? 'text-[#10221C]' : 'text-gray-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar Line */}
                    <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-[#D6FF3F] h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {/* Mobile Step Description */}
                    <div className="sm:hidden mt-2.5 flex items-center justify-between text-xs font-bold text-[#10221C]">
                        <span>Step {step} of 4: {stepsData[step - 1]?.label}</span>
                        <span className="text-[11px] text-gray-500 font-semibold">{Math.round(progressPercent)}% completed</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex items-start justify-center px-4 sm:px-6 py-6 sm:py-8">
                <div className="w-full max-w-5xl lg:max-w-6xl space-y-4">
                    {availabilityBanner && (
                        <div className={`rounded-2xl border px-4 py-3 ${
                            availabilityBanner.tone === 'rose'
                                ? 'border-rose-200 bg-rose-50 text-rose-900'
                                : 'border-amber-200 bg-amber-50 text-amber-950'
                        }`}>
                            <p className="text-sm font-black">{availabilityBanner.title}</p>
                            <p className="text-xs mt-0.5 opacity-80">{availabilityBanner.body}</p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-[#10221C]/10 bg-white px-4 py-3 text-xs text-[#10221C]/70 shadow-xs flex items-center justify-between">
                        <span>Open schedule: <strong className="text-[#10221C]">{operatingDaysLabel}</strong></span>
                        <span className="text-[11px] text-[#10221C]/50 font-medium">Verified Facility</span>
                    </div>
                    
                    {selectableCourts.length === 0 ? (
                        <div className="bg-white rounded-3xl p-8 text-center shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold text-[#10221C] mb-2">
                                {availabilityBanner ? availabilityBanner.title : 'No Courts Available'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {availabilityBanner
                                    ? availabilityBanner.body
                                    : "This facility hasn't listed any bookable courts yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            {/* Animated Active Step Component */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -12 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                    {currentStepData.component}
                                </motion.div>
                            </AnimatePresence>

                            {/* Footer Navigation Dock */}
                            <div className="px-6 sm:px-8 py-5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between gap-4">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#10221C] transition px-4 py-2.5 rounded-xl hover:bg-gray-200/60 active:scale-[0.98]"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {step < stepsData.length ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canGoNext() || processing}
                                        className={`inline-flex items-center gap-2 text-sm font-black px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                                            canGoNext() && !processing
                                                ? 'bg-[#10221C] text-[#D6FF3F] hover:bg-[#18342b] shadow-md shadow-[#10221C]/10 cursor-pointer' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Holding slot...
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleBooking}
                                        disabled={!canConfirm || processing}
                                        className={`inline-flex items-center gap-2 text-sm font-black px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                                            canConfirm && !processing
                                                ? 'bg-[#D6FF3F] text-[#10221C] hover:bg-[#cbf536] shadow-lg shadow-[#D6FF3F]/30 cursor-pointer' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-[#10221C]/30 border-t-[#10221C] rounded-full animate-spin" />
                                                Submitting Reservation...
                                            </>
                                        ) : (
                                            <>
                                                Confirm & Complete Booking
                                                <Check className="w-4 h-4 stroke-[3]" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Success / Alert Modal */}
            <AnimatePresence>
                {modal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center"
                        >
                            {modal.type === 'timer' ? (
                                <div className="mb-2">
                                    <TimerIcon className="w-28 h-28 drop-shadow-xl" />
                                </div>
                            ) : (
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${
                                    modal.type === 'success' 
                                        ? 'bg-[#D6FF3F] text-[#10221C] shadow-lg shadow-[#D6FF3F]/30' 
                                        : 'bg-rose-100 text-rose-600 shadow-lg shadow-rose-100/50'
                                }`}>
                                    {modal.type === 'success' ? (
                                        <Check className="w-8 h-8 stroke-[3]" />
                                    ) : (
                                        <AlertCircle className="w-8 h-8" />
                                    )}
                                </div>
                            )}

                            <h4 className="text-2xl font-black text-[#10221C] mb-2">
                                {modal.title ? modal.title : (modal.type === 'success' ? 'Booking Submitted!' : 'Booking Notice')}
                            </h4>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed px-2">{modal.message}</p>
                            
                            {modal.type === 'success' ? (
                                <div className="w-full space-y-2">
                                    <Link 
                                        href={isPlayer ? route('player.bookings') : route('facility.show', facility.slug)}
                                        className="block w-full py-3.5 rounded-xl font-bold transition-all bg-[#10221C] text-[#D6FF3F] hover:bg-[#1a362d] shadow-md text-center text-sm"
                                    >
                                        {isPlayer ? 'View My Bookings' : 'Return to Facility'}
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeModal();
                                            setStep(1);
                                        }}
                                        className="block w-full py-2.5 rounded-xl font-semibold text-xs text-gray-500 hover:text-[#10221C] hover:bg-gray-100 transition"
                                    >
                                        Book Another Court
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button"
                                    onClick={closeModal}
                                    className="w-full py-3.5 rounded-xl font-bold transition-all bg-gray-100 text-[#10221C] hover:bg-gray-200 text-sm active:scale-[0.98]"
                                >
                                    Dismiss
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
