export const COURT_STATUSES = ['AVAILABLE', 'OPEN_PLAY', 'BLOCKED', 'NOT_AVAILABLE'];

export const COURT_STATUS_LABELS = {
    AVAILABLE: 'Available',
    OPEN_PLAY: 'Open Play',
    BLOCKED: 'Blocked',
    NOT_AVAILABLE: 'Not Available',
};

// Badge classes (light backgrounds — used on white/light cards)
export const COURT_STATUS_STYLES = {
    AVAILABLE: 'bg-[#D6FF3F]/30 text-[#10221C] border-[#D6FF3F]',
    OPEN_PLAY: 'bg-blue-100 text-blue-700 border-blue-200',
    BLOCKED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    NOT_AVAILABLE: 'bg-red-100 text-red-700 border-red-200',
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
