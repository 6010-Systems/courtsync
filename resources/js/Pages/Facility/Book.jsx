import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight, Check, AlertCircle, RotateCcw, MapPin, ShieldCheck } from 'lucide-react';

import Step1Court from './BookSteps/Step1Court';
import Step2DateTime from './BookSteps/Step2DateTime';
import Step3Confirm from './BookSteps/Step3Confirm';
import Step4Payment from './BookSteps/Step4Payment';
import { useBookingLogic } from './BookSteps/useBookingLogic';
import TimerIcon from '@/Components/TimerIcon';
import { getCourtImage } from '@/Utils/courtImages';

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

            {/* Venue Hero Identity Header */}
            <header className="bg-[#101F1A] text-[#F5F2EA] px-4 sm:px-6 py-5 border-b border-white/10 shadow-md">
                <div className="max-w-5xl lg:max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <Link 
                            href={route('facility.show', facility.slug)}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-[#F5F2EA] transition active:scale-95 shrink-0"
                            title="Back to Facility Details"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#D6FF3F]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
                                    Verified Facility
                                </span>
                                <span className="text-white/30">•</span>
                                <span className="text-[11px] text-white/70 font-semibold">
                                    {operatingDaysLabel}
                                </span>
                            </div>
                            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                                {facility.name}
                            </h1>
                            <p className="text-xs text-white/60 font-medium">
                                {[facility.city, facility.province].filter(Boolean).join(', ') || 'Premier Sports Venue'}
                            </p>
                        </div>
                    </div>

                    {/* Active Slot Lock Timer Badge */}
                    {step >= 3 && lockSecondsRemaining > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs border transition-colors self-start sm:self-auto ${
                                lockSecondsRemaining < 120
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                                    : lockSecondsRemaining < 240
                                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                                        : 'bg-[#D6FF3F]/20 text-[#D6FF3F] border-[#D6FF3F]/40'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Slot held: <span className="font-mono">{lockTimeFormatted}</span></span>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Stepper Progress Bar */}
            <div className="bg-white border-b border-gray-200/70 px-4 sm:px-6 py-4 shadow-xs sticky top-0 z-30 backdrop-blur-md bg-white/95">
                <div className="max-w-5xl lg:max-w-6xl mx-auto">
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        {stepsData.map((s) => {
                            const isDone = step > s.id;
                            const isActive = step === s.id;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    disabled={s.id > step}
                                    onClick={() => s.id < step && setStep(s.id)}
                                    className={`group flex items-center gap-2.5 text-left transition-all ${
                                        s.id < step ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                >
                                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                                        isDone 
                                            ? 'bg-[#101F1A] text-[#D6FF3F]' 
                                            : isActive 
                                                ? 'bg-[#D6FF3F] text-[#10221C] shadow-md shadow-[#D6FF3F]/30 ring-2 ring-[#10221C]' 
                                                : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : `0${s.id}`}
                                    </div>
                                    <div className="hidden sm:block min-w-0">
                                        <p className={`text-[10px] font-bold uppercase tracking-wider leading-none ${
                                            isActive ? 'text-[#FF5A36]' : 'text-gray-400'
                                        }`}>
                                            Step 0{s.id}
                                        </p>
                                        <p className={`text-xs font-black truncate mt-0.5 ${
                                            isActive ? 'text-[#10221C]' : isDone ? 'text-gray-700' : 'text-gray-400'
                                        }`}>
                                            {s.label}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Animated Track Line */}
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-3 overflow-hidden">
                        <div 
                            className="bg-[#D6FF3F] h-full rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progressPercent}%` }}
                        />
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

                            {/* Smart Concierge Action Dock */}
                            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[#FAF9F5] to-gray-50 border-t border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                {/* Left Info Column */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {selectedCourt ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/80 shadow-2xs">
                                                <img 
                                                    src={getCourtImage(selectedCourt, facility)} 
                                                    alt={selectedCourt.name}
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selected Court</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Available</span>
                                                </div>
                                                <p className="text-sm font-black text-[#10221C] truncate">{selectedCourt.name}</p>
                                                <p className="text-xs font-semibold text-gray-500">
                                                    {step === 1 && (selectedCourt.hourly_rate ? `₱${Number(selectedCourt.hourly_rate).toFixed(0)} / hour` : 'Standard Rate')}
                                                    {step === 2 && selectedDate && startTime && `${formatDateString(selectedDate)} · ${formatTimeString(startTime)} – ${formatTimeString(endTime)}`}
                                                    {step >= 3 && `Total Reservation: ${totalPrice}`}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                            <Clock className="w-4 h-4 text-gray-300" />
                                            <span>Select a court above to proceed with your reservation.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right Action Buttons */}
                                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={goPrev}
                                            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#10221C] transition px-4 py-3 rounded-xl border border-gray-200 hover:bg-white hover:shadow-2xs active:scale-[0.98] cursor-pointer"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Back
                                        </button>
                                    )}

                                    {step < stepsData.length ? (
                                        <button
                                            type="button"
                                            onClick={goNext}
                                            disabled={!canGoNext() || processing}
                                            className={`inline-flex items-center gap-2 text-xs font-black px-6 sm:px-7 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                                                canGoNext() && !processing
                                                    ? 'bg-[#10221C] text-[#D6FF3F] hover:bg-[#18342b] hover:shadow-lg shadow-md shadow-[#10221C]/10 cursor-pointer' 
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
                                                    <span>
                                                        {step === 1 && 'Choose Date & Time'}
                                                        {step === 2 && 'Review Details'}
                                                        {step === 3 && 'Proceed to Payment'}
                                                    </span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleBooking}
                                            disabled={!canConfirm || processing}
                                            className={`inline-flex items-center gap-2 text-xs font-black px-7 sm:px-8 py-3 rounded-xl transition-all duration-200 active:scale-[0.98] ${
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
