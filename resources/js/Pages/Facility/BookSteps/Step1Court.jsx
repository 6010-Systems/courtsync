import React from 'react';
import CourtCard from '@/Components/CourtCard';
import { getCourtImage, DEFAULT_COURT_IMAGES } from '@/Utils/courtImages';
import { Check } from 'lucide-react';

export default function Step1Court({ facilityName, facility = null, selectableCourts, selectedCourtId, setSelectedCourtId }) {
    return (
        <div className="p-6 sm:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF5A36] mb-1">
                        Step 01 · Court Reservation
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-[#10221C] tracking-tight">Choose Your Court</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Select your preferred playing surface at <strong className="text-[#10221C]">{facilityName}</strong>.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-[#10221C] text-[#D6FF3F] shadow-xs self-start sm:self-auto shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF3F] animate-pulse" />
                    {selectableCourts.length} {selectableCourts.length === 1 ? 'Court' : 'Courts'} Available
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {selectableCourts.map((court, courtIndex) => {
                    const isSelected = selectedCourtId == court.id;

                    return (
                        <CourtCard
                            key={court.id}
                            court={court}
                            facility={facility}
                            image={getCourtImage(court, facility, courtIndex)}
                            fallbackImage={DEFAULT_COURT_IMAGES[courtIndex % DEFAULT_COURT_IMAGES.length]}
                            onClick={() => setSelectedCourtId(court.id)}
                            isSelected={isSelected}
                            hint={null}
                            actions={
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        isSelected
                                            ? 'bg-[#D6FF3F] text-[#10221C] shadow-sm shadow-[#D6FF3F]/30 ring-1 ring-[#10221C]/20'
                                            : 'bg-[#10221C] text-[#D6FF3F] group-hover:bg-[#18342b]'
                                    }`}
                                >
                                    {isSelected ? (
                                        <>
                                            <Check size={13} strokeWidth={3} />
                                            Selected
                                        </>
                                    ) : (
                                        'Select Court'
                                    )}
                                </span>
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
