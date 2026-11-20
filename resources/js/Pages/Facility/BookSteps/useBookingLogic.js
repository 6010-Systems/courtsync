import { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import { courtIsBookable } from '@/Utils/courtStatus';
import {
    courtIsOpenOnDate,
    hoursForDate,
} from '@/Utils/courtOperatingSchedule';
import {
    facilityAvailabilityBanner,
    facilityIsAcceptingBookings,
    facilityIsOpenOnDate,
    formatOperatingDaysLabel,
} from '@/Utils/facilityAvailability';
import { offeredAddons, offeredCourtPlans, planRates, quoteBooking } from '@/Utils/rateQuote';

export function useBookingLogic(facility, preselectedCourtId = null) {
    const courts = facility.courts || [];
    const facilityAcceptingBookings = facilityIsAcceptingBookings(facility);
    const availabilityBanner = facilityAvailabilityBanner(facility);
    const bookableCourts = facilityAcceptingBookings
        ? courts.filter((c) => courtIsBookable(c.status))
        : [];
    const selectableCourts = bookableCourts;

    // "Book court" on a venue court card deep-links here with ?court={id}.
    // When that court belongs to this facility, start with it already chosen.
    const preselectedCourt = useMemo(
        () => selectableCourts.find((court) => String(court.id) === String(preselectedCourtId)) || null,
        [facility, preselectedCourtId],
    );
    const preselectedCourtKey = preselectedCourt ? preselectedCourt.id : null;

    // SECURITY: If they switch to a different facility, wipe the old memory immediately!
    if (sessionStorage.getItem('book_facility') && sessionStorage.getItem('book_facility') !== facility.id.toString()) {
        sessionStorage.removeItem('book_facility');
        sessionStorage.removeItem('book_court');
        sessionStorage.removeItem('book_date');
        sessionStorage.removeItem('book_start');
        sessionStorage.removeItem('book_end');
        sessionStorage.removeItem('book_step');
        sessionStorage.removeItem('book_rate_plan');
        sessionStorage.removeItem('book_addons');
    }

    const storedCourtId = sessionStorage.getItem('book_court');
    // Only restore a saved date/time draft when it belongs to the court we are about to use.
    const canRestoreDraft = !preselectedCourt || String(preselectedCourt.id) === storedCourtId;

    const [selectedCourtId, setSelectedCourtId] = useState(() => {
        if (preselectedCourt) {
            return preselectedCourt.id;
        }

        return selectableCourts.some((court) => String(court.id) === storedCourtId)
            ? storedCourtId
            : null;
    });

    const resetDateTimeSelection = () => {
        setStartTime('');
        setEndTime('');
        setSelectedDate(null);
        setRatePlanId(null);
        setAddonQuantities({});
        sessionStorage.removeItem('book_date');
        sessionStorage.removeItem('book_start');
        sessionStorage.removeItem('book_end');
        sessionStorage.removeItem('book_rate_plan');
        sessionStorage.removeItem('book_addons');
    };

    const handleCourtChange = async (courtId) => {
        // If they had a court locked, explicitly unlock it immediately!
        if (selectedCourtId && selectedDate && startTime && endTime) {
            try {
                await window.axios.post('/bookings/unlock', {
                    court_id: selectedCourtId,
                    date: selectedDate,
                    start_time: startTime,
                    end_time: endTime,
                    idempotency_key: idempotencyKey
                });
            } catch (e) {} // fail silently
        }

        setSelectedCourtId(courtId);
        resetDateTimeSelection();
    };

    const [selectedDate, setSelectedDate] = useState(() => (canRestoreDraft ? sessionStorage.getItem('book_date') || null : null));
    const [startTime, setStartTime] = useState(() => (canRestoreDraft ? sessionStorage.getItem('book_start') || '' : ''));
    const [endTime, setEndTime] = useState(() => (canRestoreDraft ? sessionStorage.getItem('book_end') || '' : ''));
    const [paymentMethod, setPaymentMethod] = useState('pay_at_facility');
    const [step, setStep] = useState(() => {
        const storedStep = parseInt(sessionStorage.getItem('book_step')) || 1;

        // Landing here from a court card means step 1 is already answered.
        return preselectedCourt ? Math.max(storedStep, 2) : storedStep;
    });
    const [ratePlanId, setRatePlanId] = useState(() => {
        const stored = canRestoreDraft ? sessionStorage.getItem('book_rate_plan') : null;

        return stored ? Number(stored) : null;
    });
    const [addonQuantities, setAddonQuantities] = useState(() => {
        if (!canRestoreDraft) {
            return {};
        }

        try {
            return JSON.parse(sessionStorage.getItem('book_addons') || '{}');
        } catch {
            return {};
        }
    });

    // Inertia keeps this component mounted between two court cards, so re-apply the
    // newly requested court when the visitor picks a different one on the venue page.
    const lastPreselectedCourtKeyRef = useRef(preselectedCourtKey);

    useEffect(() => {
        if (preselectedCourtKey === lastPreselectedCourtKeyRef.current) {
            return;
        }

        lastPreselectedCourtKeyRef.current = preselectedCourtKey;

        if (preselectedCourtKey === null) {
            return;
        }

        setSelectedCourtId(preselectedCourtKey);
        resetDateTimeSelection();
        setStep(2);
    }, [preselectedCourtKey]);

    const [idempotencyKey, setIdempotencyKey] = useState(() => {
        let key = sessionStorage.getItem('book_idempotency_key');
        if (!key) {
            key = crypto.randomUUID();
            sessionStorage.setItem('book_idempotency_key', key);
        }
        return key;
    });
    const [modal, setModal] = useState({ isOpen: false, type: '', message: '', title: '' });
    const [processing, setProcessing] = useState(false);
    const submittingRef = useRef(false);
    const [lockedSlots, setLockedSlots] = useState([]);
    
    // Active countdown timer for held slot
    const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);
    const lockTimerRef = useRef(null);

    const formatLockTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // This is the "Time Bomb" function that triggers when time is up
    const expireBooking = async () => {
        // Unlock immediately
        if (selectedCourtId && selectedDate && startTime && endTime) {
            try {
                await window.axios.post('/bookings/unlock', {
                    court_id: selectedCourtId,
                    date: selectedDate,
                    start_time: startTime,
                    end_time: endTime,
                    idempotency_key: idempotencyKey
                });
            } catch (e) {}
        }

        showModal('timer', 'Oops! You took a little too long. Please select your court again.', 'Session Expired');
        
        // Wipe everything out
        setStartTime('');
        setEndTime('');
        setSelectedCourtId(null);
        setSelectedDate(null);
        setStep(1);
        
        sessionStorage.removeItem('book_facility');
        sessionStorage.removeItem('book_court');
        sessionStorage.removeItem('book_date');
        sessionStorage.removeItem('book_start');
        sessionStorage.removeItem('book_end');
        sessionStorage.removeItem('book_step');
        sessionStorage.removeItem('lock_expires_at');
        sessionStorage.removeItem('book_idempotency_key');
    };

    const showModal = (type, message, title = '') => setModal({ isOpen: true, type, message, title });
    const closeModal = () => setModal({ isOpen: false, type: '', message: '', title: '' });
    
    const selectedCourt = selectableCourts.find(c => c.id == selectedCourtId);

    const courtPlans = useMemo(() => offeredCourtPlans(selectedCourt, facility), [selectedCourt, facility]);
    const addonPlans = useMemo(() => offeredAddons(selectedCourt, facility), [selectedCourt, facility]);
    const selectedRatePlan = courtPlans.find((plan) => plan.id == ratePlanId) || null;

    // Default to the first package the court offers (Court Rental on the demo card).
    useEffect(() => {
        if (!selectedCourt) {
            return;
        }

        const stillOffered = courtPlans.some((plan) => plan.id == ratePlanId);

        if (!stillOffered) {
            setRatePlanId(courtPlans.length > 0 ? courtPlans[0].id : null);
            setAddonQuantities({});
        }
    }, [selectedCourt, courtPlans]);

    useEffect(() => {
        if (ratePlanId) {
            sessionStorage.setItem('book_rate_plan', ratePlanId);
        } else {
            sessionStorage.removeItem('book_rate_plan');
        }
    }, [ratePlanId]);

    useEffect(() => {
        sessionStorage.setItem('book_addons', JSON.stringify(addonQuantities));
    }, [addonQuantities]);

    const setAddonQuantity = (plan, quantity) => {
        const max = Math.max(1, Number(plan.max_quantity || 1));
        const next = Math.min(Math.max(0, Number(quantity) || 0), max);

        setAddonQuantities((current) => ({ ...current, [plan.id]: next }));
    };

    useEffect(() => {
        if (!selectedCourtId || !selectedDate) {
            setLockedSlots([]);
            return;
        }

        const fetchLocks = () => {
            fetch(`/api/courts/${selectedCourtId}/locked-slots?date=${selectedDate}&idempotency_key=${idempotencyKey}`)
                .then(res => res.json())
                .then(data => {
                    if (data.locked_slots) {
                        setLockedSlots(data.locked_slots);
                    }
                })
                .catch(err => console.error("Error fetching locked slots", err));
        };

        // Fetch immediately on mount or when court/date changes
        fetchLocks();
        
    }, [selectedCourtId, selectedDate, idempotencyKey]);

    const generateTimeOptions = (court, selectedDate, courtId, allBookings = [], currentLockedSlots = []) => {
        const hours = hoursForDate(court, selectedDate);
        let startHour = 6;
        let endHour = 22;

        if (hours) {
            startHour = parseInt(String(hours.start).split(':')[0], 10);
            const endMinutes = String(hours.end) === '24:00'
                ? 24 * 60
                : (parseInt(String(hours.end).split(':')[0], 10) * 60);
            endHour = Math.floor(endMinutes / 60);
        }

        const courtBookings = allBookings.filter(b => b.court_id == courtId && b.date === selectedDate && ['pending', 'confirmed'].includes(b.status.toLowerCase()));
        
        const bookedHours = new Set();
        courtBookings.forEach(b => {
            const bStart = parseInt(b.start_time.split(':')[0]);
            const bEnd = parseInt(b.end_time.split(':')[0]);
            for (let i = bStart; i < bEnd; i++) {
                bookedHours.add(i);
            }
        });
        const lockedHours = new Set();
        currentLockedSlots.forEach(slot => {
            lockedHours.add(parseInt(slot.split(':')[0]));
        });

        const options = [];
        // Include the closing hour as an end-time option (e.g. midnight 24:00).
        for (let i = startHour; i <= endHour; i++) {
            const timeValue = i === 24 ? '24:00' : `${i.toString().padStart(2, '0')}:00`;
            const date = new Date();
            date.setHours(i === 24 ? 0 : i, 0);
            const formatted = i === 24
                ? '12:00 AM'
                : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            
            const isUnavailable = i < endHour && (bookedHours.has(i) || lockedHours.has(i));
            const labelSuffix = bookedHours.has(i) ? '(Booked)' : lockedHours.has(i) ? '(Held)' : '';

            let rateTag = '';
            const slotPlan = selectedRatePlan;
            const planRateSet = slotPlan ? planRates(slotPlan) : null;

            if (slotPlan && planRateSet) {
                const dayStartH = slotPlan.day_start_time ? parseInt(String(slotPlan.day_start_time).split(':')[0], 10) : 5;
                const nightStartH = slotPlan.night_start_time ? parseInt(String(slotPlan.night_start_time).split(':')[0], 10) : 17;
                const isNight = planRateSet.night !== null && (i >= nightStartH || i < dayStartH);
                const rate = isNight ? planRateSet.night : planRateSet.day;
                rateTag = isNight ? `🌙 ₱${rate.toFixed(0)}` : `☀️ ₱${rate.toFixed(0)}`;
            } else if (selectedCourt?.pricing_mode === 'SPLIT' && selectedCourt.day_rate && selectedCourt.night_rate) {
                const dayStartH = selectedCourt.day_start_time ? parseInt(String(selectedCourt.day_start_time).split(':')[0], 10) : 6;
                const nightStartH = selectedCourt.night_start_time ? parseInt(String(selectedCourt.night_start_time).split(':')[0], 10) : 18;
                const isNight = i >= nightStartH || i < dayStartH;
                const rate = isNight ? Number(selectedCourt.night_rate) : Number(selectedCourt.day_rate);
                rateTag = isNight ? `🌙 ₱${rate.toFixed(0)}` : `☀️ ₱${rate.toFixed(0)}`;
            }
            
            options.push({ 
                value: timeValue, 
                label: formatted, 
                isBooked: isUnavailable, 
                labelSuffix: labelSuffix,
                rateTag: rateTag
            });
        }
        return options;
    };
    
    const timeOptions = useMemo(() => {
        if (!selectedCourt || !selectedDate) return [];
        if (!courtIsOpenOnDate(selectedCourt, selectedDate)) return [];
        return generateTimeOptions(selectedCourt, selectedDate, selectedCourt?.id, facility.bookings || [], lockedSlots);
    }, [selectedCourt, selectedDate, facility.bookings, lockedSlots, selectedRatePlan]);

    // Generate next 14 days
    const dates = useMemo(() => {
        const generatedDates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const facilityClosed = !facilityIsOpenOnDate(facility, localDate);
            const courtClosed = selectedCourt
                ? !courtIsOpenOnDate(selectedCourt, localDate)
                : false;
            const isClosed = facilityClosed || courtClosed;
            generatedDates.push({
                date: localDate,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
                isClosed,
                closedReason: facilityClosed
                    ? 'Facility closed this day'
                    : (courtClosed ? 'This court is closed on this day' : null),
            });
        }
        return generatedDates;
    }, [facility, selectedCourt]);

    useEffect(() => {
        if (!selectedDate) {
            return;
        }

        const facilityClosed = !facilityIsOpenOnDate(facility, selectedDate);
        const courtClosed = selectedCourt ? !courtIsOpenOnDate(selectedCourt, selectedDate) : false;

        if (facilityClosed || courtClosed) {
            setSelectedDate(null);
            setStartTime('');
            setEndTime('');
        }
    }, [facility, selectedCourt, selectedDate]);

    // Auto-save to browser memory whenever these variables change
    useEffect(() => {
        sessionStorage.setItem('book_facility', facility.id);

        if (selectedCourtId) {
            sessionStorage.setItem('book_court', selectedCourtId);
        } else {
            sessionStorage.removeItem('book_court');
        }

        if (selectedDate) {
            sessionStorage.setItem('book_date', selectedDate);
        } else {
            sessionStorage.removeItem('book_date');
        }

        if (startTime) {
            sessionStorage.setItem('book_start', startTime);
        } else {
            sessionStorage.removeItem('book_start');
        }

        if (endTime) {
            sessionStorage.setItem('book_end', endTime);
        } else {
            sessionStorage.removeItem('book_end');
        }

        sessionStorage.setItem('book_step', step);
    }, [selectedCourtId, selectedDate, startTime, endTime, step]);

    // Resilient 7-Minute Timer (Survives Page Refreshes & Updates Reactive Countdown)
    useEffect(() => {
        if (step >= 3) {
            const updateTimer = () => {
                const expiresAt = sessionStorage.getItem('lock_expires_at');
                if (!expiresAt) {
                    setLockSecondsRemaining(0);
                    return;
                }

                const timeLeft = parseInt(expiresAt, 10) - Date.now();
                if (timeLeft <= 0) {
                    setLockSecondsRemaining(0);
                    expireBooking();
                } else {
                    setLockSecondsRemaining(Math.max(0, Math.ceil(timeLeft / 1000)));
                }
            };

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setLockSecondsRemaining(0);
        }
    }, [step]);

    // Track if this is the first render
    const isFirstRender = useRef(true);

    // Clear times when court or date changes (but NOT on first load!)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setStartTime('');
        setEndTime('');
    }, [selectedDate, selectedCourtId]);

       const goNext = async () => {
        // If we are leaving the Date & Time step (Step 2), try to lock it!
        if (step === 2) {
            setProcessing(true); // Spin the button
            try {
                await window.axios.post('/bookings/lock', {
                    court_id: selectedCourtId,
                    date: selectedDate,
                    start_time: startTime,
                    end_time: endTime,
                    idempotency_key: idempotencyKey
                });
                // If it succeeds, set the exact 7-minute expiration time!
                sessionStorage.setItem('lock_expires_at', Date.now() + 7 * 60 * 1000);
                // Then let them proceed to Step 3!
                setStep(3);
                // The useEffect will automatically catch this step change and start the timer!
            } catch (error) {
                if (error.response?.status === 423) {
                    const rangeStr = `${formatTimeString(startTime)} - ${formatTimeString(endTime)}`;
                    showModal('timer', `Oops! Someone else is currently booking your requested time (${rangeStr}). Please choose another time, or try checking back in a few minutes to see if it becomes available!`, 'Slot Unavailable');
                } else {
                    showModal('error', 'Failed to connect to the server. Please check your internet and try again.');
                }
            } finally {
                setProcessing(false); // Stop the button spinning
            }
        } else {
            // For all other steps, just go next normally
            setStep(s => Math.min(s + 1, 4));
        }
    };

    const goPrev = async () => {
        if (step === 3) {
            // Unlocking because they are backing out of the review step
            if (selectedCourtId && selectedDate && startTime && endTime) {
                try {
                    await window.axios.post('/bookings/unlock', {
                        court_id: selectedCourtId,
                        date: selectedDate,
                        start_time: startTime,
                        end_time: endTime,
                        idempotency_key: idempotencyKey
                    });
                } catch (e) {} // fail silently
            }
        }
        setStep(s => Math.max(s - 1, 1));
    };

    const addonSelection = useMemo(
        () => addonPlans
            .map((plan) => ({ plan, quantity: Number(addonQuantities[plan.id] || 0) }))
            .filter((row) => row.quantity > 0),
        [addonPlans, addonQuantities],
    );

    const pricingSummary = useMemo(() => {
        const quote = quoteBooking({
            court: selectedCourt,
            ratePlan: selectedRatePlan,
            addons: addonSelection,
            startTime,
            endTime,
        });

        return {
            ...quote,
            totalPrice: quote.total,
        };
    }, [selectedCourt, selectedRatePlan, addonSelection, startTime, endTime]);

    const durationHours = pricingSummary.durationHours;
    const subtotal = pricingSummary.subtotal;
    const addonsTotal = pricingSummary.addonsTotal;
    const addonLines = pricingSummary.addonLines;
    const bookingFee = useMemo(() => {
        const value = Number(facility.booking_fee_value || 0);
        const base = subtotal + addonsTotal;
        if (value <= 0) {
            return 0;
        }
        if (facility.booking_fee_type === 'PERCENT') {
            return Math.round(base * Math.min(value, 100)) / 100;
        }
        return value;
    }, [facility.booking_fee_type, facility.booking_fee_value, subtotal, addonsTotal]);
    const totalPrice = Math.round((subtotal + addonsTotal + bookingFee) * 100) / 100;
    const price = pricingSummary.dayRate || Number(selectedCourt?.hourly_rate || 0);

    const [proofFile, setProofFile] = useState(null);

    const handleBooking = () => {
        if (!startTime || !endTime || !selectedCourtId || processing || submittingRef.current) return;

        // Generate a fresh idempotency key for every attempt so retries are never blocked
        const freshKey = crypto.randomUUID();
        sessionStorage.setItem('book_idempotency_key', freshKey);
        setIdempotencyKey(freshKey);

        submittingRef.current = true;
        setProcessing(true);

        router.post(route('bookings.store'), {
            facility_id: facility.id,
            court_id: selectedCourtId,
            date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            // Preview only: the server recalculates the package, add-ons and fee.
            total_price: subtotal + addonsTotal,
            rate_plan_id: selectedRatePlan ? selectedRatePlan.id : '',
            addons: addonSelection.map(({ plan, quantity }) => ({
                rate_plan_id: plan.id,
                quantity,
            })),
            payment_method: paymentMethod,
            proof_file: proofFile
        }, {
            forceFormData: true,
            headers: { 'Idempotency-Key': freshKey },
            onFinish: () => {
                submittingRef.current = false;
                setProcessing(false);
            },
            onSuccess: () => {
                // DEFUSE THE TIME BOMB!
                if (lockTimerRef.current) clearTimeout(lockTimerRef.current);

                showModal('success', 'Your booking has been submitted and is awaiting confirmation. Track its status in My Bookings.');
                
                // Clear the temporary memory!
                sessionStorage.removeItem('book_facility');
                sessionStorage.removeItem('book_court');
                sessionStorage.removeItem('book_date');
                sessionStorage.removeItem('book_start');
                sessionStorage.removeItem('book_end');
                sessionStorage.removeItem('book_step');
                sessionStorage.removeItem('book_rate_plan');
                sessionStorage.removeItem('book_addons');
                sessionStorage.removeItem('lock_expires_at');
                
                setStartTime('');
                setEndTime('');
                setSelectedCourtId(null);
                setSelectedDate(null);
                setRatePlanId(null);
                setAddonQuantities({});
                setStep(1); // Send them back to step 1
                setProofFile(null);
                setIdempotencyKey(crypto.randomUUID());
            },
            onError: (errors) => {
                console.error(errors);
                const errorMsg = errors.idempotency
                    || errors.conflict
                    || errors.facility_id
                    || errors.court_id
                    || errors.date
                    || errors.start_time
                    || errors.rate_plan_id
                    || 'Failed to process booking. Please try again.';
                showModal('error', errorMsg);
                setIdempotencyKey(crypto.randomUUID());
            }
        });
    };

    const formatTimeString = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDateString = (dateString) => {
        if (!dateString) return '';
        const parts = String(dateString).split('-');
        if (parts.length === 3) {
            const [y, m, d] = parts.map(Number);
            const date = new Date(y, m - 1, d);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        }
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const canGoNext = () => {
        if (step === 1) return selectedCourtId !== null;
        if (step === 2) return selectedDate !== null && startTime !== '' && endTime !== '' && durationHours > 0;
        if (step === 3) return true; // Review step can always go next
        return false;
    };

    const isCustomDate = selectedDate && !dates.find(d => d.date === selectedDate);
    const requiresProof = paymentMethod === 'gcash' || paymentMethod === 'maya';
    const canConfirm = step === 4 && paymentMethod !== '' && (!requiresProof || proofFile !== null) && startTime && endTime && durationHours > 0;

    return {
        selectableCourts,
        facilityAcceptingBookings,
        availabilityBanner,
        operatingDaysLabel: facility.operating_days_label || formatOperatingDaysLabel(facility.operating_days),
        selectedCourtId, setSelectedCourtId: handleCourtChange,
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
        lockTimeFormatted: formatLockTime(lockSecondsRemaining),
    };
}
