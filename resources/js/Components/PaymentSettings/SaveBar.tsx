import React from 'react';
import { Loader2, Save } from 'lucide-react';
import { SaveBarProps } from './types';

export const SaveBar: React.FC<SaveBarProps> = ({
    isDirty,
    isProcessing,
    onSave,
    onDiscard,
}) => {
    if (!isDirty) {
        return null;
    }

    return (
        <div
            role="region"
            aria-label="Unsaved changes"
            className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:bottom-4 sm:right-8 z-30 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 rounded-2xl border border-[#10221C]/15 bg-white/95 px-3.5 py-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
            {/* Simple Unsaved Indicator */}
            <div className="flex items-center gap-2 pl-0.5">
                <span className="h-2 w-2 rounded-full bg-[#10221C] shrink-0" />
                <span className="text-xs font-bold text-[#10221C] whitespace-nowrap">
                    Unsaved changes
                </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 border-l border-[#10221C]/10 pl-2">
                <button
                    type="button"
                    onClick={onDiscard}
                    disabled={isProcessing}
                    className="min-h-[36px] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#10221C]/60 hover:text-[#10221C] hover:bg-[#10221C]/[0.04] transition-colors disabled:opacity-50"
                >
                    Discard
                </button>

                <button
                    type="button"
                    onClick={onSave}
                    disabled={isProcessing}
                    className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#10221C] px-3.5 py-1.5 text-xs font-bold text-[#D6FF3F] shadow-sm hover:bg-[#1a362d] transition-colors disabled:opacity-50"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 size={13} className="animate-spin text-[#D6FF3F]" />
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <Save size={13} strokeWidth={2.4} />
                            <span>Save</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
