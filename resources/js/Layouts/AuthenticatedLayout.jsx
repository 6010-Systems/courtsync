import Sidebar, { MobileMenu } from '@/Components/Sidebar';
import Dropdown from '@/Components/Dropdown';
import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function AuthenticatedLayout({ header, children, inset = 'default' }) {
    const isDashboard = inset === 'dashboard';
    const horizontalPad = 'px-3';
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

    return (
        <div className="min-h-screen bg-[#F5F2EA] text-[#101F1A]">
            {/* Desktop Fixed Floating Sidebar */}
            <div className="hidden md:block">
                <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
            </div>

            <MobileMenu open={mobileNavOpen} onClose={closeMobileNav} />

            {/* Mobile Header Bar */}
            <div className={`md:hidden ${isDashboard ? 'mx-4' : 'mx-2'} mt-2 mb-1 flex h-14 items-center justify-between rounded-xl bg-[#101F1A] px-2 text-white shadow-card z-20`}>
                <div className="flex min-w-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={mobileNavOpen}
                        aria-controls="mobile-nav"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10 focus-ring-volt"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="truncate tracking-tight text-lg font-bold text-white">
                        Court<span className="text-[#D6FF3F]">Sync</span>
                    </span>
                </div>
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="flex h-11 w-11 items-center justify-center cursor-pointer">
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
                        <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                        <Dropdown.Link href={route('logout')} method="post" as="button">
                            Log Out
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>

            {/* Main Content Area */}
            <div
                className={`flex min-h-screen min-w-0 flex-1 flex-col pt-1 md:pt-2 transition-[margin-left] duration-300 ${
                    collapsed ? 'md:ml-[80px]' : 'md:ml-[248px]'
                }`}
            >
                {header && (
                    <header className={`sticky top-2 z-20 ${horizontalPad} ${isDashboard ? 'pb-2' : 'pb-2'}`}>
                        <div className="w-full">
                            {header}
                        </div>
                    </header>
                )}
                <main className={`flex-1 min-w-0 ${horizontalPad} ${isDashboard ? 'pt-0 pb-2' : 'pt-1 pb-2'}`}>
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
