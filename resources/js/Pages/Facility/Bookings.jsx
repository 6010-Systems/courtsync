import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Search, Plus, Trash2, Calendar, Clock, MapPin, User, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingDetailDrawer from '@/Components/BookingDetailDrawer';
import BookingCard from '@/Components/BookingCard';
import { useConfirm } from '@/Components/ConfirmContext';

function BookingStatusBadge({ status }) {
    const s = status?.toLowerCase() || 'pending';
    let base = "px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold rounded-full uppercase border ";
    if (s === 'confirmed') {
        base += "bg-[#D6FF3F]/20 text-[#10221C] border-[#D6FF3F]/50";
    } else if (s === 'cancelled') {
        base += "bg-red-50 text-red-700 border-red-200";
    } else if (s === 'completed') {
    } else {
        base += "bg-amber-50 text-amber-700 border-amber-200";
    }
    return <span className={base}>{status}</span>;
}

export default function Bookings({ bookings, facilities, filters }) {
    const { confirm } = useConfirm();
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [activeFilter, setActiveFilter] = useState(filters?.filter || 'All');
    const [viewMode, setViewMode] = useState('table');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [modalMode, setModalMode] = useState('view');
    const [isAdding, setIsAdding] = useState(false);

    const isInitialRender = useRef(true);

    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('facility.bookings'),
                { search: searchQuery, filter: activeFilter },
                { preserveState: true, replace: true, preserveScroll: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchQuery, activeFilter]);

    const { data, setData, post, processing, errors, reset } = useForm({
        facility_id: facilities[0]?.id || '',
        court_id: '',
        date: '',
        start_time: '',
        end_time: '',
        total_price: '',
        guest_name: '',
    });

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(hour, minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const getRelativeDay = (dateString) => {
        const date = new Date(dateString);
        
        // Use local timezone for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const compareDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        compareDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (compareDate.getTime() === today.getTime()) {
            return "Today";
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return "Tomorrow";
        } else if (compareDate.getTime() === yesterday.getTime()) {
            return "Yesterday";
        }
        return formatDate(dateString);
    };

    const filteredBookings = bookings;

    // Group bookings by date
    const groupedBookings = useMemo(() => {
        const groups = {};
        filteredBookings.forEach(b => {
            if (!groups[b.date]) {
                groups[b.date] = [];
            }
            groups[b.date].push(b);
        });

        // Sort dates descending
        return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
            date: date,
            label: getRelativeDay(date),
            bookings: groups[date]
        }));
    }, [filteredBookings]);

    const handleAdd = (e) => {
        e.preventDefault();
        post(route('bookings.store'), {
            onSuccess: () => {
                const court = facilities.flatMap(f => f.courts).find(c => c.id == data.court_id);
                setSelectedBooking({
                    id: 'NEW',
                    status: 'pending',
                    user: null,
                    guest_name: data.guest_name || 'Walk-in',
                    date: data.date,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    total_price: data.total_price,
                    court: court
                });
                setModalMode('success');
                reset();
                setIsAdding(false);
            }
        });
    };

    const closeModal = () => {
        setIsAdding(false);
        reset();
    };

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

    const selectedFacility = facilities.find(f => f.id == data.facility_id);
    const availableCourts = selectedFacility?.courts || [];
    const selectedCourt = availableCourts.find(c => c.id == data.court_id);
    const timeOptions = useMemo(() => {
        return generateTimeOptions(selectedCourt?.time_range, data.date, selectedCourt?.id, bookings || []);
    }, [selectedCourt, data.date, bookings]);

    return (
        <AuthenticatedLayout
            inset="bookings"
            header={
                <PageHeader
                    title="Facility Bookings"
                    subtitle="Manage all your court reservations in one place"
                    actions={
                        facilities.length > 0 && (
                            <PrimaryButton 
                                onClick={() => setIsAdding(true)} 
                                className="!bg-[#10221C] hover:!bg-[#10221C]/90 text-[#D6FF3F] hover:text-[#D6FF3F] flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                            >
                                <Plus size={16} /> New Booking
                            </PrimaryButton>
                        )
                    }
                    showSearch={false}
                    showNotifications={false}
                />
            }
        >
            <Head title="Bookings" />

            <div className="flex flex-col gap-4 md:gap-6">
                
                {/* Top Bar: Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full max-w-md group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#10221C] transition-colors">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by player, court, or status... (Cmd+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-[#10221C]/12 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D6FF3F]/50 focus:border-[#10221C] sm:text-sm transition-all duration-200 shadow-subtle"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar w-full sm:w-auto items-center">
                        {['All', 'Today', 'Upcoming', 'Pending'].map((filterItem) => (
                            <button 
                                key={filterItem}
                                onClick={() => setActiveFilter(filterItem)}
                                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                                    activeFilter === filterItem 
                                    ? 'bg-[#10221C] text-white shadow-subtle' 
                                    : 'bg-white text-gray-600 border border-[#10221C]/12 hover:border-[#10221C]/30 hover:text-[#10221C]'
                                }`}
                            >
                                {filterItem}
                            </button>
                        ))}
                        <div className="hidden sm:flex border border-[#10221C]/12 rounded-lg bg-white p-1 gap-1 ml-2 h-full items-center">
                            <button 
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#10221C]/5 text-[#10221C]' : 'text-gray-400 hover:text-[#10221C]'}`}
                            >
                                <List size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('card')}
                                className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-[#10221C]/5 text-[#10221C]' : 'text-gray-400 hover:text-[#10221C]'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Bookings Data Grid / Cards */}
                {filteredBookings.length === 0 ? (
                    <div className="bg-white shadow-subtle rounded-xl border border-[#10221C]/12 overflow-hidden p-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center mb-4">
                                <Calendar className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-[#10221C] mb-1">No bookings found</h3>
                            <p className="text-gray-500 text-sm max-w-sm">
                                Try adjusting your search filters or create a new booking to get started.
                            </p>
                            <PrimaryButton 
                                onClick={() => setIsAdding(true)} 
                                className="mt-6 !bg-[#10221C] text-[#D6FF3F] transition-all hover:scale-105"
                            >
                                Create First Booking
                            </PrimaryButton>
                        </div>
                ) : viewMode === 'card' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredBookings.map(booking => (
                            <BookingCard 
                                key={booking.id} 
                                booking={booking} 
                                onClick={() => { setSelectedBooking(booking); setModalMode('view'); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white shadow-subtle rounded-xl border border-[#10221C]/12 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#10221C]/5">
                                <thead className="bg-[#10221C]/[0.02]">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Court</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Player</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                {groupedBookings.map((group) => (
                                    <tbody key={group.date} className="bg-white divide-y divide-[#10221C]/5">
                                        {/* Group Header */}
                                        <tr>
                                            <td colSpan="6" className="px-6 py-3 bg-gray-50/80 border-t border-[#10221C]/5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-[#10221C] uppercase tracking-wider">{group.label}</span>
                                                    {group.label !== 'Today' && group.label !== 'Tomorrow' && group.label !== 'Yesterday' ? null : (
                                                        <span className="text-xs text-gray-500 font-medium">({formatDate(group.date)})</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Group Items */}
                                        {group.bookings.map((booking) => (
                                            <tr 
                                                key={booking.id} 
                                                onClick={() => { setSelectedBooking(booking); setModalMode('view'); }}
                                                className="group hover:bg-[#10221C]/[0.02] transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        <div className="text-sm font-bold text-[#10221C]">
                                                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-[#10221C]">{booking.court?.name}</span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={12} /> {booking.facility?.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                                            <User size={14} className="text-gray-500" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-[#10221C]">
                                                                {booking.user?.name || booking.guest_name || 'Walk-in'}
                                                            </span>
                                                            {booking.user?.name && <span className="text-[11px] text-gray-500">Registered Player</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <BookingStatusBadge status={booking.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-[#10221C]">
                                                    ₱{Number(booking.total_price).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {booking.status === 'pending' && (
                                                            <button
                                                                onClick={async (e) => { 
                                                                    e.stopPropagation(); 
                                                                    const ok = await confirm({
                                                                        title: 'Verify Payment',
                                                                        message: 'Are you sure you want to mark this booking as paid and confirmed?',
                                                                        confirmText: 'Verify Payment',
                                                                        type: 'success'
                                                                    });
                                                                    if (ok) router.patch(route('bookings.update', booking.id), { status: 'confirmed' }, { preserveScroll: true });
                                                                }}
                                                                className="px-3 py-1.5 bg-[#10221C] text-[#D6FF3F] text-xs font-bold rounded-lg hover:bg-[#1a352b] transition-colors"
                                                            >
                                                                Verify
                                                            </button>
                                                        )}
                                                        {booking.status !== 'cancelled' && (
                                                            <button
                                                                onClick={async (e) => { 
                                                                    e.stopPropagation();
                                                                    const ok = await confirm({
                                                                        title: 'Cancel Booking',
                                                                        message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
                                                                        confirmText: 'Cancel Booking',
                                                                        type: 'warning'
                                                                    });
                                                                    if (ok) router.patch(route('bookings.update', booking.id), { status: 'cancelled' }, { preserveScroll: true });
                                                                }}
                                                                className="px-3 py-1.5 bg-gray-100 text-gray-500 hover:text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 border-l border-gray-200 pl-2 ml-1">
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const ok = await confirm({
                                                                        title: 'Delete Booking',
                                                                        message: 'Are you sure you want to permanently delete this booking?',
                                                                        confirmText: 'Delete',
                                                                        type: 'danger'
                                                                    });
                                                                    if (ok) {
                                                                        router.delete(route('bookings.destroy', booking.id), { preserveScroll: true });
                                                                    }
                                                                }}
                                                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                                title="Delete Booking"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                ))}
                            </table>
                        </div>
                    </div>
                )}
                </div>

            <BookingDetailDrawer 
                isOpen={!!selectedBooking}
                booking={selectedBooking}
                mode={modalMode}
                onClose={() => setSelectedBooking(null)}
            />

            <Modal show={isAdding} onClose={closeModal} maxWidth="2xl">
                <div className="p-6 sm:p-8">
                    <div className="mb-6 border-b border-gray-100 pb-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-[#10221C] uppercase tracking-wide">Manual Booking</h3>
                            <p className="text-sm text-gray-500 mt-1">Block off a court or log a walk-in player.</p>
                        </div>
                        <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleAdd} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="facility_id" value="Facility" />
                                <select
                                    id="facility_id"
                                    value={data.facility_id}
                                    onChange={(e) => {
                                        setData({
                                            ...data,
                                            facility_id: e.target.value,
                                            court_id: '',
                                            start_time: '',
                                            end_time: '',
                                            total_price: ''
                                        });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    <option value="">Select a facility</option>
                                    {facilities.map((f) => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.facility_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="court_id" value="Court" />
                                <select
                                    id="court_id"
                                    value={data.court_id}
                                    onChange={(e) => {
                                        const court = availableCourts.find(c => c.id == e.target.value);
                                        setData({
                                            ...data,
                                            court_id: e.target.value,
                                            start_time: '',
                                            end_time: '',
                                            total_price: court?.hourly_rate || ''
                                        });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm disabled:bg-gray-100"
                                    disabled={!data.facility_id}
                                >
                                    <option value="">Select a court</option>
                                    {availableCourts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.court_id} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="date" value="Date" />
                                <TextInput id="date" type="date" value={data.date} onChange={(e) => setData('date', e.target.value)} className="mt-1 block w-full" />
                                <InputError message={errors.date} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="guest_name" value="Player Name (Optional Walk-in)" />
                                <TextInput id="guest_name" type="text" value={data.guest_name} onChange={(e) => setData('guest_name', e.target.value)} className="mt-1 block w-full" placeholder="e.g. John Doe" />
                                <InputError message={errors.guest_name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="total_price" value="Total Price (₱)" />
                                <TextInput id="total_price" type="number" step="0.01" min="0" value={data.total_price} onChange={(e) => setData('total_price', e.target.value)} className="mt-1 block w-full" placeholder="0.00" />
                                <InputError message={errors.total_price} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="start_time" value="Start Time" />
                                <div className="relative">
                                    <select
                                        id="start_time"
                                        value={data.start_time}
                                        onChange={(e) => {
                                            setData({
                                                ...data,
                                                start_time: e.target.value,
                                                ...(data.end_time && e.target.value >= data.end_time ? { end_time: '' } : {})
                                            });
                                        }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm appearance-none !bg-none pr-10 cursor-pointer disabled:bg-gray-100 disabled:opacity-50"
                                        disabled={!data.court_id || !data.date}
                                    >
                                        <option value="">--:--</option>
                                        {timeOptions.slice(0, -1).map((opt) => (
                                            <option key={opt.value} value={opt.value} disabled={opt.isBooked} className={opt.isBooked ? 'text-gray-400 bg-gray-100' : 'text-gray-900'}>
                                                {opt.label} {opt.isBooked ? '(Booked)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 top-1">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.start_time} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="end_time" value="End Time" />
                                <div className="relative">
                                    <select
                                        id="end_time"
                                        value={data.end_time}
                                        onChange={(e) => setData('end_time', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm appearance-none !bg-none pr-10 cursor-pointer disabled:bg-gray-100 disabled:opacity-50"
                                        disabled={!data.start_time}
                                    >
                                        <option value="">--:--</option>
                                        {(() => {
                                            const startIndex = timeOptions.findIndex(o => o.value === data.start_time);
                                            let firstBookedAfterStart = timeOptions.findIndex((o, index) => index >= startIndex && o.isBooked);
                                            if (firstBookedAfterStart === -1) firstBookedAfterStart = timeOptions.length - 1;
                                            
                                            return timeOptions.filter((opt, index) => data.start_time && index > startIndex && index <= firstBookedAfterStart).map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ));
                                        })()}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 top-1">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError message={errors.end_time} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <PrimaryButton disabled={processing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                Confirm Manual Booking
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
