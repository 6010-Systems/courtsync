import { useRef } from 'react';
import { Download, Palette, QrCode } from 'lucide-react';
import FacilityQrCode from './FacilityQrCode';
import { resolveQrTheme } from '@/Utils/qrTheme';

/**
 * Plain booking QR block shown to owners and on the public venue page.
 */
export default function FacilityShareQrCard({ facility, canCustomize = false, onCustomize, showLabel = false, className = '' }) {
    const qrRef = useRef(null);
    const bookingUrl = facility.slug ? route('facility.show', facility.slug) : '';
    const theme = resolveQrTheme(facility.qr_theme);

    if (!bookingUrl) {
        return null;
    }

    return (
        <div className={`flex flex-col items-center text-center ${className}`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#101F1A]/45">
                <QrCode size={12} />
                {canCustomize ? 'Ready to download' : 'Scan to book'}
            </div>

            <div className="mt-3 w-full max-w-[220px] overflow-hidden rounded-2xl bg-white p-3 sm:max-w-[240px]">
                <FacilityQrCode
                    ref={qrRef}
                    url={bookingUrl}
                    theme={theme}
                    logoUrl={facility.logo_url}
                    size={240}
                    className="[&>svg]:h-auto [&>svg]:w-full"
                />
            </div>

            {showLabel && (
                <>
                    <p className="mt-4 w-full break-words text-base font-black leading-snug tracking-tight text-[#101F1A] sm:text-lg">
                        {facility.name}
                    </p>
                    {(facility.city || facility.province) && (
                        <p className="mt-1 w-full break-words text-xs font-medium text-[#101F1A]/50">
                            {[facility.city, facility.province].filter(Boolean).join(', ')}
                        </p>
                    )}
                </>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() => qrRef.current?.download('png', `${facility.slug}-qr`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#101F1A] px-3.5 py-2 text-[11px] font-bold text-[#D6FF3F] hover:bg-[#162923] cursor-pointer"
                >
                    <Download size={12} />
                    Download
                </button>
                {canCustomize && onCustomize && (
                    <button
                        type="button"
                        onClick={onCustomize}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#101F1A]/15 px-3 py-2 text-[11px] font-bold text-[#101F1A] hover:bg-[#F5F2EA] cursor-pointer"
                    >
                        <Palette size={12} />
                        Customize
                    </button>
                )}
            </div>
        </div>
    );
}
