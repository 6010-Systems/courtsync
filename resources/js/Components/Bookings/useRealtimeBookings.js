import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/Components/ToastContext';
import {
    BOOKING_STATUS,
    BOOKING_SOURCE,
    INITIAL_BOOKINGS,
    INITIAL_EXPIRED_HOLDS,
    MOCK_KPIS,
    MOCK_COURTS,
} from './types';

export function useRealtimeBookings() {
    const toast = useToast();
    const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
    const [expiredHolds, setExpiredHolds] = useState(INITIAL_EXPIRED_HOLDS);
    const [kpis, setKpis] = useState(MOCK_KPIS);
    const [echoStatus, setEchoStatus] = useState('connected'); // 'connected' | 'reconnecting' | 'disconnected'
    const [animatingBookingId, setAnimatingBookingId] = useState(null);
    const [pendingActionId, setPendingActionId] = useState(null);

    // ── 1. Live 1-second countdown ticker for Awaiting Payment holds ─────────
    useEffect(() => {
        const interval = setInterval(() => {
            setBookings(prevBookings => {
                let hasChanges = false;
                const newExpired = [];

                const updated = prevBookings.map(b => {
                    if (b.status === BOOKING_STATUS.AWAITING_PAYMENT && typeof b.holdRemainingSeconds === 'number') {
                        if (b.holdRemainingSeconds <= 1) {
                            hasChanges = true;
                            newExpired.push({
                                id: `exp-${Date.now()}-${b.id}`,
                                reference: b.reference,
                                customerName: b.customerName,
                                customerPhone: b.customerPhone,
                                customerEmail: b.customerEmail,
                                initials: b.initials,
                                courtName: MOCK_COURTS.find(c => c.id === b.courtId)?.name || 'Court',
                                sport: b.sport,
                                timeRange: `${b.startTime} – ${b.endTime}`,
                                amount: b.amount,
                                expiredAgo: 'Just now',
                                reason: '30-minute payment hold window lapsed',
                            });
                            return {
                                ...b,
                                status: BOOKING_STATUS.EXPIRED,
                                holdRemainingSeconds: 0,
                            };
                        }
                        return {
                            ...b,
                            holdRemainingSeconds: b.holdRemainingSeconds - 1,
                        };
                    }
                    return b;
                });

                if (newExpired.length > 0) {
                    setExpiredHolds(prev => [...newExpired, ...prev]);
                    toast.warning(
                        `Payment hold for ${newExpired[0].customerName} has expired and released the slot.`,
                        { title: 'Hold Expired' }
                    );
                }

                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [toast]);

    // ── 2. Booking Actions ───────────────────────────────────────────────────

    // Check In with micro-spinner
    const checkInBooking = useCallback(async (bookingId) => {
        setPendingActionId(bookingId);

        // Optimistic delay simulation representing server roundtrip
        await new Promise(r => setTimeout(r, 450));

        setBookings(prev =>
            prev.map(b => (b.id === bookingId ? { ...b, status: BOOKING_STATUS.CHECKED_IN } : b))
        );
        setPendingActionId(null);
        toast.success('Player checked in successfully. Court access granted.', {
            title: 'Check-In Complete',
        });
    }, [toast]);

    // Mark Paid
    const markPaid = useCallback(async (bookingId, paymentMethod = 'CASH') => {
        setPendingActionId(bookingId);
        await new Promise(r => setTimeout(r, 400));

        setBookings(prev =>
            prev.map(b => {
                if (b.id === bookingId) {
                    return {
                        ...b,
                        status: BOOKING_STATUS.CONFIRMED,
                        paymentStatus: 'PAID',
                        paymentMethod: paymentMethod,
                        holdRemainingSeconds: null,
                    };
                }
                return b;
            })
        );
        setPendingActionId(null);
        toast.success(`Payment recorded via ${paymentMethod}. Booking confirmed!`, {
            title: 'Payment Confirmed',
        });
    }, [toast]);

    // Extend Booking (+30m or +1h)
    const extendBooking = useCallback(async (bookingId, additionalMinutes = 30) => {
        setPendingActionId(bookingId);
        await new Promise(r => setTimeout(r, 400));

        setBookings(prev =>
            prev.map(b => {
                if (b.id === bookingId) {
                    const [h, m] = b.endTime.split(':').map(Number);
                    const totalMins = h * 60 + m + additionalMinutes;
                    const newH = Math.floor(totalMins / 60);
                    const newM = totalMins % 60;
                    const newEndTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                    const addHours = additionalMinutes / 60;
                    const rate = b.durationHours > 0 ? b.amount / b.durationHours : 450;
                    const addAmount = Math.round(rate * addHours);

                    return {
                        ...b,
                        endTime: newEndTime,
                        durationHours: b.durationHours + addHours,
                        amount: b.amount + addAmount,
                    };
                }
                return b;
            })
        );
        setPendingActionId(null);
        toast.info(`Booking extended by ${additionalMinutes} mins.`, {
            title: 'Booking Extended',
        });
    }, [toast]);

    // Cancel Booking
    const cancelBooking = useCallback(async (bookingId, reason = 'Cancelled by staff') => {
        setPendingActionId(bookingId);
        await new Promise(r => setTimeout(r, 400));

        setBookings(prev =>
            prev.map(b => (b.id === bookingId ? { ...b, status: BOOKING_STATUS.CANCELLED, notes: `${b.notes || ''} [Cancelled: ${reason}]` } : b))
        );
        setPendingActionId(null);
        toast.warning(`Booking ${bookingId} cancelled and slot released.`, {
            title: 'Booking Cancelled',
        });
    }, [toast]);

    // Create Booking (Walk-in or Staff or Online)
    const createBooking = useCallback((bookingData) => {
        const id = `bk-${Date.now()}`;
        const reference = `CS-BK-${Math.floor(1000 + Math.random() * 9000)}`;
        const initials = bookingData.customerName
            ? bookingData.customerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
            : 'WB';

        const newBooking = {
            id,
            reference,
            courtId: bookingData.courtId,
            customerName: bookingData.customerName,
            customerPhone: bookingData.customerPhone || '+63 900 000 0000',
            customerEmail: bookingData.customerEmail || '',
            initials,
            sport: bookingData.sport,
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            durationHours: bookingData.durationHours || 1,
            status: bookingData.status || BOOKING_STATUS.CONFIRMED,
            source: bookingData.source || BOOKING_SOURCE.WALK_IN,
            paymentStatus: bookingData.paymentStatus || 'PAID',
            paymentMethod: bookingData.paymentMethod || 'CASH',
            amount: bookingData.amount || 450,
            holdRemainingSeconds: bookingData.status === BOOKING_STATUS.AWAITING_PAYMENT ? 1800 : null,
            notes: bookingData.notes || '',
        };

        setBookings(prev => [newBooking, ...prev]);

        // Animate entrance
        setAnimatingBookingId(id);
        setTimeout(() => setAnimatingBookingId(null), 3000);

        // Update KPIs dynamically
        setKpis(prev => ({
            ...prev,
            bookingsToday: {
                ...prev.bookingsToday,
                value: prev.bookingsToday.value + 1,
            },
            revenueToday: {
                ...prev.revenueToday,
                value: `₱${(prev.revenueToday.rawValue + newBooking.amount).toLocaleString()}`,
                rawValue: prev.revenueToday.rawValue + newBooking.amount,
            },
        }));

        toast.success(
            `New ${bookingData.sport} booking created for ${bookingData.customerName} (${bookingData.startTime} – ${bookingData.endTime})`,
            {
                title: bookingData.source === BOOKING_SOURCE.WALK_IN ? 'Walk-In Created' : 'Booking Confirmed',
            }
        );

        return newBooking;
    }, [toast]);

    // Simulate Realtime Inflow Trigger (For Live Demonstration)
    const triggerSimulatedEvent = useCallback((type = 'ONLINE_BOOKING') => {
        const randomCourts = MOCK_COURTS;
        const court = randomCourts[Math.floor(Math.random() * randomCourts.length)];
        const startHours = [12, 14, 16, 17, 19, 21];
        const startHour = startHours[Math.floor(Math.random() * startHours.length)];
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(startHour + 1).padStart(2, '0')}:30`;

        if (type === 'ONLINE_BOOKING') {
            const names = ['Camille Prats', 'Jericho Rosales', 'Alyssa Valdez', 'EJ Obiena', 'Jasmine Curtis'];
            const name = names[Math.floor(Math.random() * names.length)];
            createBooking({
                courtId: court.id,
                customerName: name,
                customerPhone: '+63 917 999 8811',
                customerEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
                sport: court.sport,
                startTime,
                endTime,
                durationHours: 1.5,
                status: BOOKING_STATUS.AWAITING_PAYMENT,
                source: BOOKING_SOURCE.ONLINE,
                paymentStatus: 'PENDING',
                paymentMethod: 'GCASH',
                amount: Math.round(court.hourlyRate * 1.5),
                notes: 'Instant hold pushed via online mobile checkout.',
            });
        } else if (type === 'WALK_IN') {
            const names = ['Walk-in: Gabriel Mercado', 'Walk-in: Paolo Contis', 'Walk-in: Marco Gallo'];
            const name = names[Math.floor(Math.random() * names.length)];
            createBooking({
                courtId: court.id,
                customerName: name,
                customerPhone: '+63 920 444 8877',
                customerEmail: '',
                sport: court.sport,
                startTime,
                endTime,
                durationHours: 1.5,
                status: BOOKING_STATUS.CONFIRMED,
                source: BOOKING_SOURCE.WALK_IN,
                paymentStatus: 'PAID',
                paymentMethod: 'CASH',
                amount: Math.round(court.hourlyRate * 1.5),
                notes: 'Walk-in booked & paid at front desk.',
            });
        }
    }, [createBooking]);

    return {
        bookings,
        expiredHolds,
        kpis,
        echoStatus,
        animatingBookingId,
        pendingActionId,
        checkInBooking,
        markPaid,
        extendBooking,
        cancelBooking,
        createBooking,
        triggerSimulatedEvent,
    };
}
