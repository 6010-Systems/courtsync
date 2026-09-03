import {
    AlertTriangle,
    Check,
    HelpCircle,
    Trash2,
} from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ConfirmContext = createContext(null);

const TYPE_CONFIG = {
    success: {
        icon: Check,
        haloBg: 'bg-[#EEF4FF]',
        innerBg: 'bg-[#3B82F6] text-white shadow-[#3B82F6]/30',
        confirmBtn: 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-md shadow-[#3B82F6]/25',
        singleBtn: 'bg-[#F3F6FD] text-[#3B82F6] hover:bg-[#E8F0FD]',
    },
    danger: {
        icon: Trash2,
        haloBg: 'bg-[#FFF0ED]',
        innerBg: 'bg-[#FF5A36] text-white shadow-[#FF5A36]/30',
        confirmBtn: 'bg-[#FF5A36] text-white hover:bg-[#E04522] shadow-md shadow-[#FF5A36]/25',
        singleBtn: 'bg-[#FFF0ED] text-[#FF5A36] hover:bg-[#FFE2DC]',
    },
    warning: {
        icon: AlertTriangle,
        haloBg: 'bg-[#FFFBEB]',
        innerBg: 'bg-[#F59E0B] text-white shadow-[#F59E0B]/30',
        confirmBtn: 'bg-[#F59E0B] text-white hover:bg-[#D97706] shadow-md shadow-[#F59E0B]/25',
        singleBtn: 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]',
    },
    info: {
        icon: HelpCircle,
        haloBg: 'bg-[#F5F2EA]',
        innerBg: 'bg-[#101F1A] text-[#D6FF3F] shadow-[#101F1A]/20',
        confirmBtn: 'bg-[#101F1A] text-[#D6FF3F] hover:bg-[#1C2E24] shadow-md shadow-[#101F1A]/20',
        singleBtn: 'bg-[#F5F2EA] text-[#101F1A] hover:bg-[#EAE5D9]',
    },
};

/**
 * Global Confirm & Alert Dialog Provider for CourtSync.
 * Matches Sidebar's rounded-xl border radius with clean soft-halo badge theme.
 */
export function ConfirmProvider({ children }) {
    const [dialogState, setDialogState] = useState(null);
    const resolverRef = useRef(null);
    const confirmBtnRef = useRef(null);

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve;
            setDialogState({
                title: options?.title ?? 'Confirm Action',
                message: options?.message ?? 'Please confirm if you would like to proceed.',
                confirmText: options?.confirmText ?? 'Confirm',
                cancelText: options?.cancelText !== undefined ? options.cancelText : 'Cancel',
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

    // Keyboard navigation (Escape = cancel, Enter = confirm)
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

    // Auto-focus primary confirm button on mount
    useEffect(() => {
        if (dialogState) {
            confirmBtnRef.current?.focus();
        }
    }, [dialogState]);

    const config = dialogState ? (TYPE_CONFIG[dialogState.type] || TYPE_CONFIG.info) : TYPE_CONFIG.info;
    const IconComponent = config.icon;
    const isSingleButton = !dialogState?.cancelText;

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
                        className="fixed inset-0 bg-[#101F1A]/40 backdrop-blur-xs transition-opacity duration-200"
                        style={{ animation: 'cs-backdrop-in 0.2s ease-out' }}
                    />

                    {/* Dialog Card Container matching sidebar's rounded-xl */}
                    <div
                        style={{ animation: 'cs-dialog-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
                        className="relative z-10 flex w-full max-w-[360px] flex-col items-center rounded-xl border border-black/[0.06] bg-white px-6 pt-6 pb-5 text-center shadow-[0_24px_50px_-12px_rgba(16,31,26,0.18)] ring-1 ring-black/[0.03]"
                    >
                        {/* Outer Soft Halo with Solid Inner Circle Icon */}
                        <div
                            style={{ animation: 'cs-icon-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                            className={['flex h-18 w-18 items-center justify-center rounded-full', config.haloBg].join(' ')}
                        >
                            <div className={['flex h-11 w-11 items-center justify-center rounded-full shadow-md', config.innerBg].join(' ')}>
                                <IconComponent size={20} strokeWidth={2.8} />
                            </div>
                        </div>

                        {/* Heading Title */}
                        <h3 id="cs-confirm-title" className="mt-4 text-[17px] font-bold tracking-tight text-[#101F1A]">
                            {dialogState.title}
                        </h3>

                        {/* Subtext Description */}
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[#101F1A]/60 max-w-[280px]">
                            {dialogState.message}
                        </p>

                        {/* Action Buttons */}
                        {isSingleButton ? (
                            <button
                                ref={confirmBtnRef}
                                type="button"
                                onClick={handleConfirm}
                                className={[
                                    'mt-5 h-10 w-full rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-[0.98] focus:outline-none',
                                    config.singleBtn,
                                ].join(' ')}
                            >
                                {dialogState.confirmText || 'Close'}
                            </button>
                        ) : (
                            <div className="mt-5 flex w-full items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 h-10 rounded-xl bg-[#F5F2EA] text-[#101F1A]/70 hover:bg-[#EAE5D9] hover:text-[#101F1A] font-semibold text-xs transition-all active:scale-95 focus:outline-none"
                                >
                                    {dialogState.cancelText}
                                </button>
                                <button
                                    ref={confirmBtnRef}
                                    type="button"
                                    onClick={handleConfirm}
                                    className={[
                                        'flex-1 h-10 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 focus:outline-none',
                                        config.confirmBtn,
                                    ].join(' ')}
                                >
                                    {dialogState.confirmText}
                                </button>
                            </div>
                        )}
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
                    from { opacity: 0; transform: scale(0.92) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes cs-icon-pop {
                    0%   { opacity: 0; transform: scale(0.6); }
                    70%  { transform: scale(1.08); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </ConfirmContext.Provider>
    );
}

/**
 * Hook to invoke confirmation dialogs anywhere.
 *
 * @example
 * const { confirm } = useConfirm();
 * const ok = await confirm({
 *   title: 'Request Sent Successfully',
 *   message: 'Your admin has been notified. They will review and grant access if approved.',
 *   confirmText: 'Close',
 *   cancelText: null, // single-button alert mode
 *   type: 'success'
 * });
 */
export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
