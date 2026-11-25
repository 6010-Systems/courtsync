import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Layers, MapPin, Search } from 'lucide-react';

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=1200&q=80';

export default function Discover({ facilities = [], filters = {} }) {
    const [city, setCity] = useState(filters.city || '');

    const submit = (event) => {
        event.preventDefault();
        router.get(route('facility.discover'), { city }, { preserveState: true, preserveScroll: true });
    };

    const coverFor = (facility) =>
        facility.cover_photo_url || facility.verification?.facility_photos?.[0] || FALLBACK_COVER;

    return (
        <div className="min-h-screen bg-[#F5F2EA] font-sans selection:bg-[#D6FF3F] selection:text-[#10221C]">
            <Head title="Find a court" />

            <header className="border-b border-[#101F1A]/10 bg-[#101F1A]">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2 font-display text-lg font-black tracking-tight text-[#F5F2EA]">
                        <span className="rounded-md bg-[#D6FF3F] px-1.5 py-0.5 text-[#101F1A]">CS</span>
                        CourtSync
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F5F2EA]/70 transition-colors hover:text-[#D6FF3F]"
                    >
                        <ArrowLeft size={13} />
                        Back to home
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#101F1A]/45">Discover venues</p>
                        <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-[#101F1A] sm:text-4xl">
                            Find a court near you
                        </h1>
                        <p className="mt-1.5 max-w-xl text-sm font-medium text-[#101F1A]/60">
                            Browse every approved venue. Search by city or province, then open one to see its courts and rates.
                        </p>
                    </div>

                    <form onSubmit={submit} className="flex w-full max-w-sm items-center gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#101F1A]/40" />
                            <input
                                type="search"
                                value={city}
                                onChange={(event) => setCity(event.target.value)}
                                placeholder="City, province, or venue"
                                className="w-full rounded-xl border border-[#101F1A]/15 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-[#101F1A] placeholder:text-[#101F1A]/40 focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923] cursor-pointer"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="mt-8 flex items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-black tracking-tight text-[#101F1A]">
                        {filters.city ? `Venues matching “${filters.city}”` : 'All venues'}
                    </h2>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/45">
                        {facilities.length} {facilities.length === 1 ? 'venue' : 'venues'}
                    </span>
                </div>

                {facilities.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-[#101F1A]/10 bg-white p-10 text-center shadow-sm">
                        <MapPin size={26} className="mx-auto text-[#101F1A]/35" />
                        <p className="mt-3 text-sm font-bold text-[#101F1A]">No venues found</p>
                        <p className="mt-1 text-xs text-[#101F1A]/55">
                            Try a different city or clear the search to see every venue with a pin.
                        </p>
                        {filters.city && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCity('');
                                    router.get(route('facility.discover'), {}, { preserveScroll: true });
                                }}
                                className="mt-4 text-xs font-bold text-[#101F1A] underline underline-offset-4 cursor-pointer"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {facilities.map((facility) => (
                            <Link
                                key={facility.id}
                                href={route('facility.show', facility.slug)}
                                className="group flex flex-col overflow-hidden rounded-2xl border border-[#101F1A]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D6FF3F] hover:shadow-lg"
                            >
                                <div className="relative h-36 w-full overflow-hidden bg-[#101F1A]/5">
                                    <img
                                        src={coverFor(facility)}
                                        alt={facility.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col justify-between p-4">
                                    <div>
                                        <p className="truncate font-display text-base font-black tracking-tight text-[#10221C]">
                                            {facility.name}
                                        </p>
                                        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#10221C]/60">
                                            <MapPin size={12} className="shrink-0 text-[#FF5A36]/80" />
                                            <span className="truncate">
                                                {[facility.city, facility.province].filter(Boolean).join(', ')}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#101F1A]/60">
                                        <Layers size={12} />
                                        {facility.address || 'View venue details'}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
