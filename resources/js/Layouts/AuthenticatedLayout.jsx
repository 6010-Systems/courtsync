import Dropdown from '@/Components/Dropdown';
import Sidebar from '@/Components/Sidebar';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#F5F2EA] overflow-hidden">
            {/* Sidebar — desktop only, floating card (see Components/Sidebar.jsx) */}
            <div className="hidden md:block shrink-0" style={{ width: collapsed ? '88px' : '256px', transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)' }}>
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
                {/* Mobile Header Toggle */}
                <div className="md:hidden flex h-16 items-center justify-between bg-[#10221C] px-4 shadow-sm z-20">
                    <span className="font-display tracking-tight text-xl font-bold text-white">Court<span className="text-[#D6FF3F]">Sync</span></span>
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex items-center gap-2">
                                 {user.avatar ? (
                                    <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[#D6FF3F]" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#10221C] flex items-center justify-center font-bold">
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content>
                            <Dropdown.Link href={route('dashboard')}>Dashboard</Dropdown.Link>
                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>

                {header && (
                    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10">
                        <div className="px-8 py-5">
                            {header}
                        </div>
                    </header>
                )}
                
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
