import { Link, usePage } from '@inertiajs/react';
import {
    BarChart2,
    Building2,
    Calendar,
    CalendarCheck,
    ClipboardList,
    CreditCard,
    LayoutGrid,
    LogOut,
    Settings,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ── Custom Domain SVGs ────────────────────────────────────────────────────────
const CourtIcon = ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M2 12h3m14 0h3" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const LogoMark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101F1A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// ── Nav data matching extracted design ─────────────────────────────────────
// `href: '#'` marks a module whose page exists but has no backend routes yet
// (see NavItem — it renders those as disabled rather than a dead link).
// `roles` lists which `user.role` values see the item.
const navSections = [
    {
        title: 'Main',
        items: [
            { name: 'Dashboard',    href: 'dashboard',                 icon: LayoutGrid,    badge: null, roles: ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN', 'PLAYER'] },
        ],
    },
    {
        title: 'Management',
        items: [
            { name: 'Bookings',     href: '#',                         icon: CalendarCheck, badge: 'Soon', roles: ['FACILITY_OWNER', 'FACILITY_STAFF'] },
            { name: 'Calendar',     href: '#',                         icon: Calendar,      badge: 'Soon', roles: ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'] },
            { name: 'Facilities',   href: 'facilities.index',          icon: Building2,     badge: null, roles: ['FACILITY_OWNER'] },
            { name: 'Facilities',   href: 'admin.facilities',          icon: Building2,     badge: null, roles: ['ADMIN'] },
            { name: 'Courts',       href: '#',                         icon: ClipboardList, badge: 'Soon', roles: ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'] },
        ],
    },
    {
        title: 'People & Finance',
        items: [
            { name: 'Players',      href: 'facility.players',          icon: Users,         badge: null, roles: ['FACILITY_OWNER', 'FACILITY_STAFF'] },
            { name: 'Staff',        href: 'facility.staff',            icon: UserCheck,     badge: null, roles: ['FACILITY_OWNER'] },
            { name: 'Owners',       href: 'admin.owners',              icon: UserCheck,     badge: null, roles: ['ADMIN'] },
            { name: 'Staff',        href: 'admin.staff',               icon: UserCheck,     badge: null, roles: ['ADMIN'] },
            { name: 'Customers',    href: '#',                         icon: Users,         badge: 'Soon', roles: ['FACILITY_OWNER', 'FACILITY_STAFF'] },
            { name: 'Payments',     href: '#',                         icon: CreditCard,    badge: 'Soon', roles: ['FACILITY_OWNER', 'FACILITY_STAFF', 'ADMIN'] },
        ],
    },
    {
        title: 'System',
        items: [
            { name: 'Reports',       href: '#',                        icon: BarChart2,     badge: 'Soon', roles: ['FACILITY_OWNER', 'ADMIN'] },
            { name: 'Verifications', href: 'admin.verifications',      icon: ShieldCheck,   badge: null, roles: ['ADMIN'] },
        ],
    },
];

function navForRole(role) {
    return navSections
        .map(section => ({
            ...section,
            items: section.items.filter(item => item.roles.includes(role)),
        }))
        .filter(section => section.items.length > 0);
}

// ── Fade wrapper: simple instant fade-out on collapse, smooth glide-in on expand ─
function Fade({ show, children, className = '', delay = 0 }) {
    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                overflow: 'hidden',
                maxWidth: show ? '240px' : '0px',
                opacity: show ? 1 : 0,
                transform: show ? 'translateX(0)' : 'none',
                marginLeft: show ? undefined : 0,
                marginRight: show ? undefined : 0,
                paddingLeft: show ? undefined : 0,
                paddingRight: show ? undefined : 0,
                transition: show
                    ? `opacity 220ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + 70}ms,
                       transform 220ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + 50}ms,
                       max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)`
                    : `opacity 75ms ease,
                       max-width 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
                whiteSpace: 'nowrap',
                pointerEvents: show ? 'auto' : 'none',
                flexShrink: 0,
            }}
        >
            {children}
        </span>
    );
}

// ── NavItem ───────────────────────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
    const [tooltipY, setTooltipY] = useState(null);
    const disabled = item.href === '#';

    let isActive = false;
    try { if (!disabled) isActive = route().current(item.href); } catch (_) {}

    let href = item.href;
    try { if (!disabled) href = route(item.href); } catch (_) {}

    const TOOLTIP_LEFT = 84; // 8px margin + 72px sidebar + 4px gap
    const IconComponent = item.icon;

    return (
        <>
            <Link
                href={href}
                aria-disabled={disabled}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) {
                        e.preventDefault();
                    }
                }}
                className={[
                    'group relative flex h-10 w-full items-center rounded-lg text-sm font-medium transition-colors duration-150',
                    collapsed ? 'justify-center p-0' : 'pr-3',
                    disabled
                        ? 'cursor-not-allowed text-[#F5F2EA]/30'
                        : isActive
                            ? 'badge-volt glow-volt-sm shadow-sm'
                            : 'text-[#F5F2EA]/70 hover:bg-[#F5F2EA]/[0.08] hover:text-[#F5F2EA]',
                ].join(' ')}
                onMouseEnter={collapsed ? (e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipY(rect.top + rect.height / 2);
                } : undefined}
                onMouseLeave={collapsed ? () => setTooltipY(null) : undefined}
            >
                {/* Fixed Icon Slot (h-10 w-14) — centered at x=36px */}
                <span
                    className={[
                        'relative flex h-10 w-14 shrink-0 items-center justify-center transition-colors duration-200',
                        isActive ? 'text-[#101F1A]' : 'text-[#F5F2EA]/40 group-hover:text-[#F5F2EA]',
                    ].join(' ')}
                >
                    <IconComponent size={18} strokeWidth={2} />

                    {/* Collapsed badge dot */}
                    {item.badge !== null && (
                        <span
                            className={[
                                'absolute right-4 top-2 h-2 w-2 rounded-full ring-2',
                                isActive
                                    ? 'bg-[#101F1A] ring-[#D6FF3F]'
                                    : 'bg-[#D6FF3F] ring-[#101F1A]',
                            ].join(' ')}
                            style={{
                                opacity: collapsed ? 1 : 0,
                                transform: collapsed ? 'scale(1)' : 'scale(0)',
                                transition: 'opacity 200ms ease, transform 200ms cubic-bezier(0.4,0,0.2,1)',
                            }}
                        />
                    )}
                </span>

                {/* Label — fades and slides smoothly */}
                <Fade show={!collapsed} className="flex-1">
                    <span className="truncate leading-none">{item.name}</span>
                </Fade>

                {/* Badge */}
                {item.badge !== null && (
                    <Fade show={!collapsed}>
                        <span
                            className={[
                                'ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
                                isActive
                                    ? 'bg-[#101F1A]/20 text-[#101F1A]'
                                    : 'bg-[#D6FF3F]/15 text-[#D6FF3F]',
                            ].join(' ')}
                        >
                            {item.badge}
                        </span>
                    </Fade>
                )}
            </Link>

            {/* Portal tooltip — renders in document.body to escape overflow:hidden */}
            {collapsed && tooltipY !== null && createPortal(
                <div
                    role="tooltip"
                    style={{
                        position: 'fixed',
                        left: TOOLTIP_LEFT,
                        top: tooltipY,
                        transform: 'translateY(-50%)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        animation: 'cs-tooltip-in 0.15s cubic-bezier(0.16,1,0.3,1) both',
                    }}
                    className="flex items-center gap-2 rounded-lg bg-[#101F1A] px-3 py-2 text-xs font-semibold text-[#F5F2EA] shadow-[0_4px_16px_rgba(16,31,26,0.35)] ring-1 ring-[#F5F2EA]/10"
                >
                    {item.name}
                    {item.badge !== null && (
                        <span className="rounded-full bg-[#D6FF3F]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D6FF3F]">
                            {item.badge}
                        </span>
                    )}
                    <span
                        style={{
                            position: 'absolute',
                            right: '100%',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: 0,
                            height: 0,
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            borderRight: '5px solid #101F1A',
                        }}
                    />
                </div>,
                document.body
            )}
        </>
    );
}

// ── UserFooter ────────────────────────────────────────────────────────────────
function UserFooter({ user, initials, collapsed, onToggle }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);
    const cardRef = useRef(null);

    const toggleCard = (e) => {
        e.stopPropagation();
        setOpen(prev => !prev);
    };

    // Close card when collapsed state changes
    useEffect(() => {
        setOpen(false);
    }, [collapsed]);

    // Close on outside click or Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        const onDown = (e) => {
            if (
                cardRef.current && !cardRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [open]);

    const cardStyle = collapsed
        ? {
            position: 'fixed',
            left: '88px',
            bottom: '24px',
            width: '240px',
            zIndex: 9999,
            animation: 'cs-card-flyout 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        }
        : {
            position: 'fixed',
            left: '16px',
            bottom: '80px',
            width: '224px',
            zIndex: 9999,
            animation: 'cs-card-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        };

    return (
        <>
            <div className="shrink-0 border-t border-[#F5F2EA]/10 p-2">
                <div className="flex items-center rounded-lg">

                    {/* Clickable trigger: avatar + name */}
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={toggleCard}
                        title={collapsed ? (user?.name ?? 'User profile') : undefined}
                        className={[
                            'group flex min-w-0 flex-1 items-center rounded-lg text-left transition-colors duration-150 focus:outline-none cursor-pointer',
                            open
                                ? 'bg-[#F5F2EA]/10'
                                : 'hover:bg-[#F5F2EA]/[0.06]',
                        ].join(' ')}
                        aria-haspopup="true"
                        aria-expanded={open}
                    >
                        {/* Fixed Avatar Slot (w-14 h-10) — centered at x=36px */}
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D6FF3F] text-[11px] font-bold text-[#101F1A] glow-volt-sm">
                                {initials}
                            </div>
                        </div>

                        {/* Name only — left-aligned */}
                        <Fade show={!collapsed} className="flex-1 min-w-0">
                            <span className="block truncate text-left text-[13px] font-semibold text-[#F5F2EA] group-hover:text-white">
                                {user?.name ?? 'User'}
                            </span>
                        </Fade>
                    </button>

                    {/* Collapse toggle — hidden during collapse state */}
                    <Fade show={!collapsed} className="shrink-0">
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-label="Collapse sidebar"
                            title="Collapse sidebar"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#F5F2EA]/40 transition-colors duration-150 hover:bg-[#F5F2EA]/[0.08] hover:text-[#D6FF3F] focus-ring-volt mr-1 cursor-pointer"
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="1.5" y="1.5" width="17" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                                <line x1="7" y1="1.5" x2="7" y2="18.5" stroke="currentColor" strokeWidth="1.6" />
                                <rect x="1.5" y="1.5" width="5.5" height="17" rx="2.5" fill="currentColor" fillOpacity="0.35" />
                            </svg>
                        </button>
                    </Fade>
                </div>
            </div>

            {/* Portal popover card */}
            {open && createPortal(
                <>
                    <div
                        ref={cardRef}
                        role="dialog"
                        aria-label="User account menu"
                        style={cardStyle}
                        className="overflow-hidden rounded-xl glass-panel-dark p-1.5 shadow-elevated dark-scrollbar"
                    >
                        {/* User identity header */}
                        <div className="flex items-center gap-3 rounded-lg bg-[#F5F2EA]/[0.04] p-3 border border-[#F5F2EA]/[0.06]">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D6FF3F] text-[12px] font-bold text-[#101F1A] glow-volt-sm">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold text-[#F5F2EA]">
                                    {user?.name ?? 'User'}
                                </p>
                                <p className="truncate text-[11px] text-[#F5F2EA]/50">
                                    {user?.email ?? 'user@courtsync.com'}
                                </p>
                            </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="mt-1.5 flex flex-col gap-0.5">
                            <Link
                                href={route('profile.edit')}
                                onClick={() => setOpen(false)}
                                className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium text-[#F5F2EA]/80 transition-colors hover:bg-[#F5F2EA]/[0.08] hover:text-[#F5F2EA]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-5 w-5 items-center justify-center text-[#F5F2EA]/50 group-hover:text-[#D6FF3F] transition-colors">
                                        <Settings size={16} strokeWidth={2} />
                                    </span>
                                    <span>Settings & Profile</span>
                                </div>
                                <span className="text-[11px] text-[#F5F2EA]/30 group-hover:text-[#D6FF3F] group-hover:translate-x-0.5 transition-all">
                                    →
                                </span>
                            </Link>

                            <div className="my-1 border-t border-[#F5F2EA]/[0.08]" />

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                onClick={() => setOpen(false)}
                                className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium text-[#F5F2EA]/70 transition-colors hover:bg-[#FF5A36]/10 hover:text-[#FF5A36]"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-5 w-5 items-center justify-center text-[#F5F2EA]/50 group-hover:text-[#FF5A36] transition-colors">
                                        <LogOut size={15} strokeWidth={2} />
                                    </span>
                                    <span>Log out</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ collapsed, onToggle }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const sections = navForRole(user?.role);

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const handleAsideClick = (e) => {
        if (!collapsed) return;
        // If clicking on an interactive child element (links, buttons, dialogs), don't trigger sidebar toggle
        const interactive = e.target.closest('a, button, [role="button"], [role="dialog"]');
        if (interactive) return;
        onToggle();
    };

    return (
        <>
            {/* Global consolidated keyframes + transition styles */}
            <style>{`
                .sidebar-transition { transition: width 300ms cubic-bezier(0.4,0,0.2,1); }
                @keyframes cs-tooltip-in {
                    from { opacity: 0; transform: translateY(-50%) translateX(-4px); }
                    to   { opacity: 1; transform: translateY(-50%) translateX(0); }
                }
                @keyframes cs-card-up {
                    from { opacity: 0; transform: translateY(8px) scale(0.96); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes cs-card-flyout {
                    from { opacity: 0; transform: translateX(-8px) scale(0.96); }
                    to   { opacity: 1; transform: translateX(0) scale(1); }
                }
            `}</style>

            <aside
                onClick={handleAsideClick}
                className={[
                    'sidebar-transition fixed left-2 top-2 z-30 flex flex-col overflow-hidden rounded-xl bg-[#101F1A] border border-white/[0.08] shadow-elevated dark-scrollbar',
                    collapsed ? 'cursor-pointer' : '',
                ].join(' ')}
                style={{
                    width: collapsed ? '72px' : '240px',
                    height: 'calc(100vh - 16px)',
                }}
                title={collapsed ? 'Click to expand sidebar' : undefined}
                aria-label="Sidebar navigation"
            >

                {/* ── Brand header ─────────────────────────────────── */}
                <div className="flex h-16 shrink-0 items-center border-b border-[#F5F2EA]/10 px-2">
                    {/* Fixed Logo Slot (w-14 h-10) — centered at x=36px */}
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#D6FF3F]">
                            <LogoMark />
                        </div>
                    </div>

                    {/* Wordmark — fades + slides out on collapse */}
                    <Fade show={!collapsed} className="flex-1">
                        <span
                            className="font-bold tracking-tight text-[#F5F2EA]"
                            style={{ fontSize: '15px' }}
                        >
                            Court<span className="text-[#D6FF3F]">Sync</span>
                        </span>
                    </Fade>
                </div>

                {/* ── Navigation ───────────────────────────────────── */}
                <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-2 gap-0.5 dark-scrollbar">
                    {sections.map((section, idx) => (
                        <div key={section.title || idx} className="flex flex-col">
                            {/* Fixed-height section segregation header (h-[22px]) for zero vertical shift */}
                            <div className="relative flex h-[22px] shrink-0 items-center overflow-hidden">
                                {idx > 0 && (
                                    <div
                                        className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                                        style={{ opacity: collapsed ? 1 : 0, pointerEvents: collapsed ? 'auto' : 'none' }}
                                    >
                                        <div className="h-px w-6 bg-[#F5F2EA]/10" />
                                    </div>
                                )}
                                <Fade show={!collapsed} className="px-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5F2EA]/35 leading-none">
                                        {section.title}
                                    </span>
                                </Fade>
                            </div>

                            {/* Section Items */}
                            <div className="flex flex-col gap-1">
                                {section.items.map(item => (
                                    <NavItem key={item.name} item={item} collapsed={collapsed} />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* ── User footer ──────────────────────────────────── */}
                <UserFooter
                    user={user}
                    initials={initials}
                    collapsed={collapsed}
                    onToggle={onToggle}
                />

            </aside>
        </>
    );
}
