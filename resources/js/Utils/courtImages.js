export const DEFAULT_COURT_IMAGES = {
    pickleball: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?auto=format&fit=crop&w=800&q=80',
    badminton: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    futsal: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    volleyball: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80',
};

export function getCourtImage(court, facility) {
    if (court?.image_url) return court.image_url;
    if (facility?.cover_photo_url) return facility.cover_photo_url;

    const sportType = (court?.type || '').toLowerCase();
    for (const [key, url] of Object.entries(DEFAULT_COURT_IMAGES)) {
        if (sportType.includes(key)) return url;
    }

    return DEFAULT_COURT_IMAGES.pickleball;
}
