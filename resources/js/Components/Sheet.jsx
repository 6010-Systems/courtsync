import React, { Fragment, isValidElement } from 'react';
import {
    Dialog as HeadlessDialog,
    DialogPanel,
    Transition,
    TransitionChild,
} from '@headlessui/react';
import { X, Loader2 } from 'lucide-react';

const SIZE_CLASSES = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl',
    full: 'sm:max-w-full',
};

const SLIDE_TRANSITIONS = {
    right: {
        container: 'inset-y-0 right-0 flex pl-8 sm:pl-10 max-w-full justify-end',
        enterFrom: 'translate-x-full',
        enterTo: 'translate-x-0',
        leaveFrom: 'translate-x-0',
        leaveTo: 'translate-x-full',
    },
    left: {
        container: 'inset-y-0 left-0 flex pr-8 sm:pr-10 max-w-full justify-start',
        enterFrom: '-translate-x-full',
        enterTo: 'translate-x-0',
        leaveFrom: 'translate-x-0',
        leaveTo: '-translate-x-full',
    },
    bottom: {
        container: 'inset-x-0 bottom-0 flex pt-10 max-h-full justify-end flex-col',
        enterFrom: 'translate-y-full',
        enterTo: 'translate-y-0',
        leaveFrom: 'translate-y-0',
        leaveTo: 'translate-y-full',
    },
};

export default function Sheet({
    isOpen = false,
    onClose = () => {},
    side = 'right', // 'right' | 'left' | 'bottom'
    size = 'xl',    // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
    title,
    subtitle,
    icon: Icon,
    iconVariant = 'forest',
    closeOnClickOutside = true,
    header,
    footer,
    confirmText,
    cancelText = 'Close',
    onConfirm,
    confirmVariant = 'volt',
    isLoading = false,
    className = '',
    bodyClassName = '',
    children,
}) {
    const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.xl;
    const slideTransitions = SLIDE_TRANSITIONS[side] || SLIDE_TRANSITIONS.right;

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
                {/* Backdrop Blur */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[#101F1A]/50 backdrop-blur-xs transition-opacity" />
                </TransitionChild>

                {/* Drawer Container */}
                <div className="fixed inset-0 z-10 overflow-hidden">
                    <div className={`fixed ${slideTransitions.container} pointer-events-none`}>
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-[cubic-bezier(0.16,1,0.3,1)] duration-350"
                            enterFrom={slideTransitions.enterFrom}
                            enterTo={slideTransitions.enterTo}
                            leave="transform transition ease-[cubic-bezier(0.16,1,0.3,1)] duration-250"
                            leaveFrom={slideTransitions.leaveFrom}
                            leaveTo={slideTransitions.leaveTo}
                        >
                            <DialogPanel
                                className={[
                                    'pointer-events-auto w-screen flex flex-col bg-white text-left text-[#101F1A]',
                                    'shadow-elevated border-l border-[#101F1A]/10 h-full max-h-screen',
                                    sizeClasses,
                                    className,
                                ].join(' ')}
                            >
                                {/* Sticky Top Bar */}
                                {header !== undefined ? (
                                    <div className="shrink-0 z-20">{header}</div>
                                ) : (title || subtitle || Icon) ? (
                                    <div className="shrink-0 z-20 flex items-center justify-between border-b border-[#101F1A]/10 px-5 sm:px-6 py-4 bg-[#FAF8F5]">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {Icon && (
                                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getIconStyles()}`}>
                                                    {renderIcon()}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                {title && (
                                                    <h2 className="text-base sm:text-lg font-display font-bold tracking-tight text-[#101F1A] truncate">
                                                        {title}
                                                    </h2>
                                                )}
                                                {subtitle && (
                                                    <p className="text-xs text-[#101F1A]/55 truncate leading-tight mt-0.5 font-sans">
                                                        {subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="rounded-lg p-1.5 text-[#101F1A]/50 hover:bg-[#101F1A]/10 hover:text-[#101F1A] transition-colors cursor-pointer shrink-0"
                                            aria-label="Close sheet"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : null}

                                {/* Scrollable Viewport */}
                                <div className={`flex-1 overflow-y-auto min-h-0 bg-white ${bodyClassName}`}>
                                    {children}
                                </div>

                                {/* Sticky Bottom Actions */}
                                {footer !== undefined ? (
                                    <div className="shrink-0 z-20 border-t border-[#101F1A]/10 bg-[#FAF8F5]">{footer}</div>
                                ) : (confirmText || onConfirm) ? (
                                    <div className="shrink-0 z-20 border-t border-[#101F1A]/10 px-5 sm:px-6 py-3.5 bg-[#FAF8F5] flex items-center justify-end gap-2.5">
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={onClose}
                                            className="h-9 rounded-lg px-4 text-xs font-bold text-[#101F1A]/70 hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50 flex items-center font-display"
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={onConfirm}
                                            className={[
                                                'h-9 flex items-center gap-1.5 rounded-lg px-5 text-xs font-extrabold uppercase tracking-wider transition-all press-scale cursor-pointer disabled:opacity-60 font-display',
                                                getConfirmBtnStyles(),
                                            ].join(' ')}
                                        >
                                            {isLoading && <Loader2 size={14} className="animate-spin" />}
                                            <span>{confirmText || 'Save'}</span>
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
