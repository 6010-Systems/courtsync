import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const output = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        output[index] = rawData.charCodeAt(index);
    }

    return output;
}

const announcedNotificationIds = new Set();

function announceNotifications(items) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return;
    }

    items.forEach((item) => {
        if (item.read_at !== null || announcedNotificationIds.has(item.id)) {
            return;
        }

        announcedNotificationIds.add(item.id);

        const popup = new Notification(item.title || 'CourtSync', {
            body: item.message || '',
            icon: '/assets/ball.png',
            tag: item.id,
            requireInteraction: true,
        });

        popup.onclick = () => {
            window.focus();
            popup.close();

            if (item.url) {
                router.visit(item.url);
            }
        };
    });
}

function formatRelativeTime(isoString) {
    const elapsedSeconds = Math.round((Date.now() - new Date(isoString).getTime()) / 1000);

    if (Number.isNaN(elapsedSeconds) || elapsedSeconds < 60) {
        return 'Just now';
    }

    const minutes = Math.round(elapsedSeconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.round(hours / 24)}d ago`;
}

/**
 * ── PageHeader Component ───────────────────────────────────────────────────────
 * Standardized global floating glass header across all authenticated pages in CourtSync.
 *
 * @param {string} title - Dynamic page heading
 * @param {string} [subtitle] - Dynamic subtext / contextual description
 * @param {React.ReactNode} [actions] - Dynamic page-specific action buttons on the right
 * @param {boolean} [showSearch] - Shows global quick search / ⌘K command trigger
 * @param {boolean} [showNotifications] - Shows interactive notification center
 * @param {boolean} [liveNotifications] - Loads the signed-in user's notifications
 * @param {string|null} [notificationsFooterHref] - Optional link under a live notification list
 */
export default function PageHeader({
    title,
    subtitle,
    actions,
    showSearch = true,
    showNotifications = true,
    liveNotifications = false,
    notificationsFooterHref = null,
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search courts, bookings...',
    className = '',
    containerClassName = '',
}) {
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
    const [liveItems, setLiveItems] = useState([]);
    const [liveUnreadCount, setLiveUnreadCount] = useState(0);
    const [pushStatus, setPushStatus] = useState('unknown');
    const { vapidPublicKey } = usePage().props;
    const notifRef = useRef(null);
    const searchInputRef = useRef(null);

    // Keyboard shortcut ⌘K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Venue notifications
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Court 2 Booked',
            desc: 'Marcus Vance • Doubles (6:00 PM - 8:00 PM)',
            time: '4m ago',
            type: 'booking',
            unread: true,
        },
        {
            id: 2,
            title: 'Payment Confirmed',
            desc: '₱350.00 received via GCash for Court 1',
            time: '28m ago',
            type: 'payment',
            unread: true,
        },
        {
            id: 3,
            title: 'Court 4 Available',
            desc: 'Booking concluded on schedule',
            time: '1h ago',
            type: 'system',
            unread: false,
        },
    ]);

    const loadNotifications = useCallback(() => {
        if (!liveNotifications) {
            return;
        }

        window.axios.get(route('notifications.index')).then(({ data }) => {
            setLiveItems(data.notifications);
            setLiveUnreadCount(data.unread_count);
            announceNotifications(data.notifications);
        }).catch(() => {
            // Keep the last list when a refresh fails.
        });
    }, [liveNotifications]);

    useEffect(() => {
        if (!liveNotifications) {
            return undefined;
        }

        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 30000);

        return () => window.clearInterval(intervalId);
    }, [liveNotifications, loadNotifications]);

    useEffect(() => {
        if (!liveNotifications || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return undefined;
        }

        if (Notification.permission === 'denied') {
            setPushStatus('denied');

            return undefined;
        }

        let active = true;

        navigator.serviceWorker.getRegistration('/sw.js').then(async (registration) => {
            await registration?.update();
            const subscription = await registration?.pushManager.getSubscription();

            if (active) {
                setPushStatus(subscription ? 'enabled' : 'default');
            }
        }).catch(() => {
            if (active) {
                setPushStatus('default');
            }
        });

        return () => {
            active = false;
        };
    }, [liveNotifications]);

    const enablePush = async () => {
        if (!vapidPublicKey || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPushStatus('unsupported');

            return;
        }

        setPushStatus('saving');

        try {
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setPushStatus(permission === 'denied' ? 'denied' : 'default');

                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            const existing = await registration.pushManager.getSubscription();
            const subscription = existing || await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
            const payload = subscription.toJSON();

            await window.axios.post(route('push-subscriptions.store'), {
                endpoint: payload.endpoint,
                keys: payload.keys,
                content_encoding: 'aes128gcm',
            });
            setPushStatus('enabled');
        } catch {
            setPushStatus('error');
        }
    };

    const disablePush = async () => {
        setPushStatus('saving');

        try {
            const registration = await navigator.serviceWorker.getRegistration('/sw.js');
            const subscription = await registration?.pushManager.getSubscription();

            if (subscription) {
                await window.axios.delete(route('push-subscriptions.destroy'), {
                    data: { endpoint: subscription.endpoint },
                });
                await subscription.unsubscribe();
            }

            setPushStatus('default');
        } catch {
            setPushStatus('error');
        }
    };

    // Close notifications on outside click or Escape
    useEffect(() => {
        if (!notifOpen) return;
        const onDown = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        const onKey = (e) => {
            if (e.key === 'Escape') setNotifOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [notifOpen]);

    const markAllRead = () => {
        if (!liveNotifications) {
            setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
            setUnreadCount(0);

            return;
        }

        window.axios.post(route('notifications.read-all')).then(({ data }) => {
            setLiveUnreadCount(data.unread_count);
            setLiveItems((current) => current.map((item) => ({
                ...item,
                read_at: item.read_at ?? data.read_at,
            })));
        });
    };

    const openNotification = (item) => {
        const finish = () => {
            setNotifOpen(false);
            if (item.url) {
                router.visit(item.url);
            }
        };

        if (!liveNotifications || item.read_at) {
            finish();

            return;
        }

        window.axios.patch(route('notifications.read', item.id)).then(({ data }) => {
            setLiveUnreadCount(data.unread_count);
            setLiveItems((current) => current.map((entry) => (
                entry.id === item.id ? { ...entry, read_at: data.read_at } : entry
            )));
            finish();
        });
    };

    const visibleUnreadCount = liveNotifications ? liveUnreadCount : unreadCount;
    const displayedNotifications = liveNotifications
        ? liveItems.map((item) => ({
            id: item.id,
            title: item.title,
            desc: item.message,
            time: formatRelativeTime(item.created_at),
            unread: item.read_at === null,
            url: item.url,
            type: 'booking',
        }))
        : notifications;

    const headerContent = (
        <div
            className={[
                'flex h-16 w-full items-center justify-between rounded-xl border border-[#101F1A]/10 bg-white/90 px-5 backdrop-blur-md shadow-card transition-all duration-200',
                className,
            ].join(' ')}
        >
            {/* ── Left: Dynamic Page Title & Subtitle ───────────────────── */}
            <div className="flex min-w-0 flex-col justify-center">
                <h1 className="truncate text-lg sm:text-xl font-bold tracking-tight text-[#101F1A]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="truncate text-xs font-medium text-[#101F1A]/60">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* ── Right: Search + Notifications + Dynamic Actions ───────── */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
                {/* Global Command Search (⌘K) */}
                {showSearch && (
                    <div className="relative hidden md:flex items-center">
                        <span className="pointer-events-none absolute left-2.5 z-10 flex items-center text-[#101F1A]/40">
                            <Search size={13} strokeWidth={2.2} />
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-8 w-44 sm:w-56 md:w-64 rounded-lg border border-[#101F1A]/10 bg-white/90 py-1 pl-8 pr-9 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-subtle transition-colors focus:border-[#D6FF3F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D6FF3F]"
                        />
                        <div className="pointer-events-none absolute right-1.5 flex items-center">
                            <kbd className="rounded border border-[#101F1A]/15 bg-[#F5F2EA] px-1 py-0.5 text-[9px] font-bold text-[#101F1A]/50 leading-none">
                                ⌘K
                            </kbd>
                        </div>
                    </div>
                )}

                {/* Notification Bell with interactive dropdown */}
                {showNotifications && (
                    <div ref={notifRef} className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setNotifOpen((prev) => !prev);
                                if (!notifOpen) {
                                    loadNotifications();
                                }
                            }}
                            aria-label="Notifications"
                            className={[
                                'relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 focus:outline-none shadow-subtle cursor-pointer',
                                notifOpen
                                    ? 'border-[#101F1A] bg-[#101F1A] text-[#D6FF3F]'
                                    : 'border-[#101F1A]/10 bg-white/90 text-[#101F1A] hover:bg-white hover:border-[#101F1A]/25',
                            ].join(' ')}
                        >
                            <Bell size={14} />
                            {visibleUnreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#FF5A36] px-1 text-[8px] font-bold text-white shadow-xs ring-2 ring-[#F5F2EA]">
                                    {visibleUnreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown Card */}
                        {notifOpen && (
                            <div
                                className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white/95 backdrop-blur-md border border-[#101F1A]/10 p-1.5 shadow-elevated ring-1 ring-black/5 animate-fade-in"
                            >
                                <div className="flex items-center justify-between border-b border-[#101F1A]/10 px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#101F1A]">Notifications</span>
                                        {visibleUnreadCount > 0 && (
                                            <span className="rounded-full bg-[#D6FF3F] text-[#101F1A] font-bold px-1.5 py-0.5 text-[10px] shadow-xs">
                                                {visibleUnreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {visibleUnreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={markAllRead}
                                            className="text-[11px] font-bold text-[#101F1A]/60 transition-colors hover:text-[#101F1A] cursor-pointer"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {liveNotifications && (
                                    <div className="border-b border-[#101F1A]/10 px-3 py-2">
                                        {pushStatus === 'enabled' ? (
                                            <button type="button" onClick={disablePush} className="text-[11px] font-bold text-[#101F1A]/70 hover:text-[#101F1A] cursor-pointer">
                                                Browser notifications are on
                                            </button>
                                        ) : pushStatus === 'denied' ? (
                                            <p className="text-[11px] font-medium text-[#101F1A]/60">Notifications are blocked in this browser.</p>
                                        ) : pushStatus === 'unsupported' ? (
                                            <p className="text-[11px] font-medium text-[#101F1A]/60">This browser cannot receive notifications.</p>
                                        ) : pushStatus === 'error' ? (
                                            <button type="button" onClick={enablePush} className="text-[11px] font-bold text-[#FF5A36] cursor-pointer">
                                                Could not enable notifications. Try again.
                                            </button>
                                        ) : (
                                            <button type="button" onClick={enablePush} disabled={pushStatus === 'saving' || !vapidPublicKey} className="rounded-lg bg-[#101F1A] px-2.5 py-1.5 text-[11px] font-bold text-[#D6FF3F] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">
                                                {pushStatus === 'saving' ? 'Enabling notifications...' : 'Enable notifications'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                <div className="max-h-72 divide-y divide-[#101F1A]/[0.06] overflow-y-auto">
                                    {displayedNotifications.length === 0 ? (
                                        <p className="px-3 py-6 text-center text-xs font-medium text-[#101F1A]/60">No notifications yet.</p>
                                    ) : displayedNotifications.map((item) => {
                                        const content = (
                                            <>
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-[#D6FF3F]">
                                                    {item.type === 'booking' ? (
                                                        <Clock size={13} />
                                                    ) : item.type === 'payment' ? (
                                                        <Sparkles size={13} />
                                                    ) : (
                                                        <CheckCircle2 size={13} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1 text-left">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate text-xs font-bold text-[#101F1A]">
                                                            {item.title}
                                                        </p>
                                                        <span className="shrink-0 text-[10px] font-medium text-[#101F1A]/40">
                                                            {item.time}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 line-clamp-4 text-[11px] text-[#101F1A]/60">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </>
                                        );
                                        const itemClassName = [
                                            'flex w-full gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-[#F5F2EA]/60',
                                            item.unread ? 'bg-[#F5F2EA]/30' : '',
                                        ].join(' ');

                                        if (!liveNotifications) {
                                            return (
                                                <div key={item.id} className={itemClassName}>
                                                    {content}
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => openNotification(item)}
                                                className={`${itemClassName} cursor-pointer`}
                                            >
                                                {content}
                                            </button>
                                        );
                                    })}
                                </div>

                                {(!liveNotifications || notificationsFooterHref) && (
                                    <div className="border-t border-[#101F1A]/10 p-1.5 text-center">
                                        {liveNotifications ? (
                                            <Link
                                                href={notificationsFooterHref}
                                                className="block w-full rounded-lg py-1.5 text-center text-xs font-bold text-[#101F1A]/70 transition-colors hover:bg-[#F5F2EA] hover:text-[#101F1A]"
                                            >
                                                View bookings
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setNotifOpen(false)}
                                                className="w-full rounded-lg py-1.5 text-center text-xs font-bold text-[#101F1A]/70 transition-colors hover:bg-[#F5F2EA] hover:text-[#101F1A] cursor-pointer"
                                            >
                                                View all activity
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Dynamic Page Actions */}
                {actions !== undefined ? (
                    actions
                ) : (
                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-colors hover:bg-[#162923] cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={2.4} />
                        <span>Action</span>
                    </button>
                )}
            </div>
        </div>
    );

    if (containerClassName) {
        return (
            <div className={containerClassName}>
                {headerContent}
            </div>
        );
    }

    return headerContent;
}
