import { BellRing, Share2, ShieldAlert, X } from 'lucide-react';
import usePushNotifications from '@/hooks/usePushNotifications';

const COPY = {
    default: {
        icon: BellRing,
        title: 'Turn on booking alerts',
        body: 'Get notified about new bookings, confirmations and reschedules even when the app is closed.',
        action: 'Enable notifications',
    },
    error: {
        icon: BellRing,
        title: 'Could not enable alerts',
        body: 'Something went wrong while subscribing this device. Try again - it usually works on the second attempt.',
        action: 'Try again',
    },
    'ios-install': {
        icon: Share2,
        title: 'Install to get alerts on iPhone',
        body: 'Tap Share, choose "Add to Home Screen", then enable notifications inside the installed app.',
        action: null,
    },
    denied: {
        icon: ShieldAlert,
        title: 'Notifications are blocked',
        body: 'Allow notifications for this site in your browser settings, then reopen the app to switch alerts on.',
        action: null,
    },
};

/**
 * Automatic push opt-in banner.
 *
 * Mounted once in AuthenticatedLayout so every signed-in page (owner, staff and
 * player) offers notifications instead of hiding the control inside the bell.
 * Permission itself can only be granted from this click - browsers forbid a
 * silent grant.
 */
export default function NotificationPrompt() {
    const push = usePushNotifications();

    if (!push.promptVisible) {
        return null;
    }

    const copy = COPY[push.status] ?? COPY.default;
    const Icon = copy.icon;

    return (
        <div className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:left-4 sm:w-[360px]">
            <div className="rounded-2xl border border-white/10 bg-[#101F1A] p-4 text-white shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D6FF3F] text-[#101F1A]">
                            <Icon size={18} />
                        </span>
                        <div>
                            <p className="text-sm font-black">{copy.title}</p>
                            <p className="mt-0.5 text-[11px] leading-snug text-white/70">{copy.body}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={push.dismiss}
                        aria-label="Dismiss notification prompt"
                        className="rounded-lg p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X size={16} />
                    </button>
                </div>

                {copy.action && (
                    <div className="mt-3 flex justify-end">
                        <button
                            type="button"
                            onClick={push.enable}
                            disabled={push.status === 'saving'}
                            className="rounded-lg bg-[#D6FF3F] px-3 py-1.5 text-xs font-bold text-[#101F1A] transition-colors hover:bg-[#c4ec39] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {push.status === 'saving' ? 'Enabling...' : copy.action}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
