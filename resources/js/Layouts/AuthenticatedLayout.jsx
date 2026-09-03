import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="flex h-screen bg-[#F5F2EA] overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0 bg-[#10221C] text-white flex-col justify-between hidden md:flex shadow-xl z-10">
                <div>
                    <div className="flex h-20 shrink-0 items-center px-6 mt-2">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="font-display tracking-tight text-3xl font-bold text-white">Court<span className="text-[#D6FF3F]">Sync</span></span>
                        </Link>
                    </div>

                    <nav className="mt-6 flex flex-col gap-2 px-4">
                        <Link
                            href={route('dashboard')}
                            className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('dashboard') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Dashboard
                        </Link>

                        {user.role === 'FACILITY_OWNER' && user.status === 'VERIFIED' && (
                            <Link
                                href={route('facilities.index')}
                                className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('facilities.index') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Facilities
                            </Link>
                        )}

                        {user.role === 'FACILITY_OWNER' && user.facilities?.some(f => f.verification_status === 'APPROVED') && (
                            <>
                                <Link
                                    href={route('facility.staff')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('facility.staff') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Team Management
                                </Link>
                                <Link
                                    href={route('facility.players')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('facility.players') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Players
                                </Link>
                            </>
                        )}

                        {user.role === 'ADMIN' && (
                            <>
                                <Link
                                    href={route('admin.owners')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('admin.owners') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Owners
                                </Link>
                                <Link
                                    href={route('admin.facilities')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('admin.facilities') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Facilities
                                </Link>
                                <Link
                                    href={route('admin.staff')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('admin.staff') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Staff
                                </Link>
                                <Link
                                    href={route('admin.verifications')}
                                    className={`flex items-center px-4 py-3.5 rounded-md transition duration-200 ${route().current('admin.verifications') ? 'bg-[#D6FF3F] text-[#10221C] font-semibold shadow-md' : 'text-gray-300 hover:bg-[#1A332B] hover:text-white'}`}
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Verifications
                                </Link>
                            </>
                        )}
                    </nav>
                </div>

                {/* User Dropdown at the bottom */}
                <div className="p-4 border-t border-[#1A332B]/50 mb-2">
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="flex w-full items-center justify-between rounded-md px-4 py-3 text-left transition duration-200 hover:bg-[#1A332B]">
                                <div className="flex items-center gap-3">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-[#D6FF3F]" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[#D6FF3F] text-[#10221C] flex items-center justify-center font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-white leading-tight">{user.name}</span>
                                        <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5 truncate max-w-[150px]">
                                            {user.role ? user.role.replace('_', ' ') : 'USER'}
                                            {user.work_facility ? ` • ${user.work_facility.name}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="top">
                            <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                            <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
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
