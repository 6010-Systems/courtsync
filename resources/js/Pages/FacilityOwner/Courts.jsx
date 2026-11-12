import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Dialog from '@/Components/Dialog';
import SportIcon from '@/Components/Bookings/SportIcon';
import { useConfirm } from '@/Components/ConfirmContext';
import { useToast } from '@/Components/ToastContext';
import { useState, useMemo } from 'react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import CourtCard from '@/Components/CourtCard';
import {
    Plus,
    Search,
    Clock,
    PhilippinePeso,
    Building2,
    Activity,
    Edit3,
    Trash2,
    X,
    Filter,
    Layers,
    AlertTriangle,
    CheckCircle2,
    ShieldAlert,
    CalendarCheck,
    Target,
    Sparkles,
    ChevronRight,
    CircleDot
} from 'lucide-react';

const SPORT_PRESETS = [
    { name: 'Badminton', sport: 'Badminton' },
    { name: 'Pickleball', sport: 'Pickleball' },
    { name: 'Tennis', sport: 'Tennis' },
    { name: 'Basketball', sport: 'Basketball' },
    { name: 'Volleyball', sport: 'Volleyball' },
    { name: 'Futsal', sport: 'Futsal' },
    { name: 'Table Tennis', sport: 'Table Tennis' },
];

const TIME_PRESETS = [
    '6:00 AM - 10:00 PM',
    '7:00 AM - 11:00 PM',
    '8:00 AM - 9:00 PM',
    '24 Hours / Open Daily',
];

const MINUTES_PER_DAY = 24 * 60;

/**
 * 12-hour label for a minute offset from midnight, e.g. 420 -> "07:00 AM".
 */
function formatMinutesLabel(totalMinutes) {
    const hour24 = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
    const minutes = totalMinutes % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

    return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/**
 * 24-hour value for a minute offset from midnight, e.g. 420 -> "07:00".
 */
function formatMinutesValue(totalMinutes) {
    const hour24 = Math.floor((totalMinutes % MINUTES_PER_DAY) / 60);
    const minutes = totalMinutes % 60;

    return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Read either "7:00 AM" or "19:00" into minutes from midnight.
 */
function parseClockToMinutes(rawValue) {
    if (!rawValue) {
        return null;
    }

    const meridiem = String(rawValue).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (meridiem) {
        const hour = (Number(meridiem[1]) % 12) + (meridiem[3].toLowerCase() === 'pm' ? 12 : 0);

        return hour * 60 + Number(meridiem[2] ?? 0);
    }

    const twentyFourHour = String(rawValue).trim().match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFourHour) {
        return Number(twentyFourHour[1]) * 60 + Number(twentyFourHour[2]);
    }

    return null;
}

/**
 * Bounds of the free-text operating schedule, or null when it cannot be read.
 *
 * @return {{startMinutes: number, endMinutes: number}|null}
 */
function parseScheduleBounds(schedule) {
    const normalized = (schedule || '').trim();

    if (!normalized) {
        return null;
    }

    if (/(24\s*(?:hrs|hours)|open\s*(?:all\s*)?daily|open\s*24)/i.test(normalized)) {
        return { startMinutes: 0, endMinutes: MINUTES_PER_DAY };
    }

    const [startRaw, endRaw] = normalized.split(/\s*[-–—]\s*/);
    const startMinutes = parseClockToMinutes(startRaw);
    const endMinutes = parseClockToMinutes(endRaw);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        return null;
    }

    return { startMinutes, endMinutes };
}

/**
 * Hourly start-time options inside the schedule bounds, so an owner can only
 * pick hours the court is actually open.
 *
 * @return {Array<{value: string, label: string, minutes: number}>}
 */
function buildStartTimeOptions(bounds) {
    const rangeStart = bounds?.startMinutes ?? 0;
    const rangeEnd = bounds?.endMinutes ?? MINUTES_PER_DAY;
    const options = [];

    for (let minutes = rangeStart; minutes < rangeEnd; minutes += 60) {
        options.push({
            value: formatMinutesValue(minutes),
            label: formatMinutesLabel(minutes),
            minutes,
        });
    }

    return options.length > 0 ? options : buildStartTimeOptions(null);
}

function describeScheduleBounds(bounds) {
    if (!bounds) {
        return null;
    }

    if (bounds.endMinutes - bounds.startMinutes >= MINUTES_PER_DAY) {
        return '24 hours';
    }

    return `${formatMinutesLabel(bounds.startMinutes)} – ${formatMinutesLabel(bounds.endMinutes)}`;
}

/**
 * Keep a saved start time selectable even when it sits outside the schedule.
 */
function withCurrentTimeOption(options, currentValue) {
    if (!currentValue || options.some((option) => option.value === currentValue)) {
        return options;
    }

    const minutes = parseClockToMinutes(currentValue);

    return [
        ...options,
        {
            value: currentValue,
            label: minutes === null ? String(currentValue) : formatMinutesLabel(minutes),
            minutes: minutes ?? 0,
        },
    ].sort((a, b) => a.minutes - b.minutes);
}

const SPORT_COURT_IMAGES = {
    pickleball: [
        'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1628891890467-b79f2c8ba9dc?auto=format&fit=crop&w=800&q=80',
    ],
    badminton: [
        'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    ],
    tennis: [
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    ],
    basketball: [
        'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    ],
    volleyball: [
        'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=800&q=80',
    ],
    futsal: [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    ],
    padel: [
        'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    ],
    'table tennis': [
        'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=800&q=80',
    ],
};

const DEFAULT_COURT_IMAGES = [
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=800&q=80',
];

function getCourtImage(court, facility, index = 0) {
    if (court?.image_url) {
        return court.image_url;
    }

    const facilityPhotos = (facility?.verification?.facility_photos || []).filter(p => Boolean(p && typeof p === 'string' && p.trim()));
    if (facilityPhotos.length > 0) {
        return facilityPhotos[(court.id || index) % facilityPhotos.length];
    }

    const typeKey = (court.type || '').toLowerCase();
    for (const [sport, images] of Object.entries(SPORT_COURT_IMAGES)) {
        if (typeKey.includes(sport)) {
            return images[(court.id || index) % images.length];
        }
    }

    return DEFAULT_COURT_IMAGES[(court.id || index) % DEFAULT_COURT_IMAGES.length];
}

export default function Courts({ facilities = [], can = {} }) {
    const { confirm } = useConfirm();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourt, setEditingCourt] = useState(null);
    const [step, setStep] = useState(1);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedFacilityId, setSelectedFacilityId] = useState('ALL');

    const [clientErrors, setClientErrors] = useState({});

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        facility_id: facilities[0]?.id || '',
        name: '',
        type: '',
        image_url: '',
        time_range: '',
        description: '',
        pricing_mode: 'FLAT',
        hourly_rate: '',
        day_rate: '',
        night_rate: '',
        day_start_time: '06:00',
        night_start_time: '18:00',
        status: 'AVAILABLE',
    });

    const hasOperatingSchedule = useMemo(() => Boolean((data.time_range || '').trim()), [data.time_range]);
    const scheduleBounds = useMemo(() => parseScheduleBounds(data.time_range), [data.time_range]);
    const startTimeOptions = useMemo(() => buildStartTimeOptions(scheduleBounds), [scheduleBounds]);
    const dayStartOptions = useMemo(() => withCurrentTimeOption(startTimeOptions, data.day_start_time), [startTimeOptions, data.day_start_time]);
    const nightStartOptions = useMemo(() => withCurrentTimeOption(startTimeOptions, data.night_start_time), [startTimeOptions, data.night_start_time]);

    /**
     * Update the schedule and re-clamp the day/night start times to the new range.
     */
    const applyOperatingSchedule = (value) => {
        const options = buildStartTimeOptions(parseScheduleBounds(value));
        const eveningOption = options.reduce(
            (closest, option) => (Math.abs(option.minutes - 18 * 60) < Math.abs(closest.minutes - 18 * 60) ? option : closest),
            options[0],
        );

        setData({
            ...data,
            time_range: value,
            day_start_time: options.some((option) => option.value === data.day_start_time)
                ? data.day_start_time
                : (options[0]?.value ?? '06:00'),
            night_start_time: options.some((option) => option.value === data.night_start_time)
                ? data.night_start_time
                : (eveningOption?.value ?? '18:00'),
        });

        if (clientErrors.time_range) {
            setClientErrors(prev => ({ ...prev, time_range: undefined }));
        }
    };

    // Check if the form has been altered from its initial state
    const hasChanges = useMemo(() => {
        if (editingCourt) {
            return (
                (data.name || '').trim() !== (editingCourt.name || '').trim() ||
                (data.type || '').trim() !== (editingCourt.type || '').trim() ||
                (data.image_url || '').trim() !== (editingCourt.image_url || '').trim() ||
                String(data.facility_id || '') !== String(editingCourt.facility_id || '') ||
                (data.time_range || '').trim() !== (editingCourt.time_range || '').trim() ||
                (data.description || '').trim() !== (editingCourt.description || '').trim() ||
                data.pricing_mode !== (editingCourt.pricing_mode || 'FLAT') ||
                String(data.hourly_rate ?? '') !== String(editingCourt.hourly_rate ?? '') ||
                String(data.day_rate ?? '') !== String(editingCourt.day_rate ?? '') ||
                String(data.night_rate ?? '') !== String(editingCourt.night_rate ?? '') ||
                String(data.day_start_time || '') !== String(editingCourt.day_start_time ? editingCourt.day_start_time.substring(0, 5) : '06:00') ||
                String(data.night_start_time || '') !== String(editingCourt.night_start_time ? editingCourt.night_start_time.substring(0, 5) : '18:00') ||
                data.status !== (editingCourt.status || 'AVAILABLE')
            );
        }
        return Boolean(
            data.name?.trim() ||
            data.type?.trim() ||
            data.image_url?.trim() ||
            data.time_range?.trim() ||
            data.description?.trim() ||
            data.pricing_mode !== 'FLAT' ||
            (data.hourly_rate !== '' && data.hourly_rate !== null) ||
            (data.day_rate !== '' && data.day_rate !== null) ||
            (data.night_rate !== '' && data.night_rate !== null) ||
            data.status !== 'AVAILABLE'
        );
    }, [data, editingCourt]);

    // Validate form before submitting
    const validate = () => {
        const errs = {};
        if (!data.name?.trim()) {
            errs.name = 'Court identifier/name is required.';
        }
        if (!data.type?.trim()) {
            errs.type = 'Sport category is required.';
        }
        if (facilities.length > 1 && !data.facility_id) {
            errs.facility_id = 'Please select a facility venue.';
        }
        if (!hasOperatingSchedule) {
            errs.time_range = 'Set the operating schedule before choosing a pricing mode.';
        } else if (data.pricing_mode === 'FLAT') {
            if (data.hourly_rate !== '' && data.hourly_rate !== null && (isNaN(Number(data.hourly_rate)) || Number(data.hourly_rate) < 0)) {
                errs.hourly_rate = 'Hourly rate must be a positive number.';
            }
        } else {
            if (data.day_rate === '' || data.day_rate === null || isNaN(Number(data.day_rate)) || Number(data.day_rate) < 0) {
                errs.day_rate = 'Day rate must be a valid positive number.';
            }
            if (data.night_rate === '' || data.night_rate === null || isNaN(Number(data.night_rate)) || Number(data.night_rate) < 0) {
                errs.night_rate = 'Night rate must be a valid positive number.';
            }
            if (!data.day_start_time) {
                errs.day_start_time = 'Day start hour is required.';
            }
            if (!data.night_start_time) {
                errs.night_start_time = 'Night start hour is required.';
            }
        }
        setClientErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Step 1 must be complete before the pricing step is shown.
    const validateStepOne = () => {
        const errs = {};

        if (!data.name?.trim()) {
            errs.name = 'Court identifier/name is required.';
        }
        if (!data.type?.trim()) {
            errs.type = 'Sport category is required.';
        }
        if (facilities.length > 1 && !data.facility_id) {
            errs.facility_id = 'Please select a facility venue.';
        }
        if (!hasOperatingSchedule) {
            errs.time_range = 'Set the operating schedule to continue.';
        }

        setClientErrors(errs);

        return Object.keys(errs).length === 0;
    };

    const goToStepTwo = () => {
        if (!validateStepOne()) {
            toast.error('Complete the court details and operating schedule first.');
            return;
        }

        setClientErrors({});
        setStep(2);
    };

    const goToStepOne = () => {
        setClientErrors({});
        setStep(1);
    };

    const activeErrors = useMemo(() => ({
        ...errors,
        ...clientErrors,
    }), [errors, clientErrors]);

    const openAddModal = (defaultFacilityId) => {
        reset();
        clearErrors();
        setClientErrors({});
        setData({
            facility_id: defaultFacilityId || facilities[0]?.id || '',
            name: '',
            type: '',
            time_range: '',
            description: '',
            pricing_mode: 'FLAT',
            hourly_rate: '',
            day_rate: '',
            night_rate: '',
            day_start_time: '06:00',
            night_start_time: '18:00',
            status: 'AVAILABLE',
        });
        setEditingCourt(null);
        setStep(1);
        setIsModalOpen(true);
    };

    const openEditModal = (court, facility) => {
        reset();
        clearErrors();
        setClientErrors({});
        setEditingCourt(court);
        setData({
            facility_id: facility.id,
            name: court.name || '',
            type: court.type || '',
            image_url: court.image_url || '',
            time_range: court.time_range || '',
            description: court.description || '',
            pricing_mode: court.pricing_mode || 'FLAT',
            hourly_rate: court.hourly_rate ?? '',
            day_rate: court.day_rate ?? '',
            night_rate: court.night_rate ?? '',
            day_start_time: court.day_start_time ? String(court.day_start_time).substring(0, 5) : '06:00',
            night_start_time: court.night_start_time ? String(court.night_start_time).substring(0, 5) : '18:00',
            status: court.status || 'AVAILABLE',
        });
        setStep(1);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setStep(1);
        setEditingCourt(null);
        setClientErrors({});
        reset();
        clearErrors();
    };

    const handleCancelAttempt = async () => {
        if (hasChanges) {
            const confirmed = await confirm({
                title: 'Discard Unsaved Changes?',
                message: 'You have modified court specifications. Are you sure you want to discard your edits?',
                confirmText: 'Discard Changes',
                cancelText: 'Keep Editing',
                type: 'warning',
            });
            if (!confirmed) return;
        }
        closeModal();
    };

    const submitForm = (e) => {
        e.preventDefault();

        // Pressing Enter on step 1 advances the wizard instead of saving.
        if (step !== 2) {
            goToStepTwo();
            return;
        }

        if (!validate()) {
            toast.error('Please complete all required fields.');
            return;
        }

        if (editingCourt) {
            put(route('facility.courts.update', editingCourt.id), {
                onSuccess: () => {
                    toast.success('Court updated successfully');
                    closeModal();
                },
                onError: (serverErrors = {}) => {
                    toast.error('Failed to update court. Please check the form.');
                    if (['name', 'type', 'facility_id', 'time_range'].some((key) => key in serverErrors)) {
                        setStep(1);
                    }
                },
                preserveScroll: true,
            });
        } else {
            post(route('facility.courts.store'), {
                onSuccess: () => {
                    toast.success('Court created successfully');
                    closeModal();
                },
                onError: (serverErrors = {}) => {
                    toast.error('Failed to create court. Please check the form.');
                    if (['name', 'type', 'facility_id', 'time_range'].some((key) => key in serverErrors)) {
                        setStep(1);
                    }
                },
                preserveScroll: true,
            });
        }
    };

    const handleDeleteCourt = async (court) => {
        const confirmed = await confirm({
            title: `Remove "${court.name}"?`,
            message: 'Are you sure you want to permanently remove this court? Future reservations or allocations tied to this court will be affected.',
            confirmText: 'Delete Court',
            cancelText: 'Cancel',
            type: 'danger',
        });

        if (!confirmed) return;

        router.delete(route('facility.courts.destroy', court.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Court deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete court. Please try again.');
            }
        });
    };

    // Aggregated statistics for KPI strip matching Bookings/Dashboard
    const stats = useMemo(() => {
        let total = 0;
        let available = 0;
        let openPlay = 0;
        let blocked = 0;

        facilities.forEach(f => {
            (f.courts || []).forEach(c => {
                total++;
                if (c.status === 'AVAILABLE') available++;
                else if (c.status === 'OPEN_PLAY') openPlay++;
                else blocked++;
            });
        });

        return {
            total,
            available,
            openPlay,
            blocked,
            facilitiesCount: facilities.length,
        };
    }, [facilities]);

    // Filtered facilities and courts
    const filteredFacilities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return facilities
            .filter(f => selectedFacilityId === 'ALL' || String(f.id) === String(selectedFacilityId))
            .map(f => {
                const matchedCourts = (f.courts || []).filter(court => {
                    const matchesSearch =
                        !query ||
                        court.name.toLowerCase().includes(query) ||
                        (court.type && court.type.toLowerCase().includes(query)) ||
                        (court.description && court.description.toLowerCase().includes(query)) ||
                        f.name.toLowerCase().includes(query);

                    const matchesStatus =
                        statusFilter === 'ALL' || court.status === statusFilter;

                    return matchesSearch && matchesStatus;
                });

                return {
                    ...f,
                    filteredCourts: matchedCourts,
                };
            })
            .filter(f => selectedFacilityId !== 'ALL' || f.filteredCourts.length > 0 || !searchQuery);
    }, [facilities, searchQuery, statusFilter, selectedFacilityId]);

    const totalFilteredCourts = filteredFacilities.reduce(
        (sum, f) => sum + (f.filteredCourts?.length || 0),
        0
    );

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Courts"
                    subtitle="Manage courts, sports allocations, operating schedules, and rates"
                    actions={
                        can.create && facilities.length > 0 ? (
                            <button
                                onClick={() => openAddModal()}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-colors hover:bg-[#162923] cursor-pointer"
                            >
                                <Plus size={14} strokeWidth={2.4} />
                                <span>Add Court</span>
                            </button>
                        ) : null
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Courts" />

            <div className="w-full space-y-4 pb-2">
                {/* ── KPI Strip (Styled exactly like Bookings KpiStrip & Dashboard StatCards) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Card 1: Total Courts */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#101F1A]/20">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Total Courts
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#101F1A]/[0.05] text-[#101F1A] shadow-2xs">
                                <Layers size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#101F1A]">
                                {stats.total}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#101F1A]/55">
                            <Building2 size={12} className="text-[#101F1A]/40" />
                            <span>Across {stats.facilitiesCount} venue{stats.facilitiesCount === 1 ? '' : 's'}</span>
                        </div>
                    </div>

                    {/* Card 2: Available Courts */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#D6FF3F]">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Available Now
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/35 text-[#101F1A] shadow-2xs border border-[#D6FF3F]/60">
                                <CheckCircle2 size={14} strokeWidth={2.4} className="text-emerald-700" />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700">
                                {stats.available}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-emerald-700">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Ready for booking</span>
                        </div>
                    </div>

                    {/* Card 3: Open Play Sessions */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-blue-300">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Open Play
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 shadow-2xs border border-blue-100">
                                <Activity size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-blue-700">
                                {stats.openPlay}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-blue-700">
                            <span>Drop-in & queue slots</span>
                        </div>
                    </div>

                    {/* Card 4: Maintenance / Blocked */}
                    <div className="group relative flex flex-col justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 p-4 shadow-card backdrop-blur-md transition-all duration-200 hover-lift hover:border-[#FF5A36]/40">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60">
                                Blocked / Offline
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FF5A36]/15 text-[#B8391D] shadow-2xs border border-[#FF5A36]/30">
                                <AlertTriangle size={14} strokeWidth={2.4} />
                            </div>
                        </div>
                        <div className="my-2">
                            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#B8391D]">
                                {stats.blocked}
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 border-t border-[#101F1A]/5 text-[11px] font-medium text-[#B8391D]">
                            <span>Under maintenance or hold</span>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar & Filter Bar (Matching CalendarToolbar & QuickActionDock) ── */}
                {facilities.length > 0 && stats.total > 0 && (
                    <div className="rounded-xl border border-[#101F1A]/10 bg-white/95 p-3.5 shadow-card backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter courts by name, sport, or facility..."
                                className="w-full rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/40 pl-9 pr-8 py-1.5 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] p-0.5"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Controls Group */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Facility Selector */}
                            {facilities.length > 1 && (
                                <div className="flex items-center gap-1.5 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/60 px-2 py-1 shadow-2xs">
                                    <Building2 size={13} className="text-[#101F1A]/50" />
                                    <select
                                        value={selectedFacilityId}
                                        onChange={(e) => setSelectedFacilityId(e.target.value)}
                                        className="bg-transparent text-xs font-bold text-[#101F1A] border-none p-0 pr-5 focus:ring-0 focus:outline-none cursor-pointer"
                                    >
                                        <option value="ALL">All Venues ({facilities.length})</option>
                                        {facilities.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter Tabs (Matching Bookings segmented control) */}
                            <div className="flex items-center gap-0.5 rounded-lg border border-[#101F1A]/10 bg-[#F5F2EA]/70 p-0.5 shadow-2xs">
                                {[
                                    { key: 'ALL', label: 'All' },
                                    { key: 'AVAILABLE', label: 'Available' },
                                    { key: 'OPEN_PLAY', label: 'Open Play' },
                                    { key: 'BLOCKED', label: 'Blocked' },
                                    { key: 'NOT_AVAILABLE', label: 'Offline' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setStatusFilter(tab.key)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                            statusFilter === tab.key
                                                ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                                : 'text-[#101F1A]/60 hover:text-[#101F1A] hover:bg-white/40'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Main Court Content ── */}
                {facilities.length === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md max-w-lg mx-auto my-10">
                        <div className="w-12 h-12 rounded-xl bg-[#101F1A]/5 text-[#101F1A] flex items-center justify-center mx-auto mb-3">
                            <Building2 size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-base font-bold text-[#101F1A] mb-1.5">No Approved Facility</h3>
                        <p className="text-xs text-[#101F1A]/60 leading-relaxed">
                            You need an approved facility before courts, rates, and booking schedules can be configured.
                        </p>
                    </div>
                ) : stats.total === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-12 text-center shadow-card backdrop-blur-md max-w-lg mx-auto my-10">
                        <div className="w-12 h-12 rounded-xl bg-[#D6FF3F]/35 text-[#101F1A] border border-[#D6FF3F]/60 flex items-center justify-center mx-auto mb-3">
                            <Sparkles size={22} strokeWidth={2.2} />
                        </div>
                        <h3 className="text-base font-bold text-[#101F1A] mb-1.5">No Courts Created Yet</h3>
                        <p className="text-xs text-[#101F1A]/60 leading-relaxed mb-5">
                            Set up courts with sport types, hourly pricing, and availability so players can make reservations.
                        </p>
                        {can.create && (
                            <button
                                onClick={() => openAddModal()}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] shadow-xs cursor-pointer"
                            >
                                <Plus size={14} strokeWidth={2.4} />
                                Add Your First Court
                            </button>
                        )}
                    </div>
                ) : totalFilteredCourts === 0 ? (
                    <div className="rounded-2xl border border-[#101F1A]/10 bg-white/90 p-10 text-center shadow-card backdrop-blur-md">
                        <div className="w-10 h-10 rounded-xl bg-[#101F1A]/5 text-[#101F1A]/50 flex items-center justify-center mx-auto mb-2.5">
                            <Search size={18} />
                        </div>
                        <h4 className="text-sm font-bold text-[#101F1A] mb-1">No matching courts found</h4>
                        <p className="text-xs text-[#101F1A]/50 mb-4">
                            Try adjusting your search query, status filter, or venue selector.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setSelectedFacilityId('ALL'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#101F1A]/5 text-[#101F1A] hover:bg-[#101F1A]/10 transition cursor-pointer"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredFacilities.map((facility) => {
                            if (!facility.filteredCourts || facility.filteredCourts.length === 0) {
                                return null;
                            }

                            return (
                                <div key={facility.id} className="space-y-3">
                                    {/* Facility Header Strip */}
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-[#101F1A]/50" />
                                            <h3 className="text-sm font-bold text-[#101F1A]">
                                                {facility.name}
                                            </h3>
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#101F1A]/5 text-[#101F1A]/70">
                                                {facility.filteredCourts.length} {facility.filteredCourts.length === 1 ? 'court' : 'courts'}
                                            </span>
                                        </div>

                                        {can.create && (
                                            <button
                                                onClick={() => openAddModal(facility.id)}
                                                className="text-xs font-bold text-[#101F1A] hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={13} strokeWidth={2.4} />
                                                Add court
                                            </button>
                                        )}
                                    </div>

                                    {/* Courts Grid — 4 cards per row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {facility.filteredCourts.map((court, courtIndex) => (
                                            <CourtCard
                                                key={court.id}
                                                court={court}
                                                image={getCourtImage(court, facility, courtIndex)}
                                                fallbackImage={DEFAULT_COURT_IMAGES[courtIndex % DEFAULT_COURT_IMAGES.length]}
                                                className="animate-fade-up"
                                                style={{ animationDelay: `${courtIndex * 40}ms` }}
                                                actions={
                                                    can.edit || can.delete ? (
                                                        <>
                                                            {can.edit && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(court, facility)}
                                                                    className="inline-flex items-center gap-1 rounded-xl bg-[#D6FF3F] px-2.5 py-1.5 text-xs font-bold text-[#10221C] transition-all hover:bg-[#c4ec32]"
                                                                >
                                                                    <Edit3 size={11} strokeWidth={2.2} />
                                                                    <span>Edit</span>
                                                                </button>
                                                            )}
                                                            {can.delete && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteCourt(court)}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
                                                                    title="Delete court"
                                                                    aria-label={`Delete ${court.name}`}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : null
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Add / Edit Court Dialog ── */}
            <Dialog isOpen={isModalOpen} onClose={handleCancelAttempt} closeOnClickOutside={false} size="2xl">
                <form onSubmit={submitForm} className="p-4 sm:p-5 bg-white flex flex-col gap-3.5">
                    {/* Modal Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#101F1A]/10">
                        <div className="w-8 h-8 rounded-lg bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                            {editingCourt ? <Edit3 size={15} /> : <Plus size={15} strokeWidth={2.4} />}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm sm:text-base font-black text-[#101F1A] truncate">
                                    {editingCourt ? 'Edit Court Specifications' : 'Add New Court'}
                                </h3>
                                {editingCourt && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-[#101F1A]/5 text-[#101F1A]/70 text-[10px] font-bold shrink-0">
                                        {editingCourt.name}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-[#101F1A]/60 font-medium truncate">
                                {step === 1
                                    ? 'Step 1 of 2 · Court details & operating schedule'
                                    : 'Step 2 of 2 · Pricing, status & court profile'}
                            </p>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                            {[1, 2].map((stepNumber) => (
                                <span
                                    key={stepNumber}
                                    className={`h-1.5 w-5 rounded-full transition-colors ${step >= stepNumber ? 'bg-[#101F1A]' : 'bg-[#101F1A]/15'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Step 1 — Court details & operating schedule */}
                    {step === 1 && (
                        <>
                    {/* Venue Selection (if multiple) */}
                    {facilities.length > 1 && (
                        <div>
                            <InputLabel htmlFor="facility_id" value="Assigned Facility *" />
                            <div className="relative mt-1">
                                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                                <select
                                    id="facility_id"
                                    value={data.facility_id}
                                    onChange={(e) => {
                                        setData('facility_id', e.target.value);
                                        if (clientErrors.facility_id) setClientErrors(prev => ({ ...prev, facility_id: undefined }));
                                    }}
                                    disabled={!!editingCourt}
                                    className="block h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-9 pr-8 py-2 text-xs font-bold text-[#101F1A] shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] disabled:bg-[#F5F2EA]/60 transition-all cursor-pointer"
                                >
                                    {facilities.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.city})</option>
                                    ))}
                                </select>
                            </div>
                            <InputError message={activeErrors.facility_id} className="mt-1" />
                        </div>
                    )}

                    {/* Court Identity: Name & Sport */}
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <InputLabel htmlFor="name" value="Court Name / Identifier *" />
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => {
                                        setData('name', e.target.value);
                                        if (clientErrors.name) setClientErrors(prev => ({ ...prev, name: undefined }));
                                    }}
                                    className="mt-1 block w-full text-xs font-bold"
                                    placeholder="e.g. Court 1 (Taraflex)"
                                    required
                                />
                                <InputError message={activeErrors.name} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="type" value="Sport / Activity Category *" />
                                <TextInput
                                    id="type"
                                    value={data.type}
                                    onChange={(e) => {
                                        setData('type', e.target.value);
                                        if (clientErrors.type) setClientErrors(prev => ({ ...prev, type: undefined }));
                                    }}
                                    className="mt-1 block w-full text-xs font-medium"
                                    placeholder="e.g. Badminton, Tennis, Pickleball..."
                                    required
                                />
                                <InputError message={activeErrors.type} className="mt-1" />
                            </div>
                        </div>

                        {/* Quick Sport Selector Chips */}
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block mb-1.5">
                                Quick Sport Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {SPORT_PRESETS.map((preset) => {
                                    const isSelected = data.type?.toLowerCase() === preset.name.toLowerCase();
                                    return (
                                        <button
                                            type="button"
                                            key={preset.name}
                                            onClick={() => {
                                                setData('type', preset.name);
                                                if (clientErrors.type) setClientErrors(prev => ({ ...prev, type: undefined }));
                                            }}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs scale-[1.02]'
                                                    : 'bg-[#F5F2EA] text-[#101F1A]/70 hover:bg-[#E8E4D9] hover:text-[#101F1A] border border-[#101F1A]/5'
                                            }`}
                                        >
                                            <SportIcon sport={preset.sport} size={12} />
                                            <span>{preset.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Operating Schedule — drives the pricing time options */}
                    <div className="space-y-2 pt-2 border-t border-[#101F1A]/5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#101F1A] text-[#D6FF3F]">
                                    <Clock size={12} strokeWidth={2.4} />
                                </span>
                                <InputLabel htmlFor="time_range" value="Operating Schedule *" className="!block !text-xs !font-bold !text-[#101F1A]" />
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${hasOperatingSchedule ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                                {hasOperatingSchedule ? '✓ Hours set' : 'Required'}
                            </span>
                        </div>

                        <TextInput
                            id="time_range"
                            value={data.time_range}
                            onChange={(e) => applyOperatingSchedule(e.target.value)}
                            className={`block w-full text-xs font-medium ${activeErrors.time_range ? '!border-rose-300' : ''}`}
                            placeholder="e.g. 6:00 AM - 10:00 PM"
                        />
                        <InputError message={activeErrors.time_range} className="mt-1" />
                        <p className="text-[10px] font-medium text-[#101F1A]/50">
                            Pricing time options follow this range{describeScheduleBounds(scheduleBounds) ? ` — ${describeScheduleBounds(scheduleBounds)}.` : '.'}
                        </p>

                        {/* Quick Schedule Preset Pills */}
                        <div className="pt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/50 block mb-1.5">
                                Schedule Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {TIME_PRESETS.map((preset) => {
                                    const isSelected = data.time_range === preset;
                                    return (
                                        <button
                                            type="button"
                                            key={preset}
                                            onClick={() => applyOperatingSchedule(preset)}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                                isSelected
                                                    ? 'bg-[#101F1A] text-white font-bold shadow-xs'
                                                    : 'bg-[#F5F2EA] text-[#101F1A]/70 hover:bg-[#E8E4D9] hover:text-[#101F1A] border border-[#101F1A]/5'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                        </>
                    )}

                    {/* Step 2 — Pricing & court profile */}
                    {step === 2 && (
                        <>
                    <div className="space-y-3 pt-2 border-t border-[#101F1A]/5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <Clock size={12} className="shrink-0 text-[#101F1A]/45" />
                                <span className="truncate text-[11px] font-medium text-[#101F1A]/60">
                                    Operating hours: <span className="font-bold text-[#101F1A]">{data.time_range || 'Not set'}</span>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={goToStepOne}
                                className="shrink-0 cursor-pointer text-[11px] font-bold text-[#101F1A] hover:underline"
                            >
                                Change
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#101F1A]">Pricing Structure *</span>
                            <div className="flex bg-[#F5F2EA] p-0.5 rounded-xl border border-[#101F1A]/10 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setData('pricing_mode', 'FLAT')}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                        data.pricing_mode === 'FLAT'
                                            ? 'bg-[#101F1A] text-white shadow-xs'
                                            : 'text-[#101F1A]/60 hover:text-[#101F1A]'
                                    }`}
                                >
                                    Flat Rate
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('pricing_mode', 'SPLIT')}
                                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                        data.pricing_mode === 'SPLIT'
                                            ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs'
                                            : 'text-[#101F1A]/60 hover:text-[#101F1A]'
                                    }`}
                                >
                                    <span>☀️ Day / 🌙 Night Split</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                        {data.pricing_mode === 'FLAT' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <InputLabel htmlFor="hourly_rate" value="Hourly Rate (PHP ₱)" />
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/50 font-bold text-xs">₱</span>
                                        <TextInput
                                            id="hourly_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.hourly_rate}
                                            onChange={(e) => {
                                                setData('hourly_rate', e.target.value);
                                                if (clientErrors.hourly_rate) setClientErrors(prev => ({ ...prev, hourly_rate: undefined }));
                                            }}
                                            className="pl-7 block w-full text-xs font-bold"
                                            placeholder="350.00"
                                        />
                                    </div>
                                    <InputError message={activeErrors.hourly_rate} className="mt-1" />
                                </div>

                                <div className="flex items-center rounded-xl border border-dashed border-[#101F1A]/15 bg-[#F5F2EA]/40 px-3 py-2 text-[11px] font-medium leading-snug text-[#101F1A]/55">
                                    One hourly rate applies to every slot booked within the operating schedule above.
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F5F2EA]/60 rounded-xl border border-[#101F1A]/8">
                                    {/* Day Rate & Start Time */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                                            <span>☀️ Daytime Rate</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-[#101F1A]/60 mb-0.5">Rate (₱/hr)</label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/50 font-bold text-xs">₱</span>
                                                    <TextInput
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.day_rate}
                                                        onChange={(e) => {
                                                            setData('day_rate', e.target.value);
                                                            if (clientErrors.day_rate) setClientErrors(prev => ({ ...prev, day_rate: undefined }));
                                                        }}
                                                        className="pl-6 block w-full text-xs font-bold"
                                                        placeholder="250.00"
                                                    />
                                                </div>
                                                <InputError message={activeErrors.day_rate} className="mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-[#101F1A]/60 mb-0.5">Starts At</label>
                                                <select
                                                    value={data.day_start_time}
                                                    onChange={(e) => setData('day_start_time', e.target.value)}
                                                    className="block w-full text-xs font-bold rounded-xl border-[#101F1A]/15 bg-white py-2 px-2.5 shadow-xs focus:border-[#101F1A] focus:ring-[#101F1A]"
                                                >
                                                    {dayStartOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Night Rate & Start Time */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                                            <span>🌙 Nighttime Rate</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-[#101F1A]/60 mb-0.5">Rate (₱/hr)</label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#101F1A]/50 font-bold text-xs">₱</span>
                                                    <TextInput
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={data.night_rate}
                                                        onChange={(e) => {
                                                            setData('night_rate', e.target.value);
                                                            if (clientErrors.night_rate) setClientErrors(prev => ({ ...prev, night_rate: undefined }));
                                                        }}
                                                        className="pl-6 block w-full text-xs font-bold"
                                                        placeholder="400.00"
                                                    />
                                                </div>
                                                <InputError message={activeErrors.night_rate} className="mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-[#101F1A]/60 mb-0.5">Starts At</label>
                                                <select
                                                    value={data.night_start_time}
                                                    onChange={(e) => setData('night_start_time', e.target.value)}
                                                    className="block w-full text-xs font-bold rounded-xl border-[#101F1A]/15 bg-white py-2 px-2.5 shadow-xs focus:border-[#101F1A] focus:ring-[#101F1A]"
                                                >
                                                    {nightStartOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Operational Status Segmented Grid */}
                    <div className="pt-1.5 border-t border-[#101F1A]/5">
                        <InputLabel htmlFor="status" value="Operational Status *" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                            {[
                                {
                                    key: 'AVAILABLE',
                                    label: 'Available',
                                    desc: 'Live for booking',
                                    activeStyle: 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/30',
                                    dot: 'bg-emerald-500',
                                },
                                {
                                    key: 'OPEN_PLAY',
                                    label: 'Open Play',
                                    desc: 'Queue session',
                                    activeStyle: 'border-blue-500 bg-blue-50 text-blue-800 ring-1 ring-blue-500/30',
                                    dot: 'bg-blue-500',
                                },
                                {
                                    key: 'BLOCKED',
                                    label: 'Blocked',
                                    desc: 'Admin hold',
                                    activeStyle: 'border-amber-500 bg-amber-50 text-amber-800 ring-1 ring-amber-500/30',
                                    dot: 'bg-amber-500',
                                },
                                {
                                    key: 'NOT_AVAILABLE',
                                    label: 'Offline',
                                    desc: 'Maintenance',
                                    activeStyle: 'border-rose-500 bg-rose-50 text-rose-800 ring-1 ring-rose-500/30',
                                    dot: 'bg-rose-500',
                                },
                            ].map((item) => {
                                const isSelected = data.status === item.key;
                                return (
                                    <button
                                        type="button"
                                        key={item.key}
                                        onClick={() => setData('status', item.key)}
                                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                            isSelected
                                                ? `${item.activeStyle} shadow-xs`
                                                : 'border-[#101F1A]/10 bg-[#F5F2EA]/40 text-[#101F1A]/70 hover:bg-[#F5F2EA] hover:border-[#101F1A]/20'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-xs font-bold text-[#101F1A]">{item.label}</span>
                                            <span className={`w-2 h-2 rounded-full ${item.dot} ${isSelected ? 'animate-pulse' : 'opacity-60'}`} />
                                        </div>
                                        <span className="text-[10px] text-[#101F1A]/60 font-medium leading-tight">
                                            {item.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={activeErrors.status} className="mt-1" />
                    </div>

                    {/* Court Image Link */}
                    <div className="pt-1.5 border-t border-[#101F1A]/5">
                        <InputLabel htmlFor="image_url" value="Court Photo / Image Link (Optional)" />
                        <div className="mt-1 flex items-center gap-3">
                            {data.image_url ? (
                                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#101F1A]/10 bg-[#101F1A]/5">
                                    <img
                                        src={data.image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                </div>
                            ) : null}
                            <div className="flex-1">
                                <TextInput
                                    id="image_url"
                                    type="url"
                                    value={data.image_url}
                                    onChange={(e) => setData('image_url', e.target.value)}
                                    className="block w-full text-xs font-medium"
                                    placeholder="https://images.unsplash.com/photo-... (or leave blank for sport default)"
                                />
                            </div>
                        </div>
                        <InputError message={activeErrors.image_url} className="mt-1" />
                    </div>

                    {/* Amenities & Description */}
                    <div className="pt-1.5 border-t border-[#101F1A]/5">
                        <InputLabel htmlFor="description" value="Court Features & Notes (Optional)" />
                        <textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="mt-1 block w-full rounded-xl border border-[#101F1A]/15 bg-white p-3 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] shadow-2xs transition-all min-h-[72px]"
                            rows="2"
                            placeholder="e.g. Taraflex flooring, LED tournament floodlights, air-conditioned, racket rentals available..."
                        />
                        <InputError message={activeErrors.description} className="mt-1" />
                    </div>
                        </>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-[#101F1A]/10 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#101F1A]/45">
                            Step {step} of 2
                        </span>
                        <div className="flex items-center gap-2">
                            {step === 1 ? (
                                <div key="step-one-actions" className="flex items-center gap-2">
                                    <SecondaryButton type="button" onClick={handleCancelAttempt} className="!text-xs font-bold !py-1.5 !px-3.5">
                                        Cancel
                                    </SecondaryButton>
                                    <PrimaryButton
                                        type="button"
                                        onClick={goToStepTwo}
                                        className="!bg-[#101F1A] hover:!bg-[#162923] !text-[#D6FF3F] !rounded-xl !px-4.5 !py-1.5 !text-xs !font-bold shadow-subtle hover-lift press-scale"
                                    >
                                        <span>Next: Pricing</span>
                                        <ChevronRight size={13} strokeWidth={2.6} className="ml-1" />
                                    </PrimaryButton>
                                </div>
                            ) : (
                                <div key="step-two-actions" className="flex items-center gap-2">
                                    <SecondaryButton type="button" onClick={goToStepOne} className="!text-xs font-bold !py-1.5 !px-3.5">
                                        Back
                                    </SecondaryButton>
                                    <PrimaryButton
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !hasChanges ||
                                            !data.name?.trim() ||
                                            !data.type?.trim() ||
                                            (facilities.length > 1 && !data.facility_id) ||
                                            !hasOperatingSchedule ||
                                            (data.pricing_mode === 'FLAT' && data.hourly_rate !== '' && data.hourly_rate !== null && (isNaN(Number(data.hourly_rate)) || Number(data.hourly_rate) < 0))
                                        }
                                        className="!bg-[#101F1A] hover:!bg-[#162923] !text-[#D6FF3F] !rounded-xl !px-4.5 !py-1.5 !text-xs !font-bold shadow-subtle hover-lift press-scale disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none"
                                    >
                                        {processing ? 'Saving...' : editingCourt ? 'Save Changes' : 'Create Court'}
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            </Dialog>
        </AuthenticatedLayout>
    );
}
