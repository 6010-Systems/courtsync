export const DEFAULT_QR_THEME = {
    dot_style: 'rounded',
    corner_style: 'extra-rounded',
    foreground: '#101F1A',
    background: '#FFFFFF',
    error_correction: 'Q',
    logo: true,
    caption: '',
};

export const QR_DOT_STYLES = [
    { value: 'square', label: 'Square' },
    { value: 'dots', label: 'Dots' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy rounded' },
    { value: 'extra-rounded', label: 'Extra rounded' },
];

export const QR_CORNER_STYLES = [
    { value: 'square', label: 'Square' },
    { value: 'dot', label: 'Dot' },
    { value: 'extra-rounded', label: 'Extra rounded' },
];

export const QR_ERROR_LEVELS = [
    { value: 'L', label: 'Low (7%)' },
    { value: 'M', label: 'Medium (15%)' },
    { value: 'Q', label: 'Quartile (25%)' },
    { value: 'H', label: 'High (30%)' },
];

export function resolveQrTheme(theme) {
    return { ...DEFAULT_QR_THEME, ...(theme || {}) };
}
