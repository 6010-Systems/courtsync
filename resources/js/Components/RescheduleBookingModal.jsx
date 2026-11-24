import { useEffect, useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Banknote, Clock, Sun, Moon } from 'lucide-react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import BookingReviewCard from '@/Components/BookingReviewCard';
import { formatPeso } from '@/Components/MetricCard';
import { estimateBookingFee, offeredAddons, offeredCourtPlans, planRates, quoteBooking } from '@/Utils/rateQuote';

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

const FALLBACK_OPEN_HOUR = 6;
const FALLBACK_CLOSE_HOUR = 22;

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
 * Falls back to a 6 AM – 10 PM window when the text cannot be parsed.
 *
 * @returns {[number, number]}
 */
const parseHourRange = (timeRange) => {
    if (!timeRange) return [FALLBACK_OPEN_HOUR, FALLBACK_CLOSE_HOUR];

    if (/24\s*hours/i.test(timeRange)) return [0, 23];

    const match = String(timeRange).match(/(\d{1,2})(?::\d{2})?\s*(AM|PM)?\s*-\s*(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);
    if (!match) return [FALLBACK_OPEN_HOUR, FALLBACK_CLOSE_HOUR];

    const to24Hour = (hour, meridiem) => {
        let parsed = parseInt(hour, 10);
        const period = meridiem ? meridiem.toUpperCase() : null;
        if (period === 'PM' && parsed < 12) parsed += 12;
        if (period === 'AM' && parsed === 12) parsed = 0;

        return parsed;
    };

    const open = to24Hour(match[1], match[2]);
    const close = to24Hour(match[3], match[4]);

    return close > open ? [open, close] : [FALLBACK_OPEN_HOUR, FALLBACK_CLOSE_HOUR];
};

export default function RescheduleBookingModal({ show, booking, courtBookings = [], facilities = [], onClose }) {
    const [step, setStep] = useState(1);
    const [addonQuantities, setAddonQuantities] = useState({});
    const [amountTouched, setAmountTouched] = useState(false);

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

        const offeredIds = courtPlans.map((plan) => plan.id);
        const initialRatePlanId = offeredIds.includes(booking.rate_plan_id)
            ? booking.rate_plan_id
            : (courtPlans[0]?.id ?? '');

        setData({
            date: dateOnly(booking.date),
            start_time: timeOnly(booking.start_time),
            end_time: timeOnly(booking.end_time),
            rate_plan_id: initialRatePlanId,
            payment_method: '',
            payment_amount: booking.payment?.amount ?? booking.total_price ?? '',
            payment_status: '',
        });
        clearErrors();
        setAmountTouched(false);

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
    transform((formData) => ({
        ...formData,
        rate_plan_id: selectedRatePlan?.id || '',
        addons: addonSelection.map(({ plan, quantity }) => ({ rate_plan_id: plan.id, quantity })),
        payment_method: formData.payment_method || undefined,
        payment_status: formData.payment_status || undefined,
    }));

    const [openHour, closeHour] = useMemo(() => parseHourRange(booking?.court?.time_range), [booking?.court?.time_range]);

    // Hours already taken on the selected court/date by any other active booking.
    const bookedHours = useMemo(() => {
        const hours = new Set();

        courtBookings
            .filter((item) => item.court_id === booking?.court_id
                && dateOnly(item.date) === data.date
                && item.id !== booking?.id
                && String(item.status).toLowerCase() !== 'cancelled')
            .forEach((item) => {
                for (let hour = hourOf(item.start_time); hour < hourOf(item.end_time); hour += 1) {
                    hours.add(hour);
                }
            });

        return hours;
    }, [courtBookings, booking?.id, booking?.court_id, data.date]);

    const allHourOptions = useMemo(() => {
        const options = [];
        for (let hour = openHour; hour <= closeHour; hour += 1) {
            options.push({ value: `${String(hour).padStart(2, '0')}:00`, hour, label: formatHour(hour) });
        }

        return options;
    }, [openHour, closeHour]);

    const startOptions = useMemo(() => allHourOptions.slice(0, -1), [allHourOptions]);

    const endOptions = useMemo(() => {
        const startIndex = allHourOptions.findIndex((option) => option.value === data.start_time);
        if (startIndex === -1) return [];

        const options = [];
        for (let index = startIndex + 1; index < allHourOptions.length; index += 1) {
            const option = allHourOptions[index];
            options.push(option);

            // An end time right at the next booked hour is still free, past it is not.
            if (bookedHours.has(option.hour)) break;
        }

        return options;
    }, [allHourOptions, data.start_time, bookedHours]);

    const durationHours = Math.max(0, hourOf(data.end_time) - hourOf(data.start_time));
    const canReview = Boolean(data.date && data.start_time && data.end_time);

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
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <InputLabel htmlFor="reschedule_date" value="Date" />
                                <input
                                    id="reschedule_date"
                                    type="date"
                                    min={localToday()}
                                    value={data.date}
                                    onChange={(event) => setData('date', event.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                />
                                <InputError message={errors.date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="reschedule_start_time" value="Start Time" />
                                <select
                                    id="reschedule_start_time"
                                    value={data.start_time}
                                    onChange={(event) => setData({
                                        ...data,
                                        start_time: event.target.value,
                                        end_time: event.target.value >= data.end_time ? '' : data.end_time,
                                    })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    <option value="">--:--</option>
                                    {startOptions.map((option) => (
                                        <option key={option.value} value={option.value} disabled={bookedHours.has(option.hour)}>
                                            {option.label}{bookedHours.has(option.hour) ? ' (Booked)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="reschedule_end_time" value="End Time" />
                                <select
                                    id="reschedule_end_time"
                                    value={data.end_time}
                                    onChange={(event) => setData('end_time', event.target.value)}
                                    disabled={!data.start_time}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm disabled:bg-gray-100"
                                >
                                    <option value="">--:--</option>
                                    {endOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>
                        </div>

                        {durationHours > 0 && (
                            <p className="-mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#D6FF3F]/20 px-2.5 py-1 text-[11px] font-bold text-[#10221C]">
                                <Clock size={12} />
                                {durationHours} hr{durationHours === 1 ? '' : 's'} · {formatHour(hourOf(data.start_time))} – {formatHour(hourOf(data.end_time))}
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
                                                    <p className={`text-xs font-bold flex items-center gap-1.5 ${active ? 'text-[#D6FF3F]' : 'text-[#10221C]/70'}`}>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Sun size={11} className={active ? 'text-[#D6FF3F]' : 'text-amber-500'} />
                                                            {formatPeso(rates.day)}/hr
                                                        </span>
                                                        {rates.night !== null && (
                                                            <>
                                                                <span className="opacity-40">·</span>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <Moon size={11} className={active ? 'text-[#D6FF3F]' : 'text-indigo-400'} />
                                                                    {formatPeso(rates.night)}/hr
                                                                </span>
                                                            </>
                                                        )}
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
                                <p className="mt-2 text-sm font-bold text-[#10221C] flex items-center gap-2">
                                    {fullCourt.court?.pricing_mode === 'SPLIT'
                                        ? (
                                            <>
                                                <span className="inline-flex items-center gap-1 text-amber-700">
                                                    <Sun size={12} className="text-amber-500" />
                                                    {formatPeso(fullCourt.court?.day_rate)}/hr
                                                </span>
                                                <span className="text-gray-300">·</span>
                                                <span className="inline-flex items-center gap-1 text-indigo-700">
                                                    <Moon size={12} className="text-indigo-400" />
                                                    {formatPeso(fullCourt.court?.night_rate)}/hr
                                                </span>
                                            </>
                                        )
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
                            timeLabel={`${formatHour(hourOf(data.start_time))} – ${formatHour(hourOf(data.end_time))}`}
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
