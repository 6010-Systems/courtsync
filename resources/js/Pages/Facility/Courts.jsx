import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { useState } from 'react';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';

export default function Courts({ facilities, can }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingCourt, setEditingCourt] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        facility_id: facilities[0]?.id || '',
        name: '',
        type: '',
        time_range: '',
        description: '',
        hourly_rate: '',
        status: 'AVAILABLE',
    });

    const openAdd = () => {
        reset();
        setData('facility_id', facilities[0]?.id || '');
        setEditingCourt(null);
        setIsAdding(true);
    };

    const openEdit = (court, facility) => {
        setEditingCourt(court);
        setData({
            facility_id: facility.id,
            name: court.name,
            type: court.type || '',
            time_range: court.time_range || '',
            description: court.description || '',
            hourly_rate: court.hourly_rate ?? '',
            status: court.status,
        });
        setIsAdding(true);
    };

    const submit = (e) => {
        e.preventDefault();

        if (editingCourt) {
            put(route('facility.courts.update', editingCourt.id), {
                onSuccess: () => { setIsAdding(false); setEditingCourt(null); reset(); },
            });
        } else {
            post(route('facility.courts.store'), {
                onSuccess: () => { setIsAdding(false); reset(); },
            });
        }
    };

    const deleteCourt = (court) => {
        if (confirm(`Remove "${court.name}"? This cannot be undone.`)) {
            router.delete(route('facility.courts.destroy', court.id), { preserveScroll: true });
        }
    };

    const totalCourts = facilities.reduce((sum, f) => sum + (f.courts?.length || 0), 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold leading-tight text-[#10221C]">Courts</h2>
                    {can.create && facilities.length > 0 && (
                        <PrimaryButton onClick={openAdd} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                            + Add Court
                        </PrimaryButton>
                    )}
                </div>
            }
        >
            <Head title="Courts" />

            <div className="max-w-7xl mx-auto">
                {isAdding && (
                    <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-[#10221C]">
                                {editingCourt ? 'Edit Court' : 'Add Court'}
                            </h3>
                            <button
                                onClick={() => { setIsAdding(false); setEditingCourt(null); reset(); }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={submit} className="flex flex-col gap-4">
                            {facilities.length > 1 && (
                                <div>
                                    <InputLabel htmlFor="facility_id" value="Facility" />
                                    <select
                                        id="facility_id"
                                        value={data.facility_id}
                                        onChange={(e) => setData('facility_id', e.target.value)}
                                        disabled={!!editingCourt}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm disabled:bg-gray-100"
                                    >
                                        {facilities.map((f) => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.facility_id} className="mt-2" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="name" value="Court Name" />
                                    <TextInput id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 block w-full" placeholder="Court 1" />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="type" value="Sport / Type" />
                                    <TextInput id="type" value={data.type} onChange={(e) => setData('type', e.target.value)} className="mt-1 block w-full" placeholder="Badminton" />
                                    <InputError message={errors.type} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="hourly_rate" value="Hourly Rate (optional)" />
                                    <TextInput id="hourly_rate" type="number" step="0.01" min="0" value={data.hourly_rate} onChange={(e) => setData('hourly_rate', e.target.value)} className="mt-1 block w-full" placeholder="320.00" />
                                    <InputError message={errors.hourly_rate} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="time_range" value="Open Hours (optional)" />
                                    <TextInput id="time_range" value={data.time_range} onChange={(e) => setData('time_range', e.target.value)} className="mt-1 block w-full" placeholder="6:00 AM - 10:00 PM" />
                                    <InputError message={errors.time_range} className="mt-2" />
                                </div>
                            </div>

                            <div>
                                <InputLabel htmlFor="status" value="Status" />
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-[#D6FF3F] focus:ring-[#D6FF3F] text-sm"
                                >
                                    {Object.entries(COURT_STATUS_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="description" value="Description (optional)" />
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                    rows="2"
                                />
                                <InputError message={errors.description} className="mt-2" />
                            </div>

                            <div className="flex justify-end">
                                <PrimaryButton disabled={processing} className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                    {editingCourt ? 'Save Changes' : 'Add Court'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                )}

                {facilities.length === 0 ? (
                    <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-2 text-[#10221C]">No Facility Assigned</h2>
                        <p className="text-gray-500">You need an approved facility before courts can be added.</p>
                    </div>
                ) : totalCourts === 0 && !isAdding ? (
                    <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200">
                        <h2 className="text-xl font-bold mb-2 text-[#10221C]">No Courts Yet</h2>
                        <p className="text-gray-500 mb-6">Add the courts available at your facility so players know what they can book.</p>
                        {can.create && (
                            <PrimaryButton onClick={openAdd} className="!bg-[#10221C] hover:!bg-[#1a382d]">Add Your First Court</PrimaryButton>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {facilities.map((facility) => (
                            <div key={facility.id}>
                                {facilities.length > 1 && (
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">{facility.name}</h3>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {(facility.courts || []).map((court) => (
                                        <div key={court.id} className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="text-lg font-bold text-[#10221C]">{court.name}</h3>
                                                    <span className={`px-2 py-1 text-[10px] font-bold border rounded-full uppercase whitespace-nowrap ${COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE}`}>
                                                        {COURT_STATUS_LABELS[court.status] || court.status}
                                                    </span>
                                                </div>
                                                {court.type && (
                                                    <p className="text-sm text-gray-500 mb-1">{court.type}</p>
                                                )}
                                                {court.time_range && (
                                                    <p className="text-sm text-gray-500 mb-1">🕐 {court.time_range}</p>
                                                )}
                                                {court.hourly_rate && (
                                                    <p className="text-sm font-semibold text-[#10221C]">₱{Number(court.hourly_rate).toFixed(2)} / hour</p>
                                                )}
                                                {court.description && (
                                                    <p className="text-sm text-gray-500 mt-2">{court.description}</p>
                                                )}
                                            </div>
                                            {(can.edit || can.delete) && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                                                    {can.edit ? (
                                                        <button onClick={() => openEdit(court, facility)} className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                                                            Edit
                                                        </button>
                                                    ) : <span />}
                                                    {can.delete && (
                                                        <button onClick={() => deleteCourt(court)} className="text-sm font-bold text-red-600 hover:text-red-700">
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
