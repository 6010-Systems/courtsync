import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Info,
    X,
} from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

const TYPE_CONFIG = {
    success: {
        icon: CheckCircle2,
        iconColor: 'text-[#D6FF3F]',
        iconBg: 'bg-[#D6FF3F]/15',
        dot: 'bg-[#D6FF3F]',
    },
    error: {
        icon: AlertCircle,
        iconColor: 'text-[#FF5A36]',
        iconBg: 'bg-[#FF5A36]/15',
        dot: 'bg-[#FF5A36]',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-400/15',
        dot: 'bg-amber-400',
    },
    info: {
        icon: Info,
        iconColor: 'text-sky-300',
        iconBg: 'bg-sky-400/15',
        dot: 'bg-sky-400',
    },
};

let uid = 0;

/**
 * Compact, low-profile toast notification card.
 */
function ToastItem({ toast, onDismiss }) {
    const config = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;
    const IconComponent = config.icon;

    return (
        <div
            role="alert"
            aria-live="assertive"
            style={{ animation: 'cs-toast-pop 0.2s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border border-[#F5F2EA]/15 bg-[#101F1A]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md transition-all hover:border-[#F5F2EA]/25"
        >
            {/* Icon Pill */}
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}>
                <IconComponent size={14} strokeWidth={2.4} />
            </div>

            {/* Typography Content */}
            <div className="min-w-0 flex-1 text-left">
                {toast.title && (
                    <p className="truncate text-xs font-bold leading-snug text-[#F5F2EA]">
                        {toast.title}
                    </p>
                )}
                {toast.message && (
                    <p className={`text-[11px] leading-snug ${toast.title ? 'text-[#F5F2EA]/60 truncate' : 'font-medium text-[#F5F2EA]'}`}>
                        {toast.message}
                    </p>
                )}
            </div>

            {/* Dismiss Button */}
            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#F5F2EA]/35 transition-colors hover:bg-[#F5F2EA]/10 hover:text-[#F5F2EA] focus:outline-none"
                aria-label="Dismiss notification"
            >
                <X size={12} strokeWidth={2.2} />
            </button>
        </div>
    );
}

/**
 * Global Toast Notification Provider.
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        if (timers.current[id]) {
            clearTimeout(timers.current[id]);
            delete timers.current[id];
        }
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((options) => {
        const id = ++uid;
        const type = options?.type ?? 'info';
        const title = options?.title ?? null;
        const message = typeof options === 'string' ? options : (options?.message ?? '');
        const duration = options?.duration ?? 4000;

        setToasts(prev => [...prev, { id, type, title, message }]);

        if (duration > 0) {
            timers.current[id] = setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    // Convenient calling patterns
    const toast = Object.assign(addToast, {
        addToast,
        dismiss,
        success: (message, opts = {}) => addToast({ type: 'success', message, ...opts }),
        error: (message, opts = {}) => addToast({ type: 'error', message, ...opts }),
        warning: (message, opts = {}) => addToast({ type: 'warning', message, ...opts }),
        info: (message, opts = {}) => addToast({ type: 'info', message, ...opts }),
    });

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {typeof document !== 'undefined' && createPortal(
                <div
                    aria-label="Notifications"
                    className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col gap-2"
                    style={{ width: '350px', maxWidth: 'calc(100vw - 32px)' }}
                >
                    {toasts.map(t => (
                        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                    ))}
                </div>,
                document.body
            )}

            <style>{`
                @keyframes cs-toast-pop {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

/**
 * Hook to trigger toast notifications anywhere in the application.
 */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
}
