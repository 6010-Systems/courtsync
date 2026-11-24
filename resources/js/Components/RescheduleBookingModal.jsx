import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Banknote, Clock } from 'lucide-react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import BookingReviewCard from '@/Components/BookingReviewCard';
import { formatPeso } from '@/Components/MetricCard';
import { estimateBookingFee, offeredAddons, offeredCourtPlans, planRates, quoteBooking } from '@/Utils/rateQuote';
import {
    addDays,
    buildHourOptions,
    clockToMinutes,
    normalizeSelection,
    occupiedHourKeys,
    parseOperatingWindow,
} from '@/Utils/operatingHours';

const PAYMENT_METHODS = [
    { value: '', label: 'Unchanged' },
    { value: 'gcash', label: 'GCash' },
    { value: 'maya', label: 'Maya' },
    { value: 'cash', label: 'Cash (at facility)' },
];

const PAYMENT_STATUSES = [
    { value: '', label: 'Unchanged' },
    { value: 'pending', label: 'Pending' },
    { value: 'verified', label: 'Verified' },
    { value: 'rejected', label: 'Rejected' },
];

const dateOnly = (value) => (value ? String(value).slice(0, 10) : '');

const timeOnly = (value) => (value ? String(value).slice(0, 5) : '');

const hourOf = (value) => parseInt(timeOnly(value), 10) || 0;

const localToday = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatHour = (hour) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatBookingDate = (value) => {
    if (!value) return '';

    return new Date(`${dateOnly(value)}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
};

/**
 * Courts keep their opening hours as free text, e.g. "6:00 AM - 10:00 PM".
 * Scheduling now goes through the shared operating-hours engine
 * (@/Utils/operatingHours), which supports midnight and 2:00 AM closes.
 */
export default function RescheduleBookingModal({ show, booking, courtBookings = [], facilities = [], onClose }) {
    const [step, setStep] = useState(1);
    const [addonQuantities, setAddonQuantities] = useState({});
    const [amountTouched, setAmountTouched] = useState(false);
    const [startKey, setStartKey] = useState('');
    const [endKey, setEndKey] = useState('');

    const { data, setData, post, processing, errors, clearErrors, transform } = useForm({
        date: '',
        start_time: '',
        end_time: '',
        rate_plan_id: '',
        payment_method: '',
        payment_amount: '',
        payment_status: '',
    });

    // The booking's own `court` relation is a lightweight snapshot; the full
    // court (with its rate card) lives on the `facilities` prop.
    const fullCourt = useMemo(() => {
        for (const facility of facilities) {
            const court = (facility.courts || []).find((c) => c.id === booking?.court_id);
            if (court) return { court, facility };
        }

        return { court: booking?.court ?? null, facility: null };
    }, [facilities, booking?.court_id]);

    const courtPlans = useMemo(() => offeredCourtPlans(fullCourt.court, fullCourt.facility), [fullCourt]);
    const addonPlans = useMemo(() => offeredAddons(fullCourt.court, fullCourt.facility), [fullCourt]);
    const selectedRatePlan = courtPlans.find((plan) => plan.id == data.rate_plan_id) || null;

    useEffect(() => {
        if (!show || !booking) return;

        setStep(1);

        // An early-morning session (12:00 AM – 2:00 AM) belongs to the previous
        // night, so anchor the slot list on that evening to keep it selectable.
        const window = parseOperatingWindow(fullCourt.court?.time_range || booking?.court?.time_range);
        const startMinutes = clockToMinutes(timeOnly(booking.start_time)) ?? 0;
        const endMinutes = clockToMinutes(timeOnly(booking.end_time)) ?? 0;
        const normalisedEnd = endMinutes <= startMinutes ? endMinutes + 1440 : endMinutes;
        const isEarlyTail = startMinutes < window.openMinutes && normalisedEnd <= window.earlyCloseMinutes;
        const bookingDate = isEarlyTail
            ? addDays(dateOnly(booking.date), -1)
            : dateOnly(booking.date);

        const offeredIds = courtPlans.map((plan) => plan.id);
        const initialRatePlanId = offeredIds.includes(booking.rate_plan_id)
            ? booking.rate_plan_id
            : (courtPlans[0]?.id ?? '');

        setData({
            date: bookingDate,
            start_time: timeOnly(booking.start_time),
            end_time: timeOnly(booking.end_time),
            rate_plan_id: initialRatePlanId,
            payment_method: '',
            payment_amount: booking.payment?.amount ?? booking.total_price ?? '',
            payment_status: '',
        });
        clearErrors();
        setAmountTouched(false);
        setStartKey('');
        setEndKey('');

        const initialAddons = {};
        (booking.price_breakdown?.addons || []).forEach((line) => {
            if (line?.rate_plan_id) {
                initialAddons[line.rate_plan_id] = Number(line.quantity || 0);
            }
        });
        setAddonQuantities(initialAddons);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, booking?.id]);

    const addonSelection = useMemo(
        () => addonPlans
            .map((plan) => ({ plan, quantity: Number(addonQuantities[plan.id] || 0) }))
            .filter((row) => row.quantity > 0),
        [addonPlans, addonQuantities],
    );

    const setAddonQuantity = (plan, quantity) => {
        const max = Math.max(1, Number(plan.max_quantity || 1));
        const clamped = Math.max(0, Math.min(quantity, max));
        setAddonQuantities((prev) => ({ ...prev, [plan.id]: clamped }));
    };

    const pricingQuote = useMemo(() => quoteBooking({
        court: fullCourt.court,
        ratePlan: selectedRatePlan,
        addons: addonSelection,
        startTime: data.start_time,
        endTime: data.end_time,
    }), [fullCourt, selectedRatePlan, addonSelection, data.start_time, data.end_time]);

    const bookingFeeEstimate = useMemo(
        () => estimateBookingFee(fullCourt.facility, pricingQuote.total),
        [fullCourt.facility, pricingQuote.total],
    );
    const grandTotal = pricingQuote.total + bookingFeeEstimate;

    // The amount follows the recalculated total until the owner types their own
    // figure (e.g. a partial payment) — then it stops auto-updating.
    useEffect(() => {
        if (!amountTouched) {
            setData('payment_amount', grandTotal);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grandTotal, amountTouched]);

    // "Unchanged" selections (empty string) should not overwrite the stored payment.
    transform((formData) => {
        const selection = normalizeSelection(formData.date, startOption, endOption);

        return {
            ...formData,
            date: selection?.date || formData.date,
            end_date: selection?.end_date || null,
            start_time: selection?.start_time || formData.start_time,
            end_time: selection?.end_time || formData.end_time,
            rate_plan_id: selectedRatePlan?.id || '',
            addons: addonSelection.map(({ plan, quantity }) => ({ rate_plan_id: plan.id, quantity })),
            payment_method: formData.payment_method || undefined,
            payment_status: formData.payment_status || undefined,
        };
    });

    // Shared operating-hours engine. Courts are bookable until at least
    // midnight (and until 2:00 AM when their schedule closes after midnight).
    const operatingWindow = useMemo(
        () => parseOperatingWindow(fullCourt.court?.time_range || booking?.court?.time_range),
        [fullCourt.court?.time_range, booking?.court?.time_range],
    );
    const hourOptions = useMemo(() => buildHourOptions(operatingWindow), [operatingWindow]);

    // Hours already taken on the selected court by any other active booking.
    const occupiedHours = useMemo(
        () => occupiedHourKeys((courtBookings || []).filter((item) => item.id !== booking?.id), booking?.court_id ?? null),
        [courtBookings, booking?.id, booking?.court_id],
    );

    const dayOptions = useMemo(() => {
        if (!data.date) {
            return [];
        }

        return hourOptions.map((option) => ({
            ...option,
            isBooked: occupiedHours.has(`${addDays(data.date, option.dayOffset)}-${parseInt(option.value.slice(0, 2), 10)}`),
        }));
    }, [hourOptions, data.date, occupiedHours]);

    const startOptions = useMemo(
        () => dayOptions.filter((option) => !option.isClosing && !option.isBooked),
        [dayOptions],
    );

    const startOption = useMemo(
        () => dayOptions.find((option) => option.key === startKey) || null,
        [dayOptions, startKey],
    );

    const endOption = useMemo(
        () => dayOptions.find((option) => option.key === endKey) || null,
        [dayOptions, endKey],
    );

    const endOptions = useMemo(() => {
        const startIndex = dayOptions.findIndex((option) => option.key === startKey);

        if (startIndex === -1) {
            return [];
        }

        const firstBooked = dayOptions.findIndex((option, index) => index > startIndex && option.isBooked);
        const lastIndex = firstBooked === -1 ? dayOptions.length - 1 : firstBooked;

        return dayOptions.slice(startIndex + 1, lastIndex + 1);
    }, [dayOptions, startKey]);

    const durationHours = startOption && endOption
        ? Math.max(0, (endOption.minutes - startOption.minutes) / 60)
        : 0;
    const canReview = Boolean(data.date && startOption && endOption);

    // Preselect the booking's current hours once the court's window is known.
    useEffect(() => {
        if (!show || startKey || dayOptions.length === 0) {
            return;
        }

        const currentStart = dayOptions.find(
            (option) => option.value === timeOnly(data.start_time) && !option.isClosing,
        );

        if (!currentStart) {
            return;
        }

        setStartKey(currentStart.key);

        const currentEnd = dayOptions.find(
            (option) => option.value === timeOnly(data.end_time) && option.minutes > currentStart.minutes,
        );

        if (currentEnd) {
            setEndKey(currentEnd.key);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, dayOptions, startKey]);

    // Drop an end time that no longer follows the chosen start.
    useEffect(() => {
        if (endKey && !endOptions.some((option) => option.key === endKey)) {
            setEndKey('');
        }
    }, [endOptions, endKey]);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!booking) return;

        post(route('bookings.reschedule', booking.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    if (!booking) {
        return <Modal show={show} onClose={onClose} maxWidth="2xl" />;
    }

    const extraRows = [];
    if (data.payment_method) {
        extraRows.push({ label: 'Payment method', value: PAYMENT_METHODS.find((m) => m.value === data.payment_method)?.label || data.payment_method });
    }
    if (data.payment_status) {
        extraRows.push({ label: 'Payment status', value: PAYMENT_STATUSES.find((s) => s.value === data.payment_status)?.label || data.payment_status });
    }
    const currentPaymentAmount = Number(booking.payment?.amount ?? booking.total_price ?? 0);
    if (data.payment_amount !== '' && Number(data.payment_amount) !== currentPaymentAmount) {
        extraRows.push({ label: 'Payment amount', value: formatPeso(data.payment_amount) });
    }

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
                <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-[#10221C] uppercase tracking-wide">
                            {step === 1 ? 'Edit Booking' : 'Review Changes'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            #{booking.id} · {booking.court?.name || 'Court'} · {booking.user?.name || booking.guest_name || 'Walk-in'}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {step === 1 ? (
                    <div className="flex flex-col gap-6">
                        <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAFAF8] px-3 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">Current slot</span>
                            <p className="mt-0.5 text-sm font-bold text-[#10221C]">
                                {formatBookingDate(booking.date)} · {formatHour(hourOf(booking.start_time))} – {formatHour(hourOf(booking.end_time))}
                                {String(booking.end_time) <= String(booking.start_time) || booking.end_date ? ' (next day)' : ''}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <InputLabel htmlFor="reschedule_date" value="Date" />
                                <input
                                    id="reschedule_date"
                                    type="date"
                                    value={data.date}
                                    onChange={(event) => {
                                        setData('date', event.target.value);
                                        setStartKey('');
                                        setEndKey('');
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                />
                                <InputError message={errors.date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="reschedule_start_time" value="Start Time" />
                                <select
                                    id="reschedule_start_time"
                                    value={startKey}
                                    onChange={(event) => {
                                        const option = dayOptions.find((item) => item.key === event.target.value);
                                        setStartKey(event.target.value);
                                        setData('start_time', option?.value || '');
                                        setEndKey('');
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    <option value="">--:--</option>
                                    {startOptions.map((option) => (
                                        <option key={option.key} value={option.key}>
                                            {option.label}{option.isNextDay ? ' (next day)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="reschedule_end_time" value="End Time" />
                                <select
                                    id="reschedule_end_time"
                                    value={endKey}
                                    onChange={(event) => {
                                        const option = dayOptions.find((item) => item.key === event.target.value);
                                        setEndKey(event.target.value);
                                        setData('end_time', option?.value || '');
                                    }}
                                    disabled={!startKey}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm disabled:bg-gray-100"
                                >
                                    <option value="">--:--</option>
                                    {endOptions.map((option) => (
                                        <option key={option.key} value={option.key}>{option.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>
                        </div>

                        {durationHours > 0 && (
                            <p className="-mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#D6FF3F]/20 px-2.5 py-1 text-[11px] font-bold text-[#10221C]">
                                <Clock size={12} />
                                {durationHours} hr{durationHours === 1 ? '' : 's'} · {formatHour(hourOf(data.start_time))} – {formatHour(hourOf(data.end_time))}{endOption?.isNextDay ? ' (next day)' : ''}
                            </p>
                        )}

                        <InputError message={errors.booking} />

                        {/* Rate card — pick a package instead of typing a raw amount */}
                        <div className="rounded-xl border border-gray-100 bg-[#FAFAF8] p-4">
                            <InputLabel value="Rate" />
                            {courtPlans.length > 0 ? (
                                <>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {courtPlans.map((plan) => {
                                            const rates = planRates(plan);
                                            const active = selectedRatePlan?.id === plan.id;

                                            return (
                                                <button
                                                    type="button"
                                                    key={plan.id}
                                                    onClick={() => setData('rate_plan_id', plan.id)}
                                                    className={`text-left rounded-lg border-2 p-2.5 transition-all ${
                                                        active
                                                            ? 'border-[#10221C] bg-[#10221C] text-white shadow-md'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                    }`}
                                                >
                                                    <p className={`text-sm font-bold ${active ? 'text-white' : 'text-[#10221C]'}`}>{plan.name}</p>
                                                    <p className={`text-xs font-bold ${active ? 'text-[#D6FF3F]' : 'text-[#10221C]/70'}`}>
                                                        ☀️ {formatPeso(rates.day)}/hr
                                                        {rates.night !== null && <> · 🌙 {formatPeso(rates.night)}/hr</>}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError message={errors.rate_plan_id} className="mt-2" />

                                    {addonPlans.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {addonPlans.map((plan) => {
                                                const qty = Number(addonQuantities[plan.id] || 0);
                                                const max = Math.max(1, Number(plan.max_quantity || 1));

                                                return (
                                                    <div key={plan.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
                                                        <div>
                                                            <p className="text-sm font-bold text-[#10221C]">{plan.name}</p>
                                                            <p className="text-[11px] text-gray-500">{formatPeso(planRates(plan).day)}/hr each · max {max}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button type="button" onClick={() => setAddonQuantity(plan, qty - 1)} disabled={qty === 0} className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-sm font-black text-[#10221C] disabled:opacity-40">−</button>
                                                            <span className="w-6 text-center text-sm font-black text-[#10221C]">{qty}</span>
                                                            <button type="button" onClick={() => setAddonQuantity(plan, qty + 1)} disabled={qty >= max} className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-sm font-black text-[#10221C] disabled:opacity-40">+</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="mt-2 text-sm font-bold text-[#10221C]">
                                    {fullCourt.court?.pricing_mode === 'SPLIT'
                                        ? <>☀️ {formatPeso(fullCourt.court?.day_rate)}/hr · 🌙 {formatPeso(fullCourt.court?.night_rate)}/hr</>
                                        : <>{formatPeso(fullCourt.court?.hourly_rate)}/hr (court rate)</>}
                                </p>
                            )}

                            <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5">
                                <span className="text-xs font-bold uppercase tracking-wide text-[#10221C]/60">
                                    Total {pricingQuote.durationHours > 0 ? `(${pricingQuote.durationHours} hr${pricingQuote.durationHours === 1 ? '' : 's'})` : ''}
                                </span>
                                <span className="text-lg font-black text-[#10221C]">{formatPeso(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-[#FAFAF8] p-4">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#10221C]/40">
                                <Banknote size={13} />
                                Payment
                            </span>

                            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <InputLabel htmlFor="reschedule_payment_amount" value="Amount (₱)" />
                                        {amountTouched && (
                                            <button
                                                type="button"
                                                onClick={() => setAmountTouched(false)}
                                                className="text-[10px] font-bold uppercase tracking-wide text-[#10221C]/50 hover:text-[#10221C] cursor-pointer"
                                            >
                                                Use total
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="reschedule_payment_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.payment_amount}
                                        onChange={(event) => {
                                            setAmountTouched(true);
                                            setData('payment_amount', event.target.value);
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                    />
                                    <p className="mt-1 text-[10px] text-gray-400">
                                        {amountTouched ? 'Manually set — won’t follow rate changes.' : 'Auto-calculated from the rate & hours.'}
                                    </p>
                                    <InputError message={errors.payment_amount} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="reschedule_payment_method" value="Method" />
                                    <select
                                        id="reschedule_payment_method"
                                        value={data.payment_method}
                                        onChange={(event) => setData('payment_method', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                    >
                                        {PAYMENT_METHODS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.payment_method} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="reschedule_payment_status" value="Status" />
                                    <select
                                        id="reschedule_payment_status"
                                        value={data.payment_status}
                                        onChange={(event) => setData('payment_status', event.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                    >
                                        {PAYMENT_STATUSES.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.payment_status} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <PrimaryButton
                                type="button"
                                disabled={!canReview}
                                onClick={() => setStep(2)}
                                className="!bg-[#10221C] hover:!bg-[#1a382d]"
                            >
                                Next: Review
                            </PrimaryButton>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <p className="text-sm text-gray-500 -mt-2">Please review the changes before saving.</p>

                        <BookingReviewCard
                            courtName={booking.court?.name}
                            courtSubtitle={selectedRatePlan?.name || fullCourt.court?.type || 'Standard Court'}
                            isSplit={pricingQuote.isSplit}
                            dayRate={pricingQuote.dayRate}
                            nightRate={pricingQuote.nightRate}
                            dateLabel={formatBookingDate(data.date)}
                            timeLabel={`${formatHour(hourOf(data.start_time))} – ${formatHour(hourOf(data.end_time))}${endOption?.isNextDay ? ' (next day)' : ''}`}
                            durationHours={pricingQuote.durationHours}
                            breakdown={pricingQuote.breakdown}
                            addonLines={pricingQuote.addonLines}
                            subtotal={pricingQuote.subtotal}
                            addonsTotal={pricingQuote.addonsTotal}
                            bookingFee={bookingFeeEstimate}
                            total={grandTotal}
                            extraRows={extraRows}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Back
                            </button>
                            <PrimaryButton disabled={processing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                Save Changes
                            </PrimaryButton>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}
