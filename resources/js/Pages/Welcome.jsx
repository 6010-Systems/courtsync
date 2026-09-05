import { Head, Link } from '@inertiajs/react';
import { Building2 } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

const SPORTS = [
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



export default function Welcome({ auth, facilities = [] }) {
    const bookingsToday = useCountUp(214);

    return (
        <>
            <Head title="CourtSync — Book a court" />

            <div className="courtsync bg-[#F5F2EA] text-[#10221C]">
                {/* Hero — dark, diagonal-cut */}
                <div
                    className="relative bg-[#101F1A] text-[#F5F2EA]"
                    style={{
                        clipPath:
                            'polygon(0 0, 100% 0, 100% 92%, 0 100%)',
                    }}
                >
                    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 animate-fade-in">
                        <span className="font-display text-2xl font-black tracking-tight">
                            Court<span className="text-[#D6FF3F]">Sync</span>
                        </span>

                        <nav className="flex items-center gap-6 text-sm">
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
                                        className="font-semibold text-[#F5F2EA]/70 transition hover:text-[#F5F2EA]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-md bg-[#D6FF3F] px-4 py-2 font-bold text-sm tracking-wide text-[#101F1A] transition hover:bg-[#c2ea2e]"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )}
                        </nav>
                    </header>

                    <section className="mx-auto max-w-6xl px-6 pb-28 pt-10 lg:pt-16">
                        <div className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
                            <div>
                                {/* Eyebrow label */}
                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#D6FF3F]/70 animate-fade-up delay-75">
                                    Philippines #1 Court Booking Platform
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
                                <p className="mt-7 max-w-md text-lg font-medium leading-relaxed text-[#F5F2EA]/65 animate-fade-up delay-200">
                                    Real-time availability across <strong className="font-bold text-[#F5F2EA]/90">Pickleball</strong>,
                                    basketball, badminton, tennis, futsal,
                                    volleyball, and padel facilities.
                                    <span className="block mt-1 text-base font-normal text-[#F5F2EA]/50">No phone calls. No group chats.</span>
                                </p>

                                <div className="mt-9 flex flex-wrap items-center gap-4 animate-fade-up delay-300">
                                    <Link
                                        href={route('register')}
                                        className="rounded-md bg-[#D6FF3F] px-7 py-3.5 font-display font-bold text-lg tracking-wide text-[#101F1A] transition-all hover:bg-[#c2ea2e] hover:scale-[1.03] hover:shadow-lg hover:shadow-[#D6FF3F]/20 active:scale-[0.98]"
                                    >
                                        Find a court
                                    </Link>
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
                                <div className="rounded-lg border border-[#F5F2EA]/10 bg-[#F5F2EA]/5 px-6 py-5 animate-fade-up delay-400">
                                    <p className="font-display text-5xl font-black text-[#D6FF3F]">
                                        {bookingsToday}
                                    </p>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#F5F2EA]/50">
                                        courts booked today
                                    </p>
                                </div>

                                {/* Card 1 — tilted -3deg. Uses animate-fade-only so opacity-only entrance never resets the rotate transform */}
                                <div className="w-56 -rotate-3 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-xl animate-fade-only delay-500">
                                    <p className="font-display text-sm font-bold tracking-tight">
                                        Court 3 · Pickleball
                                    </p>
                                    <p className="mt-0.5 text-xs font-medium text-[#10221C]/55">
                                        6:00 – 7:00 PM · ₱450
                                    </p>
                                    <span className="mt-2.5 inline-block rounded-full bg-[#D6FF3F]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#10221C]">
                                        Open
                                    </span>
                                </div>

                                {/* Card 2 — tilted +2deg. Uses animate-fade-only so opacity-only entrance never resets the rotate transform */}
                                <div className="w-56 rotate-2 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-xl animate-fade-only delay-600">
                                    <p className="font-display text-sm font-bold tracking-tight">
                                        Court A · Badminton
                                    </p>
                                    <p className="mt-0.5 text-xs font-medium text-[#10221C]/55">
                                        8:00 – 9:00 PM · ₱320
                                    </p>
                                    <span className="mt-2.5 inline-block rounded-full bg-[#FF5A36]/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#B8391D]">
                                        2 left
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sports filter pills */}
                <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/40 animate-fade-up">
                        Sports on CourtSync
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        {SPORTS.map((sport, i) => (
                            <span
                                key={sport}
                                className={
                                    'animate-scale-in rounded-full border-2 px-5 py-2 font-display text-base tracking-wide transition-transform hover:scale-105 ' +
                                    (i % 3 === 0
                                        ? 'border-[#101F1A] bg-[#101F1A] text-[#F5F2EA]'
                                        : i % 3 === 1
                                          ? 'border-[#101F1A] text-[#101F1A]'
                                          : 'border-[#FF5A36] text-[#FF5A36]')
                                }
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                {sport}
                            </span>
                        ))}
                    </div>
                </section>

                {/* Featured Facilities */}
                {facilities.length > 0 && (
                    <section className="mx-auto max-w-6xl px-6 py-16">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/40">Featured</p>
                                <h2 className="font-display text-3xl font-black tracking-tight text-[#10221C]">
                                    Top Facilities
                                </h2>
                            </div>
                            <Link href={route('register')} className="text-sm font-bold text-[#FF5A36] hover:underline">
                                View all →
                            </Link>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {facilities.map((facility, i) => (
                                <Link
                                    key={facility.slug}
                                    href={`/${facility.slug}`}
                                    className="group rounded-xl border border-[#10221C]/10 bg-white p-6 shadow-sm transition-all hover:border-[#D6FF3F] hover:shadow-lg hover:-translate-y-1 block animate-fade-up"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    <div className="mb-4 h-32 w-full rounded-lg bg-[#10221C]/5 flex items-center justify-center text-[#10221C]/25 overflow-hidden">
                                        {facility.verification?.facility_photos?.[0] ? (
                                            <img
                                                src={facility.verification.facility_photos[0]}
                                                alt={facility.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <Building2 className="h-10 w-10" />
                                        )}
                                    </div>
                                    <h3 className="font-display text-xl font-bold tracking-tight text-[#10221C] group-hover:text-[#FF5A36] transition">
                                        {facility.name}
                                    </h3>
                                    <p className="mt-1.5 text-sm font-medium text-[#10221C]/50 line-clamp-2">
                                        {facility.city}, {facility.province}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-bold text-[#10221C]">Book Now</span>
                                        <span className="text-[#D6FF3F] bg-[#10221C] rounded-full p-1 group-hover:bg-[#FF5A36] group-hover:text-white transition-all group-hover:scale-110">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* How it works */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#10221C]/40">Simple process</p>
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
                                <p className="mt-2 text-sm font-medium leading-relaxed text-[#10221C]/60">
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
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF5A36]/70 animate-fade-up">For facility owners</p>
                            <h2 className="mt-2 font-display text-4xl font-black tracking-tight sm:text-5xl animate-fade-up delay-100">
                                RUN YOUR FACILITY
                                <br />
                                LIKE A{' '}
                                <span className="text-[#FF5A36]">PRO</span>.
                            </h2>
                            <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-[#F5F2EA]/65 animate-fade-up delay-200">
                                A live booking calendar, walk-in check-in,
                                staff approval workflows, and payouts from
                                <strong className="font-bold text-[#F5F2EA]/90"> GCash, Maya, QR Ph, and card</strong> — all
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
                                    <p className="mt-1 text-xs font-medium text-[#F5F2EA]/55">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#10221C]/10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#10221C]/50 sm:flex-row">
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
        </>
    );
}
