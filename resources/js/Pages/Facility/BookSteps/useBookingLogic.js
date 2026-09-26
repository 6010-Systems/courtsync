import { useState, useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import { courtIsBookable } from '@/Utils/courtStatus';

export function useBookingLogic(facility) {
    const courts = facility.courts || [];
    const bookableCourts = courts.filter((c) => courtIsBookable(c.status));
    const selectableCourts = bookableCourts.length > 0 ? bookableCourts : courts;

   const [selectedCourtId, setSelectedCourtId] = useState(() => sessionStorage.getItem('book_court') || null);
  const [selectedDate, setSelectedDate] = useState(() => sessionStorage.getItem('book_date') || null);
   const [startTime, setStartTime] = useState(() => sessionStorage.getItem('book_start') || '');
    const [endTime, setEndTime] = useState(() => sessionStorage.getItem('book_end') || '');
    const [paymentMethod, setPaymentMethod] = useState('pay_at_facility');
  const [step, setStep] = useState(() => parseInt(sessionStorage.getItem('book_step')) || 1);
    const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
    const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });
    const [processing, setProcessing] = useState(false);
    


    const showModal = (type, message) => setModal({ isOpen: true, type, message });
    const closeModal = () => setModal({ isOpen: false, type: '', message: '' });
    
    const selectedCourt = selectableCourts.find(c => c.id == selectedCourtId);

    const generateTimeOptions = (timeRange, selectedDate, courtId, allBookings = []) => {
        let startHour = 6;
        let endHour = 22;

        if (timeRange) {
            const match = timeRange.match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);
            if (match) {
                let sH = parseInt(match[1]);
                const sM = match[2];
                let eH = parseInt(match[3]);
                const eM = match[4];

                if (sM && sM.toUpperCase() === 'PM' && sH < 12) sH += 12;
                if (sM && sM.toUpperCase() === 'AM' && sH === 12) sH = 0;
                
                if (eM && eM.toUpperCase() === 'PM' && eH < 12) eH += 12;
                if (eM && eM.toUpperCase() === 'AM' && eH === 12) eH = 0;

                startHour = sH;
                endHour = eH;
            }
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

        const options = [];
        for (let i = startHour; i <= endHour; i++) {
            const timeValue = `${i.toString().padStart(2, '0')}:00`;
            const date = new Date();
            date.setHours(i, 0);
            const formatted = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            options.push({ value: timeValue, label: formatted, isBooked: bookedHours.has(i) });
        }
        return options;
    };
    
    const timeOptions = useMemo(() => {
        if (!selectedCourt || !selectedDate) return [];
        return generateTimeOptions(selectedCourt?.time_range, selectedDate, selectedCourt?.id, facility.bookings || []);
    }, [selectedCourt, selectedDate, facility.bookings]);

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
        if (selectedCourtId) sessionStorage.setItem('book_court', selectedCourtId);
        if (selectedDate) sessionStorage.setItem('book_date', selectedDate);
        if (startTime) sessionStorage.setItem('book_start', startTime);
        if (endTime) sessionStorage.setItem('book_end', endTime);
        sessionStorage.setItem('book_step', step);
    }, [selectedCourtId, selectedDate, startTime, endTime, step]);

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

    const goNext = () => setStep(s => Math.min(s + 1, 4));
    const goPrev = () => setStep(s => Math.max(s - 1, 1));

    const price = selectedCourt?.hourly_rate ? Number(selectedCourt.hourly_rate) : 0;
    
    const durationHours = useMemo(() => {
        if (!startTime || !endTime) return 0;
        const [sH] = startTime.split(':').map(Number);
        const [eH] = endTime.split(':').map(Number);
        const diff = eH - sH;
        return diff > 0 ? diff : 0;
    }, [startTime, endTime]);
    
    const totalPrice = price * durationHours;

    const [proofFile, setProofFile] = useState(null);

    const handleBooking = () => {
        if (!startTime || !endTime || !selectedCourtId || processing) return;

        setProcessing(true);

        router.post(route('bookings.store'), {
            facility_id: facility.id,
            court_id: selectedCourtId,
            date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            total_price: totalPrice,
            payment_method: paymentMethod,
            proof_file: proofFile
        }, {
            forceFormData: true,
            headers: { 'Idempotency-Key': idempotencyKey },
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                showModal('success', 'Your court reservation has been secured. See you there!');
                
                // Clear the temporary memory!
                sessionStorage.removeItem('book_court');
                sessionStorage.removeItem('book_date');
                sessionStorage.removeItem('book_start');
                sessionStorage.removeItem('book_end');
                sessionStorage.removeItem('book_step');
                
                setStartTime('');
                setEndTime('');
                setSelectedCourtId(null);
                setSelectedDate(null);
                setStep(1); // Send them back to step 1
                setProofFile(null);
                setIdempotencyKey(crypto.randomUUID());
            },
            onError: (errors) => {
                console.error(errors);
                const errorMsg = errors.idempotency || errors.conflict || 'Failed to process booking. Please try again.';
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
    };
}
