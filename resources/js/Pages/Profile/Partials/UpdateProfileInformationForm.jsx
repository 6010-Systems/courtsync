import InputError from '@/Components/InputError';
import { ButtonSpinner } from '@/Components/LoadingContext';
import { useToast } from '@/Components/ToastContext';
import { Link, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, ShieldCheck, User } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const { addToast } = useToast();

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
    });

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: 'Profile Updated',
                    message: 'Your personal information has been saved successfully.',
                });
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: 'Update Failed',
                    message: 'Please check the form for any input errors.',
                });
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-[#101F1A]/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                    <User size={14} className="text-[#101F1A]" />
                    <span>Personal Information</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-[#101F1A]">
                    Profile Details
                </h2>
                <p className="mt-0.5 text-xs text-[#101F1A]/60">
                    Update your display name, public contact email, and avatar initials.
                </p>
            </header>

            {/* Avatar Visual Banner */}
            <div className="mt-6 flex items-center gap-4 rounded-xl border border-[#101F1A]/10 bg-[#F5F2EA]/40 p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#D6FF3F] text-lg font-black text-[#101F1A] shadow-sm ring-1 ring-[#101F1A]/10">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-[#101F1A]">
                            {data.name || 'Your Name'}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#101F1A] px-2 py-0.5 text-[10px] font-bold text-[#D6FF3F]">
                            <ShieldCheck size={11} />
                            Active
                        </span>
                    </div>
                    <p className="truncate text-xs text-[#101F1A]/60">
                        {data.email || 'your-email@courtsync.com'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
                {/* Full Name */}
                <div>
                    <label htmlFor="name" className="block text-xs font-bold text-[#101F1A]">
                        Full Name
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                            <User size={15} />
                        </span>
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/80 pl-9 pr-3 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
                            placeholder="John Doe"
                        />
                    </div>
                    <InputError className="mt-1.5" message={errors.name} />
                </div>

                {/* Email Address */}
                <div>
                    <label htmlFor="email" className="block text-xs font-bold text-[#101F1A]">
                        Email Address
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                            <Mail size={15} />
                        </span>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="username"
                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/80 pl-9 pr-3 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
                            placeholder="manager@courtsync.com"
                        />
                    </div>
                    <InputError className="mt-1.5" message={errors.email} />
                </div>

                {/* Unverified Email Warning */}
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-xl border border-[#FF5A36]/20 bg-[#FF5A36]/10 p-3 text-xs text-[#101F1A]">
                        <p className="font-semibold text-[#FF5A36]">
                            Your email address is unverified.
                        </p>
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="mt-1 text-xs font-bold underline hover:text-[#101F1A] focus:outline-none"
                        >
                            Click here to re-send the verification email.
                        </Link>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 flex items-center gap-1.5 font-bold text-emerald-700">
                                <CheckCircle2 size={13} />
                                A new verification link has been sent to your email.
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Action */}
                <div className="flex items-center justify-end pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#101F1A] px-5 text-xs font-bold text-[#D6FF3F] shadow-sm transition-all hover:bg-[#101F1A]/90 hover:shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {processing && <ButtonSpinner />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
