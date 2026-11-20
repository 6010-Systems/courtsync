import { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Building2, MapPin, ArrowRight, Sparkles, Search, X } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import LandingBall from '@/Components/LandingBall';

const SPORTS = [
    'All',
    'Pickleball',
    'Basketball',
    'Badminton',
    'Tennis',
    'Futsal',
    'Volleyball',
    'Padel',
];

const STEPS = [
    {
        title: 'Find your court',
        body: 'Filter by sport, city, and time slot to see real availability across every facility on CourtSync.',
    },
    {
        title: 'Book instantly',
        body: 'Pick your slot and pay with GCash, Maya, QR Ph, or card. Your spot is held the moment payment clears.',
    },
    {
        title: 'Show up and play',
        body: 'Your booking confirmation doubles as your check-in. Facility staff see your reservation the second you arrive.',
    },
];

const MOCK_FACILITY_IMAGES = [
    'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
];

export default function Welcome({ auth, facilities = [] }) {
    const bookingsToday = useCountUp(214);
    const [selectedSport, setSelectedSport] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFacilities = useMemo(() => {
        return facilities.filter((facility) => {
            const matchesSport =
                selectedSport === 'All' ||
                (facility.courts && facility.courts.some((c) => c.type?.toLowerCase().includes(selectedSport.toLowerCase()))) ||
                facility.name?.toLowerCase().includes(selectedSport.toLowerCase()) ||
                facility.description?.toLowerCase().includes(selectedSport.toLowerCase());

            const query = searchQuery.trim().toLowerCase();
            const matchesSearch =
                !query ||
                facility.name?.toLowerCase().includes(query) ||
                facility.city?.toLowerCase().includes(query) ||
                facility.province?.toLowerCase().includes(query) ||
                (facility.courts && facility.courts.some((c) => c.type?.toLowerCase().includes(query)));

            return matchesSport && matchesSearch;
        });
    }, [facilities, selectedSport, searchQuery]);

    return (
        <>
            <Head title="CourtSync — Book sports courts in real-time" />

            <div className="courtsync bg-[#F5F2EA] text-[#10221C]">
                {/* Hero — dark, diagonal-cut */}
                <div
                    className="relative bg-[#101F1A] text-[#F5F2EA]"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 92%, 0 100%)',
                    }}
                >
                    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 animate-fade-in">
                        <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-black tracking-tight">
                            <span>Court<span className="text-[#D6FF3F]">Sync</span></span>
                        </Link>

                        <nav className="flex items-center gap-4 sm:gap-6 text-sm">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-md px-4 py-2 font-semibold text-[#F5F2EA] transition hover:text-[#D6FF3F]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="font-semibold text-[#F5F2EA]/80 transition hover:text-[#F5F2EA]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg border border-[#D6FF3F]/40 bg-[#D6FF3F]/10 px-3.5 py-1.5 font-bold text-xs tracking-wider uppercase text-[#D6FF3F] transition hover:bg-[#D6FF3F] hover:text-[#101F1A]"
                                    >
                                        List facility
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="mx-auto max-w-6xl px-6 pb-28 pt-10 lg:pt-16">
                        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
                            <div>
                                {/* Eyebrow label */}
                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D6FF3F]/90 animate-fade-up delay-75">
                                    The Philippines' #1 Court Booking Platform
                                </p>
                                <h1 className="font-display text-[3.4rem] font-black leading-[0.95] tracking-tight sm:text-[4.6rem] lg:text-[5.2rem] animate-fade-up delay-100">
                                    BOOK A
                                    <br />
                                    COURT BEFORE
                                    <br />
                                    <span className="text-[#D6FF3F]">
                                        SOMEONE ELSE
                                    </span>{' '}
                                    DOES.
                                </h1>
                                <p className="mt-7 max-w-md text-lg font-medium leading-relaxed text-[#F5F2EA]/80 animate-fade-up delay-200">
                                    Real-time availability across <strong className="font-bold text-[#F5F2EA]">Pickleball</strong>,
                                    basketball, badminton, tennis, futsal,
                                    volleyball, and padel facilities.
                                    <span className="block mt-1 text-base font-normal text-[#F5F2EA]/70">No phone calls. No group chats. Instant confirmation.</span>
                                </p>

                                <div className="mt-9 flex flex-wrap items-center gap-4 animate-fade-up delay-300">
                                    <a
                                        href="#venues"
                                        className="inline-flex items-center gap-2 rounded-md bg-[#D6FF3F] px-7 py-3.5 font-display font-bold text-lg tracking-wide text-[#101F1A] transition-all hover:bg-[#c2ea2e] hover:scale-[1.03] hover:shadow-lg hover:shadow-[#D6FF3F]/20 active:scale-[0.98]"
                                    >
                                        <span>Find a court</span>
                                        <ArrowRight size={18} />
                                    </a>
                                    <a
                                        href="#owners"
                                        className="rounded-md border border-[#F5F2EA]/25 px-7 py-3.5 font-semibold text-[#F5F2EA] transition-all hover:border-[#F5F2EA]/50 hover:bg-[#F5F2EA]/5"
                                    >
                                        List your facility
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 lg:items-end">
                                {/* Stat card */}
                                <div className="rounded-lg border border-[#F5F2EA]/10 bg-[#F5F2EA]/5 px-6 py-5 animate-fade-up delay-400 transition-all duration-300 hover:border-[#D6FF3F]/30 hover:bg-[#F5F2EA]/8">
                                    <p className="font-display text-5xl font-black text-[#D6FF3F]">
                                        {bookingsToday}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#F5F2EA]/75">
                                        courts booked today
                                    </p>
                                </div>

                                {/* Floating Cards Container with subtle ambient floating motion */}
                                <div className="animate-float flex flex-col gap-4 lg:items-end">
                                    {/* Card 1 — tilted -3deg */}
                                    <div className="w-56 -rotate-3 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-2xl animate-fade-only delay-500 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-default">
                                        <p className="font-display text-sm font-bold tracking-tight">
                                            Court 3 · Pickleball
                                        </p>
                                        <p className="mt-0.5 text-xs font-medium text-[#10221C]/70">
                                            6:00 – 7:00 PM · ₱450
                                        </p>
                                        <span className="mt-2.5 inline-block rounded-full bg-[#D6FF3F]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10221C]">
                                            Open
                                        </span>
                                    </div>

                                    {/* Card 2 — tilted +2deg */}
                                    <div className="w-56 rotate-2 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-2xl animate-fade-only delay-600 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-default">
                                        <p className="font-display text-sm font-bold tracking-tight">
                                            Court A · Badminton
                                        </p>
                                        <p className="mt-0.5 text-xs font-medium text-[#10221C]/70">
                                            8:00 – 9:00 PM · ₱320
                                        </p>
                                        <span className="mt-2.5 inline-block rounded-full bg-[#FF5A36]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B8391D]">
                                            2 left
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sports filter pills */}
                <section className="mx-auto max-w-6xl px-6 pb-8 pt-14">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/70 animate-fade-up">
                                Sports on CourtSync
                            </p>
                            <p className="text-sm font-medium text-[#10221C]/65 mt-0.5">
                                Select a sport to filter available venues in real time.
                            </p>
                        </div>

                        {/* Quick venue search */}
                        <div className="relative w-full sm:w-72">
                            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by venue or city..."
                                className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/90 pl-9 pr-8 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-2xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#101F1A]/10"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40 hover:text-[#101F1A] transition"
                                    aria-label="Clear search"
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                        {SPORTS.map((sport, i) => {
                            const isSelected = selectedSport === sport;
                            return (
                                <button
                                    type="button"
                                    key={sport}
                                    onClick={() => setSelectedSport(sport)}
                                    className={
                                        'rounded-full border-2 px-4 py-1.5 font-display text-sm tracking-wide transition-all duration-200 active:scale-95 cursor-pointer ' +
                                        (isSelected
                                            ? 'border-[#101F1A] bg-[#101F1A] text-[#D6FF3F] shadow-sm ring-2 ring-[#101F1A]/20 scale-105'
                                            : 'border-[#101F1A]/15 bg-white/80 text-[#101F1A] hover:border-[#101F1A]/40 hover:bg-white')
                                    }
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    {sport}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Featured Facilities */}
                <section id="venues" className="mx-auto max-w-6xl px-6 py-6 sm:py-8 scroll-mt-6">
                    <div className="flex items-center justify-between mb-4 sm:mb-5">
                        <div>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/70 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-[#FF5A36]" />
                                {selectedSport !== 'All' ? `${selectedSport} Venues` : 'Featured Venues'}
                            </p>
                            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[#10221C] mt-0.5">
                                Available Facilities
                            </h2>
                        </div>
                        {(selectedSport !== 'All' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => { setSelectedSport('All'); setSearchQuery(''); }}
                                className="group flex items-center gap-1 text-xs sm:text-sm font-bold text-[#FF5A36] hover:text-[#e64d2b] transition-colors cursor-pointer"
                            >
                                <span>Reset filters</span>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {filteredFacilities.length > 0 ? (
                        <div className="grid gap-3 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredFacilities.map((facility, i) => (
                                <Link
                                    key={facility.slug}
                                    href={`/${facility.slug}`}
                                    className="group relative flex flex-col justify-between h-full rounded-xl border border-[#10221C]/10 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:border-[#D6FF3F] hover:shadow-lg hover:-translate-y-1 block animate-fade-up"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                >
                                    {/* Top Image: Edge-to-edge with smooth gradient overlay */}
                                    <div className="relative h-36 sm:h-40 lg:h-44 w-full shrink-0 overflow-hidden bg-white">
                                        <img
                                            src={facility.cover_photo_url || facility.cover_image_url || facility.verification?.facility_photos?.[0] || MOCK_FACILITY_IMAGES[i % MOCK_FACILITY_IMAGES.length]}
                                            alt={facility.name}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
                                            style={{
                                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                                                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 100%)',
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.src = MOCK_FACILITY_IMAGES[i % MOCK_FACILITY_IMAGES.length];
                                            }}
                                        />

                                        {/* Floating Venue Status Badge */}
                                        <div className="absolute top-3 left-3 z-10">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#101F1A] bg-white/90 backdrop-blur-md shadow-2xs border border-white/60 transition-transform duration-300 group-hover:scale-105">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Partner Venue
                                            </span>
                                        </div>

                                        {/* Smooth gradient overlay that seamlessly dissolves into the card background */}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0.25) 72%, rgba(255,255,255,0.65) 86%, #ffffff 100%)',
                                            }}
                                        />
                                    </div>

                                    {/* Card Body */}
                                    <div className="-mt-3.5 sm:-mt-4 relative z-10 px-4 pb-3.5 sm:px-4.5 sm:pb-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 h-6 sm:h-7">
                                                {facility.logo_url && (
                                                    <img
                                                        src={facility.logo_url}
                                                        alt="Logo"
                                                        className="w-5 h-5 rounded-md object-cover border border-[#101F1A]/10 shrink-0 shadow-2xs"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                )}
                                                <h3 className="font-display text-base sm:text-lg font-bold tracking-tight text-[#10221C] group-hover:text-[#FF5A36] transition-colors duration-200 truncate flex-1" title={facility.name}>
                                                    {facility.name}
                                                </h3>
                                            </div>

                                            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#10221C]/75 truncate h-5">
                                                <MapPin size={12} className="text-[#FF5A36]/80 shrink-0" />
                                                <span className="truncate">{facility.city}, {facility.province}</span>
                                            </p>

                                            <p className="mt-1.5 text-xs text-[#10221C]/70 line-clamp-2 leading-relaxed h-9 overflow-hidden">
                                                {facility.description || 'Verified premier sports facility with top-tier playing courts.'}
                                            </p>

                                            {/* Sport Tags if available */}
                                            {facility.courts && facility.courts.length > 0 && (
                                                <div className="mt-2.5 flex flex-wrap gap-1 overflow-hidden max-h-5">
                                                    {[...new Set(facility.courts.map((c) => c.type).filter(Boolean))].slice(0, 3).map((sportType) => (
                                                        <span key={sportType} className="inline-block rounded-md bg-[#101F1A]/5 px-1.5 py-0.5 text-[9px] font-bold text-[#101F1A]/70 uppercase tracking-tight">
                                                            {sportType}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Fixed Footer */}
                                        <div className="mt-3 pt-2.5 border-t border-[#10221C]/6 flex items-center justify-between shrink-0 h-10">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#10221C]/75 group-hover:text-[#10221C] transition-colors">
                                                Book Courts
                                            </span>
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-[#D6FF3F] shadow-xs transition-all duration-300 group-hover:bg-[#FF5A36] group-hover:text-white group-hover:scale-105 group-hover:shadow-sm">
                                                <ArrowRight size={14} strokeWidth={2.5} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[#10221C]/20 bg-white/70 p-8 text-center sm:p-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101F1A]/5 text-[#101F1A]">
                                <Building2 className="h-6 w-6 text-[#101F1A]/60" />
                            </div>
                            <h3 className="mt-4 font-display text-lg font-bold text-[#10221C]">
                                No venues found {selectedSport !== 'All' ? `for ${selectedSport}` : ''} {searchQuery ? `matching "${searchQuery}"` : ''}
                            </h3>
                            <p className="mx-auto mt-1.5 max-w-sm text-xs font-medium text-[#10221C]/70 leading-relaxed">
                                We couldn&apos;t find any approved facilities with those criteria. Try picking another sport or reset your search.
                            </p>
                            <div className="mt-5 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setSelectedSport('All'); setSearchQuery(''); }}
                                    className="rounded-lg bg-[#101F1A] px-4 py-2 font-display text-xs font-bold text-[#D6FF3F] hover:bg-[#162923] transition-colors cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                                <a
                                    href="#owners"
                                    className="rounded-lg border border-[#10221C]/20 px-4 py-2 font-display text-xs font-bold text-[#10221C] hover:bg-black/5 transition-colors"
                                >
                                    List Your Facility
                                </a>
                            </div>
                        </div>
                    )}
                </section>

                {/* How it works */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/70">Simple process</p>
                    <h2 className="mt-1 font-display text-3xl font-black tracking-tight text-[#10221C]">
                        How it works
                    </h2>
                    <div className="relative mt-10 grid gap-10 sm:grid-cols-3">
                        <div
                            className="absolute left-0 right-0 top-6 hidden h-0.5 bg-[#10221C]/10 sm:block"
                            aria-hidden="true"
                        />
                        {STEPS.map((step, i) => (
                            <div key={step.title} className="relative animate-fade-up" style={{ animationDelay: `${i * 120}ms` }}>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#101F1A] font-display text-xl font-black text-[#D6FF3F] transition-transform hover:scale-110 hover:shadow-lg hover:shadow-[#D6FF3F]/20">
                                    {i + 1}
                                </div>
                                <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-[#10221C]">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-[#10221C]/75">
                                    {step.body}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Facility owners — dark, mirrored diagonal */}
                <div
                    id="owners"
                    className="relative bg-[#101F1A] text-[#F5F2EA]"
                    style={{
                        clipPath: 'polygon(0 8%, 100% 0, 100% 100%, 0 100%)',
                    }}
                >
                    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 pt-32 lg:grid-cols-[1fr,0.8fr] lg:items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF5A36] animate-fade-up">For facility owners</p>
                            <h2 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl animate-fade-up delay-100">
                                RUN YOUR FACILITY
                                <br />
                                LIKE A{' '}
                                <span className="text-[#FF5A36]">PRO</span>.
                            </h2>
                            <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-[#F5F2EA]/80 animate-fade-up delay-200">
                                A live booking calendar, walk-in check-in,
                                staff approval workflows, and payouts from
                                <strong className="font-bold text-[#F5F2EA]"> GCash, Maya, QR Ph, and card</strong> — all
                                in one dashboard.
                            </p>
                            <Link
                                href={route('register')}
                                className="mt-8 inline-block rounded-md bg-[#FF5A36] px-7 py-3.5 font-display font-bold text-lg tracking-wide text-white transition-all hover:bg-[#e64d2b] hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF5A36]/20 active:scale-[0.98] animate-fade-up delay-300"
                            >
                                List your facility
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ['Live calendar', 'See every court, every slot, in real time.'],
                                ['Walk-ins', 'Log on-site bookings alongside online ones.'],
                                ['PH payouts', 'GCash, Maya, QR Ph, and cards, settled to you.'],
                                ['Staff roles', 'Approvals and check-in without owner bottlenecks.'],
                            ].map(([title, body], i) => (
                                <div
                                    key={title}
                                    className="rounded-lg border border-[#F5F2EA]/10 bg-[#F5F2EA]/5 p-5 transition-all hover:bg-[#F5F2EA]/10 hover:border-[#F5F2EA]/20 hover:-translate-y-0.5 animate-fade-up"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    <p className="font-display text-lg font-bold text-[#F5F2EA]">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-[#F5F2EA]/75">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#10221C]/10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#10221C]/70 sm:flex-row">
                        <span className="font-display text-base font-black text-[#10221C]">
                            Court<span className="text-[#D6FF3F] bg-[#10221C] px-1 rounded">Sync</span>
                        </span>
                        <span className="font-medium">
                            &copy; {new Date().getFullYear()} CourtSync.
                            Built for courts across the Philippines.
                        </span>
                    </div>
                </footer>
            </div>
            <LandingBall />
        </>
    );
}
