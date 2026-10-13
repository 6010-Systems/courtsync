import React from 'react';

export default function Step1Court({ facilityName, selectableCourts, selectedCourtId, setSelectedCourtId }) {
    return (
        <div className="p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-2xl font-black text-[#10221C] mb-1">Choose a Court</h2>
                <p className="text-sm text-gray-500">Select the court you'd like to book at {facilityName}.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectableCourts.map(court => (
                    <div 
                        key={court.id}
                        onClick={() => setSelectedCourtId(court.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                            selectedCourtId == court.id 
                                ? 'border-[#10221C] bg-[#10221C] text-white shadow-lg shadow-[#10221C]/10' 
                                : 'border-gray-100 hover:border-gray-300 hover:shadow-md bg-white'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className={`font-bold text-base ${selectedCourtId == court.id ? 'text-white' : 'text-[#10221C]'}`}>{court.name}</h4>
                                <p className={`text-xs ${selectedCourtId == court.id ? 'text-gray-300' : 'text-gray-500'}`}>{court.type || 'Standard Court'}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                selectedCourtId == court.id 
                                    ? 'border-[#D6FF3F] bg-[#D6FF3F]' 
                                    : 'border-gray-300 group-hover:border-gray-400'
                            }`}>
                                {selectedCourtId == court.id && (
                                    <svg className="w-3 h-3 text-[#10221C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`font-black text-lg ${selectedCourtId == court.id ? 'text-[#D6FF3F]' : 'text-[#10221C]'}`}>
                                ₱{Number(court.hourly_rate).toFixed(2)}
                                <span className={`text-xs font-medium ${selectedCourtId == court.id ? 'text-gray-400' : 'text-gray-400'}`}>/hr</span>
                            </span>
                            {court.time_range && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    selectedCourtId == court.id 
                                        ? 'bg-white/15 text-gray-200' 
                                        : 'bg-gray-100 text-gray-500'
                                }`}>{court.time_range}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
