import {
    AlertTriangle,
    Check,
    HelpCircle,
    Trash2,
} from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext(null);

const TYPE_CONFIG = {
    success: {
        icon: Check,
        headerBg: 'bg-[#101F1A]',
        iconBg: 'bg-white/10',
        iconColor: 'text-[#D6FF3F]',
        confirmBtn: 'bg-[#D6FF3F] text-[#10221C] hover:bg-[#c2f026]',
    },
    danger: {
        icon: AlertTriangle,
        headerBg: 'bg-[#FF5A36]',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        confirmBtn: 'bg-[#FF5A36] text-white hover:bg-[#E04522]',
    },
    warning: {
        icon: AlertTriangle,
        headerBg: 'bg-[#F59E0B]',
        iconBg: 'bg-white/20',
        iconColor: 'text-white',
        confirmBtn: 'bg-[#F59E0B] text-white hover:bg-[#D97706]',
    },
    info: {
        icon: HelpCircle,
        headerBg: 'bg-[#101F1A]',
        iconBg: 'bg-white/10',
        iconColor: 'text-[#D6FF3F]',
        confirmBtn: 'bg-[#10221C] text-[#D6FF3F] hover:bg-[#1C2E24]',
    },
};

/**
 * Global Confirm & Alert Dialog Provider for CourtSync.
 * Uses the new centered Dialog layout style (split header/body).
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
            // small timeout to ensure DOM is ready during animation
            setTimeout(() => confirmBtnRef.current?.focus(), 100);
        }
    }, [dialogState]);

    const config = dialogState ? (TYPE_CONFIG[dialogState.type] || TYPE_CONFIG.info) : TYPE_CONFIG.info;
    const IconComponent = config.icon;
    const isSingleButton = !dialogState?.cancelText;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {dialogState && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cs-confirm-title"
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        >
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleCancel}
                                className="fixed inset-0 bg-[#10221C]/40 backdrop-blur-sm transition-opacity"
                            />

                            {/* Dialog Card Container matching BookingDetailDrawer */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="relative z-10 flex w-full max-w-sm flex-col bg-white overflow-hidden rounded-3xl shadow-2xl pointer-events-auto"
                            >
                                {/* Top Section (Header) */}
                                <div className={`${config.headerBg} px-5 py-6 flex flex-col items-center text-center relative`}>
                                    <div className={`w-14 h-14 ${config.iconBg} rounded-full flex items-center justify-center mb-3 ${config.iconColor} shadow-inner`}>
                                        <IconComponent size={28} strokeWidth={2.5} />
                                    </div>
                                    
                                    <h3 id="cs-confirm-title" className="text-xl font-bold text-white mb-0 tracking-tight leading-tight">
                                        {dialogState.title}
                                    </h3>
                                </div>

                                {/* Bottom Section (Details & CTAs) */}
                                <div className="px-5 py-6 bg-white flex flex-col items-center text-center">
                                    <p className="text-[#10221C]/70 text-sm leading-relaxed mb-6">
                                        {dialogState.message}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="w-full pt-4 mt-2 border-t border-[#10221C]/10 flex flex-row items-center gap-2">
                                        {!isSingleButton && (
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="flex-1 py-2.5 text-center text-xs font-bold text-gray-400 hover:text-red-600 bg-transparent hover:bg-gray-50 rounded-xl transition-colors focus:outline-none"
                                            >
                                                {dialogState.cancelText}
                                            </button>
                                        )}
                                        <button
                                            ref={confirmBtnRef}
                                            type="button"
                                            onClick={handleConfirm}
                                            className={`flex-[2] py-2.5 flex justify-center text-xs tracking-wide rounded-xl font-bold transition-transform active:scale-[0.98] focus:outline-none ${config.confirmBtn}`}
                                        >
                                            {dialogState.confirmText}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
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
