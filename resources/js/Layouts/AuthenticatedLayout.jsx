import Sidebar, { MobileMenu } from '@/Components/Sidebar';
import Dropdown from '@/Components/Dropdown';
import InstallPwaPrompt from '@/Components/InstallPwaPrompt';
import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function AuthenticatedLayout({ header, children, inset = 'default' }) {
    const isDashboard = inset === 'dashboard';
    const page = usePage();
    const user = page.props.auth.user;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cs_sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('cs_sidebar_collapsed', String(next));
            }
            return next;
        });
    };

    useEffect(() => {
        closeMobileNav();
    }, [page.url, closeMobileNav]);

    useEffect(() => {
        const desktopNav = window.matchMedia('(min-width: 768px)');
        const closeOnDesktop = () => {
            if (desktopNav.matches) {
                closeMobileNav();
            }
        };
        desktopNav.addEventListener('change', closeOnDesktop);
        return () => desktopNav.removeEventListener('change', closeOnDesktop);
    }, [closeMobileNav]);

    const sidebarWidth = collapsed ? 72 : 240;
    // Sidebar sits at left: 8px (fixed), total sidebar footprint = 8 + width
    const sidebarOffset = sidebarWidth + 8;
    const horizontalPad = 'px-2.5 sm:px-3 md:px-4';

    return (
        <div className="min-h-screen bg-[#F5F2EA] text-[#101F1A]">
            {/* Desktop Fixed Floating Sidebar */}
            <div className="hidden md:block">
                <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
            </div>

            <MobileMenu open={mobileNavOpen} onClose={closeMobileNav} />

            {/* ── Sticky Top Header Area (Fixed at top on Mobile and Desktop) ── */}
            <div
                className={`sticky top-0 z-30 bg-[#F5F2EA]/95 backdrop-blur-md transition-[margin-left] duration-300 ${
                    collapsed ? 'md:ml-[80px]' : 'md:ml-[248px]'
                }`}
            >
                {/* Mobile Header Bar */}
                <div className={`md:hidden ${horizontalPad} pt-2 pb-1`}>
                    <div className="flex h-12 sm:h-14 items-center justify-between rounded-xl bg-[#101F1A] px-2.5 text-white shadow-card">
                        <div className="flex min-w-0 items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="Open menu"
                                aria-expanded={mobileNavOpen}
                                aria-controls="mobile-nav"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10 focus-ring-volt cursor-pointer"
                            >
                                <Menu size={20} />
                            </button>
                            <span className="truncate tracking-tight text-base sm:text-lg font-bold text-white">
                                Court<span className="text-[#D6FF3F]">Sync</span>
                            </span>
                        </div>
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex h-10 w-10 items-center justify-center cursor-pointer">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Avatar"
                                            className="w-7 h-7 rounded-full border border-[#D6FF3F]"
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-[#D6FF3F] text-[#101F1A] flex items-center justify-center font-bold text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                </button>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                <Dropdown.Link href={route('dashboard')}>Dashboard</Dropdown.Link>
                                {user.role === 'PLAYER' && <Dropdown.Link href={route('player.bookings')}>My Bookings</Dropdown.Link>}
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">
                                    Log Out
                                </Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </div>

                {/* Page Header Bar */}
                {header && (
                    <header className={`${horizontalPad} pt-1 md:pt-2 pb-2`}>
                        <div className="w-full">
                            {header}
                        </div>
                    </header>
                )}
            </div>

            {/* Main Content Area */}
            <div
                className={`flex min-w-0 flex-1 flex-col transition-[margin-left] duration-300 ${
                    collapsed ? 'md:ml-[80px]' : 'md:ml-[248px]'
                }`}
            >
                <main className={`flex-1 min-w-0 ${horizontalPad} pt-1 pb-4`}>
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>

            <InstallPwaPrompt />
        </div>
    );
}
