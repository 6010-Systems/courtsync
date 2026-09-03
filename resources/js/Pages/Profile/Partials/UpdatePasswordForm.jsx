import { useConfirm } from '@/Components/ConfirmContext';
import InputError from '@/Components/InputError';
import { ButtonSpinner } from '@/Components/LoadingContext';
import { useToast } from '@/Components/ToastContext';
import { useForm } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const { addToast } = useToast();
    const { confirm } = useConfirm();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = async (e) => {
        e.preventDefault();

        const ok = await confirm({
            title: 'Change Password?',
            message: 'Are you sure you want to update your security password? You will need to use your new credentials for future logins.',
            confirmText: 'Update Password',
            cancelText: 'Cancel',
            type: 'warning',
        });
        if (!ok) return;

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                addToast({
                    type: 'success',
                    title: 'Password Updated',
                    message: 'Your account password has been updated securely.',
                });
            },
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }

                addToast({
                    type: 'error',
                    title: 'Update Failed',
                    message: 'Please review the password requirements and try again.',
                });
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-[#101F1A]/10 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#101F1A]/50">
                    <KeyRound size={14} className="text-[#101F1A]" />
                    <span>Security Credentials</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-[#101F1A]">
                    Update Password
                </h2>
                <p className="mt-0.5 text-xs text-[#101F1A]/60">
                    Ensure your account is using a strong, unique password to prevent unauthorized access.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-5">
                {/* Current Password */}
                <div>
                    <label htmlFor="current_password" className="block text-xs font-bold text-[#101F1A]">
                        Current Password
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                            <Lock size={15} />
                        </span>
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            type={showCurrent ? 'text' : 'password'}
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            autoComplete="current-password"
                            placeholder="Enter current password"
                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/80 pl-9 pr-10 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(v => !v)}
                            className="absolute right-3 text-[#101F1A]/40 transition-colors hover:text-[#101F1A]"
                            tabIndex={-1}
                        >
                            {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <InputError className="mt-1.5" message={errors.current_password} />
                </div>

                {/* New Password */}
                <div>
                    <label htmlFor="password" className="block text-xs font-bold text-[#101F1A]">
                        New Password
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                            <Lock size={15} />
                        </span>
                        <input
                            id="password"
                            ref={passwordInput}
                            type={showNew ? 'text' : 'password'}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            autoComplete="new-password"
                            placeholder="Minimum 8 characters"
                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/80 pl-9 pr-10 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(v => !v)}
                            className="absolute right-3 text-[#101F1A]/40 transition-colors hover:text-[#101F1A]"
                            tabIndex={-1}
                        >
                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <InputError className="mt-1.5" message={errors.password} />
                </div>

                {/* Confirm New Password */}
                <div>
                    <label htmlFor="password_confirmation" className="block text-xs font-bold text-[#101F1A]">
                        Confirm New Password
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                        <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                            <Lock size={15} />
                        </span>
                        <input
                            id="password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            autoComplete="new-password"
                            placeholder="Repeat new password"
                            className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white/80 pl-9 pr-10 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#101F1A]"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 text-[#101F1A]/40 transition-colors hover:text-[#101F1A]"
                            tabIndex={-1}
                        >
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    <InputError className="mt-1.5" message={errors.password_confirmation} />
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-end pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#101F1A] px-5 text-xs font-bold text-[#D6FF3F] shadow-sm transition-all hover:bg-[#101F1A]/90 hover:shadow-md active:scale-95 disabled:opacity-50"
                    >
                        {processing && <ButtonSpinner />}
                        <span>Update Password</span>
                    </button>
                </div>
            </form>
        </section>
    );
}
