import { createContext, useCallback, useContext, useRef, useState } from 'react';

// ── Types: 'success' | 'error' | 'warning' | 'info' ─────────────────────────

const ToastContext = createContext(null);

const ICONS = {
    success: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    error: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
    warning: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    info: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
};

const STYLES = {
    success: {
        bar:  'bg-[#D6FF3F]',
        icon: 'text-[#101F1A] bg-[#D6FF3F]/20',
        text: 'text-[#101F1A]',
        sub:  'text-[#10221C]/60',
    },
    error: {
        bar:  'bg-[#FF5A36]',
        icon: 'text-[#FF5A36] bg-[#FF5A36]/10',
        text: 'text-[#10221C]',
        sub:  'text-[#10221C]/60',
    },
    warning: {
        bar:  'bg-amber-400',
        icon: 'text-amber-600 bg-amber-400/10',
        text: 'text-[#10221C]',
        sub:  'text-[#10221C]/60',
    },
    info: {
        bar:  'bg-sky-400',
        icon: 'text-sky-600 bg-sky-400/10',
        text: 'text-[#10221C]',
        sub:  'text-[#10221C]/60',
    },
};

let uid = 0;

// ── Toast item ───────────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }) {
    const s = STYLES[toast.type] ?? STYLES.info;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="pointer-events-auto flex w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-[0_4px_24px_rgba(16,31,26,0.12)] ring-1 ring-[#10221C]/[0.06] animate-toast-in"
        >
            {/* Left accent bar */}
            <div className={`w-1 shrink-0 ${s.bar}`} />

            {/* Icon */}
            <div className="flex items-start px-3 pt-3.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${s.icon}`}>
                    {ICONS[toast.type]}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 px-1 py-3 pr-3">
                {toast.title && (
                    <p className={`text-sm font-semibold leading-tight ${s.text}`}>
                        {toast.title}
                    </p>
                )}
                {toast.message && (
                    <p className={`mt-0.5 text-sm leading-relaxed ${toast.title ? s.sub : s.text}`}>
                        {toast.message}
                    </p>
                )}
            </div>

            {/* Dismiss */}
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center self-start mt-1.5 mr-1.5 rounded-lg text-[#10221C]/30 transition-colors hover:bg-[#10221C]/[0.05] hover:text-[#10221C]/70"
                aria-label="Dismiss notification"
            >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current[id]);
        delete timers.current[id];
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
        const id = ++uid;
        setToasts(prev => [...prev, { id, type, title, message }]);

        if (duration > 0) {
            timers.current[id] = setTimeout(() => dismiss(id), duration);
        }
        return id;
    }, [dismiss]);

    // Convenience aliases
    toast.success = (msg, opts = {}) => toast({ type: 'success', message: msg, ...opts });
    toast.error   = (msg, opts = {}) => toast({ type: 'error',   message: msg, ...opts });
    toast.warning = (msg, opts = {}) => toast({ type: 'warning', message: msg, ...opts });
    toast.info    = (msg, opts = {}) => toast({ type: 'info',    message: msg, ...opts });

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast portal — fixed bottom-right */}
            <div
                aria-label="Notifications"
                className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col gap-3"
                style={{ width: '360px' }}
            >
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
                ))}
            </div>

            {/* Keyframe animation injected inline so no external CSS dep */}
            <style>{`
                @keyframes toast-in {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)     scale(1);    }
                }
                .animate-toast-in {
                    animation: toast-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
                }
            `}</style>
        </ToastContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a <ToastProvider>');
    return ctx;
}
