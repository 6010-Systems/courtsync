import React, { Fragment, isValidElement } from 'react';
import {
    Dialog as HeadlessDialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';

export default function Dialog({
    isOpen = false,
    onClose = () => {},
    title,
    subtitle,
    icon: Icon,
    iconVariant = 'forest',
    size = '2xl',
    minHeight,
    closeOnClickOutside = false,
    header,
    footer,
    confirmText,
    cancelText = 'Cancel',
    onConfirm,
    confirmVariant = 'volt',
    isLoading = false,
    className = '',
    children,
}) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl sm:min-h-[500px]',
        '3xl': 'max-w-3xl sm:min-h-[560px]',
        '4xl': 'max-w-4xl sm:min-h-[640px]',
        '5xl': 'max-w-5xl sm:min-h-[680px]',
        full: 'max-w-[95vw] sm:min-h-[700px]',
    }[size] || 'max-w-2xl';

    const getIconStyles = () => {
        switch (iconVariant) {
            case 'volt':
                return 'bg-[#D6FF3F] text-[#101F1A] border border-[#101F1A]/10 shadow-xs';
            case 'forest':
                return 'bg-[#101F1A] text-[#D6FF3F] shadow-xs';
            case 'coral':
                return 'bg-[#FF5A36] text-white shadow-xs';
            case 'emerald':
                return 'bg-[#10B981] text-white shadow-xs';
            case 'amber':
                return 'bg-amber-400 text-[#101F1A] shadow-xs';
            case 'default':
            default:
                return 'bg-[#101F1A]/10 text-[#101F1A] border border-[#101F1A]/10';
        }
    };

    const getConfirmBtnStyles = () => {
        switch (confirmVariant) {
            case 'forest':
                return 'bg-[#101F1A] text-[#D6FF3F] hover:bg-[#162923] shadow-subtle';
            case 'coral':
                return 'bg-[#FF5A36] text-white hover:bg-[#e04826] shadow-subtle';
            case 'emerald':
                return 'bg-[#10B981] text-white hover:bg-[#0ea372] shadow-subtle';
            case 'volt':
            default:
                return 'bg-[#D6FF3F] text-[#101F1A] hover:bg-[#c2ea2e] hover:shadow-volt-glow shadow-subtle';
        }
    };

    const renderIcon = () => {
        if (!Icon) return null;
        if (isValidElement(Icon)) return Icon;
        const IconComponent = Icon;
        return <IconComponent size={18} strokeWidth={2.4} />;
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <HeadlessDialog
                as="div"
                open={isOpen}
                className="relative z-50"
                onClose={closeOnClickOutside ? onClose : () => {}}
            >
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 transition-opacity" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-3 sm:p-5 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-150"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-100"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel
                                className={[
                                    'w-full transform rounded-2xl border border-[#101F1A]/15 bg-white text-left text-[#101F1A] shadow-elevated transition-all flex flex-col justify-between overflow-hidden',
                                    sizeClasses,
                                    minHeight ? `min-h-[${minHeight}]` : '',
                                    className,
                                ].join(' ')}
                            >
                                {header !== undefined ? (
                                    <div className="shrink-0 rounded-t-2xl overflow-hidden">
                                        {header}
                                    </div>
                                ) : (title || subtitle || Icon) ? (
                                    <div className="shrink-0 flex items-center justify-between border-b border-[#101F1A]/10 px-6 py-4 bg-[#FAF8F5] rounded-t-2xl">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {Icon && (
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconStyles()}`}>
                                                    {renderIcon()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                {title && (
                                                    <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#101F1A] truncate">
                                                        {title}
                                                    </h2>
                                                )}
                                                {subtitle && (
                                                    <p className="text-xs text-[#101F1A]/55 truncate leading-tight mt-0.5">
                                                        {subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-lg p-1.5 text-[#101F1A]/50 hover:bg-[#101F1A]/10 hover:text-[#101F1A] transition-colors cursor-pointer shrink-0"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : null}

                                <div className="flex-1 flex flex-col min-h-0 bg-white">
                                    {children}
                                </div>

                                {footer !== undefined ? (
                                    <div className="shrink-0 rounded-b-2xl overflow-hidden">
                                        {footer}
                                    </div>
                                ) : (confirmText || onConfirm) ? (
                                    <div className="shrink-0 border-t border-[#101F1A]/10 px-6 py-3.5 bg-[#FAF8F5] flex items-center justify-end gap-2.5 rounded-b-2xl">
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={onClose}
                                            className="h-9 rounded-lg px-4 text-xs font-bold text-[#101F1A]/70 hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50 flex items-center"
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={onConfirm}
                                            className={[
                                                'h-9 flex items-center gap-1.5 rounded-lg px-5 text-xs font-extrabold uppercase tracking-wider transition-all press-scale cursor-pointer disabled:opacity-60',
                                                getConfirmBtnStyles(),
                                            ].join(' ')}
                                        >
                                            {isLoading && <Loader2 size={14} className="animate-spin" />}
                                            <span>{confirmText || 'Confirm'}</span>
                                        </button>
                                    </div>
                                ) : null}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </HeadlessDialog>
        </Transition>
    );
}
