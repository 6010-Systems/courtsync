export const COURT_STATUSES = ['AVAILABLE', 'OPEN_PLAY', 'BLOCKED', 'NOT_AVAILABLE'];

export const COURT_STATUS_LABELS = {
    AVAILABLE: 'Available',
    OPEN_PLAY: 'Open Play',
    BLOCKED: 'Blocked',
    NOT_AVAILABLE: 'Not Available',
};

// Badge classes (high contrast — clearly visible on both light and photo backgrounds)
export const COURT_STATUS_STYLES = {
    AVAILABLE: 'bg-[#D6FF3F] text-[#10221C] font-black border-[#D6FF3F] shadow-md',
    OPEN_PLAY: 'bg-sky-500 text-white font-bold border-sky-400 shadow-md',
    BLOCKED: 'bg-amber-500 text-white font-bold border-amber-400 shadow-md',
    NOT_AVAILABLE: 'bg-rose-500 text-white font-bold border-rose-400 shadow-md',
};

// Badge classes on the dark public facility page
export const COURT_STATUS_STYLES_DARK = {
    AVAILABLE: 'bg-[#D6FF3F]/20 text-[#D6FF3F] border-[#D6FF3F]/30',
    OPEN_PLAY: 'bg-blue-400/20 text-blue-300 border-blue-400/30',
    BLOCKED: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
    NOT_AVAILABLE: 'bg-red-400/20 text-red-300 border-red-400/30',
};

export function courtIsBookable(status) {
    return status === 'AVAILABLE';
}
