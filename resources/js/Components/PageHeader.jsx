import { Link } from '@inertiajs/react';
import {
    Bell,
    CheckCircle2,
    Clock,
    Plus,
    Search,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * ── PageHeader Component ───────────────────────────────────────────────────────
 * Standardized global header across all authenticated pages in CourtSync.
 *
 * @param {string} title - Dynamic page heading
 * @param {string} [subtitle] - Dynamic subtext / contextual description
 * @param {React.ReactNode} [actions] - Dynamic page-specific action buttons on the right
 * @param {boolean} [showSearch] - Shows global quick search / ⌘K command trigger
 * @param {boolean} [showNotifications] - Shows interactive notification center
 */
export default function PageHeader({
    title,
    subtitle,
    actions,
    showSearch = true,
    showNotifications = true,
    searchQuery = '',
    onSearchChange,
    searchPlaceholder = 'Search courts, bookings...',
    className = '',
}) {
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
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

    // Mock venue notifications
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
            desc: '$60.00 received via Stripe for Court 1',
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
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        setUnreadCount(0);
    };

    return (
        <div
            className={[
                'flex h-16 w-full items-center justify-between rounded-xl border border-[#101F1A]/10 bg-white px-6 shadow-card transition-colors duration-200',
                className,
            ].join(' ')}
        >

            {/* ── Left: Dynamic Page Title & Subtitle ───────────────────── */}
            <div className="flex min-w-0 flex-col justify-center">
                <h1 className="truncate text-xl font-bold tracking-tight text-[#101F1A]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="truncate text-xs text-[#101F1A]/60">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* ── Right: Search + Notifications + Dynamic Actions ───────── */}
            <div className="flex shrink-0 items-center gap-2.5">

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
                            className="h-8 w-48 sm:w-60 md:w-72 rounded-lg border border-[#101F1A]/10 bg-white/90 py-1 pl-8 pr-10 text-xs text-[#101F1A] placeholder-[#101F1A]/40 shadow-subtle transition-colors focus:border-[#101F1A] focus:bg-white focus:outline-none focus-ring-volt"
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
                            onClick={() => setNotifOpen(prev => !prev)}
                            aria-label="Notifications"
                            className={[
                                'relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-150 focus:outline-none focus-ring-volt shadow-subtle cursor-pointer',
                                notifOpen
                                    ? 'border-[#101F1A] bg-[#101F1A] text-[#D6FF3F] glow-volt-sm'
                                    : 'border-[#101F1A]/10 bg-white/90 text-[#101F1A] hover:bg-white hover:border-[#101F1A]/25',
                            ].join(' ')}
                        >
                            <Bell size={14} />
                            {unreadCount > 0 && (
                                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#FF5A36] px-1 text-[8px] font-bold text-white shadow-xs ring-2 ring-[#F5F2EA]">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown Card */}
                        {notifOpen && (
                            <div
                                className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl glass-card p-1.5 shadow-elevated ring-1 ring-black/5 animate-fade-in"
                            >
                                <div className="flex items-center justify-between border-b border-[#101F1A]/10 px-3 py-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#101F1A]">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="rounded-full badge-volt px-1.5 py-0.5 text-[10px] shadow-xs">
                                                {unreadCount} new
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={markAllRead}
                                            className="text-[11px] font-semibold text-[#101F1A]/60 transition-colors hover:text-[#101F1A] cursor-pointer"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                <div className="max-h-72 divide-y divide-[#101F1A]/[0.06] overflow-y-auto">
                                    {notifications.map((item) => (
                                        <div
                                            key={item.id}
                                            className={[
                                                'flex gap-2.5 p-2.5 transition-colors hover:bg-[#F5F2EA]/60 rounded-lg',
                                                item.unread ? 'bg-[#F5F2EA]/30' : '',
                                            ].join(' ')}
                                        >
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-[#D6FF3F] glow-volt-sm">
                                                {item.type === 'booking' ? (
                                                    <Clock size={13} />
                                                ) : item.type === 'payment' ? (
                                                    <Sparkles size={13} />
                                                ) : (
                                                    <CheckCircle2 size={13} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="truncate text-xs font-semibold text-[#101F1A]">
                                                        {item.title}
                                                    </p>
                                                    <span className="shrink-0 text-[10px] text-[#101F1A]/40">
                                                        {item.time}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-2 mt-0.5 text-[11px] text-[#101F1A]/60">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-[#101F1A]/10 p-1.5 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setNotifOpen(false)}
                                        className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-[#101F1A]/70 transition-colors hover:bg-[#F5F2EA] hover:text-[#101F1A] cursor-pointer"
                                    >
                                        View all activity
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Dynamic Page Actions (or Default Action CTA) */}
                {actions !== undefined ? (
                    actions
                ) : (
                    <button
                        type="button"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-colors hover:bg-[#101F1A]/90 glow-volt-sm focus-ring-volt cursor-pointer"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Book Court</span>
                    </button>
                )}
            </div>
        </div>
    );
}
