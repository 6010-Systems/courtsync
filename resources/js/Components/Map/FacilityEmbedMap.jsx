import { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

/**
 * Google Maps iframe embed for a facility, expandable into a modal.
 */
export default function FacilityEmbedMap({ url, name, directionsUrl, height = 'h-44 sm:h-48' }) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!isExpanded) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsExpanded(false);
            }
        };

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isExpanded]);

    if (!url) {
        return null;
    }

    return (
        <>
            <div className={`relative w-full overflow-hidden rounded-xl border border-[#101F1A]/15 ${height}`}>
                <iframe
                    src={url}
                    title={`Map of ${name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="h-full w-full border-0"
                />

                <button
                    type="button"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setIsExpanded(true);
                    }}
                    className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-[#101F1A] px-3 py-1.5 text-[11px] font-bold text-[#D6FF3F] shadow-lg cursor-pointer hover:bg-[#162923]"
                >
                    <Maximize2 size={12} />
                    Expand
                </button>
            </div>

            {isExpanded && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#101F1A]/60 p-3 backdrop-blur-sm sm:p-6"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="flex w-full max-w-3xl flex-col gap-3 rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-base font-black text-[#101F1A]">{name}</p>
                                {directionsUrl && (
                                    <a
                                        href={directionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-0.5 inline-block text-[11px] font-bold text-[#101F1A]/60 underline underline-offset-2 hover:text-[#101F1A]"
                                    >
                                        Get directions
                                    </a>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsExpanded(false)}
                                aria-label="Close map"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3 py-2 text-xs font-bold text-[#D6FF3F] cursor-pointer hover:bg-[#162923]"
                            >
                                <X size={14} />
                                Close
                            </button>
                        </div>

                        <div className="relative h-[55vh] max-h-[560px] min-h-[240px] overflow-hidden rounded-xl border border-[#101F1A]/15">
                            <iframe
                                src={url}
                                title={`Map of ${name}`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                                className="h-full w-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
