import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    ChevronDown,
    Loader2,
    Lock,
    Save,
} from 'lucide-react';
import {
    Listbox,
    ListboxButton,
    ListboxOption,
    ListboxOptions,
} from '@headlessui/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';

import { MethodTile } from '@/Components/PaymentSettings/MethodTile';
import { QrDropzone } from '@/Components/PaymentSettings/QrDropzone';
import { PaymentPreview } from '@/Components/PaymentSettings/PaymentPreview';
import {
    ConfirmService,
    Facility,
    PaymentFormData,
    PaymentMethod,
    PaymentSettingsProps,
    ToastService,
} from '@/Components/PaymentSettings/types';
import {
    formatPhPhoneNumber,
    validatePhPhoneNumber,
} from '@/Components/PaymentSettings/utils';

export default function PaymentSettings({ auth }: PaymentSettingsProps) {
    const facilities: Facility[] = auth?.user?.facilities || [];
    const toast = useToast() as unknown as ToastService;
    const { confirm } = useConfirm() as unknown as ConfirmService;

    // Active facility state
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
        facilities[0] || null
    );
    const [isSwitchingFacility, setIsSwitchingFacility] = useState(false);

    // Active method tab/tile
    const [activeMethod, setActiveMethod] = useState<PaymentMethod>('gcash');

    // QR Image Previews (ObjectURL for new uploads, URL string for existing server images)
    const [gcashPreview, setGcashPreview] = useState<string | null>(
        selectedFacility?.gcash_qr_url || null
    );
    const [mayaPreview, setMayaPreview] = useState<string | null>(
        selectedFacility?.maya_qr_url || null
    );

    // Client-side phone validation error state
    const [phoneErrors, setPhoneErrors] = useState<{
        gcash?: string;
        maya?: string;
    }>({});

    // Inertia form handler
    const {
        data,
        setData,
        post,
        processing,
        errors,
        recentlySuccessful,
        clearErrors,
    } = useForm<PaymentFormData>({
        gcash_name: selectedFacility?.gcash_name || '',
        gcash_number: selectedFacility?.gcash_number
            ? formatPhPhoneNumber(selectedFacility.gcash_number)
            : '',
        gcash_qr: null,
        maya_name: selectedFacility?.maya_name || '',
        maya_number: selectedFacility?.maya_number
            ? formatPhPhoneNumber(selectedFacility.maya_number)
            : '',
        maya_qr: null,
    });

    // Compute whether current form is dirty compared to the selected facility
    const isFormDirty = useMemo(() => {
        if (!selectedFacility) return false;

        const gcashNameDirty =
            (data.gcash_name || '') !== (selectedFacility.gcash_name || '');
        const gcashNumberClean = (data.gcash_number || '').replace(/\s+/g, '');
        const facilityGcashNumberClean = (
            selectedFacility.gcash_number || ''
        ).replace(/\s+/g, '');
        const gcashNumberDirty = gcashNumberClean !== facilityGcashNumberClean;
        const gcashQrDirty =
            data.gcash_qr !== null ||
            (selectedFacility.gcash_qr_url && !gcashPreview);

        const mayaNameDirty =
            (data.maya_name || '') !== (selectedFacility.maya_name || '');
        const mayaNumberClean = (data.maya_number || '').replace(/\s+/g, '');
        const facilityMayaNumberClean = (
            selectedFacility.maya_number || ''
        ).replace(/\s+/g, '');
        const mayaNumberDirty = mayaNumberClean !== facilityMayaNumberClean;
        const mayaQrDirty =
            data.maya_qr !== null ||
            (selectedFacility.maya_qr_url && !mayaPreview);

        return (
            gcashNameDirty ||
            gcashNumberDirty ||
            gcashQrDirty ||
            mayaNameDirty ||
            mayaNumberDirty ||
            mayaQrDirty
        );
    }, [data, selectedFacility, gcashPreview, mayaPreview]);

    // Handle switching facility with prompt if changes exist
    const handleFacilitySelect = async (newFacility: Facility) => {
        if (newFacility.id === selectedFacility?.id) return;

        if (isFormDirty) {
            const shouldSwitch = await confirm({
                title: 'Discard Unsaved Changes?',
                message: `You have unsaved payment configurations for "${selectedFacility?.name}". Switching facilities will discard your unsaved edits.`,
                confirmText: 'Discard & Switch',
                cancelText: 'Keep Editing',
                type: 'warning',
            });

            if (!shouldSwitch) {
                return;
            }
        }

        // Perform smooth facility switch
        setIsSwitchingFacility(true);
        setSelectedFacility(newFacility);

        setData({
            gcash_name: newFacility.gcash_name || '',
            gcash_number: newFacility.gcash_number
                ? formatPhPhoneNumber(newFacility.gcash_number)
                : '',
            gcash_qr: null,
            maya_name: newFacility.maya_name || '',
            maya_number: newFacility.maya_number
                ? formatPhPhoneNumber(newFacility.maya_number)
                : '',
            maya_qr: null,
        });

        setGcashPreview(newFacility.gcash_qr_url || null);
        setMayaPreview(newFacility.maya_qr_url || null);
        setPhoneErrors({});
        clearErrors();

        setTimeout(() => {
            setIsSwitchingFacility(false);
        }, 200);
    };

    // Discard changes and revert to selected facility's initial saved state
    const handleDiscard = () => {
        if (!selectedFacility) return;

        setData({
            gcash_name: selectedFacility.gcash_name || '',
            gcash_number: selectedFacility.gcash_number
                ? formatPhPhoneNumber(selectedFacility.gcash_number)
                : '',
            gcash_qr: null,
            maya_name: selectedFacility.maya_name || '',
            maya_number: selectedFacility.maya_number
                ? formatPhPhoneNumber(selectedFacility.maya_number)
                : '',
            maya_qr: null,
        });

        setGcashPreview(selectedFacility.gcash_qr_url || null);
        setMayaPreview(selectedFacility.maya_qr_url || null);
        setPhoneErrors({});
        clearErrors();

        toast.info('Changes discarded.');
    };

    // Handle phone number change with live formatting
    const handlePhoneChange = (
        method: PaymentMethod,
        rawInput: string
    ) => {
        const formatted = formatPhPhoneNumber(rawInput);
        if (method === 'gcash') {
            setData('gcash_number', formatted);
            const validation = validatePhPhoneNumber(formatted);
            setPhoneErrors((prev) => ({
                ...prev,
                gcash: validation.isValid ? undefined : validation.message,
            }));
        } else {
            setData('maya_number', formatted);
            const validation = validatePhPhoneNumber(formatted);
            setPhoneErrors((prev) => ({
                ...prev,
                maya: validation.isValid ? undefined : validation.message,
            }));
        }
    };

    // Handle file selection from QrDropzone
    const handleFileSelect = (method: PaymentMethod, file: File) => {
        const previewUrl = URL.createObjectURL(file);
        if (method === 'gcash') {
            setData('gcash_qr', file);
            setGcashPreview(previewUrl);
        } else {
            setData('maya_qr', file);
            setMayaPreview(previewUrl);
        }
    };

    // Handle QR file removal
    const handleFileRemove = (method: PaymentMethod) => {
        if (method === 'gcash') {
            setData('gcash_qr', null);
            setGcashPreview(null);
        } else {
            setData('maya_qr', null);
            setMayaPreview(null);
        }
    };

    // Form submit
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!selectedFacility) return;

        // Final client validation check
        const gcashValidation = validatePhPhoneNumber(data.gcash_number);
        const mayaValidation = validatePhPhoneNumber(data.maya_number);

        if (!gcashValidation.isValid || !mayaValidation.isValid) {
            setPhoneErrors({
                gcash: gcashValidation.isValid ? undefined : gcashValidation.message,
                maya: mayaValidation.isValid ? undefined : mayaValidation.message,
            });
            toast.error('Please fix the phone number formatting errors before saving.');
            return;
        }

        // Send multipart form data to existing endpoint
        // @ts-ignore - route helper available globally via Ziggy
        post(route('facility.payment-settings.update', selectedFacility.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Payment settings updated successfully!');
            },
            onError: () => {
                toast.error('Failed to update payment settings. Please review the errors.');
            },
        });
    };

    // Computed configuration statuses for tiles
    const isGcashConfigured = Boolean(
        data.gcash_name &&
        data.gcash_number &&
        (data.gcash_qr || gcashPreview)
    );
    const isGcashPartiallyConfigured = Boolean(
        (data.gcash_name || data.gcash_number || data.gcash_qr || gcashPreview) &&
        !isGcashConfigured
    );

    const isMayaConfigured = Boolean(
        data.maya_name &&
        data.maya_number &&
        (data.maya_qr || mayaPreview)
    );
    const isMayaPartiallyConfigured = Boolean(
        (data.maya_name || data.maya_number || data.maya_qr || mayaPreview) &&
        !isMayaConfigured
    );

    // Empty state if owner has no facilities yet
    if (facilities.length === 0) {
        return (
            <AuthenticatedLayout
                header={
                    <PageHeader
                        title="Payment Settings"
                        actions={null}
                        showSearch={false}
                        showNotifications={false}
                    />
                }
            >
                <Head title="Payment Settings" />
                <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-[#10221C]/10 bg-white p-8 text-center shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10221C]/[0.05] text-[#10221C] mb-4">
                        <Building2 size={32} strokeWidth={1.8} />
                    </div>
                    <h2 className="text-lg font-bold text-[#10221C]">No Facilities Found</h2>
                    <p className="mt-1 max-w-sm text-xs text-[#10221C]/60 leading-relaxed">
                        You need to set up at least one facility first before configuring payment QR codes.
                    </p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Payment Settings"
                    subtitle="Configure manual GCash and Maya QR codes for player checkout."
                    actions={
                        facilities.length > 1 ? (
                            <div className="flex items-center gap-2">
                                <Listbox
                                    value={selectedFacility ?? undefined}
                                    onChange={(val: Facility) => handleFacilitySelect(val)}
                                >
                                    <div className="relative">
                                        <ListboxButton
                                            aria-label="Select facility"
                                            className="relative flex min-w-0 max-w-[130px] sm:max-w-xs sm:min-w-[15rem] items-center justify-between rounded-lg border border-[#101F1A]/10 bg-white/80 py-1.5 pl-2.5 sm:pl-3 pr-7 sm:pr-8 text-left text-xs font-bold text-[#101F1A] shadow-2xs transition-colors hover:border-[#101F1A]/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D6FF3F]"
                                            title={selectedFacility?.name}
                                        >
                                            <span className="flex items-center gap-1.5 sm:gap-2 truncate">
                                                <Building2 size={13} className="text-[#101F1A]/60 shrink-0" />
                                                <span className="truncate">{selectedFacility?.name}</span>
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-2.5 text-[#101F1A]/50">
                                                <ChevronDown size={14} strokeWidth={2.4} />
                                            </span>
                                        </ListboxButton>

                                        <ListboxOptions
                                            anchor="bottom end"
                                            className="z-50 mt-1 max-h-60 w-[var(--button-width)] min-w-[15rem] overflow-auto rounded-xl border border-[#10221C]/15 bg-white p-1 shadow-lg focus:outline-none"
                                        >
                                            {facilities.map((facility) => (
                                                <ListboxOption
                                                    key={facility.id}
                                                    value={facility}
                                                    className={({ active, selected }) => `
                                                        relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-colors
                                                        ${
                                                            selected
                                                                ? 'bg-[#10221C] text-[#D6FF3F]'
                                                                : active
                                                                ? 'bg-[#10221C]/[0.05] text-[#10221C]'
                                                                : 'text-[#10221C]'
                                                        }
                                                    `}
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className="truncate" title={facility.name}>
                                                                {facility.name}
                                                            </span>
                                                            {selected && (
                                                                <span className="h-1.5 w-1.5 rounded-full bg-[#D6FF3F] shrink-0 ml-2" />
                                                            )}
                                                        </>
                                                    )}
                                                </ListboxOption>
                                            ))}
                                        </ListboxOptions>
                                    </div>
                                </Listbox>
                            </div>
                        ) : facilities.length === 1 ? (
                            <div className="flex items-center gap-1.5 rounded-lg border border-[#101F1A]/10 bg-white/80 px-3 py-1.5 text-xs font-bold text-[#101F1A] shadow-2xs">
                                <Building2 size={13} className="text-[#101F1A]/60 shrink-0" />
                                <span className="truncate max-w-[200px]">{facilities[0].name}</span>
                            </div>
                        ) : null
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Payment Settings" />

            <div className="w-full space-y-4 pb-12">
                {/* Feedback Toast / Recently Successful Banner */}
                {recentlySuccessful && (
                    <div
                        role="status"
                        className="flex items-center gap-2.5 rounded-xl border border-[#10221C]/15 bg-[#D6FF3F]/20 p-3 text-[#10221C] animate-in fade-in slide-in-from-top-2"
                    >
                        <CheckCircle2 size={15} className="shrink-0 text-[#10221C]" />
                        <span className="text-xs font-bold">
                            Payment settings updated for {selectedFacility?.name}.
                        </span>
                    </div>
                )}

                {/* Main Content: Two Columns on lg (Form ~60%, Sticky Preview ~40%) */}
                {isSwitchingFacility ? (
                    /* Loading Skeleton State */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-pulse">
                        <div className="lg:col-span-7 rounded-2xl border border-[#10221C]/10 bg-white p-5 sm:p-7 space-y-5">
                            <div className="h-4 w-32 bg-[#10221C]/10 rounded" />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-20 bg-[#10221C]/5 rounded-xl" />
                                <div className="h-20 bg-[#10221C]/5 rounded-xl" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-10 bg-[#10221C]/5 rounded-xl" />
                                <div className="h-10 bg-[#10221C]/5 rounded-xl" />
                            </div>
                            <div className="h-28 bg-[#10221C]/5 rounded-xl" />
                        </div>
                        <div className="lg:col-span-5 h-96 rounded-2xl bg-[#10221C]/20" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* ── Left Column: Form Card (~60% / 7 cols) ── */}
                        <section
                            aria-labelledby="form-card-heading"
                            className="lg:col-span-7 rounded-2xl border border-[#10221C]/15 bg-white p-4 sm:p-6 lg:p-7 shadow-xs space-y-4 sm:space-y-5"
                        >
                            {/* Method Selector */}
                            <div>
                                <h2
                                    id="form-card-heading"
                                    className="text-xs font-bold uppercase tracking-wider text-[#10221C]/70 mb-2 sm:mb-2.5"
                                >
                                    Payment Method
                                </h2>

                                <div
                                    role="radiogroup"
                                    aria-label="Payment method selector"
                                    className="grid grid-cols-2 gap-2 sm:gap-3"
                                >
                                    <MethodTile
                                        id="gcash"
                                        name="GCash"
                                        subtitle="Direct QR & mobile number transfer"
                                        selected={activeMethod === 'gcash'}
                                        isConfigured={isGcashConfigured}
                                        onSelect={(id) => setActiveMethod(id)}
                                    />

                                    <MethodTile
                                        id="maya"
                                        name="Maya"
                                        subtitle="Direct QR & mobile number transfer"
                                        selected={activeMethod === 'maya'}
                                        isConfigured={isMayaConfigured}
                                        onSelect={(id) => setActiveMethod(id)}
                                    />
                                </div>
                            </div>

                            <hr className="border-[#10221C]/10" />

                            {/* Active Method Form Fields */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* GCash Fields */}
                                {activeMethod === 'gcash' && (
                                    <div className="space-y-4 animate-in fade-in duration-150">
                                        {/* Account Name & Phone Number (Ergonomic 2-Column Grid) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {/* Account Name */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="gcash_name_input"
                                                    className="block text-xs font-bold uppercase tracking-wider text-[#10221C]/70"
                                                >
                                                    Account Name
                                                </label>
                                                <input
                                                    id="gcash_name_input"
                                                    type="text"
                                                    value={data.gcash_name}
                                                    onChange={(e) => setData('gcash_name', e.target.value)}
                                                    placeholder="e.g. Juan Dela Cruz"
                                                    disabled={processing}
                                                    aria-describedby={errors.gcash_name ? 'gcash_name_error' : undefined}
                                                    className="block w-full rounded-xl border border-[#10221C]/15 bg-[#10221C]/[0.03] p-2.5 text-xs sm:text-sm font-semibold text-[#10221C] placeholder:text-[#10221C]/35 transition-colors focus:border-[#10221C] focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C] disabled:opacity-50"
                                                />
                                                {errors.gcash_name && (
                                                    <p id="gcash_name_error" role="alert" className="text-xs font-semibold text-[#FF5A36]">
                                                        {errors.gcash_name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* GCash Number Field */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="gcash_number_input"
                                                    className="block text-xs font-bold uppercase tracking-wider text-[#10221C]/70"
                                                >
                                                    Mobile Number
                                                </label>
                                                <input
                                                    id="gcash_number_input"
                                                    type="tel"
                                                    value={data.gcash_number}
                                                    onChange={(e) => handlePhoneChange('gcash', e.target.value)}
                                                    placeholder="0917 123 4567"
                                                    disabled={processing}
                                                    aria-describedby={
                                                        phoneErrors.gcash || errors.gcash_number
                                                            ? 'gcash_number_error'
                                                            : undefined
                                                    }
                                                    className={`
                                                        block w-full rounded-xl border p-2.5 font-mono text-xs sm:text-sm font-semibold text-[#10221C] placeholder:text-[#10221C]/35 transition-colors
                                                        focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C] disabled:opacity-50
                                                        ${
                                                            phoneErrors.gcash || errors.gcash_number
                                                                ? 'border-[#FF5A36] bg-[#FF5A36]/[0.04] text-[#B8391D]'
                                                                : 'border-[#10221C]/15 bg-[#10221C]/[0.03] focus:border-[#10221C]'
                                                        }
                                                    `}
                                                />
                                                {(phoneErrors.gcash || errors.gcash_number) && (
                                                    <p id="gcash_number_error" role="alert" className="text-xs font-semibold text-[#FF5A36]">
                                                        {phoneErrors.gcash || errors.gcash_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* QR Upload Dropzone */}
                                        <QrDropzone
                                            method="gcash"
                                            methodName="GCash"
                                            currentFile={data.gcash_qr}
                                            currentPreviewUrl={gcashPreview}
                                            error={errors.gcash_qr}
                                            onFileSelect={(file) => handleFileSelect('gcash', file)}
                                            onFileRemove={() => handleFileRemove('gcash')}
                                            disabled={processing}
                                        />
                                    </div>
                                )}

                                {/* Maya Fields */}
                                {activeMethod === 'maya' && (
                                    <div className="space-y-4 animate-in fade-in duration-150">
                                        {/* Account Name & Phone Number (Ergonomic 2-Column Grid) */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {/* Account Name */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="maya_name_input"
                                                    className="block text-xs font-bold uppercase tracking-wider text-[#10221C]/70"
                                                >
                                                    Account Name
                                                </label>
                                                <input
                                                    id="maya_name_input"
                                                    type="text"
                                                    value={data.maya_name}
                                                    onChange={(e) => setData('maya_name', e.target.value)}
                                                    placeholder="e.g. Maria Santos"
                                                    disabled={processing}
                                                    aria-describedby={errors.maya_name ? 'maya_name_error' : undefined}
                                                    className="block w-full rounded-xl border border-[#10221C]/15 bg-[#10221C]/[0.03] p-2.5 text-xs sm:text-sm font-semibold text-[#10221C] placeholder:text-[#10221C]/35 transition-colors focus:border-[#10221C] focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C] disabled:opacity-50"
                                                />
                                                {errors.maya_name && (
                                                    <p id="maya_name_error" role="alert" className="text-xs font-semibold text-[#FF5A36]">
                                                        {errors.maya_name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Maya Number Field */}
                                            <div className="space-y-1.5">
                                                <label
                                                    htmlFor="maya_number_input"
                                                    className="block text-xs font-bold uppercase tracking-wider text-[#10221C]/70"
                                                >
                                                    Mobile Number
                                                </label>
                                                <input
                                                    id="maya_number_input"
                                                    type="tel"
                                                    value={data.maya_number}
                                                    onChange={(e) => handlePhoneChange('maya', e.target.value)}
                                                    placeholder="0918 765 4321"
                                                    disabled={processing}
                                                    aria-describedby={
                                                        phoneErrors.maya || errors.maya_number
                                                            ? 'maya_number_error'
                                                            : undefined
                                                    }
                                                    className={`
                                                        block w-full rounded-xl border p-2.5 font-mono text-xs sm:text-sm font-semibold text-[#10221C] placeholder:text-[#10221C]/35 transition-colors
                                                        focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10221C] disabled:opacity-50
                                                        ${
                                                            phoneErrors.maya || errors.maya_number
                                                                ? 'border-[#FF5A36] bg-[#FF5A36]/[0.04] text-[#B8391D]'
                                                                : 'border-[#10221C]/15 bg-[#10221C]/[0.03] focus:border-[#10221C]'
                                                        }
                                                    `}
                                                />
                                                {(phoneErrors.maya || errors.maya_number) && (
                                                    <p id="maya_number_error" role="alert" className="text-xs font-semibold text-[#FF5A36]">
                                                        {phoneErrors.maya || errors.maya_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* QR Upload Dropzone */}
                                        <QrDropzone
                                            method="maya"
                                            methodName="Maya"
                                            currentFile={data.maya_qr}
                                            currentPreviewUrl={mayaPreview}
                                            error={errors.maya_qr}
                                            onFileSelect={(file) => handleFileSelect('maya', file)}
                                            onFileRemove={() => handleFileRemove('maya')}
                                            disabled={processing}
                                        />
                                    </div>
                                )}

                                {/* Form Footer Action Row */}
                                <div className="pt-3.5 sm:pt-4 border-t border-[#10221C]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Lock size={13} className="text-[#10221C]/50 shrink-0" />
                                        <p className="text-[11px] sm:text-xs text-[#10221C]/60">
                                            Only players completing a booking see this QR code.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        {isFormDirty && (
                                            <button
                                                type="button"
                                                onClick={handleDiscard}
                                                disabled={processing}
                                                className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-xs font-bold text-[#10221C]/60 hover:text-[#10221C] transition-colors rounded-xl"
                                            >
                                                Discard
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={processing || !isFormDirty}
                                            className="flex-1 sm:flex-initial inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#10221C] px-5 py-2 text-xs sm:text-sm font-bold text-[#D6FF3F] shadow-sm hover:bg-[#1a362d] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin text-[#D6FF3F]" />
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={14} strokeWidth={2.4} />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </section>

                        {/* ── Right Column: Sticky Live Preview (~40% / 5 cols) ── */}
                        <aside className="lg:col-span-5 w-full">
                            <PaymentPreview
                                method={activeMethod}
                                accountName={
                                    activeMethod === 'gcash'
                                        ? data.gcash_name
                                        : data.maya_name
                                }
                                accountNumber={
                                    activeMethod === 'gcash'
                                        ? data.gcash_number
                                        : data.maya_number
                                }
                                qrPreviewUrl={
                                    activeMethod === 'gcash'
                                        ? gcashPreview
                                        : mayaPreview
                                }
                                facilityName={selectedFacility?.name || 'Facility'}
                            />
                        </aside>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
