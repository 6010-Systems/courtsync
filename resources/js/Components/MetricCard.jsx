import { Link } from '@inertiajs/react';

export function percentDelta(current, previous) {
    const previousValue = Number(previous);
    const currentValue = Number(current);

    if (!(previousValue > 0)) {
        return null;
    }

    const rounded = Math.round(((currentValue - previousValue) / previousValue) * 100);

    return rounded === 0 ? null : rounded;
}

export function formatCount(value) {
    return Number(value).toLocaleString('en-PH');
}

export function formatPeso(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(amount));
}

const accents = {
    lime: 'bg-[#D6FF3F] text-[#101F1A]',
    forest: 'bg-[#101F1A] text-[#D6FF3F]',
    coral: 'bg-[#FF5A36]/15 text-[#FF5A36]',
    amber: 'bg-amber-100 text-amber-800',
    muted: 'bg-[#101F1A]/5 text-[#101F1A]/40',
};

export default function MetricCard({
    label,
    value,
    hint = null,
    delta = null,
    comparison = null,
    href = null,
    alert = false,
    placeholder = false,
    icon: Icon = null,
    accent = 'lime',
}) {
    const card = (
        <div
            className={`flex h-full flex-col rounded-xl border bg-white p-4 md:p-6 ${
                placeholder
                    ? 'border-dashed border-[#101F1A]/20'
                    : alert
                        ? 'border-amber-200'
                        : 'border-[#101F1A]/10'
            } ${href ? 'transition-colors hover:border-[#101F1A]/25' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <p className={`text-xs font-bold uppercase tracking-wider ${alert ? 'text-amber-800' : 'text-[#101F1A]/50'}`}>
                    {label}
                </p>
                <div className="flex shrink-0 items-center gap-2">
                    {placeholder && (
                        <span className="rounded-full bg-[#101F1A]/10 px-2 py-0.5 text-[10px] font-bold text-[#101F1A]/60">
                            Soon
                        </span>
                    )}
                    {Icon ? (
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accents[placeholder ? 'muted' : accent]}`}>
                            <Icon size={16} strokeWidth={2.25} aria-hidden="true" />
                        </span>
                    ) : null}
                </div>
            </div>
            <p className={`mt-3 text-3xl font-black ${alert ? 'text-amber-900' : 'text-[#101F1A]'}`}>
                {placeholder ? '—' : value}
            </p>
            {placeholder && (
                <p className="mt-2 text-xs text-[#101F1A]/60">Not available yet</p>
            )}
            {(delta !== null || comparison) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {delta !== null && (
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                delta > 0
                                    ? 'bg-[#D6FF3F] text-[#101F1A]'
                                    : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                    )}
                    {comparison && (
                        <span className="text-xs text-[#101F1A]/60">{comparison}</span>
                    )}
                </div>
            )}
            {hint && (
                <p className="mt-2 text-xs text-[#101F1A]/60">{hint}</p>
            )}
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block h-full">
                {card}
            </Link>
        );
    }

    return card;
}
