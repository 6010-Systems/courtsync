import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Save, Wallet, UploadCloud } from 'lucide-react';

export default function PaymentSettings({ auth }) {
    const facilities = auth.user.facilities || [];
    
    // Auto-select the first facility if one isn't selected
    const [selectedFacility, setSelectedFacility] = useState(facilities[0] || null);
    const [activeTab, setActiveTab] = useState('gcash');

    const [gcashPreview, setGcashPreview] = useState(selectedFacility?.gcash_qr_url || null);
    const [mayaPreview, setMayaPreview] = useState(selectedFacility?.maya_qr_url || null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        gcash_name: selectedFacility?.gcash_name || '',
        gcash_number: selectedFacility?.gcash_number || '',
        gcash_qr: null,
        maya_name: selectedFacility?.maya_name || '',
        maya_number: selectedFacility?.maya_number || '',
        maya_qr: null,
    });

    // Handle facility change
    const handleFacilityChange = (e) => {
        const facilityId = e.target.value;
        const facility = facilities.find(f => f.id === parseInt(facilityId));
        if (facility) {
            setSelectedFacility(facility);
            setData({
                gcash_name: facility.gcash_name || '',
                gcash_number: facility.gcash_number || '',
                gcash_qr: null,
                maya_name: facility.maya_name || '',
                maya_number: facility.maya_number || '',
                maya_qr: null,
            });
            setGcashPreview(facility.gcash_qr_url || null);
            setMayaPreview(facility.maya_qr_url || null);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            if (type === 'gcash') {
                setData('gcash_qr', file);
                setGcashPreview(URL.createObjectURL(file));
            } else {
                setData('maya_qr', file);
                setMayaPreview(URL.createObjectURL(file));
            }
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('facility.payment-settings.update', selectedFacility.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                // Settings saved successfully
            }
        });
    };

    if (facilities.length === 0) {
        return (
            <AuthenticatedLayout user={auth.user}>
                <Head title="Payment Settings" />
                <div className="p-8 text-center text-gray-500">
                    You need to create a facility first before managing payment settings.
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Payment Settings" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[#10221C] flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-[#10221C]" strokeWidth={2.5} />
                            Payment Settings
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-2">
                            Configure your GCash and Maya QR codes so players can pay for bookings.
                        </p>
                    </div>

                    {facilities.length > 1 && (
                        <div className="w-full sm:w-64 shrink-0">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Facility</label>
                            <div className="relative">
                                <select 
                                    value={selectedFacility?.id || ''}
                                    onChange={handleFacilityChange}
                                    className="appearance-none block w-full bg-white border border-gray-200 text-[#10221C] font-semibold py-2.5 px-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-[#D6FF3F] focus:border-transparent transition-all shadow-sm"
                                >
                                    {facilities.map(facility => (
                                        <option key={facility.id} value={facility.id}>{facility.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setActiveTab('gcash')}
                            className={`flex-1 py-4 text-center text-sm font-black transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'gcash' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            GCash Setup
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('maya')}
                            className={`flex-1 py-4 text-center text-sm font-black transition-colors flex items-center justify-center gap-2 ${
                                activeTab === 'maya' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            Maya Setup
                        </button>
                    </div>

                    <form onSubmit={submit} className="p-8">
                        
                        {/* GCash Settings */}
                        <div className={activeTab === 'gcash' ? 'block animate-in fade-in' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">Account Name</label>
                                        <input
                                            type="text"
                                            value={data.gcash_name}
                                            onChange={e => setData('gcash_name', e.target.value)}
                                            placeholder="e.g. Juan Dela Cruz"
                                            className="w-full bg-gray-50 border border-gray-200 text-[#10221C] text-sm rounded-xl focus:ring-[#D6FF3F] focus:border-[#D6FF3F] block p-3 transition-colors"
                                        />
                                        {errors.gcash_name && <p className="text-red-500 text-xs mt-1">{errors.gcash_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">GCash Number</label>
                                        <input
                                            type="text"
                                            value={data.gcash_number}
                                            onChange={e => setData('gcash_number', e.target.value)}
                                            placeholder="e.g. 0912 345 6789"
                                            className="w-full bg-gray-50 border border-gray-200 text-[#10221C] text-sm rounded-xl focus:ring-[#D6FF3F] focus:border-[#D6FF3F] block p-3 transition-colors"
                                        />
                                        {errors.gcash_number && <p className="text-red-500 text-xs mt-1">{errors.gcash_number}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">QR Code Image</label>
                                        <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'gcash')}
                                            />
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <UploadCloud className="w-5 h-5" />
                                                </div>
                                                <div className="text-sm font-bold text-gray-700">Click to upload QR code</div>
                                                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                            </div>
                                        </label>
                                        {errors.gcash_qr && <p className="text-red-500 text-xs mt-1">{errors.gcash_qr}</p>}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Preview</h4>
                                    {gcashPreview ? (
                                        <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-full h-full overflow-hidden rounded-xl relative flex justify-center items-center">
                                                <img src={gcashPreview} alt="GCash Preview" className="max-w-none w-full object-cover" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-200 rounded-xl border border-gray-300 flex items-center justify-center text-gray-400 flex-col">
                                            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-xs font-bold">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Maya Settings */}
                        <div className={activeTab === 'maya' ? 'block animate-in fade-in' : 'hidden'}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">Account Name</label>
                                        <input
                                            type="text"
                                            value={data.maya_name}
                                            onChange={e => setData('maya_name', e.target.value)}
                                            placeholder="e.g. Juan Dela Cruz"
                                            className="w-full bg-gray-50 border border-gray-200 text-[#10221C] text-sm rounded-xl focus:ring-[#D6FF3F] focus:border-[#D6FF3F] block p-3 transition-colors"
                                        />
                                        {errors.maya_name && <p className="text-red-500 text-xs mt-1">{errors.maya_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">Maya Number</label>
                                        <input
                                            type="text"
                                            value={data.maya_number}
                                            onChange={e => setData('maya_number', e.target.value)}
                                            placeholder="e.g. 0912 345 6789"
                                            className="w-full bg-gray-50 border border-gray-200 text-[#10221C] text-sm rounded-xl focus:ring-[#D6FF3F] focus:border-[#D6FF3F] block p-3 transition-colors"
                                        />
                                        {errors.maya_number && <p className="text-red-500 text-xs mt-1">{errors.maya_number}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[#10221C] mb-2">QR Code Image</label>
                                        <label className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'maya')}
                                            />
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <UploadCloud className="w-5 h-5" />
                                                </div>
                                                <div className="text-sm font-bold text-gray-700">Click to upload QR code</div>
                                                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                            </div>
                                        </label>
                                        {errors.maya_qr && <p className="text-red-500 text-xs mt-1">{errors.maya_qr}</p>}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 flex flex-col items-center justify-center text-center">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Preview</h4>
                                    {mayaPreview ? (
                                        <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-full h-full overflow-hidden rounded-xl relative flex justify-center items-center">
                                                <img src={mayaPreview} alt="Maya Preview" className="max-w-none w-full object-cover" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-200 rounded-xl border border-gray-300 flex items-center justify-center text-gray-400 flex-col">
                                            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-xs font-bold">No Image</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <div>
                                {recentlySuccessful && (
                                    <span className="text-sm font-bold text-green-600 flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                        Settings Saved!
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-[#10221C] hover:bg-[#1a362d] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {processing ? 'Saving...' : 'Save Payment Settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
