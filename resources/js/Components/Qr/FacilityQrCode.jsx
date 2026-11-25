import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { resolveQrTheme } from '@/Utils/qrTheme';

/**
 * Renders a facility booking QR (SVG) from a stored theme.
 * Exposes download(extension, name) through a ref.
 */
const FacilityQrCode = forwardRef(function FacilityQrCode({ url, theme, logoUrl, size = 200, className = '' }, ref) {
    const hostRef = useRef(null);
    const qrRef = useRef(null);
    const resolved = resolveQrTheme(theme);

    const options = useMemo(() => ({
        width: size,
        height: size,
        type: 'svg',
        data: url,
        image: resolved.logo && logoUrl ? logoUrl : undefined,
        qrOptions: { errorCorrectionLevel: resolved.error_correction },
        dotsOptions: { color: resolved.foreground, type: resolved.dot_style },
        cornersSquareOptions: { color: resolved.foreground, type: resolved.corner_style },
        cornersDotOptions: { color: resolved.foreground },
        backgroundOptions: { color: resolved.background },
        imageOptions: {
            crossOrigin: 'anonymous',
            margin: 5,
            imageSize: 0.32,
            hideBackgroundDots: true,
        },
    }), [
        size,
        url,
        logoUrl,
        resolved.logo,
        resolved.foreground,
        resolved.background,
        resolved.dot_style,
        resolved.corner_style,
        resolved.error_correction,
    ]);

    useEffect(() => {
        if (!hostRef.current) {
            return;
        }

        if (!qrRef.current) {
            qrRef.current = new QRCodeStyling(options);
            qrRef.current.append(hostRef.current);

            return;
        }

        qrRef.current.update(options);
    }, [options]);

    useImperativeHandle(ref, () => ({
        download: (extension = 'png', name = 'facility-qr') => qrRef.current?.download({ name, extension }),
        getInstance: () => qrRef.current,
    }), []);

    return <div ref={hostRef} className={className} aria-label="Facility booking QR code" />;
});

export default FacilityQrCode;
