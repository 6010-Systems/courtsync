import { Head, Link, usePage, router } from '@inertiajs/react';
import ShareButton from '@/Components/ShareButton';
import Dialog from '@/Components/Dialog';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';
import CourtCard from '@/Components/CourtCard';
import { Camera, Image as ImageIcon, Sparkles, Check, Upload, Link2, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useState, useEffect } from 'react';

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
};

const DEFAULT_COURT_IMAGES = [
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
];

const PRESET_COVERS = [
    { label: 'Tennis Complex', url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Badminton Hall', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Basketball Arena', url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Pickleball / Multi-Sport', url: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Padel Arena', url: 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1600&q=80' },
    { label: 'Futsal Turf', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1600&q=80' },
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

export default function Show({ facility }) {
    const currentUrl = window.location.href;
    const { auth } = usePage().props;
    const user = auth.user;
    const isOwner = user && (user.role === 'ADMIN' || (user.role === 'FACILITY_OWNER' && user.id === facility.user_id));

    const defaultCover = 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1600&q=80';
    const coverPhoto = facility.cover_photo_url || facility.cover_image_url || facility.verification?.facility_photos?.[0] || defaultCover;
    
    // Gallery photos
    const rawPhotos = facility.verification?.facility_photos || [];
    const photos = (Array.isArray(rawPhotos) ? rawPhotos : [])
        .filter((p) => Boolean(p && typeof p === 'string' && p.trim()));

    // Fallback: if no verification photos exist, include coverPhoto if available
    if (photos.length === 0 && coverPhoto) {
        photos.push(coverPhoto);
    }

    // Interactive Lightbox Expand State
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    const openLightbox = (index) => {
        setActivePhotoIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
    };

    const nextPhoto = () => {
        setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    };

    const prevPhoto = () => {
        setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    };

    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
            } else if (e.key === 'ArrowRight') {
                setActivePhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isLightboxOpen, photos.length]);

    // Modal state for changing branding (cover photo & logo)
    const [isEditCoverOpen, setIsEditCoverOpen] = useState(false);
    const [coverMode, setCoverMode] = useState('preset'); // 'preset', 'url', 'upload'
    const [coverUrlInput, setCoverUrlInput] = useState(facility.cover_photo_url || '');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(coverPhoto);
    const [logoUrlInput, setLogoUrlInput] = useState(facility.logo_url || '');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(facility.logo_url || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectPreset = (url) => {
        setCoverUrlInput(url);
        setCoverFile(null);
        setCoverPreview(url);
    };

    const handleCoverFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleLogoFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveBranding = () => {
        setIsSaving(true);
        const formData = new FormData();

        if (coverFile) {
            formData.append('cover_photo', coverFile);
        } else if (coverUrlInput) {
            formData.append('cover_photo_url', coverUrlInput);
        }

        if (logoFile) {
            formData.append('logo', logoFile);
        } else if (logoUrlInput) {
            formData.append('logo_url', logoUrlInput);
        }

        router.post(route('facility.branding.update', facility.id), formData, {
            onFinish: () => {
                setIsSaving(false);
                setIsEditCoverOpen(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C]">
            <Head>
                <title>{facility.name}</title>
                <meta property="og:title" content={facility.name} />
                <meta property="og:description" content={facility.description} />
                <meta property="og:image" content={facility.cover_image_url} />
                <meta property="og:url" content={currentUrl} />
                <meta property="og:type" content="website" />
            </Head>

            {/* Immersive Hero Section */}
            <header
                className="group relative h-[50vh] min-h-[400px] sm:h-[65vh] lg:h-[75vh] flex items-end justify-center transition-all duration-700"
                style={{
                    backgroundImage: `url(${coverPhoto})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#10221C] via-[#10221C]/65 to-transparent"></div>

                {/* Owner "Change Cover Photo" button on banner hover */}
                {isOwner && (
                    <button
                        type="button"
                        onClick={() => setIsEditCoverOpen(true)}
                        className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-8 z-30 inline-flex items-center gap-2 rounded-full bg-[#10221C]/85 px-4 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md border border-white/20 transition-all hover:bg-[#10221C] hover:border-[#D6FF3F] hover:text-[#D6FF3F] group-hover:opacity-100 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                    >
                        <Camera size={15} className="text-[#D6FF3F]" />
                        <span>Change Cover Photo</span>
                    </button>
                )}

                {/* Navbar elements integrated into hero */}
                <div className="absolute top-0 right-0 p-3 sm:p-6 lg:p-8 flex justify-end items-center gap-2 sm:gap-3 z-30">
                    <ShareButton
                        title={facility.name}
                        text={`Book your court on ${facility.name} now!`}
                        url={currentUrl}
                    />

                    {user && (
                        <>
                            {user.role === 'PLAYER' && (
                                <Link
                                    href={route('player.bookings')}
                                    className="rounded-full bg-[#D6FF3F] hover:bg-[#c4ec39] transition px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-[#10221C] sm:text-sm shadow-md whitespace-nowrap"
                                >
                                    My Bookings
                                </Link>
                            )}

                            {(user.role === 'ADMIN' || user.role === 'FACILITY_OWNER' || user.role === 'FACILITY_STAFF') && (
                                <Link
                                    href="/dashboard"
                                    className="rounded-full bg-[#D6FF3F] hover:bg-[#c4ec39] transition px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-[#10221C] sm:text-sm shadow-md whitespace-nowrap"
                                >
                                    Dashboard
                                </Link>
                            )}

                            <div className="text-white text-xs sm:text-sm font-medium flex items-center gap-2 bg-[#10221C]/90 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 shadow-xl backdrop-blur-md">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D6FF3F] flex items-center justify-center text-[#10221C] font-black text-[10px] sm:text-xs shrink-0">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="hidden sm:inline max-w-[130px] truncate">{user.name}</span>
                            </div>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-white hover:text-[#D6FF3F] text-xs sm:text-sm font-bold bg-[#10221C]/60 hover:bg-[#10221C]/90 transition px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 backdrop-blur-md cursor-pointer whitespace-nowrap"
                            >
                                Log Out
                            </Link>
                        </>
                    )}
                </div>

                <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 lg:pb-24">
                    <div className="flex flex-row items-end justify-start gap-4 sm:gap-6 lg:gap-10 w-full">
                        <div className="max-w-[85%] sm:max-w-3xl">
                            {/* Bigger Logo with Verified Badge at lower-right edge */}
                            {facility.logo_url && (
                                <div className="relative inline-block group/logo mb-3 sm:mb-5">
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl bg-[#10221C]/95 shadow-2xl backdrop-blur-md overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-300 ">
                                        <img
                                            src={facility.logo_url}
                                            alt={`${facility.name} logo`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }}
                                        />
                                    </div>
                                    <img
                                        src="/assets/verified-badge-yellow.png"
                                        alt="Verified"
                                        title="Verified Partner"
                                        className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-xl z-20 select-none pointer-events-none"
                                    />
                                </div>
                            )}

                            <h1 className="text-2xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight mb-2 sm:mb-4 drop-shadow-lg break-words flex items-center flex-wrap gap-2 sm:gap-3">
                                <span>{facility.name}</span>
                                {!facility.logo_url && (
                                    <img
                                        src="/assets/verified-badge-yellow.png"
                                        alt="Verified"
                                        title="Verified Partner"
                                        className="w-6 h-6 sm:w-9 sm:h-9 object-contain drop-shadow-xl inline-block select-none pointer-events-none"
                                    />
                                )}
                            </h1>
                            <p className="text-xs sm:text-xl lg:text-2xl text-gray-200 font-medium flex items-center gap-1 sm:gap-2 drop-shadow-md">
                                <svg className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 text-[#D6FF3F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {facility.city}, {facility.province}
                            </p>
                            {facility.contact_number && (
                                <p className="text-xs sm:text-xl lg:text-2xl text-gray-200 font-medium flex items-center gap-1 sm:gap-2 drop-shadow-md mt-1">
                                    <svg className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 text-[#D6FF3F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {facility.contact_number}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-14 lg:py-20 relative z-20">
                {/* Mobile-Only Compact Rectangle Booking CTA (Directly below banner) */}
                <div className="block lg:hidden mb-6 sm:mb-8">
                    <div className="bg-[#10221C] p-4 sm:p-5 rounded-2xl shadow-xl border border-white/5 flex items-center justify-between gap-3.5">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">Ready to play?</h2>
                            <p className="text-xs text-gray-300 truncate mt-0.5">Book a court now at {facility.name}</p>
                        </div>
                        {user ? (
                            <Link
                                href={route('facility.book', facility.slug)}
                                className="shrink-0 inline-flex items-center justify-center bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl transition duration-300 shadow-md shadow-[#D6FF3F]/20 hover:-translate-y-0.5"
                            >
                                Book a Court
                            </Link>
                        ) : (
                            <Link
                                href={`/${facility.slug}/login`}
                                className="shrink-0 inline-flex items-center justify-center bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl transition duration-300 shadow-md shadow-[#D6FF3F]/20 hover:-translate-y-0.5"
                            >
                                Sign In to Book
                            </Link>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12">

                    {/* Left Column - Details & Gallery */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-8 sm:space-y-10 lg:space-y-12">
                        {/* Courts */}
                        <section>
                            <div className="mb-5 sm:mb-8 px-1 sm:px-2">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[#10221C]">Courts</h2>
                                    {facility.courts?.length > 0 && (
                                        <span className="rounded-full bg-[#10221C]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#10221C]/70">
                                            {facility.courts.length}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs sm:text-sm text-[#10221C]/60">
                                    Operating hours, day/night rates, and availability for every court.
                                </p>
                            </div>
                            {facility.courts && facility.courts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {facility.courts.map((court, courtIndex) => {
                                        const isBookable = court.status === 'AVAILABLE';

                                        return (
                                            <CourtCard
                                                key={court.id}
                                                court={court}
                                                image={getCourtImage(court, facility, courtIndex)}
                                                fallbackImage={DEFAULT_COURT_IMAGES[courtIndex % DEFAULT_COURT_IMAGES.length]}
                                                actions={
                                                    isBookable ? (
                                                        <Link
                                                            href={route('facility.book', facility.slug)}
                                                            className="inline-flex items-center gap-1 rounded-xl bg-[#10221C] px-3.5 py-2 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c4a34]"
                                                        >
                                                            Book court
                                                            <ChevronRight size={13} strokeWidth={2.6} />
                                                        </Link>
                                                    ) : (
                                                        <span className="rounded-xl bg-[#10221C]/5 px-3 py-2 text-xs font-bold text-[#10221C]/50">
                                                            Unavailable
                                                        </span>
                                                    )
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-[#10221C]/5 p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-[#10221C]/10 border-dashed text-center">
                                    <p className="text-[#10221C]/60 italic font-medium">No courts have been listed for this facility yet.</p>
                                </div>
                            )}
                        </section>

                        {/* Premium Facility Gallery */}
                        <section>
                            <div className="flex items-center justify-between mb-5 sm:mb-8 px-1 sm:px-2">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[#10221C]">Facility Gallery</h2>
                                    <p className="text-xs sm:text-sm text-[#10221C]/60 mt-0.5">Explore court photos & facility amenities</p>
                                </div>
                                {photos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => openLightbox(0)}
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#10221C] hover:text-[#0c4a34] bg-[#10221C]/5 hover:bg-[#10221C]/10 px-3.5 py-1.5 rounded-full transition cursor-pointer"
                                    >
                                        <ImageIcon size={14} />
                                        <span>View all ({photos.length})</span>
                                    </button>
                                )}
                            </div>

                            {photos.length === 0 ? (
                                <div className="bg-[#10221C]/5 p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-[#10221C]/10 border-dashed text-center">
                                    <p className="text-[#10221C]/60 italic font-medium">No photos available for this facility.</p>
                                </div>
                            ) : photos.length === 1 ? (
                                <div
                                    onClick={() => openLightbox(0)}
                                    className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/9] bg-[#10221C] shadow-lg cursor-pointer border border-[#10221C]/10"
                                >
                                    <img
                                        src={photos[0]}
                                        alt="Facility photo"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                    <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Maximize2 size={16} />
                                    </div>
                                </div>
                            ) : photos.length === 2 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {photos.map((photo, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => openLightbox(idx)}
                                            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] bg-[#10221C] shadow-lg cursor-pointer border border-[#10221C]/10"
                                        >
                                            <img
                                                src={photo}
                                                alt={`Facility photo ${idx + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                            <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize2 size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : photos.length === 3 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div
                                        onClick={() => openLightbox(0)}
                                        className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-auto sm:row-span-2 bg-[#10221C] shadow-lg cursor-pointer border border-[#10221C]/10"
                                    >
                                        <img
                                            src={photos[0]}
                                            alt="Facility photo 1"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                        <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Maximize2 size={16} />
                                        </div>
                                    </div>
                                    {photos.slice(1, 3).map((photo, idx) => (
                                        <div
                                            key={idx + 1}
                                            onClick={() => openLightbox(idx + 1)}
                                            className="group relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/10] bg-[#10221C] shadow-lg cursor-pointer border border-[#10221C]/10"
                                        >
                                            <img
                                                src={photo}
                                                alt={`Facility photo ${idx + 2}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                            <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize2 size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Facebook-Style 4-Image Collage */
                                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 rounded-2xl sm:rounded-3xl overflow-hidden">
                                    {photos.slice(0, 4).map((photo, index) => {
                                        const isLastVisible = index === 3;
                                        const remainingCount = photos.length - 4;
                                        const hasMore = isLastVisible && remainingCount > 0;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => openLightbox(index)}
                                                className="group relative aspect-[4/3] sm:aspect-[16/10] bg-[#10221C] overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer shadow-md border border-[#10221C]/10"
                                            >
                                                <img
                                                    src={photo}
                                                    alt={`Facility photo ${index + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

                                                {/* Expand icon on hover for regular cards */}
                                                {!hasMore && (
                                                    <div className="absolute top-2.5 right-2.5 rounded-full bg-black/60 backdrop-blur-md p-1.5 sm:p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <Maximize2 size={14} />
                                                    </div>
                                                )}

                                                {/* Facebook-style +1 / +X overlay on the 4th image */}
                                                {hasMore && (
                                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white transition-all duration-300 group-hover:bg-black/75 z-20">
                                                        <span className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                                                            +{remainingCount}
                                                        </span>
                                                       
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* About Section - Dark Card */}
                        <section className="bg-[#10221C] p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/5">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">About the Facility</h2>
                            <div className="prose prose-lg text-gray-300 leading-relaxed text-sm sm:text-base">
                                {facility.description ? (
                                    <p>{facility.description}</p>
                                ) : (
                                    <p className="italic opacity-50">No description provided by the facility owner yet.</p>
                                )}
                            </div>

                            <hr className="my-6 sm:my-8 border-white/10" />

                            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Location Details</h3>
                            <p className="text-base sm:text-lg text-gray-400 flex flex-col gap-1">
                                <span className="text-gray-300">{facility.address}</span>
                                <span>{facility.city}, {facility.province}</span>
                                <span className="opacity-70">{facility.country}</span>
                            </p>
                        </section>
                    </div>

                    {/* Right Column - Booking CTA (Desktop Sticky Sidebar) */}
                    <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
                        <div className="bg-[#10221C] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/5 sticky top-8">
                            <h2 className="text-2xl font-bold text-white mb-4">Ready to play?</h2>
                            <p className="text-gray-400 mb-6">Book a court now at {facility.name}.</p>

                            {user ? (
                                <Link
                                    href={route('facility.book', facility.slug)}
                                    className="w-full flex items-center justify-center bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] font-black text-lg py-4 px-4 rounded-xl transition duration-300 shadow-xl shadow-[#D6FF3F]/20 hover:-translate-y-1"
                                >
                                    Book a Court
                                </Link>
                            ) : (
                                <Link
                                    href={`/${facility.slug}/login`}
                                    className="w-full flex items-center justify-center bg-[#D6FF3F] hover:bg-[#c4ec39] text-[#10221C] font-black text-lg py-4 px-4 rounded-xl transition duration-300 shadow-xl shadow-[#D6FF3F]/20 hover:-translate-y-1"
                                >
                                    Sign In to Book
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Owner Branding & Cover Photo Modal */}
            {isOwner && (
                <Dialog
                    isOpen={isEditCoverOpen}
                    onClose={() => setIsEditCoverOpen(false)}
                    title="Change Cover Photo & Logo"
                    subtitle="Customize how your facility looks to players"
                    icon={Camera}
                    iconVariant="volt"
                    size="xl"
                    confirmText="Save Branding"
                    confirmVariant="volt"
                    isLoading={isSaving}
                    onConfirm={handleSaveBranding}
                >
                    <div className="p-6 space-y-6">
                        {/* Cover Photo Preview */}
                        <div>
                            <InputLabel value="Cover Photo Preview" className="mb-2 font-bold" />
                            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[#101F1A]/10 bg-[#101F1A] shadow-inner">
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                    <p className="text-xs font-bold text-white drop-shadow">
                                        Hero Banner Preview
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Mode Switcher */}
                        <div>
                            <div className="flex gap-2 p-1 bg-[#101F1A]/5 rounded-xl text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setCoverMode('preset')}
                                    className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        coverMode === 'preset' ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs' : 'text-[#101F1A]/70 hover:text-[#101F1A]'
                                    }`}
                                >
                                    <Sparkles size={14} />
                                    <span>Choose Preset</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCoverMode('url')}
                                    className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        coverMode === 'url' ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs' : 'text-[#101F1A]/70 hover:text-[#101F1A]'
                                    }`}
                                >
                                    <Link2 size={14} />
                                    <span>Image URL</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCoverMode('upload')}
                                    className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        coverMode === 'upload' ? 'bg-[#101F1A] text-[#D6FF3F] shadow-xs' : 'text-[#101F1A]/70 hover:text-[#101F1A]'
                                    }`}
                                >
                                    <Upload size={14} />
                                    <span>Upload File</span>
                                </button>
                            </div>

                            {/* Mode Content */}
                            <div className="mt-4">
                                {coverMode === 'preset' && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {PRESET_COVERS.map((preset, idx) => {
                                            const isSelected = coverUrlInput === preset.url;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSelectPreset(preset.url)}
                                                    className={`relative rounded-xl overflow-hidden aspect-[16/9] border-2 transition-all cursor-pointer group text-left ${
                                                        isSelected ? 'border-[#D6FF3F] ring-2 ring-[#D6FF3F]' : 'border-transparent hover:border-black/20'
                                                    }`}
                                                >
                                                    <img
                                                        src={preset.url}
                                                        alt={preset.label}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex items-end">
                                                        <span className="text-[11px] font-bold text-white line-clamp-1">
                                                            {preset.label}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#D6FF3F] text-[#101F1A] flex items-center justify-center shadow">
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {coverMode === 'url' && (
                                    <div>
                                        <InputLabel htmlFor="cover_photo_url" value="Enter Direct Image URL" />
                                        <TextInput
                                            id="cover_photo_url"
                                            type="url"
                                            value={coverUrlInput}
                                            onChange={(e) => {
                                                setCoverUrlInput(e.target.value);
                                                setCoverFile(null);
                                                if (e.target.value) setCoverPreview(e.target.value);
                                            }}
                                            placeholder="https://images.unsplash.com/photo-..."
                                            className="mt-1 block w-full text-xs font-medium"
                                        />
                                    </div>
                                )}

                                {coverMode === 'upload' && (
                                    <div>
                                        <InputLabel value="Upload High-Resolution Cover Photo" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleCoverFileChange}
                                            className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#101F1A] file:text-[#D6FF3F] hover:file:bg-[#162923] cursor-pointer"
                                        />
                                        <p className="mt-1 text-[11px] text-[#101F1A]/50">
                                            PNG, JPG or WEBP up to 10MB. Recommended resolution: 1600x900px or higher.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Optional Facility Logo */}
                        <div className="pt-4 border-t border-[#101F1A]/10">
                            <InputLabel value="Facility Logo Badge (Optional)" className="mb-1 font-bold" />
                            <div className="flex items-center gap-3">
                                {logoPreview ? (
                                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#101F1A]/10 bg-[#101F1A]/5 shrink-0">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                ) : null}
                                <div className="flex-1 space-y-1.5">
                                    <TextInput
                                        type="url"
                                        value={logoUrlInput}
                                        onChange={(e) => {
                                            setLogoUrlInput(e.target.value);
                                            setLogoFile(null);
                                            if (e.target.value) setLogoPreview(e.target.value);
                                        }}
                                        placeholder="Logo URL (e.g. https://.../logo.png)"
                                        className="block w-full text-xs font-medium"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoFileChange}
                                        className="block w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#101F1A]/10 file:text-[#101F1A] hover:file:bg-[#101F1A]/20 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Dialog>
            )}

            {/* Semi-Transparent Shadow Lightbox Modal (Page stays visible beneath) */}
            {isLightboxOpen && photos.length > 0 && (
                <div
                    onClick={closeLightbox}
                    className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center select-none animate-in fade-in duration-200 p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                >
                    {/* Floating Close Button */}
                    <button
                        type="button"
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40 rounded-full bg-black/40 hover:bg-black/75 text-white/90 hover:text-white p-2.5 backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-xl hover:scale-105"
                        title="Close (Esc)"
                    >
                        <X size={22} />
                    </button>

                    {/* Prev Arrow Button (Clean Icon Without Circle Background) */}
                    {photos.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                prevPhoto();
                            }}
                            className="absolute left-1 sm:left-4 z-30 p-2 text-white/90 hover:text-white transition-all cursor-pointer hover:scale-115 active:scale-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                            title="Previous photo (Left arrow)"
                        >
                            <ChevronLeft size={36} className="sm:w-11 sm:h-11 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
                        </button>
                    )}

                    {/* Main Image Stage */}
                    <div
                        className="relative max-h-full max-w-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            key={activePhotoIndex}
                            src={photos[activePhotoIndex]}
                            alt={`Facility photo ${activePhotoIndex + 1}`}
                            className="max-h-[72vh] sm:max-h-[78vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl transition-all duration-200 drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)]"
                        />
                    </div>

                    {/* Next Arrow Button (Clean Icon Without Circle Background) */}
                    {photos.length > 1 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                nextPhoto();
                            }}
                            className="absolute right-1 sm:right-4 z-30 p-2 text-white/90 hover:text-white transition-all cursor-pointer hover:scale-115 active:scale-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                            title="Next photo (Right arrow)"
                        >
                            <ChevronRight size={36} className="sm:w-11 sm:h-11 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
                        </button>
                    )}

                    {/* Bottom Floating Thumbnail Dock (Shadow Styled) */}
                    {photos.length > 1 && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-4 sm:bottom-6 z-30 max-w-[92vw] overflow-x-auto py-2 px-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl flex items-center justify-center gap-2 sm:gap-2.5 hide-scrollbar"
                        >
                            {photos.map((photo, i) => {
                                const isActive = i === activePhotoIndex;
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActivePhotoIndex(i)}
                                        className={`relative w-12 h-9 sm:w-16 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden shrink-0 transition-all duration-200 border-2 cursor-pointer shadow-md ${
                                            isActive
                                                ? 'border-[#D6FF3F] ring-2 ring-[#D6FF3F]/50 scale-105 opacity-100'
                                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-102'
                                        }`}
                                    >
                                        <img
                                            src={photo}
                                            alt={`Thumbnail ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
