import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import PasswordStrengthBar from '@/Components/Auth/PasswordStrengthBar';
import { Head, useForm, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, Lock, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password — CourtSync" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#10221C] sm:text-3xl">
                        Reset password
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#10221C]/65">
                        Choose a strong new password for your CourtSync account.
                    </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101F1A]/5 text-[#101F1A]">
                    <KeyRound className="h-5 w-5" />
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                {/* Email */}
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Email address"
                        className="block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80 mb-1.5"
                    />
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#101F1A]/40">
                            <Mail className="h-4 w-4" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-3.5 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                {/* New Password */}
                <div>
                    <InputLabel
                        htmlFor="password"
                        value="New Password"
                        className="block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80 mb-1.5"
                    />
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#101F1A]/40">
                            <Lock className="h-4 w-4" />
                        </div>
                        <TextInput
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            placeholder="At least 8 characters"
                            className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-10 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#101F1A]/40 hover:text-[#101F1A] transition focus:outline-none"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                    <PasswordStrengthBar password={data.password} />
                </div>

                {/* Confirm Password */}
                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80 mb-1.5"
                    />
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#101F1A]/40">
                            <Lock className="h-4 w-4" />
                        </div>
                        <TextInput
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            placeholder="Repeat new password"
                            className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-10 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#101F1A]/40 hover:text-[#101F1A] transition focus:outline-none"
                            aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                {/* Submit */}
                <motion.button
                    type="submit"
                    disabled={processing}
                    whileHover={processing ? {} : { scale: 1.01 }}
                    whileTap={processing ? {} : { scale: 0.985 }}
                    className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-colors hover:bg-[#c4ec32] hover:shadow-md disabled:opacity-50 cursor-pointer"
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <ButtonSpinner /> Saving password...
                        </span>
                    ) : (
                        <>
                            <span>Save New Password & Continue</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </motion.button>
            </form>
        </GuestLayout>
    );
}
