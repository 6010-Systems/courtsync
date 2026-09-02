import Sidebar from '@/Components/Sidebar';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cs_sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleCollapsed = () => {
        setCollapsed(prev => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('cs_sidebar_collapsed', String(next));
            }
            return next;
        });
    };

    const sidebarWidth = collapsed ? 72 : 240;
    // Sidebar sits at left: 8px (fixed), total sidebar footprint = 8 + width
    const sidebarOffset = sidebarWidth + 8;

    return (
        <div className="min-h-screen bg-[#F5F2EA]">
            <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

            {/* Main content — top and bottom margins match the sidebar's 8px offset exactly */}
            <div
                style={{
                    marginLeft: `${sidebarOffset}px`,
                    transition: 'margin-left 300ms cubic-bezier(0.4,0,0.2,1)',
                }}
                className="flex min-h-screen min-w-0 flex-1 flex-col pt-2"
            >
                {header && (
                    <header className="sticky top-2 z-20 px-4 pb-2">
                        {header}
                    </header>
                )}
                <main className="flex-1 min-w-0 px-4 pt-1 pb-2">
                    {children}
                </main>
            </div>
        </div>
    );
}
