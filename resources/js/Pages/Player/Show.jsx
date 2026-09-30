import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import BookingWidget from '@/Components/BookingWidget';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES, courtIsBookable } from '@/Utils/courtStatus';
import SportIcon from '@/Components/Bookings/SportIcon';
import {
    Clock,
    PhilippinePeso,
    ArrowRight,
    Check,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    X,
    Sparkles,
    ShieldAlert,
    Info,
} from 'lucide-react';

const MOCK_FACILITY_IMAGES = [
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80',
];

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

export default function Show({ facility }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const courts = facility.courts || [];
    const bookableCourts = courts.filter((c) => courtIsBookable(c.status));

    const [selectedCourtId, setSelectedCourtId] = useState(
        bookableCourts[0]?.id ?? (courts[0]?.id ?? null)
    );
    const [unavailablePromptCourt, setUnavailablePromptCourt] = useState(null);
    const [highlightWidget, setHighlightWidget] = useState(false);
    const bookingWidgetRef = useRef(null);

    // Keyboard ESC to close unavailable court prompt
    useEffect(() => {
        if (!unavailablePromptCourt) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setUnavailablePromptCourt(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [unavailablePromptCourt]);

    const handleCourtClick = (court) => {
        if (courtIsBookable(court.status)) {
            setSelectedCourtId(court.id);
            setHighlightWidget(true);
            setTimeout(() => setHighlightWidget(false), 1400);

            if (bookingWidgetRef.current) {
                const rect = bookingWidgetRef.current.getBoundingClientRect();
                const isInView = rect.top >= 60 && rect.bottom <= window.innerHeight;
                if (!isInView || window.innerWidth < 1024) {
                    bookingWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        } else {
            setUnavailablePromptCourt(court);
        }
    };

    const handleSwitchToAvailable = (targetCourt) => {
        const courtToPick = targetCourt || bookableCourts[0];
        if (courtToPick) {
            setSelectedCourtId(courtToPick.id);
            setHighlightWidget(true);
            setTimeout(() => setHighlightWidget(false), 1400);
            setUnavailablePromptCourt(null);
            setTimeout(() => {
                if (bookingWidgetRef.current) {
                    bookingWidgetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 120);
        } else {
            setUnavailablePromptCourt(null);
        }
    };
    
    const validPhotos = (facility.verification?.facility_photos || []).filter(p => Boolean(p && typeof p === 'string' && p.trim()));
    const defaultCover = MOCK_FACILITY_IMAGES[(facility.id || 0) % MOCK_FACILITY_IMAGES.length];
    const coverPhoto = validPhotos.length > 0 ? validPhotos[0] : defaultCover;
    const photos = validPhotos.length > 0 ? validPhotos : [
        MOCK_FACILITY_IMAGES[(facility.id || 0) % MOCK_FACILITY_IMAGES.length],
        MOCK_FACILITY_IMAGES[((facility.id || 0) + 1) % MOCK_FACILITY_IMAGES.length],
        MOCK_FACILITY_IMAGES[((facility.id || 0) + 2) % MOCK_FACILITY_IMAGES.length],
    ];

    return (
        <div className="min-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C]">
            <Head title={facility.name} />

            {/* Immersive Hero Section */}
            <header
                className="relative h-[50vh] min-h-[380px] sm:h-[65vh] lg:h-[75vh] flex items-end justify-center"
                style={{
                    backgroundImage: `url(${coverPhoto})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#10221C] via-[#10221C]/60 to-transparent"></div>
                
                {/* Navbar elements integrated into hero */}
                <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 lg:p-8 flex justify-end items-center gap-2 sm:gap-4 z-30">
                    {user ? (
                        <>
                            <div className="text-white text-xs sm:text-sm font-medium flex items-center gap-2 sm:gap-3 bg-[#10221C]/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 shadow-xl backdrop-blur-md">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-[#D6FF3F] flex items-center justify-center text-[#10221C] font-bold text-xs">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                                <span className="hidden sm:inline">{user.name}</span>
                            </div>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-white hover:text-white text-xs sm:text-sm font-bold bg-[#10221C]/50 hover:bg-[#10221C]/80 transition px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 backdrop-blur-md cursor-pointer"
                            >
                                Log Out
                            </Link>
                        </>
                    ) : (
                        <Link
                            href={`/${facility.slug}/login`}
                            className="text-[#10221C] text-xs sm:text-sm font-black flex items-center gap-2 sm:gap-3 bg-[#D6FF3F] hover:bg-[#c4ec39] transition px-4 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-lg shadow-[#D6FF3F]/20 hover:-translate-y-0.5"
                        >
                            Sign In
                        </Link>
                    )}
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 lg:pb-24">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-3 sm:mb-4">
                            <span className="px-2.5 sm:px-3 py-1 bg-[#D6FF3F]/20 text-[#D6FF3F] border border-[#D6FF3F]/30 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                Verified Partner
                            </span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight mb-3 sm:mb-4 drop-shadow-lg break-words">
                            {facility.name}
                        </h1>
                        <p className="text-base sm:text-xl lg:text-2xl text-gray-200 font-medium flex items-center gap-2 drop-shadow-md">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 text-[#D6FF3F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {facility.city}, {facility.province}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">

                    {/* Left Column - Details & Gallery */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8 sm:space-y-10 lg:space-y-12">
                        {/* About Section - Dark Card */}
                        <section className="bg-[#10221C] p-6 sm:p-8 lg:p-12 rounded-xl shadow-2xl border border-white/5">
                            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">About the Facility</h2>
                            <div className="prose prose-lg text-gray-300 leading-relaxed text-sm sm:text-base">
                                {facility.description ? (
                                    <p>{facility.description}</p>
                                ) : (
                                    <p className="italic opacity-50">No description provided by the facility owner yet.</p>
                                )}
                            </div>
                            
                            <hr className="my-6 sm:my-8 border-white/10" />

                            <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Location Details</h3>
                            <p className="text-base sm:text-lg text-gray-400 flex flex-col gap-1">
                                <span className="text-gray-300">{facility.address}</span>
                                <span>{facility.city}, {facility.province}</span>
                                <span className="opacity-70">{facility.country}</span>
                            </p>
                        </section>

                        {/* Courts Section with Sport Images */}
                        <section>
                            <div className="flex items-center justify-between mb-5 sm:mb-6 px-1">
                                <div>
                                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#10221C] tracking-tight">Available Courts</h2>
                                    <p className="text-xs sm:text-sm text-[#10221C]/60 mt-0.5">Explore playable courts, rates, and schedule availability</p>
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#10221C]/5 text-[#10221C]/70">
                                    {(facility.courts || []).length} Courts
                                </span>
                            </div>

                            {facility.courts && facility.courts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {facility.courts.map((court, courtIndex) => {
                                        const courtImg = getCourtImage(court, facility, courtIndex);
                                        const isBookable = courtIsBookable(court.status);
                                        const isSelected = selectedCourtId == court.id && isBookable;
                                        const statusStyle = COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE;
                                        const statusLabel = COURT_STATUS_LABELS[court.status] || court.status;

                                        return (
                                            <div
                                                key={court.id}
                                                onClick={() => handleCourtClick(court)}
                                                className={`group relative flex flex-col justify-between h-full rounded-xl border bg-white overflow-hidden transition-all duration-300 cursor-pointer text-left ${
                                                    isSelected
                                                        ? 'border-[#D6FF3F] ring-2 ring-[#D6FF3F] shadow-lg shadow-[#D6FF3F]/25 -translate-y-1'
                                                        : isBookable
                                                        ? 'border-[#10221C]/10 shadow-xs hover:border-[#10221C]/30 hover:shadow-md hover:-translate-y-0.5'
                                                        : 'border-[#10221C]/10 bg-[#FAF9F5] opacity-85 hover:opacity-100 hover:border-amber-300/80 hover:shadow-sm'
                                                }`}
                                            >
                                                {/* Court Image Banner — matching landing page card with smooth dissolved gradient */}
                                                <div className="relative h-36 sm:h-40 w-full shrink-0 overflow-hidden bg-white">
                                                    <img
                                                        src={courtImg}
                                                        alt={court.name}
                                                        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] ${
                                                            !isBookable ? 'filter grayscale-[25%] opacity-85' : ''
                                                        }`}
                                                        style={{
                                                            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                                                            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                                                        }}
                                                        onError={(e) => {
                                                            e.currentTarget.src = DEFAULT_COURT_IMAGES[courtIndex % DEFAULT_COURT_IMAGES.length];
                                                        }}
                                                    />

                                                    {/* Floating Sport Badge */}
                                                    <div className="absolute top-2.5 left-2.5 z-10">
                                                        <span className="inline-flex items-center gap-1.5 bg-[#10221C]/85 text-[#F5F2EA] text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-xs border border-white/10">
                                                            <SportIcon sport={court.type} className="w-3 h-3 text-[#D6FF3F]" />
                                                            <span>{court.type || 'Court'}</span>
                                                        </span>
                                                    </div>

                                                    {/* Floating Status Badge */}
                                                    <div className="absolute top-2.5 right-2.5 z-10">
                                                        {isBookable ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs backdrop-blur-md bg-white/95 text-emerald-900 border border-emerald-200">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Available
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs backdrop-blur-md bg-white/95 ${statusStyle}`}>
                                                                <AlertCircle size={11} className="shrink-0" />
                                                                {statusLabel}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Smooth gradient overlay that seamlessly dissolves into the card background */}
                                                    <div
                                                        className="absolute inset-0 pointer-events-none"
                                                        style={{
                                                            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0.25) 72%, rgba(255,255,255,0.65) 86%, #ffffff 100%)',
                                                        }}
                                                    />

                                                    {/* Active Selected Tag Banner */}
                                                    {isSelected && (
                                                        <div className="absolute bottom-2.5 left-2.5 z-10">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md bg-[#D6FF3F] text-[#10221C]">
                                                                <CheckCircle2 size={12} className="text-[#10221C]" /> Selected in Form
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Body — flex-1 flex flex-col justify-between to keep footer fixed in place */}
                                                <div className="-mt-3.5 sm:-mt-4 relative z-10 px-4 pb-3.5 sm:px-4 sm:pb-3.5 flex-1 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 h-6">
                                                            <h3 className="font-display text-[15px] sm:text-base font-bold text-[#10221C] tracking-tight group-hover:text-[#FF5A36] transition-colors truncate" title={court.name}>
                                                                {court.name}
                                                            </h3>
                                                            {isSelected && (
                                                                <span className="shrink-0 w-5 h-5 rounded-full bg-[#101F1A] text-[#D6FF3F] flex items-center justify-center shadow-xs">
                                                                    <Check size={12} strokeWidth={2.8} />
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1.5 mt-2 pt-2 border-t border-[#10221C]/6 text-xs">
                                                            <div className="flex items-center justify-between h-6">
                                                                <span className="text-[#10221C]/60 font-medium flex items-center gap-1.5">
                                                                    <PhilippinePeso size={12} className="text-[#FF5A36] shrink-0" />
                                                                    Hourly Rate
                                                                </span>
                                                                <span className="font-display font-bold text-xs sm:text-sm text-[#10221C] bg-[#F5F2EA] px-2 py-0.5 rounded-md border border-[#10221C]/5">
                                                                    {court.hourly_rate ? `₱${Number(court.hourly_rate).toFixed(2)} / hr` : 'Free / Not set'}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center justify-between h-6">
                                                                <span className="text-[#10221C]/60 font-medium flex items-center gap-1.5">
                                                                    <Clock size={12} className="text-[#10221C]/40 shrink-0" />
                                                                    Operating Hours
                                                                </span>
                                                                <span className="font-medium text-[#10221C]/80 truncate max-w-[170px]">
                                                                    {court.time_range || 'Venue standard'}
                                                                </span>
                                                            </div>

                                                            <p className="pt-0.5 text-[11px] text-[#10221C]/60 line-clamp-1 leading-normal h-5 flex items-center overflow-hidden">
                                                                {court.description || 'Verified tournament-grade court with optimal lighting.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Bottom Action Footer — fixed in place with h-10 and mt-auto */}
                                                    <div className="mt-3 pt-2.5 border-t border-[#10221C]/6 flex items-center justify-between shrink-0 h-10">
                                                        {isBookable ? (
                                                            isSelected ? (
                                                                <>
                                                                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 h-7">
                                                                        <Check size={13} strokeWidth={2.5} className="text-emerald-600" /> Active in Form
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-black bg-[#101F1A] text-[#D6FF3F] px-2.5 h-7 rounded-lg shadow-xs transition-transform group-hover:scale-105">
                                                                        Selected
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-xs font-bold text-[#10221C]/60 group-hover:text-[#10221C] transition-colors flex items-center h-7">
                                                                        Click to Select
                                                                    </span>
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#101F1A]/5 text-[#101F1A] group-hover:bg-[#FF5A36] group-hover:text-white px-2.5 h-7 rounded-lg transition-all shadow-2xs group-hover:scale-105">
                                                                        Book Court <ArrowRight size={12} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
                                                                    </span>
                                                                </>
                                                            )
                                                        ) : (
                                                            <>
                                                                <span className="text-xs font-semibold text-amber-800 flex items-center gap-1 h-7">
                                                                    <AlertCircle size={12} className="text-amber-600" /> {statusLabel}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500/10 text-amber-900 group-hover:bg-amber-500/20 px-2.5 h-7 rounded-lg transition-colors">
                                                                    View Status <ArrowRight size={12} strokeWidth={2.2} className="transition-transform group-hover:translate-x-0.5" />
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-[#10221C]/5 p-8 sm:p-12 rounded-xl border border-[#10221C]/10 border-dashed text-center">
                                    <p className="text-[#10221C]/60 italic font-medium">No courts have been listed for this facility yet.</p>
                                </div>
                            )}
                        </section>

                        {/* Premium Gallery */}
                        <section>
                            <div className="flex items-center justify-between mb-5 sm:mb-6 px-1">
                                <div>
                                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#10221C] tracking-tight">Facility Gallery</h2>
                                    <p className="text-xs sm:text-sm text-[#10221C]/60 mt-0.5">Visual tour of the venue grounds and sports amenities</p>
                                </div>
                                {validPhotos.length === 0 && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#D6FF3F]/20 text-[#10221C] border border-[#D6FF3F]/40">
                                        Venue Preview
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {photos.map((photo, index) => (
                                    <div
                                        key={index}
                                        className={`rounded-xl overflow-hidden shadow-md group relative bg-[#10221C] ${index === 0 && photos.length > 2 ? 'sm:col-span-2 sm:aspect-[2/1]' : 'aspect-[4/3]'}`}
                                    >
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300 z-10"></div>
                                        <img
                                            src={photo}
                                            alt={`Facility photo ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                            onError={(e) => {
                                                e.currentTarget.src = MOCK_FACILITY_IMAGES[index % MOCK_FACILITY_IMAGES.length];
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Booking Widget */}
                    <div ref={bookingWidgetRef} className="lg:col-span-5 xl:col-span-4 scroll-mt-24">
                        <BookingWidget
                            facility={facility}
                            user={user}
                            courts={facility.courts || []}
                            selectedCourtId={selectedCourtId}
                            onSelectCourt={(id) => setSelectedCourtId(id)}
                            isHighlighted={highlightWidget}
                        />
                    </div>
                </div>
            </main>

            {/* ── Unavailable / Blocked Court Apology & Affirmation Modal ── */}
            {unavailablePromptCourt && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#101F1A]/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setUnavailablePromptCourt(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-[#10221C]/10 text-left transition-all animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Media Header */}
                        <div className="relative h-36 w-full overflow-hidden bg-[#101F1A]">
                            <img
                                src={getCourtImage(unavailablePromptCourt, facility)}
                                alt={unavailablePromptCourt.name}
                                className="w-full h-full object-cover opacity-60 filter grayscale-[30%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#101F1A] via-[#101F1A]/50 to-transparent" />

                            {/* Close Button */}
                            <button
                                onClick={() => setUnavailablePromptCourt(null)}
                                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 transition-colors cursor-pointer"
                                aria-label="Close dialog"
                            >
                                <X size={16} />
                            </button>

                            {/* Badges on Header */}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10">
                                <span className="inline-flex items-center gap-1.5 bg-[#101F1A]/90 text-[#F5F2EA] text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    <SportIcon sport={unavailablePromptCourt.type} className="w-3.5 h-3.5 text-[#D6FF3F]" />
                                    <span>{unavailablePromptCourt.type || 'Court'}</span>
                                </span>

                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500 text-white backdrop-blur-md shadow-xs">
                                    <AlertCircle size={12} />
                                    {COURT_STATUS_LABELS[unavailablePromptCourt.status] || unavailablePromptCourt.status}
                                </span>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6">
                            <div className="flex items-center gap-2 text-amber-600 mb-2">
                                <AlertTriangle size={18} className="shrink-0" />
                                <span className="text-xs font-bold uppercase tracking-wider">Court Status Notice</span>
                            </div>

                            <h3 className="font-display text-xl sm:text-2xl font-black text-[#10221C] tracking-tight">
                                We're sorry! {unavailablePromptCourt.name} is currently unavailable.
                            </h3>

                            <p className="mt-2.5 text-xs sm:text-sm text-[#10221C]/70 leading-relaxed">
                                {unavailablePromptCourt.status === 'BLOCKED'
                                    ? `${unavailablePromptCourt.name} has been temporarily blocked by venue administration for scheduled maintenance, tournament use, or private servicing.`
                                    : unavailablePromptCourt.status === 'OPEN_PLAY'
                                    ? `${unavailablePromptCourt.name} is designated strictly for walk-in open play and cannot be booked individually online.`
                                    : `${unavailablePromptCourt.name} is currently offline and not accepting player reservations at this time.`}
                            </p>

                            {/* Reassurance & Friendly Affirmation Box */}
                            <div className="mt-4 p-3.5 rounded-xl bg-[#D6FF3F]/15 border border-[#D6FF3F]/40 flex items-start gap-3">
                                <Sparkles size={18} className="text-[#101F1A] shrink-0 mt-0.5" />
                                <div className="text-xs text-[#10221C]">
                                    <p className="font-bold">Don't worry, we've got you covered!</p>
                                    <p className="mt-0.5 text-[#10221C]/80 leading-normal">
                                        {bookableCourts.length > 0 ? (
                                            <>
                                                There {bookableCourts.length === 1 ? 'is 1 other available court' : `are ${bookableCourts.length} other available courts`} ready to book right now at {facility.name}.
                                            </>
                                        ) : (
                                            <>All courts at this venue are currently occupied or reserved. Please check back soon or explore other venues.</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Modal Actions */}
                            <div className="mt-6 space-y-2">
                                {bookableCourts.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchToAvailable(bookableCourts[0])}
                                        className="w-full py-3 px-4 rounded-xl bg-[#D6FF3F] hover:bg-[#c4ec32] text-[#101F1A] font-display font-black text-sm tracking-wide shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                                    >
                                        <CheckCircle2 size={16} className="text-[#101F1A]" />
                                        <span>Select Available Court ({bookableCourts[0].name})</span>
                                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setUnavailablePromptCourt(null)}
                                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#10221C]/60 hover:text-[#10221C] hover:bg-[#10221C]/5 transition-colors cursor-pointer"
                                >
                                    Close & Keep Browsing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Styles for Hide Scrollbar */}
            <style dangerouslySetInnerHTML={{__html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
}
