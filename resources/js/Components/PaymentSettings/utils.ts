/**
 * Formats Philippine phone numbers into standard grouping:
 * 09XX XXX XXXX (11 digits) or +63 9XX XXX XXXX
 */
export function formatPhPhoneNumber(value: string): string {
    if (!value) return '';

    // Check if input uses international +63 prefix
    if (value.startsWith('+63')) {
        const digits = value.slice(3).replace(/\D/g, '').slice(0, 10);
        if (digits.length <= 3) {
            return `+63 ${digits}`;
        }
        if (digits.length <= 6) {
            return `+63 ${digits.slice(0, 3)} ${digits.slice(3)}`;
        }
        return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }

    // Standard Philippine 09XX number
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 4) {
        return digits;
    }
    if (digits.length <= 7) {
        return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    }
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

/**
 * Validates Philippine phone numbers against 09XX or +639 telco formats.
 */
export function validatePhPhoneNumber(value: string): { isValid: boolean; message?: string } {
    if (!value || value.trim() === '') {
        return { isValid: true };
    }

    const clean = value.replace(/\s+/g, '');
    const phMobileRegex = /^(09\d{9}|\+639\d{9})$/;

    if (!phMobileRegex.test(clean)) {
        return {
            isValid: false,
            message: 'Enter a valid PH mobile number starting with 09 (e.g. 0917 123 4567) or +63 9XX.',
        };
    }

    return { isValid: true };
}

/**
 * Formats bytes to human-readable string.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

