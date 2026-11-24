import { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import { courtIsBookable } from '@/Utils/courtStatus';
import { offeredAddons, offeredCourtPlans, planRates, quoteBooking } from '@/Utils/rateQuote';
import {
    addDays,
    buildHourOptions,
    normalizeSelection,
    occupiedHourKeys,
    parseOperatingWindow,
} from '@/Utils/operatingHours';

export function useBookingLogic(facility, preselectedCourtId = null) {
    const courts = facility.courts || [];
    const bookableCourts = courts.filter((c) => courtIsBookable(c.status));
    const selectableCourts = bookableCourts.length > 0 ? bookableCourts : courts;

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
        setStartKey('');
        setEndKey('');
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
                    date: sessionStartDate,
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
    // Selections are stored as option keys ("0-22:00", "1-00:00") because the
    // clock value alone is ambiguous for courts closing at midnight.
    const [startKey, setStartKey] = useState('');
    const [endKey, setEndKey] = useState('');
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
    const [nextDayLockedSlots, setNextDayLockedSlots] = useState([]);
    
    // Keep track of our hidden timer
    const lockTimerRef = useRef(null);

    // This is the "Time Bomb" function that triggers when time is up
    const expireBooking = async () => {
        // Unlock immediately
        if (selectedCourtId && selectedDate && startTime && endTime) {
            try {
                await window.axios.post('/bookings/unlock', {
                    court_id: selectedCourtId,
                    date: sessionStartDate,
                    start_time: startTime,
                    end_time: endTime,
                    idempotency_key: idempotencyKey
                });
            } catch (e) {}
        }

        showModal('timer', 'Oops! You took a little too long. Please select your court again.', 'Session Expired');
        
        // Wipe everything out
        setStartKey('');
        setEndKey('');
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
            setNextDayLockedSlots([]);
            return;
        }

        const fetchLocks = () => {
            fetch(`/api/courts/${selectedCourtId}/locked-slots?date=${selectedDate}&idempotency_key=${idempotencyKey}`)
                .then(res => res.json())
                .then(data => {
                    setLockedSlots(data.locked_slots || []);
                    setNextDayLockedSlots(data.next_day_locked_slots || []);
                })
                .catch(err => console.error("Error fetching locked slots", err));
        };

        // Fetch immediately on mount or when court/date changes
        fetchLocks();
        
    }, [selectedCourtId, selectedDate, idempotencyKey]);

    // Operating window + hourly slots come from one shared model, so a court can
    // always be booked until at least midnight (and until 2:00 AM when its
    // schedule closes after midnight).
    const operatingWindow = useMemo(
        () => parseOperatingWindow(selectedCourt?.time_range),
        [selectedCourt?.time_range],
    );
    const hourOptions = useMemo(() => buildHourOptions(operatingWindow), [operatingWindow]);
    const occupiedHours = useMemo(
        () => occupiedHourKeys(facility.bookings || [], selectedCourtId),
        [facility.bookings, selectedCourtId],
    );

    const timeOptions = useMemo(() => {
        if (!selectedCourt || !selectedDate) {
            return [];
        }

        return hourOptions.map((option) => {
            const optionDate = addDays(selectedDate, option.dayOffset);
            const hour = parseInt(option.value.slice(0, 2), 10);
            const booked = occupiedHours.has(`${optionDate}-${hour}`);

            // Slot holds are per calendar date, so next-day hours use the next
            // date's hold list.
            const heldHours = option.dayOffset === 0 ? lockedSlots : nextDayLockedSlots;
            const locked = heldHours.includes(option.value);
            const isUnavailable = booked || locked;
            const labelSuffix = booked ? '(Booked)' : locked ? '(Held)' : option.isNextDay ? '(next day)' : '';

            let rateTag = '';
            const planRateSet = selectedRatePlan ? planRates(selectedRatePlan) : null;

            if (selectedRatePlan && planRateSet) {
                const dayStartH = selectedRatePlan.day_start_time ? parseInt(String(selectedRatePlan.day_start_time).split(':')[0], 10) : 2;
                const nightStartH = selectedRatePlan.night_start_time ? parseInt(String(selectedRatePlan.night_start_time).split(':')[0], 10) : 17;
                const isNight = planRateSet.night !== null && (hour >= nightStartH || hour < dayStartH);
                const rate = isNight ? planRateSet.night : planRateSet.day;
                rateTag = isNight ? `🌙 ₱${rate.toFixed(0)}` : `☀️ ₱${rate.toFixed(0)}`;
            } else if (selectedCourt?.pricing_mode === 'SPLIT' && selectedCourt.day_rate && selectedCourt.night_rate) {
                const dayStartH = selectedCourt.day_start_time ? parseInt(String(selectedCourt.day_start_time).split(':')[0], 10) : 6;
                const nightStartH = selectedCourt.night_start_time ? parseInt(String(selectedCourt.night_start_time).split(':')[0], 10) : 18;
                const isNight = hour >= nightStartH || hour < dayStartH;
                const rate = isNight ? Number(selectedCourt.night_rate) : Number(selectedCourt.day_rate);
                rateTag = isNight ? `🌙 ₱${rate.toFixed(0)}` : `☀️ ₱${rate.toFixed(0)}`;
            }

            return { ...option, isBooked: isUnavailable, labelSuffix, rateTag };
        });
    }, [hourOptions, selectedCourt, selectedDate, occupiedHours, lockedSlots, nextDayLockedSlots, selectedRatePlan]);

    // Slots that can open a session: the closing boundary is end-only.
    const startOptions = useMemo(
        () => timeOptions.filter((option) => !option.isClosing),
        [timeOptions],
    );

    const startOption = useMemo(
        () => timeOptions.find((option) => option.key === startKey) || null,
        [timeOptions, startKey],
    );

    const endOption = useMemo(
        () => timeOptions.find((option) => option.key === endKey) || null,
        [timeOptions, endKey],
    );

    // End times run from the chosen start to the first booked hour (or closing).
    const endOptions = useMemo(() => {
        const startIndex = timeOptions.findIndex((option) => option.key === startKey);

        if (startIndex === -1) {
            return [];
        }

        const firstBooked = timeOptions.findIndex((option, index) => index > startIndex && option.isBooked);
        const lastIndex = firstBooked === -1 ? timeOptions.length - 1 : firstBooked;

        return timeOptions.slice(startIndex + 1, lastIndex + 1);
    }, [timeOptions, startKey]);

    const startTime = startOption?.value || '';
    const endTime = endOption?.value || '';

    // A session can start on the next calendar day when it is picked from the
    // overnight tail (e.g. 12:00 AM), so locks and bookings use that date.
    const sessionStartDate = selectedDate && startOption
        ? addDays(selectedDate, startOption.dayOffset)
        : selectedDate;

    // Generate next 14 days
    const dates = useMemo(() => {
        const generatedDates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            generatedDates.push({
                date: localDate,
                dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: d.getDate(),
                monthName: d.toLocaleDateString('en-US', { month: 'short' }),
            });
        }
        return generatedDates;
    }, []);

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

    // Resilient 7-Minute Timer (Survives Page Refreshes!)
    useEffect(() => {
        if (step >= 3) {
            let expiresAt = sessionStorage.getItem('lock_expires_at');
            
            if (expiresAt) {

            const timeLeft = parseInt(expiresAt) - Date.now();
            
            if (timeLeft <= 0) {
                expireBooking();
            } else {
                lockTimerRef.current = setTimeout(() => {
                    expireBooking();
                }, timeLeft);
            }
            }
        }

        return () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        };
    }, [step]);

    // Track if this is the first render
    const isFirstRender = useRef(true);

    // Clear times when court or date changes (but NOT on first load!)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        setStartKey('');
        setEndKey('');
    }, [selectedDate, selectedCourtId]);

    // Keep the end time valid whenever the start (or availability) changes.
    useEffect(() => {
        if (endKey && !endOptions.some((option) => option.key === endKey)) {
            setEndKey('');
        }
    }, [endOptions, endKey]);

    // Restore a saved draft's hours by clock value once the court's window is known.
    useEffect(() => {
        if (startKey || timeOptions.length === 0) {
            return;
        }

        const storedStart = (sessionStorage.getItem('book_start') || '').slice(0, 5);
        if (!storedStart) {
            return;
        }

        const restoredStart = timeOptions.find((option) => option.value === storedStart && !option.isBooked && !option.isClosing);
        if (!restoredStart) {
            return;
        }

        setStartKey(restoredStart.key);

        const storedEnd = (sessionStorage.getItem('book_end') || '').slice(0, 5);
        const restoredEnd = timeOptions.find((option) => option.value === storedEnd && option.minutes > restoredStart.minutes && !option.isBooked);

        if (restoredEnd) {
            setEndKey(restoredEnd.key);
        }
    }, [timeOptions, startKey]);

       const goNext = async () => {
        // If we are leaving the Date & Time step (Step 2), try to lock it!
        if (step === 2) {
            setProcessing(true); // Spin the button
            try {
                await window.axios.post('/bookings/lock', {
                    court_id: selectedCourtId,
                    date: sessionStartDate,
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
                        date: sessionStartDate,
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
            date: sessionStartDate,
            // Informational: the server derives end_date from the start/end times.
            end_date: normalizeSelection(selectedDate, startOption, endOption)?.end_date ?? null,
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
                
                setStartKey('');
                setEndKey('');
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
                const errorMsg = errors.idempotency || errors.conflict || errors.start_time || errors.end_time || errors.rate_plan_id || 'Failed to process booking. Please try again.';
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
    const canConfirm = step === 4 && paymentMethod !== '' && proofFile !== null && startTime && endTime && durationHours > 0;

    return {
        selectableCourts,
        selectedCourtId, setSelectedCourtId: handleCourtChange,
        selectedDate, setSelectedDate,
        startKey, setStartKey,
        endKey, setEndKey,
        startOptions, endOptions,
        startOption, endOption,
        startTime, endTime,
        operatingWindow, sessionStartDate,
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
    };
}

