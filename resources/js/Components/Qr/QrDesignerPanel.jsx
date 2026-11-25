import { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Download, Printer, Save } from 'lucide-react';
import FacilityQrCode from './FacilityQrCode';
import { useToast } from '@/Components/ToastContext';
import { QR_CORNER_STYLES, QR_DOT_STYLES, resolveQrTheme } from '@/Utils/qrTheme';

const fieldClass = 'mt-1 block w-full rounded-xl border border-[#101F1A]/15 bg-white px-3 py-2 text-xs font-medium text-[#101F1A] focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F]';
const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-[#101F1A]/60';

const PRESET_COLORS = [
    { label: 'Ink', value: '#101F1A' },
    { label: 'Forest', value: '#14532D' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Teal', value: '#0D9488' },
    { label: 'Sky', value: '#0EA5E9' },
    { label: 'Indigo', value: '#4F46E5' },
    { label: 'Violet', value: '#7C3AED' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Coral', value: '#FF5A36' },
    { label: 'Amber', value: '#F59E0B' },
];

/**
 * Live QR customizer: works inside a modal or as a full page.
 */
export default function QrDesignerPanel({ facility, bookingUrl, showPrint = false, onSaved }) {
    const toast = useToast();
    const previewRef = useRef(null);
    const [processing, setProcessing] = useState(false);
    const [theme, setTheme] = useState(() => {
        const resolved = resolveQrTheme(facility.qr_theme);

        return { ...resolved, caption: resolved.caption || facility.name, error_correction: 'M' };
    });

    const setField = (key, value) => setTheme((current) => ({ ...current, [key]: value }));

    const save = () => {
        router.patch(route('facility.qr-theme.update', facility.id), { ...theme, error_correction: 'M' }, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                toast.success('QR design saved');
                onSaved?.();
            },
            onError: () => toast.error('Could not save the QR design'),
        });
    };

    const download = (extension) => previewRef.current?.download(extension, `${facility.slug}-qr`);

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-5">
            {/* Preview */}
            <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4 text-center">
                <div className="mx-auto w-fit overflow-hidden rounded-2xl border border-[#101F1A]/10 bg-white p-2.5 shadow-sm">
                    <FacilityQrCode
                        ref={previewRef}
                        url={bookingUrl}
                        theme={theme}
                        logoUrl={facility.logo_url}
                        size={200}
                        className="max-w-full"
                    />
                </div>

                <p className="mt-3 text-sm font-black leading-snug text-[#101F1A]">{theme.caption || facility.name}</p>
                <p className="mt-1 break-all text-[11px] font-medium text-[#101F1A]/55">{bookingUrl}</p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => download('png')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 py-2 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923] cursor-pointer"
                    >
                        <Download size={13} />
                        PNG
                    </button>
                    {showPrint && (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/15 px-3.5 py-2 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#F5F2EA] cursor-pointer"
                        >
                            <Printer size={13} />
                            Print poster
                        </button>
                    )}
                </div>

                <p className="mt-3 text-[11px] text-[#101F1A]/50">Scan the preview with your phone before printing.</p>
            </div>

            {/* Controls */}
            <div className="rounded-xl border border-[#101F1A]/10 bg-white p-4">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="qr-dot-style" className={labelClass}>Dot shape</label>
                        <select
                            id="qr-dot-style"
                            value={theme.dot_style}
                            onChange={(event) => setField('dot_style', event.target.value)}
                            className={fieldClass}
                        >
                            {QR_DOT_STYLES.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="qr-corner-style" className={labelClass}>Corner shape</label>
                        <select
                            id="qr-corner-style"
                            value={theme.corner_style}
                            onChange={(event) => setField('corner_style', event.target.value)}
                            className={fieldClass}
                        >
                            {QR_CORNER_STYLES.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <span className={labelClass}>Colour</span>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            {PRESET_COLORS.map((preset) => {
                                const isActive = theme.foreground.toUpperCase() === preset.value.toUpperCase();

                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        title={preset.label}
                                        aria-label={preset.label}
                                        aria-pressed={isActive}
                                        onClick={() => setField('foreground', preset.value)}
                                        style={{ backgroundColor: preset.value }}
                                        className={`h-8 w-8 rounded-full ring-1 ring-[#101F1A]/10 transition-transform cursor-pointer ${
                                            isActive ? 'scale-110 ring-2 ring-[#101F1A]' : 'hover:scale-105'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-end sm:col-span-2">
                        <label
                            htmlFor="qr-logo"
                            className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
                                facility.logo_url
                                    ? 'border-[#101F1A]/15 bg-[#F5F2EA]/60 text-[#101F1A] cursor-pointer'
                                    : 'border-dashed border-[#101F1A]/20 bg-[#F5F2EA]/40 text-[#101F1A]/45'
                            }`}
                        >
                            <input
                                id="qr-logo"
                                type="checkbox"
                                checked={Boolean(theme.logo)}
                                disabled={!facility.logo_url}
                                onChange={(event) => setField('logo', event.target.checked)}
                                className="h-4 w-4 rounded border-[#101F1A]/30 text-[#101F1A] focus:ring-[#D6FF3F]"
                            />
                            Logo in the centre
                        </label>
                    </div>
                </div>

                {!facility.logo_url && (
                    <p className="mt-3 rounded-lg bg-[#F5F2EA] px-3 py-2 text-[11px] font-medium text-[#101F1A]/60">
                        Upload a facility logo on the venue page first to place it inside the QR.
                    </p>
                )}

                <div className="mt-4 flex flex-col gap-3 border-t border-[#101F1A]/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        onClick={save}
                        disabled={processing}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#101F1A] px-4 py-2.5 text-xs font-bold text-[#D6FF3F] transition-colors hover:bg-[#162923] disabled:opacity-60 cursor-pointer sm:w-auto sm:py-2"
                    >
                        <Save size={13} />
                        Save design
                    </button>
                </div>
            </div>
        </div>
    );
}
