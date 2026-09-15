import { useState } from 'react';
import Header from '@/Components/Dashboard/Header';
import Sidebar from '@/Components/Dashboard/Sidebar';

export default function DashboardLayout({ title, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="fixed inset-0 flex h-screen w-screen overflow-hidden bg-brand-surface">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-brand-surface">
                <div className="shrink-0 border-b border-brand-border-subtle px-4 py-4 sm:px-6 lg:px-8">
                    <Header
                        title={title}
                        onMenuClick={() => setSidebarOpen(true)}
                    />
                </div>

                <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
