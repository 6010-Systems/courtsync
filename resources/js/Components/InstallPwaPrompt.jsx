import { Download, Share2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'courtsync-install-dismissed';

function isStandaloneApp() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIosDevice() {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function InstallPwaPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [visible, setVisible] = useState(false);
    const [mode, setMode] = useState('install');

    useEffect(() => {
        if (typeof window === 'undefined' || isStandaloneApp()) {
            return undefined;
        }

        try {
            if (localStorage.getItem(DISMISS_KEY) === '1') {
                return undefined;
            }
        } catch (error) {
            // Storage may be unavailable in private mode.
        }

        if (isIosDevice()) {
            setMode('ios');
            setVisible(true);

            return undefined;
        }

        const onBeforeInstall = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setMode('install');
            setVisible(true);
        };

        const onInstalled = () => {
            setDeferredPrompt(null);
            setVisible(false);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const dismiss = () => {
        setVisible(false);

        try {
            localStorage.setItem(DISMISS_KEY, '1');
        } catch (error) {
            // Ignore storage failures.
        }
    };

    const install = async () => {
        if (!deferredPrompt) {
            return;
        }

        deferredPrompt.prompt();

        try {
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setVisible(false);
            }
        } finally {
            setDeferredPrompt(null);
        }
    };

    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-4 sm:w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-[#101F1A] p-4 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D6FF3F] text-[#101F1A]">
                            {mode === 'ios' ? <Share2 size={18} /> : <Download size={18} />}
                        </span>
                        <div>
                            <p className="text-sm font-black">Install CourtSync</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-white/70">
                                {mode === 'ios'
                                    ? 'Tap Share, choose "Add to Home Screen", then enable notifications inside the installed app.'
                                    : 'Add the app to your home screen for faster access and background booking alerts.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={dismiss}
                        aria-label="Dismiss install prompt"
                        className="rounded-lg p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {mode === 'install' && (
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={install}
                            className="rounded-lg bg-[#D6FF3F] px-3 py-1.5 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#c4ec39]"
                        >
                            Install app
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
