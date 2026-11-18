import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import RateCard from '@/Components/RateCard';
import TextInput from '@/Components/TextInput';
import { formatPeso } from '@/Components/MetricCard';
import { Head, router } from '@inertiajs/react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

const blankPlan = {
    id: null,
    name: '',
    kind: 'COURT',
    description: '',
    day_rate: '',
    night_rate: '',
    day_start_time: '05:00',
    night_start_time: '17:00',
    includes_ball: true,
    included_paddles: 0,
    max_quantity: 4,
    is_active: true,
    sort_order: 0,
};

function timeValue(value, fallback) {
    return String(value || fallback).slice(0, 5);
}

export default function Rates({ facilities = [], can = {} }) {
    const [facilityId, setFacilityId] = useState(() => facilities[0]?.id ?? null);
    const [draft, setDraft] = useState(blankPlan);
    const [assignAll, setAssignAll] = useState(true);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const facility = facilities.find((item) => item.id == facilityId) || facilities[0] || null;
    const plans = facility?.rate_plans || [];
    const canEdit = Boolean(can.edit);

    const editingPlan = draft.id ? plans.find((plan) => plan.id === draft.id) || null : null;
    const assignedCourts = editingPlan?.courts || [];
    const totalCourts = facility?.courts?.length || 0;

    const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

    const resetDraft = () => {
        setDraft(blankPlan);
        setAssignAll(true);
        setErrors({});
    };

    const startEdit = (plan) => {
        setErrors({});
        const planCourts = plan.courts?.length ?? 0;
        const facilityCourts = facility?.courts?.length ?? 0;
        setAssignAll(facilityCourts > 0 && planCourts >= facilityCourts);
        setDraft({
            ...blankPlan,
            ...plan,
            day_rate: Number(plan.day_rate ?? 0),
            night_rate: plan.night_rate === null || plan.night_rate === undefined ? '' : Number(plan.night_rate),
            day_start_time: timeValue(plan.day_start_time, '05:00'),
            night_start_time: timeValue(plan.night_start_time, '17:00'),
            included_paddles: Number(plan.included_paddles ?? 0),
            max_quantity: Number(plan.max_quantity ?? 4),
            sort_order: Number(plan.sort_order ?? 0),
        });
    };

    const submit = (event) => {
        event.preventDefault();

        if (!facility) {
            return;
        }

        const payload = {
            ...draft,
            facility_id: facility.id,
            night_rate: draft.kind === 'COURT' && draft.night_rate !== '' ? draft.night_rate : null,
        };

        // New rates honour the choice; on edit only send it when applying to every court,
        // so saving prices never wipes the existing per-court assignment.
        if (! draft.id) {
            payload.assign_to_all_courts = assignAll;
        } else if (assignAll) {
            payload.assign_to_all_courts = true;
        }

        const options = {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onError: (validationErrors) => setErrors(validationErrors),
            onSuccess: () => resetDraft(),
        };

        if (draft.id) {
            router.put(route('facility.rates.update', draft.id), payload, options);
        } else {
            router.post(route('facility.rates.store'), payload, options);
        }
    };

    const removePlan = (plan) => {
        if (!window.confirm(`Remove "${plan.name}" from the rate card?`)) {
            return;
        }

        router.delete(route('facility.rates.destroy', plan.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Rate Card"
                    subtitle="Court rental, all-in packages and hourly add-ons your players can book"
                    actions={null}
                />
            }
        >
            <Head title="Rate Card" />

            <div className="w-full space-y-4 pb-2">
                {facilities.length > 1 && (
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                        <InputLabel htmlFor="rate-facility" value="Facility" />
                        <select
                            id="rate-facility"
                            value={facilityId ?? ''}
                            onChange={(event) => {
                                setFacilityId(Number(event.target.value));
                                resetDraft();
                            }}
                            className="mt-1 block w-full max-w-sm rounded-lg border-[#101F1A]/15 bg-white py-2 text-xs font-bold text-[#101F1A] shadow-xs focus:border-[#101F1A] focus:ring-[#101F1A]"
                        >
                            {facilities.map((item) => (
                                <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
                    <div className="xl:col-span-2">
                <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-black text-[#101F1A]">
                            {draft.id ? 'Edit rate' : 'Add a rate'}
                        </h2>
                        {draft.id && (
                            <button
                                type="button"
                                onClick={resetDraft}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#101F1A]/60 hover:text-[#101F1A]"
                            >
                                <X size={12} /> Cancel
                            </button>
                        )}
                    </div>

                    <div>
                        <InputLabel htmlFor="rate-name" value="Name *" />
                        <TextInput
                            id="rate-name"
                            value={draft.name}
                            onChange={(event) => setField('name', event.target.value)}
                            className="mt-1 block w-full text-xs font-bold"
                            placeholder="Court Rental"
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <InputLabel htmlFor="rate-kind" value="Type" />
                            <select
                                id="rate-kind"
                                value={draft.kind}
                                onChange={(event) => setField('kind', event.target.value)}
                                className="mt-1 block w-full rounded-lg border-[#101F1A]/15 bg-white py-2 text-xs font-bold text-[#101F1A] shadow-xs focus:border-[#101F1A] focus:ring-[#101F1A]"
                            >
                                <option value="COURT">Court package</option>
                                <option value="ADDON">Hourly add-on</option>
                            </select>
                            <InputError message={errors.kind} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="rate-description" value="Inclusions" />
                            <TextInput
                                id="rate-description"
                                value={draft.description || ''}
                                onChange={(event) => setField('description', event.target.value)}
                                className="mt-1 block w-full text-xs"
                                placeholder="Court, ball & 4 paddles"
                            />
                            <InputError message={errors.description} className="mt-1" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <InputLabel htmlFor="rate-day" value="Day rate (₱/hr) *" />
                            <TextInput
                                id="rate-day"
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.day_rate}
                                onChange={(event) => setField('day_rate', event.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                                placeholder="150.00"
                            />
                            <InputError message={errors.day_rate} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="rate-night" value="Night rate (₱/hr)" />
                            <TextInput
                                id="rate-night"
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.night_rate}
                                onChange={(event) => setField('night_rate', event.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                                placeholder={draft.kind === 'ADDON' ? 'Not used' : '250.00'}
                                disabled={draft.kind === 'ADDON'}
                            />
                            <InputError message={errors.night_rate} className="mt-1" />
                        </div>
                    </div>
                    {draft.kind === 'COURT' && (
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <InputLabel htmlFor="rate-day-start" value="Day starts" />
                                <TextInput
                                    id="rate-day-start"
                                    type="time"
                                    value={draft.day_start_time}
                                    onChange={(event) => setField('day_start_time', event.target.value)}
                                    className="mt-1 block w-full text-xs font-bold"
                                />
                                <InputError message={errors.day_start_time} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="rate-night-start" value="Night starts" />
                                <TextInput
                                    id="rate-night-start"
                                    type="time"
                                    value={draft.night_start_time}
                                    onChange={(event) => setField('night_start_time', event.target.value)}
                                    className="mt-1 block w-full text-xs font-bold"
                                />
                                <InputError message={errors.night_start_time} className="mt-1" />
                            </div>
                        </div>
                    )}

                    {draft.kind === 'COURT' ? (
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 rounded-lg bg-[#F5F2EA] px-3 py-2 text-xs font-bold text-[#101F1A]">
                                <input
                                    type="checkbox"
                                    checked={Boolean(draft.includes_ball)}
                                    onChange={(event) => setField('includes_ball', event.target.checked)}
                                    className="rounded border-[#101F1A]/30 text-[#101F1A] focus:ring-[#101F1A]"
                                />
                                Includes ball
                            </label>
                            <div>
                                <InputLabel htmlFor="rate-paddles" value="Included paddles" />
                                <TextInput
                                    id="rate-paddles"
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={draft.included_paddles}
                                    onChange={(event) => setField('included_paddles', event.target.value)}
                                    className="mt-1 block w-full text-xs font-bold"
                                />
                                <InputError message={errors.included_paddles} className="mt-1" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <InputLabel htmlFor="rate-max" value="Max per booking" />
                            <TextInput
                                id="rate-max"
                                type="number"
                                min="1"
                                max="20"
                                value={draft.max_quantity}
                                onChange={(event) => setField('max_quantity', event.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                            />
                            <InputError message={errors.max_quantity} className="mt-1" />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <InputLabel htmlFor="rate-order" value="Display order" />
                            <TextInput
                                id="rate-order"
                                type="number"
                                min="0"
                                value={draft.sort_order}
                                onChange={(event) => setField('sort_order', event.target.value)}
                                className="mt-1 block w-full text-xs font-bold"
                            />
                            <InputError message={errors.sort_order} className="mt-1" />
                        </div>
                        <label className="mt-5 flex items-center gap-2 rounded-lg bg-[#F5F2EA] px-3 py-2 text-xs font-bold text-[#101F1A]">
                            <input
                                type="checkbox"
                                checked={Boolean(draft.is_active)}
                                onChange={(event) => setField('is_active', event.target.checked)}
                                className="rounded border-[#101F1A]/30 text-[#101F1A] focus:ring-[#101F1A]"
                            />
                            Bookable
                        </label>
                    </div>

                    <div className="space-y-1">
                        <label className="flex items-center gap-2 rounded-lg border border-[#101F1A]/10 px-3 py-2 text-xs font-bold text-[#101F1A]">
                            <input
                                type="checkbox"
                                checked={assignAll}
                                onChange={(event) => setAssignAll(event.target.checked)}
                                className="rounded border-[#101F1A]/30 text-[#101F1A] focus:ring-[#101F1A]"
                            />
                            Offer on every court
                        </label>
                        {draft.id ? (
                            <p className="px-1 text-[10px] font-medium text-[#101F1A]/55">
                                {totalCourts === 0
                                    ? 'This facility has no courts yet.'
                                    : `Currently offered on ${assignedCourts.length} of ${totalCourts} court${totalCourts === 1 ? '' : 's'}${
                                        assignedCourts.length > 0 && assignedCourts.length < totalCourts
                                            ? ` (${assignedCourts.map((court) => court.name).join(', ')})`
                                            : ''
                                    }. Tick to apply to all; leave unticked to keep the current assignment.`}
                            </p>
                        ) : (
                            <p className="px-1 text-[10px] font-medium text-[#101F1A]/55">
                                Tick to put this rate on all courts now, or assign it per court later in Courts → Edit court.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !canEdit || !facility}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-[#D6FF3F] transition hover:bg-[#162923] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {draft.id ? <Check size={14} /> : <Plus size={14} />}
                        {draft.id ? 'Save changes' : 'Add rate'}
                    </button>
                    {!canEdit && (
                        <p className="text-[11px] font-medium text-[#101F1A]/60">
                            You have view-only access to this rate card.
                        </p>
                    )}
                </form>
                </div>
                    <div className="space-y-4 xl:col-span-3">
                    <RateCard plans={plans.filter((plan) => plan.is_active)} />

                    <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 shadow-card">
                        <h2 className="text-sm font-black text-[#101F1A]">All rates</h2>
                        {plans.length === 0 ? (
                            <p className="mt-3 rounded-xl border border-dashed border-[#101F1A]/20 bg-[#F5F2EA]/60 p-4 text-center text-xs font-medium text-[#101F1A]/60">
                                No rates yet. Add Court Rental, All-In and Paddle Rental to build the poster card.
                            </p>
                        ) : (
                            <div className="mt-2 divide-y divide-[#101F1A]/5">
                                {plans.map((plan) => {
                                    const night = plan.night_rate === null || plan.night_rate === undefined
                                        ? null
                                        : Number(plan.night_rate);

                                    return (
                                        <div key={plan.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-1.5 text-xs font-bold text-[#101F1A]">
                                                    {plan.name}
                                                    <span className="rounded-full bg-[#F5F2EA] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#101F1A]/60">
                                                        {plan.kind === 'ADDON' ? 'Add-on' : 'Package'}
                                                    </span>
                                                    {!plan.is_active && (
                                                        <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-rose-700">
                                                            Hidden
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] font-medium text-[#101F1A]/60">
                                                    {plan.kind === 'ADDON'
                                                        ? `${formatPeso(plan.day_rate)}/hr per item`
                                                        : `☀️ ${formatPeso(plan.day_rate)} · 🌙 ${night === null ? 'same rate' : formatPeso(night)}`}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(plan)}
                                                    disabled={!canEdit}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#101F1A]/10 text-[#101F1A] transition hover:bg-[#F5F2EA] disabled:opacity-40"
                                                    aria-label={`Edit ${plan.name}`}
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removePlan(plan)}
                                                    disabled={!canEdit}
                                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                                                    aria-label={`Delete ${plan.name}`}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="mt-3 text-[11px] font-medium text-[#101F1A]/50">
                            Assign which courts offer each rate from Courts → Edit court → Rate plans.
                        </p>
                    </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
