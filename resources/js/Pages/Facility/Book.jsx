import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    ArrowRight, 
    Building2, 
    Calendar, 
    Check, 
    Info, 
    MapPin 
} from 'lucide-react';

import Step1Court from './BookSteps/Step1Court';
import Step2DateTime from './BookSteps/Step2DateTime';
import Step3Confirm from './BookSteps/Step3Confirm';
import Step4Payment from './BookSteps/Step4Payment';
import { useBookingLogic } from './BookSteps/useBookingLogic';
import TimerIcon from '@/Components/TimerIcon';
import { formatPeso } from '@/Components/MetricCard';

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
        proofFile, setProofFile
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
                facility={facility}
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

    const getBackDestinationInfo = () => {
        if (step > 1) {
            return {
                title: stepsData[step - 2]?.label || 'Previous Step',
                subtitle: `Step ${step - 1}`,
            };
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const from = params.get('from');

            if (from === 'bookings') {
                return { title: 'My Bookings', subtitle: 'Return to' };
            }
            if (from === 'dashboard') {
                return { title: 'Dashboard', subtitle: 'Return to' };
            }
        }

        return { title: facility.name, subtitle: 'Return to' };
    };

    const handleBackNavigation = (e) => {
        if (e) e.preventDefault();

        // 1. If currently inside wizard steps > 1, step backwards in the wizard
        if (step > 1) {
            goPrev();
            return;
        }

        // 2. We are on step 1: return to referring page
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const from = params.get('from');

            if (from === 'bookings') {
                router.visit(route('player.bookings'));
                return;
            }

            if (from === 'dashboard') {
                router.visit(route('dashboard'));
                return;
            }

            // If browser has history and referrer is internal, use window.history.back()
            if (window.history.length > 1 && document.referrer) {
                try {
                    const referrerUrl = new URL(document.referrer);
                    if (referrerUrl.host === window.location.host && referrerUrl.pathname !== window.location.pathname) {
                        window.history.back();
                        return;
                    }
                } catch {}
            }
        }

        // 3. Fallback to facility show page
        router.visit(route('facility.show', facility.slug));
    };

    const handleStepClick = async (targetStep) => {
        if (targetStep >= step) return;
        if (targetStep === step - 1) {
            goPrev();
            return;
        }
        if (step >= 3 && targetStep < 3) {
            if (selectedCourtId && selectedDate && startTime && endTime) {
                try {
                    await window.axios.post('/bookings/unlock', {
                        court_id: selectedCourtId,
                        date: selectedDate,
                        start_time: startTime,
                        end_time: endTime,
                    });
                } catch (e) {}
            }
        }
        setStep(targetStep);
    };

    const backInfo = getBackDestinationInfo();

    return (
        <div className="h-screen h-[100dvh] max-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C] flex flex-col overflow-hidden">
            <Head title={`Book a Court - ${facility.name}`} />

            {/* Compact Fixed Top Header Navigation */}
            <header className="shrink-0 bg-[#F5F2EA] border-b border-[#101F1A]/10 px-3 sm:px-6 py-2 shadow-2xs z-20">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    {/* Dynamic Smart Back Button */}
                    <button 
                        type="button"
                        onClick={handleBackNavigation}
                        className="inline-flex items-center gap-2 text-left group py-0.5 px-1.5 -ml-1.5 rounded-lg hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                        title={step > 1 ? 'Go back to previous step' : 'Return to previous page'}
                        aria-label={step > 1 ? 'Go back to previous step' : 'Return to previous page'}
                    >
                        <div className="w-7 h-7 rounded-lg bg-white border border-[#101F1A]/10 flex items-center justify-center text-[#101F1A] shadow-2xs group-hover:border-[#101F1A]/30 group-hover:bg-[#D6FF3F]/30 transition-all">
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#101F1A]/50 leading-none">
                                {backInfo.subtitle}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-[#101F1A] leading-tight truncate max-w-[150px] sm:max-w-[240px]">
                                {backInfo.title}
                            </span>
                        </div>
                    </button>

                    {/* Venue & Operating Status */}
                    <div className="flex items-center gap-2">
                        {operatingDaysLabel && (
                            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#101F1A]/10 text-[11px] font-bold text-[#101F1A]/70">
                                <Calendar size={12} className="text-[#101F1A]/50 shrink-0" />
                                <span>{operatingDaysLabel}</span>
                            </span>
                        )}
                        <Link 
                            href={route('facility.show', facility.slug)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#101F1A]/10 bg-white/90 hover:bg-white text-xs font-bold text-[#101F1A] hover:border-[#101F1A]/25 transition-all shadow-2xs group shrink-0"
                            title={`View details for ${facility.name}`}
                        >
                            <Building2 size={12} className="text-[#101F1A]/50 group-hover:text-[#101F1A] transition-colors" />
                            <span className="font-black text-xs text-[#101F1A] truncate max-w-[120px] sm:max-w-[180px]">
                                {facility.name}
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Lean Progress Bar */}
            <div className="shrink-0 bg-[#F5F2EA] px-3 sm:px-6 py-1.5 border-b border-[#101F1A]/5 z-10">
                <div className="max-w-4xl mx-auto">
                    {/* Stepper Steps */}
                    <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1.5">
                        {stepsData.map((s) => {
                            const isCompleted = step > s.id;
                            const isCurrent = step === s.id;

                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    disabled={!isCompleted}
                                    onClick={() => isCompleted && handleStepClick(s.id)}
                                    className={`flex items-center gap-1.5 sm:gap-2 text-left transition-all ${
                                        isCompleted ? 'cursor-pointer group' : 'cursor-default'
                                    }`}
                                    title={isCompleted ? `Jump back to Step ${s.id}: ${s.label}` : `Step ${s.id}: ${s.label}`}
                                >
                                    <div className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black transition-all ${
                                        isCompleted 
                                            ? 'bg-[#101F1A] text-white group-hover:bg-[#1a382d]' 
                                            : isCurrent 
                                            ? 'bg-[#D6FF3F] text-[#10221C] ring-2 ring-[#D6FF3F]/40 shadow-xs font-black' 
                                            : 'bg-white/80 border border-gray-200 text-gray-400'
                                    }`}>
                                        {isCompleted ? (
                                            <Check size={12} strokeWidth={3} className="text-[#D6FF3F]" />
                                        ) : (
                                            s.id
                                        )}
                                    </div>
                                    <span className={`text-xs font-black hidden sm:inline transition-colors ${
                                        isCurrent ? 'text-[#101F1A]' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                                    }`}>
                                        {s.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-[#101F1A]/10 rounded-full h-1 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-[#101F1A] to-[#D6FF3F] h-full rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${((step - 1) / (stepsData.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area (Fills Viewport Height, Never Scrolls Page Window) */}
            <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-2 sm:px-6 py-2 sm:py-3 overflow-hidden">
                <div className="w-full max-w-4xl h-full flex flex-col min-h-0">
                    {/* Compact Alert Banner if present */}
                    {availabilityBanner && (
                        <div className={`shrink-0 mb-2 rounded-xl border px-3 py-1.5 flex items-center gap-2 text-xs ${
                            availabilityBanner.tone === 'rose'
                                ? 'border-rose-200 bg-rose-50 text-rose-900'
                                : 'border-amber-200 bg-amber-50 text-amber-950'
                        }`}>
                            <Info size={14} className="shrink-0" />
                            <span className="font-bold">{availabilityBanner.title}:</span>
                            <span className="opacity-80 truncate">{availabilityBanner.body}</span>
                        </div>
                    )}
                    
                    {selectableCourts.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-card border border-gray-100 my-auto">
                            <h3 className="text-xl font-bold text-[#10221C] mb-2">No Courts Available</h3>
                            <p className="text-gray-500 text-sm">This facility hasn't listed any bookable courts yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-card border border-[#101F1A]/8 flex flex-col flex-1 min-h-0 overflow-hidden">
                            {/* Inner Scrollable Step Content (Fits within Viewport!) */}
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
                                {currentStepData.component}
                            </div>

                            {/* Pinned Bottom Wizard Footer Navigation */}
                            <footer className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#FAF8F5] border-t border-[#101F1A]/8 flex items-center justify-between gap-3">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={goPrev}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#101F1A]/80 hover:text-[#101F1A] transition px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl hover:bg-gray-200/70 active:scale-95 cursor-pointer"
                                    >
                                        <ArrowLeft size={15} />
                                        <span>Previous</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleBackNavigation}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-[#101F1A] transition px-3 py-1.5 rounded-xl hover:bg-gray-100 active:scale-95 cursor-pointer"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Cancel</span>
                                    </button>
                                )}

                                {/* Running Price Estimate Pill */}
                                <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-white border border-[#101F1A]/8 shadow-2xs">
                                    <span className="text-gray-400 font-medium">Estimated:</span>
                                    <span className="font-black text-[#101F1A] text-xs sm:text-sm">
                                        {totalPrice > 0 ? formatPeso(totalPrice) : (selectedCourt ? `${formatPeso(price)}/hr` : '—')}
                                    </span>
                                </div>

                                {step < stepsData.length ? (
                                    <button
                                        type="button"
                                        onClick={goNext}
                                        disabled={!canGoNext()}
                                        className={`inline-flex items-center gap-2 text-xs sm:text-sm font-black px-4 py-2 sm:px-5 sm:py-2 rounded-xl transition-all duration-200 ${
                                            canGoNext() 
                                                ? 'bg-[#10221C] text-[#D6FF3F] hover:bg-[#1a382d] shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer active:scale-95' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <span>Next Step</span>
                                        <ArrowRight size={15} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleBooking}
                                        disabled={!canConfirm || processing}
                                        className={`inline-flex items-center gap-2 text-xs sm:text-sm font-black px-5 py-2 sm:px-6 sm:py-2 rounded-xl transition-all duration-200 ${
                                            canConfirm && !processing 
                                                ? 'bg-[#10221C] text-[#D6FF3F] hover:bg-[#1a382d] shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer active:scale-95' 
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-[#D6FF3F]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Confirm Booking</span>
                                                <Check size={15} strokeWidth={3} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </footer>
                        </div>
                    )}
                </div>
            </main>

            {/* Result Modal */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#10221C]/40 backdrop-blur-sm transition-all">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
                        {modal.type === 'timer' ? (
                            <div className="mb-2">
                                <TimerIcon className="w-32 h-32 drop-shadow-xl" />
                            </div>
                        ) : (
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${modal.type === 'success' ? 'bg-[#D6FF3F] text-[#10221C] shadow-lg shadow-[#D6FF3F]/30' : 'bg-red-100 text-red-600 shadow-lg shadow-red-100/50'}`}>
                                {modal.type === 'success' ? (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                )}
                            </div>
                        )}
                        <h4 className="text-2xl font-black text-[#10221C] mb-2">
                            {modal.title ? modal.title : (modal.type === 'success' ? 'Booking Submitted!' : 'Booking Failed')}
                        </h4>
                        <p className="text-gray-500 text-sm mb-8 leading-relaxed px-2">{modal.message}</p>
                        
                        {modal.type === 'success' ? (
                            <Link 
                                href={isPlayer ? route('player.bookings') : route('facility.show', facility.slug)}
                                className="block w-full py-3.5 rounded-xl font-bold transition-all bg-[#10221C] text-[#D6FF3F] hover:bg-[#1a382d] hover:-translate-y-0.5 shadow-md text-center text-sm"
                            >
                                {isPlayer ? 'View My Bookings' : 'Return to Facility'}
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
