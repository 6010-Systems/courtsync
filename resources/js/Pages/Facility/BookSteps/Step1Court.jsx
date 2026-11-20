import React from 'react';
import CourtCard from '@/Components/CourtCard';
import { getCourtImage, DEFAULT_COURT_IMAGES } from '@/Utils/courtImages';
import { Check } from 'lucide-react';

export default function Step1Court({ facilityName, facility = null, selectableCourts, selectedCourtId, setSelectedCourtId }) {
    return (
        <div className="p-6 sm:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-black text-[#10221C] tracking-tight mb-1">Choose a Court</h2>
                    <p className="text-sm text-gray-500">Select the court you'd like to book at {facilityName}.</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#10221C]/5 text-[#10221C]/70 self-start sm:self-auto">
                    {selectableCourts.length} {selectableCourts.length === 1 ? 'Court' : 'Courts'} Available
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 sm:gap-5">
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
                            hint={isSelected ? 'Court selected' : 'Click to select'}
                            actions={
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                        isSelected
                                            ? 'bg-[#D6FF3F] text-[#10221C] shadow-xs ring-1 ring-[#10221C]/10'
                                            : 'bg-[#10221C] text-[#D6FF3F] group-hover:bg-[#18342b]'
                                    }`}
                                >
                                    {isSelected ? (
                                        <>
                                            <Check size={13} strokeWidth={3} />
                                            Selected
                                        </>
                                    ) : (
                                        'Select'
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
