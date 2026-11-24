import React from 'react';
import { 
    CheckCircle2, 
    Clock, 
    XCircle, 
    CheckCheck, 
    UserX, 
    AlertCircle 
} from 'lucide-react';

const STATUS_CONFIGS = {
    CONFIRMED: {
        label: 'Confirmed',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
    },
    COMPLETED: {
        label: 'Completed',
        badge: 'bg-teal-50 text-teal-800 border-teal-200/80',
        dot: 'bg-teal-500',
        icon: CheckCheck,
    },
    AWAITING_PAYMENT: {
        label: 'Awaiting Payment',
        badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    PENDING: {
        label: 'Pending',
        badge: 'bg-amber-50 text-amber-900 border-amber-200/80',
        dot: 'bg-amber-500',
        icon: Clock,
    },
    CANCELLED: {
        label: 'Cancelled',
        badge: 'bg-rose-50 text-rose-900 border-rose-200/80',
        dot: 'bg-rose-500',
        icon: XCircle,
    },
    NO_SHOW: {
        label: 'No Show',
        badge: 'bg-purple-50 text-purple-900 border-purple-200/80',
        dot: 'bg-purple-500',
        icon: UserX,
    },
};

export default function StatusPill({ status = 'CONFIRMED', className = '' }) {
    const key = (status || '').toUpperCase().trim();
    const config = STATUS_CONFIGS[key] || {
        label: status || 'Unknown',
        badge: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-400',
        icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
        <span 
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide shrink-0 ${config.badge} ${className}`}
            role="status"
        >
            <Icon size={12} className="shrink-0" aria-hidden="true" />
            <span>{config.label}</span>
        </span>
    );
}
