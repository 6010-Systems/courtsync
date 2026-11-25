import { X } from 'lucide-react';
import Modal from '@/Components/Modal';
import QrDesignerPanel from './QrDesignerPanel';

/**
 * Restyle a facility booking QR without leaving the facilities page.
 */
export default function QrDesignerModal({ show, facility, onClose, onSaved }) {
    if (!facility) {
        return <Modal show={show} onClose={onClose} maxWidth="2xl" />;
    }

    const bookingUrl = facility.slug ? route('facility.show', facility.slug) : '';

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="max-h-[85vh] overflow-y-auto p-5 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#101F1A]/10 pb-4">
                    <div>
                        <h3 className="font-display text-lg font-black tracking-tight text-[#101F1A]">QR Design</h3>
                        <p className="mt-0.5 text-xs text-[#101F1A]/60">
                            Customize how the booking QR for {facility.name} looks.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close QR design"
                        className="rounded-lg p-1.5 text-[#101F1A]/50 transition-colors hover:bg-[#F5F2EA] hover:text-[#101F1A] cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                <QrDesignerPanel facility={facility} bookingUrl={bookingUrl} onSaved={onSaved} />
            </div>
        </Modal>
    );
}
