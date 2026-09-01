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
    // Sidebar sits at left: 8px margin, total footprint = 8 + width
    const sidebarOffset = sidebarWidth + 8;

    return (
        <div className="min-h-screen bg-[#F5F2EA]">
            <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

            {/* Main content — offset by sidebar footprint (margin + width) */}
            <div
                style={{ marginLeft: `${sidebarOffset}px`, transition: 'margin-left 300ms cubic-bezier(0.4,0,0.2,1)' }}
                className="flex min-h-screen flex-col"
            >
                {header && (
                    <header className="sticky top-0 z-20">
                        {header}
                    </header>
                )}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
