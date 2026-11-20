import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import MetricCard from '@/Components/MetricCard';
import { Head, Link, useForm } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useToast } from '@/Components/ToastContext';
import { useConfirm } from '@/Components/ConfirmContext';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    CreditCard,
    Loader2,
    Phone,
    QrCode,
    Receipt,
    Save,
    Trash2,
    UploadCloud,
    User,
    Wallet,
    X,
} from 'lucide-react';

export default function PaymentSettings({ auth }) {
    const toast = useToast();
    const { confirm } = useConfirm();
    const facilities = auth.user.facilities || [];

    // Auto-select the first facility if one isn't selected
    const [selectedFacility, setSelectedFacility] = useState(facilities[0] || null);
    const [activeTab, setActiveTab] = useState('gcash'); // 'gcash' | 'maya' | 'booking_fee'

    const [gcashPreview, setGcashPreview] = useState(selectedFacility?.gcash_qr_url || null);
    const [mayaPreview, setMayaPreview] = useState(selectedFacility?.maya_qr_url || null);

    const { data, setData, post, processing, errors, recentlySuccessful, isDirty, reset } = useForm({
        gcash_name: selectedFacility?.gcash_name || '',
        gcash_number: selectedFacility?.gcash_number || '',
        gcash_qr: null,
        clear_gcash_qr: false,
        maya_name: selectedFacility?.maya_name || '',
        maya_number: selectedFacility?.maya_number || '',
        maya_qr: null,
        clear_maya_qr: false,
        booking_fee_type: selectedFacility?.booking_fee_type || 'FIXED',
        booking_fee_value: selectedFacility?.booking_fee_value ?? 0,
    });

    // Handle facility change with unsaved changes confirmation
    const handleFacilityChange = async (e) => {
        const facilityId = e.target.value;
        const targetFacility = facilities.find((f) => f.id === parseInt(facilityId, 10));
        if (!targetFacility) return;

        if (isDirty) {
            const confirmed = await confirm({
                title: 'Discard unsaved changes?',
                message: 'You have unsaved payment settings changes. Switching facilities will discard them.',
                confirmText: 'Discard & Switch',
                cancelText: 'Keep Editing',
                type: 'danger',
            });
            if (!confirmed) return;
        }

        setSelectedFacility(targetFacility);
        setData({
            gcash_name: targetFacility.gcash_name || '',
            gcash_number: targetFacility.gcash_number || '',
            gcash_qr: null,
            clear_gcash_qr: false,
            maya_name: targetFacility.maya_name || '',
            maya_number: targetFacility.maya_number || '',
            maya_qr: null,
            clear_maya_qr: false,
            booking_fee_type: targetFacility.booking_fee_type || 'FIXED',
            booking_fee_value: targetFacility.booking_fee_value ?? 0,
        });
        setGcashPreview(targetFacility.gcash_qr_url || null);
        setMayaPreview(targetFacility.maya_qr_url || null);
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 5MB client-side check
        if (file.size > 5 * 1024 * 1024) {
            toast.error('QR code image must be under 5MB.');
            return;
        }

        if (type === 'gcash') {
            setData('gcash_qr', file);
            setData('clear_gcash_qr', false);
            setGcashPreview(URL.createObjectURL(file));
        } else {
            setData('maya_qr', file);
            setData('clear_maya_qr', false);
            setMayaPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveQr = (type) => {
        if (type === 'gcash') {
            setData('gcash_qr', null);
            setData('clear_gcash_qr', true);
            setGcashPreview(null);
            toast.success('GCash QR removed from form. Save to apply.');
        } else {
            setData('maya_qr', null);
            setData('clear_maya_qr', true);
            setMayaPreview(null);
            toast.success('Maya QR removed from form. Save to apply.');
        }
    };

    const bookingFeeValue = Number(data.booking_fee_value) || 0;
    const sampleCourtTotal = 1000;
    const sampleBookingFee =
        data.booking_fee_type === 'PERCENT'
            ? Math.round(sampleCourtTotal * Math.min(bookingFeeValue, 100)) / 100
            : bookingFeeValue;

    // Detect errors on individual tabs
    const hasGcashError = Boolean(errors.gcash_name || errors.gcash_number || errors.gcash_qr);
    const hasMayaError = Boolean(errors.maya_name || errors.maya_number || errors.maya_qr);
    const hasFeeError = Boolean(errors.booking_fee_type || errors.booking_fee_value);

    const submit = (e) => {
        e.preventDefault();
        if (!selectedFacility) return;

        post(route('facility.payment-settings.update', selectedFacility.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                toast.success('Payment settings saved successfully.');
            },
            onError: () => {
                toast.error('Please check and correct the highlighted fields in the settings.');
            },
        });
    };

    if (facilities.length === 0) {
        return (
            <AuthenticatedLayout
                user={auth.user}
                header={
                    <PageHeader
                        title="Payment Settings"
                        subtitle="Configure manual payment QR codes and booking fees for your facilities"
                        showSearch={false}
                        showNotifications={false}
                    />
                }
            >
                <Head title="Payment Settings" />
                <div className="rounded-2xl border border-dashed border-[#101F1A]/20 bg-white p-12 text-center shadow-card max-w-lg mx-auto mt-6">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A]">
                        <Building2 size={28} strokeWidth={2} />
                    </div>
                    <h3 className="mt-4 text-base font-black text-[#101F1A]">No facilities registered</h3>
                    <p className="mt-1.5 text-xs text-[#101F1A]/60 max-w-sm mx-auto">
                        You need to register and approve a facility before configuring GCash, Maya, or booking fees.
                    </p>
                    <div className="mt-6">
                        <Link
                            href={route('facilities.index')}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#101F1A] px-5 py-2.5 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors"
                        >
                            <span>Manage Facilities</span>
                        </Link>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <PageHeader
                    title="Payment Settings"
                    subtitle="Configure manual payment QR codes, digital wallet accounts, and booking fees"
                    actions={
                        facilities.length > 1 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#101F1A]/60 hidden sm:inline">Facility:</span>
                                <select
                                    value={selectedFacility?.id || ''}
                                    onChange={handleFacilityChange}
                                    className="h-10 rounded-xl border border-[#101F1A]/15 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all cursor-pointer"
                                    aria-label="Select facility"
                                >
                                    {facilities.map((facility) => (
                                        <option key={facility.id} value={facility.id}>
                                            {facility.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Payment Settings" />

            <div className="w-full space-y-5 pb-6">
                {/* ── Status Metric Cards ── */}
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                    <MetricCard
                        label="GCash Gateway"
                        value={selectedFacility?.gcash_number ? 'Configured' : 'Not Set'}
                        hint={selectedFacility?.gcash_qr_url ? 'QR code uploaded & active' : 'Manual phone number only'}
                        icon={Wallet}
                        accent="lime"
                        alert={!selectedFacility?.gcash_number}
                    />
                    <MetricCard
                        label="Maya Gateway"
                        value={selectedFacility?.maya_number ? 'Configured' : 'Not Set'}
                        hint={selectedFacility?.maya_qr_url ? 'QR code uploaded & active' : 'Manual phone number only'}
                        icon={Wallet}
                        accent="lime"
                        alert={!selectedFacility?.maya_number}
                    />
                    <MetricCard
                        label="Custom Booking Fee"
                        value={
                            selectedFacility?.booking_fee_value > 0
                                ? selectedFacility.booking_fee_type === 'PERCENT'
                                    ? `${selectedFacility.booking_fee_value}%`
                                    : `₱${Number(selectedFacility.booking_fee_value).toFixed(2)}`
                                : 'Disabled (₱0)'
                        }
                        hint={
                            selectedFacility?.booking_fee_value > 0
                                ? 'Applied on court reservations'
                                : 'Players pay court rate only'
                        }
                        icon={Receipt}
                        accent="lime"
                    />
                </div>

                {/* ── Settings Form Container ── */}
                <div className="overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white shadow-card">
                    {/* Segmented Tabs Bar */}
                    <div className="border-b border-[#101F1A]/10 bg-[#F5F2EA]/40 p-3 sm:px-6">
                        <div className="inline-flex rounded-xl bg-[#F5F2EA] p-1 border border-[#101F1A]/10">
                            <button
                                type="button"
                                onClick={() => setActiveTab('gcash')}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    activeTab === 'gcash'
                                        ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                        : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                }`}
                            >
                                <Wallet size={14} />
                                <span>GCash Setup</span>
                                {hasGcashError && (
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Validation errors on GCash" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('maya')}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    activeTab === 'maya'
                                        ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                        : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                }`}
                            >
                                <Wallet size={14} />
                                <span>Maya Setup</span>
                                {hasMayaError && (
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Validation errors on Maya" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('booking_fee')}
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                    activeTab === 'booking_fee'
                                        ? 'bg-[#D6FF3F] text-[#101F1A] shadow-2xs'
                                        : 'text-[#101F1A]/70 hover:text-[#101F1A] hover:bg-white/50'
                                }`}
                            >
                                <Receipt size={14} />
                                <span>Booking Fee</span>
                                {hasFeeError && (
                                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" title="Validation errors on Booking Fee" />
                                )}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submit} className="p-6 sm:p-8 space-y-6">
                        {/* ── GCash Tab ── */}
                        <div className={activeTab === 'gcash' ? 'block animate-in fade-in duration-200' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-5">
                                    <div>
                                        <h4 className="text-sm font-black text-[#101F1A]">GCash Account Details</h4>
                                        <p className="text-xs text-[#101F1A]/60 mt-0.5">
                                            Shown to players when they choose GCash at checkout to submit payment receipts.
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="gcash_name" value="Account Holder Name" className="text-xs font-bold text-[#101F1A]" />
                                        <div className="relative mt-1.5">
                                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                                            <TextInput
                                                id="gcash_name"
                                                type="text"
                                                value={data.gcash_name}
                                                onChange={(e) => setData('gcash_name', e.target.value)}
                                                placeholder="e.g. Juan Dela Cruz"
                                                className="w-full pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.gcash_name} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="gcash_number" value="GCash Mobile Number" className="text-xs font-bold text-[#101F1A]" />
                                        <div className="relative mt-1.5">
                                            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                                            <TextInput
                                                id="gcash_number"
                                                type="text"
                                                inputMode="tel"
                                                value={data.gcash_number}
                                                onChange={(e) => setData('gcash_number', e.target.value)}
                                                placeholder="e.g. 0917 123 4567"
                                                className="w-full pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.gcash_number} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel value="Upload GCash QR Code Image" className="text-xs font-bold text-[#101F1A]" />
                                        <label className="mt-1.5 block w-full border-2 border-dashed border-[#101F1A]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#101F1A]/40 hover:bg-[#F5F2EA]/40 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'gcash')}
                                            />
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="w-12 h-12 rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A] flex items-center justify-center">
                                                    <UploadCloud size={22} strokeWidth={2} />
                                                </div>
                                                <div className="text-xs font-bold text-[#101F1A]">Click to select QR code image</div>
                                                <p className="text-[11px] text-[#101F1A]/50">PNG, JPG up to 5MB</p>
                                            </div>
                                        </label>
                                        <InputError message={errors.gcash_qr} className="mt-1 text-xs" />
                                    </div>
                                </div>

                                {/* Preview Frame */}
                                <div className="rounded-2xl border border-[#101F1A]/10 bg-[#F5F2EA]/40 p-6 flex flex-col items-center justify-center text-center">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 mb-4 block">
                                        GCash QR Preview
                                    </span>
                                    {gcashPreview ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="w-52 h-52 bg-white p-3 rounded-2xl shadow-card border border-[#101F1A]/10">
                                                <div className="w-full h-full overflow-hidden rounded-xl flex items-center justify-center">
                                                    <img
                                                        src={gcashPreview}
                                                        alt="GCash QR Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveQr('gcash')}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                                <span>Remove QR Code</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-52 h-52 bg-white rounded-2xl border border-dashed border-[#101F1A]/15 flex flex-col items-center justify-center text-[#101F1A]/30">
                                            <QrCode size={36} strokeWidth={1.5} />
                                            <span className="text-xs font-bold mt-2">No QR Uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Maya Tab ── */}
                        <div className={activeTab === 'maya' ? 'block animate-in fade-in duration-200' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                <div className="space-y-5">
                                    <div>
                                        <h4 className="text-sm font-black text-[#101F1A]">Maya Account Details</h4>
                                        <p className="text-xs text-[#101F1A]/60 mt-0.5">
                                            Shown to players when they choose Maya at checkout to submit payment receipts.
                                        </p>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="maya_name" value="Account Holder Name" className="text-xs font-bold text-[#101F1A]" />
                                        <div className="relative mt-1.5">
                                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                                            <TextInput
                                                id="maya_name"
                                                type="text"
                                                value={data.maya_name}
                                                onChange={(e) => setData('maya_name', e.target.value)}
                                                placeholder="e.g. Juan Dela Cruz"
                                                className="w-full pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.maya_name} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="maya_number" value="Maya Mobile Number" className="text-xs font-bold text-[#101F1A]" />
                                        <div className="relative mt-1.5">
                                            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                                            <TextInput
                                                id="maya_number"
                                                type="text"
                                                inputMode="tel"
                                                value={data.maya_number}
                                                onChange={(e) => setData('maya_number', e.target.value)}
                                                placeholder="e.g. 0918 765 4321"
                                                className="w-full pl-9"
                                            />
                                        </div>
                                        <InputError message={errors.maya_number} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel value="Upload Maya QR Code Image" className="text-xs font-bold text-[#101F1A]" />
                                        <label className="mt-1.5 block w-full border-2 border-dashed border-[#101F1A]/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#101F1A]/40 hover:bg-[#F5F2EA]/40 transition-all">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'maya')}
                                            />
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="w-12 h-12 rounded-2xl bg-[#D6FF3F]/30 text-[#101F1A] flex items-center justify-center">
                                                    <UploadCloud size={22} strokeWidth={2} />
                                                </div>
                                                <div className="text-xs font-bold text-[#101F1A]">Click to select QR code image</div>
                                                <p className="text-[11px] text-[#101F1A]/50">PNG, JPG up to 5MB</p>
                                            </div>
                                        </label>
                                        <InputError message={errors.maya_qr} className="mt-1 text-xs" />
                                    </div>
                                </div>

                                {/* Preview Frame */}
                                <div className="rounded-2xl border border-[#101F1A]/10 bg-[#F5F2EA]/40 p-6 flex flex-col items-center justify-center text-center">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/50 mb-4 block">
                                        Maya QR Preview
                                    </span>
                                    {mayaPreview ? (
                                        <div className="flex flex-col items-center space-y-3">
                                            <div className="w-52 h-52 bg-white p-3 rounded-2xl shadow-card border border-[#101F1A]/10">
                                                <div className="w-full h-full overflow-hidden rounded-xl flex items-center justify-center">
                                                    <img
                                                        src={mayaPreview}
                                                        alt="Maya QR Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveQr('maya')}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 size={13} />
                                                <span>Remove QR Code</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-52 h-52 bg-white rounded-2xl border border-dashed border-[#101F1A]/15 flex flex-col items-center justify-center text-[#101F1A]/30">
                                            <QrCode size={36} strokeWidth={1.5} />
                                            <span className="text-xs font-bold mt-2">No QR Uploaded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Booking Fee Tab ── */}
                        <div className={activeTab === 'booking_fee' ? 'block animate-in fade-in duration-200' : 'hidden'}>
                            <div className="max-w-2xl space-y-6">
                                <div>
                                    <h4 className="text-sm font-black text-[#101F1A]">Custom Booking Fee Configuration</h4>
                                    <p className="text-xs text-[#101F1A]/60 mt-0.5">
                                        An additional charge added to court reservations. Players see it as a transparent separate line item on checkout.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <InputLabel htmlFor="fee_type" value="Fee Structure" className="text-xs font-bold text-[#101F1A]" />
                                        <select
                                            id="fee_type"
                                            value={data.booking_fee_type}
                                            onChange={(e) => setData('booking_fee_type', e.target.value)}
                                            className="mt-1.5 block w-full rounded-xl border border-[#101F1A]/15 bg-white px-3.5 py-2.5 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] cursor-pointer"
                                        >
                                            <option value="FIXED">Fixed amount (₱ per booking)</option>
                                            <option value="PERCENT">Percentage (% of court total)</option>
                                        </select>
                                        <InputError message={errors.booking_fee_type} className="mt-1 text-xs" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="fee_value" value="Fee Amount" className="text-xs font-bold text-[#101F1A]" />
                                        <div className="relative mt-1.5">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-[#101F1A]/50">
                                                {data.booking_fee_type === 'PERCENT' ? '%' : '₱'}
                                            </span>
                                            <TextInput
                                                id="fee_value"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                max={data.booking_fee_type === 'PERCENT' ? 100 : undefined}
                                                value={data.booking_fee_value}
                                                onChange={(e) => setData('booking_fee_value', e.target.value)}
                                                placeholder={data.booking_fee_type === 'PERCENT' ? 'e.g. 5' : 'e.g. 25'}
                                                className="w-full pl-8"
                                            />
                                        </div>
                                        <InputError message={errors.booking_fee_value} className="mt-1 text-xs" />
                                    </div>
                                </div>

                                {/* Live Player Checkout Preview */}
                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#D6FF3F]/15 p-5 shadow-2xs">
                                    <span className="text-[10px] font-bold text-[#101F1A]/60 uppercase tracking-widest block">
                                        Live Player Preview (Sample ₱1,000 Reservation)
                                    </span>
                                    <p className="mt-1.5 text-sm font-black text-[#101F1A]">
                                        ₱{sampleCourtTotal.toLocaleString()} court rate + ₱{sampleBookingFee.toFixed(2)} booking fee
                                    </p>
                                    <p className="mt-1 text-xs text-[#101F1A]/70">
                                        Total paid by player: <span className="font-bold text-[#101F1A]">₱{(sampleCourtTotal + sampleBookingFee).toFixed(2)}</span>
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#101F1A]/10 bg-[#F5F2EA]/60 p-4 text-xs text-[#101F1A]/70 leading-relaxed">
                                    💡 Set the amount to <span className="font-bold text-[#101F1A]">0</span> to disable booking fees. Existing bookings keep the fee locked at the time they were placed.
                                </div>
                            </div>
                        </div>

                        {/* ── Submit Footer ── */}
                        <div className="pt-6 border-t border-[#101F1A]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-[#101F1A]/60">
                                {recentlySuccessful && (
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 animate-in fade-in">
                                        <CheckCircle2 size={15} />
                                        <span>Settings Saved Successfully</span>
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#101F1A] px-6 py-3 text-xs font-bold text-white shadow-card hover:bg-[#162923] focus-ring-volt transition-colors disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin text-[#D6FF3F]" />
                                        <span>Saving Settings...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={15} className="text-[#D6FF3F]" />
                                        <span>Save Payment Settings</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
