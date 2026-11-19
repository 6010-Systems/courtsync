import { Link } from '@inertiajs/react';
import { ArrowUpRight, X } from 'lucide-react';
import { ownerNavigation } from '@/config/ownerNavigation';

function NavItem({ item, onNavigate }) {
    const Icon = item.icon;
    const isActive =
        typeof route === 'function'
            ? route().current(item.routeName)
            : false;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ' +
                (isActive
                    ? 'bg-brand-primary text-brand-primary-foreground'
                    : 'text-brand-text-on-dark-muted hover:bg-white/5 hover:text-brand-text-on-dark')
            }
        >
            <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            <span className="flex-1">{item.name}</span>
            {item.badge && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-white">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

function SidebarPromo() {
    return (
        <div className="rounded-2xl bg-brand-primary p-4">
            <p className="text-sm font-semibold leading-snug text-brand-primary-foreground">
                Share your facility link and get more bookings
            </p>
            <button
                type="button"
                className="mt-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-brand-primary transition hover:scale-105"
                aria-label="Copy facility link"
            >
                <ArrowUpRight className="h-4 w-4" />
            </button>
        </div>
    );
}

export default function Sidebar({ open, onClose }) {
    const navItems = ownerNavigation.flatMap((section) => section.items);

    const sidebarContent = (
        <>
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <Link
                    href="/"
                    className="font-display text-xl tracking-tight text-brand-text-on-dark"
                >
                    Court<span className="text-brand-primary">Sync</span>
                </Link>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-brand-text-on-dark-muted hover:bg-white/5 lg:hidden"
                    aria-label="Close sidebar"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-2">
                {navItems.map((item) => (
                    <NavItem key={item.routeName} item={item} onNavigate={onClose} />
                ))}
            </nav>

            <div className="shrink-0 p-4">
                <SidebarPromo />
            </div>
        </>
    );

    return (
        <>
            <div
                className={
                    'fixed inset-0 z-40 bg-brand-dark/50 backdrop-blur-sm transition-opacity lg:hidden ' +
                    (open ? 'opacity-100' : 'pointer-events-none opacity-0')
                }
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={
                    'fixed inset-y-0 left-0 z-50 flex w-sidebar max-w-[85vw] flex-col bg-brand-dark shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ' +
                    (open ? 'translate-x-0' : '-translate-x-full')
                }
            >
                {sidebarContent}
            </aside>

            <aside className="hidden h-full w-sidebar shrink-0 flex-col bg-brand-dark lg:flex">
                {sidebarContent}
            </aside>
        </>
    );
}
