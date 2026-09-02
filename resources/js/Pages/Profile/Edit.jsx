import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    Clock,
    KeyRound,
    Mail,
    Shield,
    ShieldCheck,
    User,
    UserCheck,
} from 'lucide-react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    title="Settings & Profile"
                    subtitle="Manage personal credentials and security preferences"
                    actions={null}
                />
            }
        >
            <Head title="Settings & Profile" />

            <div className="w-full">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">

                    {/* ── Left Column: Profile Info & Password Forms ─────── */}
                    <div className="flex flex-col gap-2 lg:col-span-2">
                        {/* Profile Information Form */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-6 shadow-card">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                            />
                        </div>

                        {/* Password & Security Form */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-6 shadow-card">
                            <UpdatePasswordForm />
                        </div>
                    </div>

                    {/* ── Right Column: Account Summary & Danger Zone ────── */}
                    <div className="flex flex-col gap-2">

                        {/* Account Identity Summary Card */}
                        <div className="rounded-xl border border-[#101F1A]/10 bg-white p-6 shadow-card">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                                <ShieldCheck size={14} className="text-[#101F1A]" />
                                <span>Account Overview</span>
                            </div>

                            <div className="mt-4 flex flex-col items-center text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D6FF3F] text-xl font-black text-[#101F1A] shadow-sm ring-2 ring-[#101F1A]/10">
                                    {initials}
                                </div>
                                <h3 className="mt-3 text-base font-bold text-[#101F1A]">
                                    {user.name}
                                </h3>
                                <p className="text-xs text-[#101F1A]/60">
                                    {user.email}
                                </p>
                                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#101F1A] px-3 py-1 text-xs font-bold text-[#D6FF3F]">
                                    <Shield size={12} />
                                    Venue Administrator
                                </span>
                            </div>

                            <div className="mt-6 space-y-3 border-t border-[#101F1A]/10 pt-4 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[#101F1A]/60">Email Status</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                        <CheckCircle2 size={13} />
                                        {user.email_verified_at ? 'Verified' : 'Pending Verification'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#101F1A]/60">Access Scope</span>
                                    <span className="font-semibold text-[#101F1A]">Full Venue Management</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[#101F1A]/60">Session Security</span>
                                    <span className="font-semibold text-[#101F1A]">Active TLS Protected</span>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone Deletion Card */}
                        <div className="rounded-xl border border-[#FF5A36]/20 bg-white p-6 shadow-card">
                            <DeleteUserForm />
                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
