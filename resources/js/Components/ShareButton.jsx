import { useState } from 'react';
import Modal from '@/Components/Modal';

export default function ShareButton({ title, text, url }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async (e) => {
        e.preventDefault();
        
        const shareData = {
            title: title,
            text: text,
            url: url
        };

        //  If Native Mobile Share
        if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('User cancelled share or error:', err);
            }
        } else {
            //  Fallback to our Desktop Modal
            setIsOpen(true);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition hover:-translate-y-0.5 shadow-lg"
                title="Share Facility"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Share</span>
            </button>

            {/* Desktop Share Modal */}
            <Modal show={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm">
                <div className="p-8 bg-white relative overflow-hidden">
                    {/* Decorative background blob */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D6FF3F]/20 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-[#10221C] tracking-tight">Share {title}</h2>
                              
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 text-gray-400 hover:text-[#10221C] hover:bg-gray-100 rounded-full transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        {/* Copy Link Input Area */}
                        <div className="mb-8">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Direct Link</label>
                            <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-[#D6FF3F] focus-within:ring-2 focus-within:ring-[#D6FF3F]/20 transition-all">
                                <div className="pl-3 pr-2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                </div>
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={url} 
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 font-medium truncate p-0" 
                                />
                                <button 
                                    onClick={copyToClipboard}
                                    className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${copied ? 'bg-green-500 text-white shadow-md' : 'bg-[#10221C] text-white hover:bg-[#10221C]/90 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Social Media Area */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Share via</label>
                            <div className="flex gap-4 sm:gap-6">
                                {/* Facebook */}
                                <a 
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-2 flex-1"
                                >
                                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#1877F2] transition-colors">Facebook</span>
                                </a>

                                {/* WhatsApp */}
                                <a 
                                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-2 flex-1"
                                >
                                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#25D366] transition-colors">WhatsApp</span>
                                </a>

                                {/* X/Twitter */}
                                <a 
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-2 flex-1"
                                >
                                    <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-800 group-hover:bg-gray-800 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 3.869H5.078z"/></svg>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-800 transition-colors">X</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </>
    );
}
