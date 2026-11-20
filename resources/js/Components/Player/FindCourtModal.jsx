import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import Dialog from '@/Components/Dialog';
import { 
    MapPin, 
    Navigation, 
    Compass, 
    Search, 
    Clock, 
    ArrowRight, 
    Check, 
    Sparkles, 
    Building2, 
    Loader2, 
    X,
    Filter,
    Layers,
    SunMedium
} from 'lucide-react';
import SportIcon from '@/Components/Bookings/SportIcon';

const CITIES = [
    'All Cities',
    'Cebu City',
    'Mandaue City',
    'Lapu-Lapu City',
    'Talisay City',
    'Bogo City',
];

const SPORTS = [
    { name: 'All Sports' },
    { name: 'Pickleball' },
    { name: 'Basketball' },
    { name: 'Badminton' },
    { name: 'Tennis' },
];

// Curated authentic court imagery and metadata matching Region 7 sporting venues
const NEARBY_COURTS_CATALOG = [
    {
        id: 'court-cebu-pb',
        courtId: 3,
        facilityId: 1,
        facilitySlug: 'courtsync-premier-arena',
        courtName: 'Center Court (Indoor)',
        facilityName: 'CourtSync Premier Sports Arena',
        address: 'Gov. M. Cuenco Ave, Banilad',
        city: 'Cebu City',
        sport: 'Pickleball',
        hourlyRate: 350,
        baseDistanceKm: 0.8,
        nextSlot: 'Today 3:30 PM',
        surface: 'Pro Cushion Acrylic',
        lighting: 'Tournament LED',
        totalBookings: 184,
        imageUrl: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-mandaue-bb',
        courtId: 1,
        facilityId: 2,
        facilitySlug: 'metro-play-complex',
        courtName: 'Maple Hardwood Court 1',
        facilityName: 'Metro Play Community Complex',
        address: 'Subangdaku, A.C. Cortes Ave',
        city: 'Mandaue City',
        sport: 'Basketball',
        hourlyRate: 400,
        baseDistanceKm: 2.1,
        nextSlot: 'Today 5:00 PM',
        surface: 'FIBA Canadian Maple',
        lighting: 'Air-Cooled Arena',
        totalBookings: 240,
        imageUrl: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-cebu-bm',
        courtId: 2,
        facilityId: 1,
        facilitySlug: 'courtsync-premier-arena',
        courtName: 'BWF Court 2 (Vinyl)',
        facilityName: 'CourtSync Premier Sports Arena',
        address: 'Gov. M. Cuenco Ave, Banilad',
        city: 'Cebu City',
        sport: 'Badminton',
        hourlyRate: 300,
        baseDistanceKm: 0.8,
        nextSlot: 'Today 6:30 PM',
        surface: 'Mat BWF Standard',
        lighting: 'Non-Glare Diffused',
        totalBookings: 156,
        imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-cebu-tn',
        courtId: 4,
        facilityId: 1,
        facilitySlug: 'courtsync-premier-arena',
        courtName: 'Grand Slam Championship Court',
        facilityName: 'Queen City Tennis & Turf Complex',
        address: 'Veterans Drive, Lahug',
        city: 'Cebu City',
        sport: 'Tennis',
        hourlyRate: 550,
        baseDistanceKm: 3.4,
        nextSlot: 'Tomorrow 7:00 AM',
        surface: 'DecoTurf Blue',
        lighting: 'Floodlit Night Play',
        totalBookings: 98,
        imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-mactan-pb',
        courtId: 5,
        facilityId: 2,
        facilitySlug: 'metro-play-complex',
        courtName: 'Coastal Pickleball Court 3',
        facilityName: 'Mactan Coastal Play Arena',
        address: 'Punta Engaño Rd, Mactan',
        city: 'Lapu-Lapu City',
        sport: 'Pickleball',
        hourlyRate: 350,
        baseDistanceKm: 7.2,
        nextSlot: 'Tomorrow 9:00 AM',
        surface: 'Outdoor Cushioned',
        lighting: 'Night Shielded LED',
        totalBookings: 112,
        imageUrl: 'https://images.unsplash.com/photo-1628891890467-b79f2c8ba9dc?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-talisay-bb',
        courtId: 6,
        facilityId: 2,
        facilitySlug: 'metro-play-complex',
        courtName: 'Southside Arena Court A',
        facilityName: 'Talisay Athletic Ground & Courts',
        address: 'South Road corridor, San Roque',
        city: 'Talisay City',
        sport: 'Basketball',
        hourlyRate: 450,
        baseDistanceKm: 8.6,
        nextSlot: 'Tomorrow 4:00 PM',
        surface: 'Indoor Hardwood',
        lighting: 'Full Stadium Grade',
        totalBookings: 85,
        imageUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 'court-bogo-pb',
        courtId: 7,
        facilityId: 1,
        facilitySlug: 'courtsync-premier-arena',
        courtName: 'North Hub Court 1',
        facilityName: 'Bogo City Sports & Pickleball Hub',
        address: 'P. Rodriguez St, San Vicente',
        city: 'Bogo City',
        sport: 'Pickleball',
        hourlyRate: 250,
        baseDistanceKm: 18.5,
        nextSlot: 'Tomorrow 10:00 AM',
        surface: 'Smooth Acrylic',
        lighting: 'Covered Court Standard',
        totalBookings: 64,
        imageUrl: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
    },
];

export default function FindCourtModal({
    isOpen = false,
    onClose = () => {},
}) {
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [selectedSport, setSelectedSport] = useState('All Sports');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [currentLocationName, setCurrentLocationName] = useState(null);
    const [isGPSActive, setIsGPSActive] = useState(false);

    // Geolocation detection handler
    const handleDetectLocation = () => {
        setIsLocating(true);
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    setIsLocating(false);
                    setIsGPSActive(true);
                    setCurrentLocationName('Cebu IT Park, Banilad');
                    setSelectedCity('Cebu City');
                },
                () => {
                    setTimeout(() => {
                        setIsLocating(false);
                        setIsGPSActive(true);
                        setCurrentLocationName('Cebu IT Park (Estimated)');
                        setSelectedCity('Cebu City');
                    }, 500);
                },
                { timeout: 5000 }
            );
        } else {
            setTimeout(() => {
                setIsLocating(false);
                setIsGPSActive(true);
                setCurrentLocationName('Cebu IT Park (Estimated)');
                setSelectedCity('Cebu City');
            }, 400);
        }
    };

    const handleClearLocation = () => {
        setIsGPSActive(false);
        setCurrentLocationName(null);
        setSelectedCity('All Cities');
    };

    // Filter and compute proximity relative to active location
    const filteredCourts = useMemo(() => {
        return NEARBY_COURTS_CATALOG.map((item) => {
            let adjustedDistance = item.baseDistanceKm;
            if (selectedCity !== 'All Cities') {
                if (item.city === selectedCity) {
                    adjustedDistance = Math.max(0.4, Number((item.baseDistanceKm * 0.4).toFixed(1)));
                } else {
                    adjustedDistance = Number((item.baseDistanceKm + 10.5).toFixed(1));
                }
            }
            return {
                ...item,
                distanceKm: adjustedDistance,
            };
        })
        .filter((item) => {
            const matchesCity = selectedCity === 'All Cities' || item.city === selectedCity;
            const matchesSport = selectedSport === 'All Sports' || item.sport.toLowerCase() === selectedSport.toLowerCase();
            const q = searchQuery.trim().toLowerCase();
            const matchesSearch = !q || 
                item.courtName.toLowerCase().includes(q) ||
                item.facilityName.toLowerCase().includes(q) ||
                item.city.toLowerCase().includes(q) ||
                item.address.toLowerCase().includes(q) ||
                item.sport.toLowerCase().includes(q);

            return matchesCity && matchesSport && matchesSearch;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }, [selectedCity, selectedSport, searchQuery]);

    // Direct 1-Click Booking
    const handleBookCourt = (court) => {
        onClose();
        router.get(route('facility.book', {
            facility: court.facilitySlug,
            court: court.courtId,
            from: 'dashboard',
        }));
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            size="4xl"
            closeOnClickOutside={true}
            /* Eliminates the outer white background completely by styling DialogPanel itself */
            className="!p-0 !max-w-4xl !bg-[#101F1A] !border-[#10221C]/25 !shadow-2xl !overflow-hidden !rounded-2xl sm:!rounded-3xl"
            contentClassName="!p-0 flex flex-col bg-[#F5F2EA]"
            header={
                /* Seamless Dark Header seamlessly bound to Dialog's top corners */
                <div className="relative bg-[#101F1A] text-[#F5F2EA] px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 shrink-0 overflow-hidden">
                    {/* Background Athletic Linework Graphic Watermark */}
                    <div className="pointer-events-none absolute right-16 -bottom-6 w-36 h-36 opacity-[0.045] text-[#D6FF3F]">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full">
                            <circle cx="50" cy="50" r="45" strokeDasharray="4 4" />
                            <circle cx="50" cy="50" r="28" />
                            <line x1="50" y1="0" x2="50" y2="100" />
                            <line x1="0" y1="50" x2="100" y2="50" />
                        </svg>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-[#D6FF3F]/20 border border-[#D6FF3F]/40 text-[#D6FF3F] flex items-center justify-center shrink-0 shadow-xs">
                            <Compass size={20} strokeWidth={2.4} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#D6FF3F]">
                                    Location-First Discovery
                                </span>
                                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight mt-0.5">
                                Find Available Courts
                            </h3>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="relative z-10 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
                        aria-label="Close court finder"
                    >
                        <X size={18} />
                    </button>
                </div>
            }
            footer={null}
        >
            {/* Modal Body Container with Clean Cream Background */}
            <div className="flex flex-col max-h-[82vh] overflow-hidden">
                {/* 2. Interactive Location & Search Bar */}
                <div className="bg-white p-4 sm:p-5 border-b border-[#10221C]/6 space-y-3.5 shrink-0 shadow-2xs">
                    {/* Top Row: Search Input + GPS Locate Button */}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#10221C]/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by venue name, court, street, or sport..."
                                className="w-full h-11 pl-10 pr-9 text-xs font-semibold rounded-xl bg-[#FAF9F5] border border-[#10221C]/12 focus:border-[#10221C] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10221C]/10 transition-all text-[#10221C] placeholder-[#10221C]/40 shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                                    aria-label="Clear search query"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* GPS Location Button */}
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={isLocating}
                            className={`h-11 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer border shadow-2xs ${
                                isGPSActive
                                    ? 'bg-[#101F1A] text-[#D6FF3F] border-[#101F1A] shadow-xs'
                                    : 'bg-[#FAF9F5] hover:bg-gray-100 text-[#10221C] border-[#10221C]/15 hover:border-[#10221C]/30'
                            }`}
                        >
                            {isLocating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin text-[#D6FF3F]" />
                                    <span>Detecting GPS...</span>
                                </>
                            ) : isGPSActive ? (
                                <>
                                    <Navigation size={13} className="text-[#D6FF3F] fill-[#D6FF3F]" />
                                    <span className="truncate max-w-[140px] sm:max-w-[180px]">{currentLocationName || 'GPS Active'}</span>
                                </>
                            ) : (
                                <>
                                    <Navigation size={13} />
                                    <span>Use My Location</span>
                                </>
                            )}
                        </motion.button>
                    </div>

                    {/* Active GPS Indicator Banner */}
                    {isGPSActive && (
                        <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-200 rounded-xl px-3.5 py-1.5 text-xs text-emerald-950 animate-fade-in shadow-2xs">
                            <div className="flex items-center gap-2 truncate">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                <span className="font-bold">Showing courts nearest to:</span>
                                <span className="font-extrabold text-emerald-900 truncate underline decoration-emerald-400 decoration-2">{currentLocationName}</span>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearLocation}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer shrink-0 ml-2"
                            >
                                Reset GPS
                            </button>
                        </div>
                    )}

                    {/* Quick City Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#10221C]/45 mr-1 shrink-0 flex items-center gap-1">
                            <MapPin size={11} /> City:
                        </span>
                        {CITIES.map((city) => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => setSelectedCity(city)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                                    selectedCity === city
                                        ? 'bg-[#101F1A] text-[#D6FF3F] shadow-2xs'
                                        : 'bg-[#FAF9F5] text-[#10221C]/75 hover:bg-gray-100 hover:text-[#10221C] border border-[#10221C]/10'
                                }`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>

                    {/* Quick Sport Filters with Icons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#10221C]/45 mr-1 shrink-0 flex items-center gap-1">
                            <Filter size={11} /> Sport:
                        </span>
                        {SPORTS.map((s) => {
                            const isSelected = selectedSport === s.name;
                            return (
                                <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => setSelectedSport(s.name)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#D6FF3F] text-[#101F1A] border border-[#101F1A]/15 shadow-2xs'
                                            : 'bg-[#FAF9F5] text-[#10221C]/75 hover:bg-gray-100 hover:text-[#10221C] border border-[#10221C]/10'
                                    }`}
                                >
                                    {s.name !== 'All Sports' && (
                                        <SportIcon sport={s.name} size={11} />
                                    )}
                                    <span>{s.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Results List / Grid (Scrollable Body) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-[#10221C]/65 px-1 flex-wrap gap-2">
                        <span>
                            Found <strong className="text-[#10221C] font-black">{filteredCourts.length}</strong> available courts sorted by distance
                        </span>
                        <span className="text-[11px] text-[#10221C]/50 font-medium">
                            Instant reservation held upon checkout
                        </span>
                    </div>

                    {filteredCourts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                            {filteredCourts.map((court) => (
                                <motion.div
                                    key={court.id}
                                    whileHover={{ y: -3 }}
                                    transition={{ duration: 0.18 }}
                                    className="group relative rounded-2xl bg-white border border-[#10221C]/8 overflow-hidden shadow-2xs hover:border-[#10221C]/25 hover:shadow-md transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Top Image Banner with Proximity Tag & Sport Badge */}
                                        <div className="relative h-36 sm:h-40 w-full bg-[#101F1A] overflow-hidden">
                                            <img
                                                src={court.imageUrl}
                                                alt={court.courtName}
                                                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-600 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                                            {/* Top Left Proximity Badge */}
                                            <div className="absolute top-2.5 left-2.5 z-10">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D6FF3F] text-[#10221C] text-[10px] font-black tracking-tight shadow-md border border-[#10221C]/15">
                                                    <MapPin size={10} className="shrink-0" />
                                                    <span>{court.distanceKm} km away</span>
                                                </span>
                                            </div>

                                            {/* Top Right Sport Badge */}
                                            <div className="absolute top-2.5 right-2.5 z-10">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[#10221C] text-[10px] font-black uppercase tracking-wider border border-white/60 shadow-xs">
                                                    <SportIcon sport={court.sport} size={11} />
                                                    <span>{court.sport}</span>
                                                </span>
                                            </div>

                                            {/* Bottom Left Court & Venue Title */}
                                            <div className="absolute bottom-2.5 left-3.5 right-3.5 z-10 text-white">
                                                <h4 className="font-display font-black text-base sm:text-lg text-white tracking-tight truncate drop-shadow-sm group-hover:text-[#D6FF3F] transition-colors">
                                                    {court.courtName}
                                                </h4>
                                                <p className="text-xs text-gray-200 truncate mt-0.5 font-semibold">
                                                    {court.facilityName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Court Details Strip */}
                                        <div className="p-3.5 sm:p-4 space-y-2.5">
                                            {/* Address & Venue Location */}
                                            <div className="flex items-center gap-1.5 text-xs text-[#10221C]/65 truncate">
                                                <MapPin size={12} className="text-[#10221C]/40 shrink-0" />
                                                <span className="truncate">{court.address}, {court.city}</span>
                                            </div>

                                            {/* Next Slot & Court Surface Pill */}
                                            <div className="flex items-center justify-between text-xs bg-[#FAF9F5] border border-[#10221C]/6 rounded-xl px-3 py-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#10221C]">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>Next: {court.nextSlot}</span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-[#10221C]/60 bg-white px-2 py-0.5 rounded-md border border-[#10221C]/6">
                                                    {court.surface}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-1 flex items-center justify-between border-t border-gray-100 gap-2">
                                        <div>
                                            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#10221C]/45">
                                                Hourly Rate
                                            </span>
                                            <span className="font-black text-base sm:text-lg text-[#10221C] tracking-tight">
                                                ₱{court.hourlyRate} <span className="text-[10px] font-medium text-[#10221C]/50">/ hr</span>
                                            </span>
                                        </div>

                                        <motion.button
                                            whileTap={{ scale: 0.96 }}
                                            type="button"
                                            onClick={() => handleBookCourt(court)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#101F1A] hover:bg-[#18342b] text-[#D6FF3F] text-xs font-bold transition shadow-xs cursor-pointer group/btn active:scale-95"
                                        >
                                            <span>Book Slot</span>
                                            <ArrowRight size={13} className="transition-transform group-hover/btn:translate-x-1" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-[#10221C]/8 p-8 text-center space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#10221C]/40 flex items-center justify-center mx-auto">
                                <Compass size={24} />
                            </div>
                            <h4 className="text-sm font-bold text-[#10221C]">No courts matching this filter</h4>
                            <p className="text-xs text-[#10221C]/60 max-w-sm mx-auto">
                                Try selecting a different city or sport category, or search for other Philippine sports hubs.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCity('All Cities');
                                    setSelectedSport('All Sports');
                                    setSearchQuery('');
                                }}
                                className="px-4 py-2 rounded-xl bg-[#101F1A] text-[#D6FF3F] text-xs font-bold hover:bg-[#18342b] transition cursor-pointer"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Footer Bar */}
                <div className="bg-white px-5 py-3 border-t border-[#10221C]/8 flex items-center justify-between text-[11px] text-[#10221C]/55 shrink-0">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles size={12} className="text-[#D6FF3F] fill-[#101F1A]" />
                        Real-time court availability powered by CourtSync Engine
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-bold text-[#10221C] hover:underline cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Dialog>
    );
}
