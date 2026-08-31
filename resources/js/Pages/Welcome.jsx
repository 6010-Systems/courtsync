import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const SPORTS = [
    'Pickeball',
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

function useCountUp(target, durationMs = 1400) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReduced) {
            setValue(target);
            return;
        }

        const start = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
                ref.current = requestAnimationFrame(tick);
            }
        };

        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [target, durationMs]);

    return value;
}

export default function Welcome({ auth }) {
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
                    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                        <span className="font-display text-2xl tracking-tight">
                            Court<span className="text-[#D6FF3F]">Sync</span>
                        </span>

                        <nav className="flex items-center gap-6 text-sm">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-md px-4 py-2 font-medium text-[#F5F2EA] transition hover:text-[#D6FF3F]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="font-medium text-[#F5F2EA]/80 transition hover:text-[#F5F2EA]"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-md bg-[#D6FF3F] px-4 py-2 font-display text-sm tracking-wide text-[#101F1A] transition hover:bg-[#c2ea2e]"
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
                                <h1 className="font-display text-[3.4rem] leading-[0.95] tracking-tight sm:text-[4.6rem] lg:text-[5.2rem]">
                                    BOOK A
                                    <br />
                                    COURT BEFORE
                                    <br />
                                    <span className="text-[#D6FF3F]">
                                        SOMEONE ELSE
                                    </span>{' '}
                                    DOES.
                                </h1>
                                <p className="mt-7 max-w-md text-lg leading-relaxed text-[#F5F2EA]/70">
                                    Real-time availability across Pickleball,
                                    basketball, badminton, tennis, futsal,
                                    volleyball, and padel facilities. No
                                    phone calls, no group chats.
                                </p>

                                <div className="mt-9 flex flex-wrap items-center gap-4">
                                    <Link
                                        href={route('register')}
                                        className="rounded-md bg-[#D6FF3F] px-7 py-3.5 font-display text-lg tracking-wide text-[#101F1A] transition hover:bg-[#c2ea2e]"
                                    >
                                        Find a court
                                    </Link>
                                    <a
                                        href="#owners"
                                        className="rounded-md border border-[#F5F2EA]/25 px-7 py-3.5 font-medium text-[#F5F2EA] transition hover:border-[#F5F2EA]/50"
                                    >
                                        List your facility
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 lg:items-end">
                                <div className="rounded-lg border border-[#F5F2EA]/10 bg-[#F5F2EA]/5 px-6 py-5">
                                    <p className="font-display text-5xl text-[#D6FF3F]">
                                        {bookingsToday}
                                    </p>
                                    <p className="mt-1 text-sm text-[#F5F2EA]/60">
                                        courts booked today
                                    </p>
                                </div>

                                <div className="w-56 -rotate-3 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-xl">
                                    <p className="font-display text-base">
                                        Court 3 · Pickleball
                                    </p>
                                    <p className="mt-1 text-sm text-[#10221C]/60">
                                        6:00 – 7:00 PM · ₱450
                                    </p>
                                    <span className="mt-2 inline-block rounded-full bg-[#D6FF3F]/30 px-2.5 py-1 text-xs font-semibold text-[#10221C]">
                                        Open
                                    </span>
                                </div>

                                <div className="w-56 rotate-2 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-xl">
                                    <p className="font-display text-base">
                                        Court A · Badminton
                                    </p>
                                    <p className="mt-1 text-sm text-[#10221C]/60">
                                        8:00 – 9:00 PM · ₱320
                                    </p>
                                    <span className="mt-2 inline-block rounded-full bg-[#FF5A36]/20 px-2.5 py-1 text-xs font-semibold text-[#B8391D]">
                                        2 left
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sports filter pills */}
                <section className="mx-auto max-w-6xl px-6 pb-16 pt-14">
                    <p className="font-display text-sm tracking-wide text-[#10221C]/50">
                        Sports on CourtSync
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        {SPORTS.map((sport, i) => (
                            <span
                                key={sport}
                                className={
                                    'rounded-full border-2 px-5 py-2 font-display text-base tracking-wide ' +
                                    (i % 3 === 0
                                        ? 'border-[#101F1A] bg-[#101F1A] text-[#F5F2EA]'
                                        : i % 3 === 1
                                          ? 'border-[#101F1A] text-[#101F1A]'
                                          : 'border-[#FF5A36] text-[#FF5A36]')
                                }
                            >
                                {sport}
                            </span>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className="mx-auto max-w-6xl px-6 py-16">
                    <h2 className="font-display text-3xl tracking-tight text-[#10221C]">
                        How it works
                    </h2>
                    <div className="relative mt-10 grid gap-10 sm:grid-cols-3">
                        <div
                            className="absolute left-0 right-0 top-6 hidden h-0.5 bg-[#10221C]/10 sm:block"
                            aria-hidden="true"
                        />
                        {STEPS.map((step, i) => (
                            <div key={step.title} className="relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#101F1A] font-display text-xl text-[#D6FF3F]">
                                    {i + 1}
                                </div>
                                <h3 className="mt-4 font-display text-xl tracking-tight text-[#10221C]">
                                    {step.title}
                                </h3>
                                <p className="mt-2 leading-relaxed text-[#10221C]/65">
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
                            <h2 className="font-display text-4xl tracking-tight sm:text-5xl">
                                RUN YOUR FACILITY
                                <br />
                                LIKE A{' '}
                                <span className="text-[#FF5A36]">PRO</span>.
                            </h2>
                            <p className="mt-5 max-w-lg leading-relaxed text-[#F5F2EA]/70">
                                A live booking calendar, walk-in check-in,
                                staff approval workflows, and payouts from
                                GCash, Maya, QR Ph, and card payments — all
                                in one dashboard.
                            </p>
                            <a
                                href="#"
                                className="mt-8 inline-block rounded-md bg-[#FF5A36] px-7 py-3.5 font-display text-lg tracking-wide text-[#101F1A] transition hover:bg-[#e64d2b]"
                            >
                                List your facility
                            </a>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ['Live calendar', 'See every court, every slot, in real time.'],
                                ['Walk-ins', 'Log on-site bookings alongside online ones.'],
                                ['PH payouts', 'GCash, Maya, QR Ph, and cards, settled to you.'],
                                ['Staff roles', 'Approvals and check-in without owner bottlenecks.'],
                            ].map(([title, body]) => (
                                <div
                                    key={title}
                                    className="rounded-lg border border-[#F5F2EA]/10 bg-[#F5F2EA]/5 p-5"
                                >
                                    <p className="font-display text-2xl">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#F5F2EA]/60">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#10221C]/10">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-[#10221C]/60 sm:flex-row">
                        <span className="font-display text-base text-[#10221C]">
                            Court<span className="text-[#FF5A36]">Sync</span>
                        </span>
                        <span>
                            &copy; {new Date().getFullYear()} CourtSync.
                            Built for courts across the Philippines.
                        </span>
                    </div>
                </footer>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap');
                .courtsync { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
                .font-display { font-family: 'Anton', ui-sans-serif, system-ui, sans-serif; }
            `}</style>
        </>
    );
}
