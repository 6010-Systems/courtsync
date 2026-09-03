import { Head, Link, usePage } from '@inertiajs/react';
import BookingWidget from '@/Components/BookingWidget';
import { COURT_STATUS_LABELS, COURT_STATUS_STYLES } from '@/Utils/courtStatus';

export default function Show({ facility }) {
    const { auth } = usePage().props;
    const user = auth.user;
    
    const coverPhoto = facility.verification?.facility_photos?.[0] || '/path/to/default-image.png';
    const photos = facility.verification?.facility_photos || [];

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
                                className="text-white hover:text-white text-xs sm:text-sm font-bold bg-[#10221C]/50 hover:bg-[#10221C]/80 transition px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 backdrop-blur-md"
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
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight mb-3 sm:mb-4 drop-shadow-lg break-words">
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

                        {/* Courts */}
                        <section>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#10221C] mb-5 sm:mb-8 px-1 sm:px-2">Courts</h2>
                            {facility.courts && facility.courts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {facility.courts.map((court) => (
                                        <div key={court.id} className="rounded-2xl border border-[#10221C]/10 bg-white p-5 sm:p-6 shadow-sm">
                                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-[#10221C]">{court.name}</h3>
                                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${COURT_STATUS_STYLES[court.status] || COURT_STATUS_STYLES.NOT_AVAILABLE}`}>
                                                    {COURT_STATUS_LABELS[court.status] || court.status}
                                                </span>
                                            </div>
                                            {court.type && (
                                                <p className="mt-1 text-sm text-[#10221C]/60">{court.type}</p>
                                            )}
                                            {court.time_range && (
                                                <p className="mt-1 text-sm text-[#10221C]/60">🕐 {court.time_range}</p>
                                            )}
                                            {court.hourly_rate && (
                                                <p className="mt-2 text-sm font-bold text-[#10221C]">₱{Number(court.hourly_rate).toFixed(2)}/hr</p>
                                            )}
                                            {court.description && (
                                                <p className="mt-3 text-sm text-[#10221C]/70">{court.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#10221C]/5 p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-[#10221C]/10 border-dashed text-center">
                                    <p className="text-[#10221C]/60 italic font-medium">No courts have been listed for this facility yet.</p>
                                </div>
                            )}
                        </section>

                        {/* Premium Gallery */}
                        <section>
                            <h2 className="text-2xl sm:text-3xl font-bold text-[#10221C] mb-5 sm:mb-8 px-1 sm:px-2">Facility Gallery</h2>
                            {photos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {photos.map((photo, index) => (
                                        <div
                                            key={index}
                                            className={`rounded-2xl overflow-hidden shadow-lg group relative bg-[#10221C] ${index === 0 && photos.length > 2 ? 'sm:col-span-2 sm:aspect-[2/1]' : 'aspect-[4/3]'}`}
                                        >
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300 z-10"></div>
                                            <img
                                                src={photo}
                                                alt={`Facility photo ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#10221C]/5 p-8 sm:p-12 rounded-2xl sm:rounded-3xl border border-[#10221C]/10 border-dashed text-center">
                                    <p className="text-[#10221C]/60 italic font-medium">No photos available for this facility.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column - Booking Widget */}
                    <div className="lg:col-span-5 xl:col-span-4">
                        <BookingWidget facility={facility} user={user} courts={facility.courts || []} />
                    </div>
                </div>
            </main>
            
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
