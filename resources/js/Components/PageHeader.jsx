import { Link } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Search,
    SlidersHorizontal,
    Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * ── PageHeader Component ───────────────────────────────────────────────────────
 * Refined, high-density executive header for CourtSync.
 *
 * @param {string} title - Page title
 * @param {string} [subtitle] - Secondary contextual text
 * @param {string|React.ReactNode} [badge] - Live status indicator / pill
 * @param {Array<{ label: string, href?: string }>} [breadcrumbs] - Breadcrumb ancestry
 * @param {React.ReactNode} [actions] - Action buttons / CTAs on the right
 * @param {boolean} [showSearch] - Shows search / command trigger (⌘K)
 * @param {boolean} [showNotifications] - Shows notification center
 * @param {boolean} [showDateNavigator] - Shows date picker / day scrubber
 * @param {React.ReactNode} [children] - Optional bottom filter tabs or secondary row
 */
export default function PageHeader({
    title,
    subtitle,
    badge,
    breadcrumbs = [],
    actions,
    showSearch = true,
    showNotifications = true,
    showDateNavigator = false,
    children,
    className = '',
}) {
    const [notifOpen, setNotifOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(2);
    const notifRef = useRef(null);

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
        <div className={['flex flex-col border-b border-[#101F1A]/10 bg-[#F5F2EA]/90 backdrop-blur-md', className].join(' ')}>
            <div className="flex flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">

                {/* ── Left: Breadcrumbs / Title + Live Status Badge ────── */}
                <div className="flex min-w-0 flex-col gap-0.5">
                    {/* Optional Breadcrumb trail (only rendered if hierarchical trail exists) */}
                    {breadcrumbs.length > 1 && (
                        <nav aria-label="Breadcrumb" className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-[#101F1A]/45">
                            {breadcrumbs.map((crumb, idx) => {
                                const isLast = idx === breadcrumbs.length - 1;
                                return (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        {crumb.href && !isLast ? (
                                            <Link
                                                href={crumb.href}
                                                className="transition-colors hover:text-[#101F1A]"
                                            >
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className={isLast ? 'text-[#101F1A]/75 font-semibold' : ''}>
                                                {crumb.label}
                                            </span>
                                        )}
                                        {!isLast && <ChevronRight size={11} className="text-[#101F1A]/25" />}
                                    </div>
                                );
                            })}
                        </nav>
                    )}

                    {/* Title + Status Chip row */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-xl font-black tracking-tight text-[#101F1A]">
                            {title}
                        </h1>

                        {badge && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#101F1A]/10 bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#101F1A] shadow-xs">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#101F1A] opacity-30" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D6FF3F] ring-1 ring-[#101F1A]/40" />
                                </span>
                                {badge}
                            </span>
                        )}
                    </div>

                    {subtitle && (
                        <p className="text-[12px] font-medium text-[#101F1A]/55">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* ── Right: Command Search + Date Scrubber + Actions ─── */}
                <div className="flex flex-wrap items-center gap-2.5">

                    {/* Optional Day / Date navigator */}
                    {showDateNavigator && (
                        <div className="hidden items-center rounded-xl border border-[#101F1A]/10 bg-white/70 p-0.5 text-xs font-semibold text-[#101F1A] shadow-xs lg:flex">
                            <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#101F1A]/50 transition-colors hover:bg-[#101F1A]/[0.06] hover:text-[#101F1A]"
                                title="Previous day"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px]">
                                <CalendarDays size={13} className="text-[#101F1A]/50" />
                                Today
                            </span>
                            <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#101F1A]/50 transition-colors hover:bg-[#101F1A]/[0.06] hover:text-[#101F1A]"
                                title="Next day"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Command Search (⌘K) */}
                    {showSearch && (
                        <div className="relative hidden md:flex items-center">
                            <span className="pointer-events-none absolute left-2.5 z-10 flex items-center text-[#101F1A]/40">
                                <Search size={13} strokeWidth={2.2} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search courts, bookings..."
                                className="h-8 w-56 rounded-lg border border-[#101F1A]/10 bg-white/80 py-1 pl-8 pr-10 text-xs text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
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
                                    'relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none shadow-xs',
                                    notifOpen
                                        ? 'border-[#101F1A] bg-[#101F1A] text-[#D6FF3F]'
                                        : 'border-[#101F1A]/10 bg-white/80 text-[#101F1A] hover:bg-white active:scale-95',
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
                                    style={{
                                        animation: 'cs-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both',
                                    }}
                                    className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[#101F1A]/10 bg-white p-1.5 shadow-2xl ring-1 ring-black/5"
                                >
                                    <div className="flex items-center justify-between border-b border-[#101F1A]/10 px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#101F1A]">Notifications</span>
                                            {unreadCount > 0 && (
                                                <span className="rounded-full bg-[#D6FF3F] px-1.5 py-0.2 text-[10px] font-bold text-[#101F1A]">
                                                    {unreadCount} new
                                                </span>
                                            )}
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={markAllRead}
                                                className="text-[11px] font-semibold text-[#101F1A]/60 transition-colors hover:text-[#101F1A]"
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
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101F1A] text-[#D6FF3F]">
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
                                            className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-[#101F1A]/70 transition-colors hover:bg-[#F5F2EA] hover:text-[#101F1A]"
                                        >
                                            View all activity
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Page Actions Slot */}
                    {actions ? (
                        actions
                    ) : (
                        /* High-contrast CourtSync CTA Button */
                        <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#101F1A] px-3 text-xs font-bold text-[#D6FF3F] shadow-xs transition-all hover:bg-[#101F1A]/90 hover:shadow-sm active:scale-95"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Book Court</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Optional Bottom Tabs / Sub-header Slot ──────────────── */}
            {children && (
                <div className="border-t border-[#101F1A]/10 px-6 py-2">
                    {children}
                </div>
            )}

            <style>{`
                @keyframes cs-dropdown-in {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
