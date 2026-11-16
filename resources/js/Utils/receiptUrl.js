/**
 * Resolve a stored payment proof path into a browsable URL.
 *
 * Supports rows saved as "payments/file.jpg", "/storage/payments/file.jpg"
 * and absolute URLs (e.g. Cloudinary seeds).
 */
export function receiptUrl(proofPath) {
    if (!proofPath) {
        return null;
    }

    if (/^https?:\/\//i.test(proofPath)) {
        return proofPath;
    }

    const normalized = proofPath
        .replace(/^\/+/, '')
        .replace(/^storage\//, '');

    return `/storage/${normalized}`;
}
