import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    Info,
    Trash2,
    X,
} from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ConfirmContext = createContext(null);

const TYPE_CONFIG = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-[#FF5A36]/10 text-[#FF5A36] border-[#FF5A36]/20',
        confirmBtn: 'bg-[#FF5A36] text-white hover:bg-[#FF5A36]/90 shadow-sm shadow-[#FF5A36]/20',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        confirmBtn: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/20',
    },
    info: {
        icon: HelpCircle,
        iconBg: 'bg-[#101F1A]/10 text-[#101F1A] border-[#101F1A]/15',
        confirmBtn: 'bg-[#101F1A] text-[#D6FF3F] hover:bg-[#101F1A]/90 shadow-sm',
    },
};

/**
 * Global Confirm Dialog Provider for CourtSync.
 */
export function ConfirmProvider({ children }) {
    const [dialogState, setDialogState] = useState(null);
    const resolverRef = useRef(null);
    const confirmBtnRef = useRef(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialogState({
                title: options?.title ?? 'Are you sure?',
                message: options?.message ?? 'Please confirm if you want to proceed with this action.',
                confirmText: options?.confirmText ?? 'Confirm',
                cancelText: options?.cancelText ?? 'Cancel',
                type: options?.type ?? 'info',
            });
        });
    }, []);

    const handleConfirm = () => {
        setDialogState(null);
        if (resolverRef.current) {
            resolverRef.current(true);
            resolverRef.current = null;
        }
    };

    const handleCancel = () => {
        setDialogState(null);
        if (resolverRef.current) {
            resolverRef.current(false);
            resolverRef.current = null;
        }
    };

    // Keyboard handlers (Escape = cancel, Enter = confirm)
    useEffect(() => {
        if (!dialogState) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [dialogState]);

    // Auto-focus confirm button on open
    useEffect(() => {
        if (dialogState) {
            confirmBtnRef.current?.focus();
        }
    }, [dialogState]);

    const config = dialogState ? (TYPE_CONFIG[dialogState.type] || TYPE_CONFIG.info) : TYPE_CONFIG.info;
    const IconComponent = config.icon;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {dialogState && typeof document !== 'undefined' && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cs-confirm-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        onClick={handleCancel}
                        className="fixed inset-0 bg-[#101F1A]/60 backdrop-blur-xs transition-opacity duration-200"
                        style={{ animation: 'cs-backdrop-in 0.2s ease-out' }}
                    />

                    {/* Dialog Card */}
                    <div
                        style={{ animation: 'cs-dialog-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#101F1A]/10 bg-white p-6 shadow-2xl ring-1 ring-black/5"
                    >
                        {/* Close cross button */}
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="absolute right-4 top-4 rounded-lg p-1 text-[#101F1A]/40 transition-colors hover:bg-[#101F1A]/[0.06] hover:text-[#101F1A] focus:outline-none"
                            aria-label="Close dialog"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex gap-4">
                            {/* Icon badge */}
                            <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-xs', config.iconBg].join(' ')}>
                                <IconComponent size={20} strokeWidth={2.2} />
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1 pt-0.5">
                                <h3 id="cs-confirm-title" className="text-base font-bold text-[#101F1A]">
                                    {dialogState.title}
                                </h3>
                                <p className="mt-1.5 text-xs leading-relaxed text-[#101F1A]/70">
                                    {dialogState.message}
                                </p>
                            </div>
                        </div>

                        {/* Actions row */}
                        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#101F1A]/10 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#101F1A]/15 bg-white px-4 text-xs font-bold text-[#101F1A] transition-all hover:bg-[#F5F2EA] active:scale-95 focus:outline-none"
                            >
                                {dialogState.cancelText}
                            </button>
                            <button
                                ref={confirmBtnRef}
                                type="button"
                                onClick={handleConfirm}
                                className={[
                                    'inline-flex h-9 items-center justify-center rounded-xl px-5 text-xs font-bold transition-all active:scale-95 focus:outline-none',
                                    config.confirmBtn,
                                ].join(' ')}
                            >
                                {dialogState.confirmText}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes cs-backdrop-in {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes cs-dialog-in {
                    from { opacity: 0; transform: scale(0.95) translateY(4px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </ConfirmContext.Provider>
    );
}

/**
 * Hook to invoke global confirmation dialogs anywhere.
 *
 * @example
 * const { confirm } = useConfirm();
 * const ok = await confirm({
 *   title: 'Save Profile Changes?',
 *   message: 'Are you sure you want to update your public details?',
 *   type: 'info'
 * });
 * if (!ok) return;
 */
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
