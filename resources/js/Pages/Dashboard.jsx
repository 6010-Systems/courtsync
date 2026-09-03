import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Dashboard({ user }) {
    if (user.role === 'FACILITY_OWNER' && user.status === 'VERIFIED') {
        if (!user.facilities || user.facilities.length === 0) {
            return (
                <AuthenticatedLayout header={<h2 className="text-xl font-bold leading-tight text-[#10221C]">Welcome</h2>}>
                    <Head title="Welcome" />
                    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white p-10 text-center shadow-sm rounded-lg border border-gray-200">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#D6FF3F]/30 mb-6 border border-[#D6FF3F]">
                                <svg className="h-8 w-8 text-[#10221C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-[#10221C]">Welcome to CourtSync!</h2>
                            <p className="text-gray-600 mb-8">You haven't registered any facilities yet. Please go to the Facilities page to add your first facility and get started.</p>
                            <Link href={route('facilities.index')}>
                                <PrimaryButton className="!bg-[#10221C] hover:!bg-[#1a382d]">
                                    Go to Facilities
                                </PrimaryButton>
                            </Link>
                        </div>
                    </div>
                </AuthenticatedLayout>
            );
        }
    }

    if (user.role === 'FACILITY_STAFF' && user.status === 'PENDING_VERIFICATION') {
        return (
            <AuthenticatedLayout>
                <Head title="Waiting for Verification" />
                <div className="py-12 flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-xl font-bold text-gray-900">Waiting for Verification</h3>
                        <p className="mt-1 text-sm text-gray-500">Your account is pending verification. Please wait for an administrator or facility owner to link your account to a facility.</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-[#10221C]">
                            Welcome back to CourtSync, {user.name}!
                        </h2>
                    </div>
                    {user.status === 'VERIFIED' && (
                        <div className="flex items-center gap-2 bg-[#D6FF3F]/30 text-[#10221C] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-[#D6FF3F]">
                            <svg className="w-4 h-4 text-[#10221C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            VERIFIED ACCOUNT
                        </div>
                    )}
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                {user.role === 'FACILITY_OWNER' && user.status !== 'VERIFIED' && (
                    <div className="bg-white p-6 shadow-sm rounded-lg border border-yellow-200 bg-yellow-50/50 mt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 text-yellow-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Account Pending Verification</h3>
                                <p className="text-gray-600 mt-1">
                                    Your account is currently under review by our administrators. You will be able to add and manage facilities once your account is verified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {user.role === 'FACILITY_OWNER' && user.status === 'VERIFIED' && user.facilities.filter(f => f.verification_status !== 'APPROVED').map(facility => (
                    <div key={facility.id} className="bg-white p-6 shadow-sm rounded-lg border border-yellow-200 bg-yellow-50/50 mt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 text-yellow-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Facility Status: <span className="uppercase">{facility.verification_status.replace('_', ' ')}</span></h3>
                                <p className="text-gray-600 mt-1">
                                    {facility.verification_status === 'DRAFT' && "Your facility is currently a draft. Please complete your registration and submit your verification documents."}
                                    {facility.verification_status === 'SUBMITTED' && "Your verification documents have been submitted and are awaiting review by an administrator."}
                                    {facility.verification_status === 'UNDER_REVIEW' && "Your facility is currently under review by our team. We'll notify you once it's approved."}
                                    {facility.verification_status === 'REJECTED' && "Your facility verification was rejected. Please review your documents and try again."}
                                    {facility.verification_status === 'SUSPENDED' && "Your facility has been suspended by an administrator."}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Link href={route('facilities.index')}>
                                    <PrimaryButton className="!bg-yellow-600 hover:!bg-yellow-700 !text-white">
                                        Go to Facilities
                                    </PrimaryButton>
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Dashboard Metrics Placeholders */}
                {user.role === 'FACILITY_OWNER' && user.facilities.some(f => f.verification_status === 'APPROVED') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Bookings</div>
                            <div className="text-5xl font-display text-[#10221C]">124</div>
                            <div className="text-sm text-green-600 mt-2 font-medium">↑ 12% from last week</div>
                        </div>
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Revenue</div>
                            <div className="text-5xl font-display text-[#10221C]">$4,502</div>
                            <div className="text-sm text-green-600 mt-2 font-medium">↑ 8% from last week</div>
                        </div>
                        <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-200 transition hover:shadow-md">
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Courts</div>
                            <div className="text-5xl font-display text-[#10221C]">4</div>
                            <div className="text-sm text-gray-400 mt-2 font-medium">All systems operational</div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
