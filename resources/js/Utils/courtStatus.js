export const COURT_STATUSES = ['AVAILABLE', 'OPEN_PLAY', 'BLOCKED', 'NOT_AVAILABLE'];

export const COURT_STATUS_LABELS = {
    AVAILABLE: 'Available',
    OPEN_PLAY: 'Open Play',
    BLOCKED: 'Blocked',
    NOT_AVAILABLE: 'Not Available',
};

// Badge classes (high contrast — clearly visible on both light and photo backgrounds)
export const COURT_STATUS_STYLES = {
    AVAILABLE: 'bg-emerald-50 text-emerald-800 font-extrabold border-emerald-300 shadow-2xs',
    OPEN_PLAY: 'bg-blue-50 text-blue-800 font-extrabold border-blue-300 shadow-2xs',
    BLOCKED: 'bg-amber-50 text-amber-800 font-extrabold border-amber-300 shadow-2xs',
    NOT_AVAILABLE: 'bg-rose-50 text-rose-800 font-extrabold border-rose-300 shadow-2xs',
};

// Badge classes on the dark public facility page
export const COURT_STATUS_STYLES_DARK = {
    AVAILABLE: 'bg-[#D6FF3F]/20 text-[#D6FF3F] border-[#D6FF3F]/30',
    OPEN_PLAY: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    BLOCKED: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    NOT_AVAILABLE: 'bg-red-400/20 text-red-300 border-red-400/30',
};

export const STATUS_CONFIG = {
    AVAILABLE: {
        label: 'Available',
        text: 'text-emerald-800',
        border: 'border-emerald-300',
        dot: 'bg-emerald-500 animate-pulse',
        color: '#065f46',
    },
    OPEN_PLAY: {
        label: 'Open Play',
        text: 'text-blue-800',
        border: 'border-blue-300',
        dot: 'bg-blue-500',
        color: '#1e40af',
    },
    BLOCKED: {
        label: 'Blocked',
        text: 'text-amber-800',
        border: 'border-amber-300',
        dot: 'bg-amber-500',
        color: '#92400e',
    },
    NOT_AVAILABLE: {
        label: 'Offline',
        text: 'text-rose-800',
        border: 'border-rose-300',
        dot: 'bg-rose-500',
        color: '#9f1239',
    },
};

export function courtIsBookable(status) {
    return status === 'AVAILABLE';
}
