import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import GoogleIcon from '@/Components/Auth/GoogleIcon';
import PasswordStrengthBar from '@/Components/Auth/PasswordStrengthBar';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Eye, 
    EyeOff, 
    Mail, 
    Lock, 
    User, 
    ArrowRight, 
    CheckCircle2, 
    Zap,
    Shield,
    Users
} from 'lucide-react';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Create Facility Account — CourtSync" />

            <div className="grid min-h-screen bg-[#F5F2EA] text-[#10221C] lg:grid-cols-[1.08fr,1fr]">
                <AuthBrandPanel
                    badge="Facility Owner Registration"
                    titleNode={
                        <>
                            START MANAGING <br />
                            <span className="text-[#D6FF3F]">YOUR COURTS TODAY.</span>
                        </>
                    }
                    subtitle="Register your sports venue on CourtSync to eliminate double bookings, automate payments, and attract hundreds of active players in your area."
                    bottomLeft="No credit card required to register"
                >
                    {/* Feature Checklist */}
                    <div className="space-y-3.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/15 text-[#D6FF3F]">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Live Online Booking Engine</p>
                                <p className="text-xs text-[#F5F2EA]/60">Players book and pay in real-time 24/7</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/15 text-[#D6FF3F]">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Multi-Staff Permissions</p>
                                <p className="text-xs text-[#F5F2EA]/60">Delegate court oversight with granular role controls</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D6FF3F]/15 text-[#D6FF3F]">
                                <Shield className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Direct GCash & Maya Sync</p>
                                <p className="text-xs text-[#F5F2EA]/60">Instant verification with automatic receipts</p>
                            </div>
                        </div>
                    </div>
                </AuthBrandPanel>

                {/* Right — Clean Form Container (Static) */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-12 xl:px-20">
                    <div className="mx-auto w-full max-w-[440px]">
                        {/* Mobile Brand Logo */}
                        <div className="mb-8 flex items-center justify-between lg:hidden">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-[#10221C]"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] font-black text-sm">
                                    C
                                </span>
                                <span>Court<span className="text-[#FF5A36]">Sync</span></span>
                            </Link>
                            <span className="rounded-full bg-[#101F1A]/5 px-2.5 py-1 text-[11px] font-bold text-[#101F1A]/70 uppercase tracking-wider">
                                Register
                            </span>
                        </div>

                        {/* Title & Subtext */}
                        <div className="mb-8">
                            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#10221C] sm:text-4xl">
                                Create an account
                            </h2>
                            <p className="mt-2 text-sm text-[#10221C]/65 font-medium">
                                Sign up as a facility owner. Already registered?{' '}
                                <Link
                                    href={route('login')}
                                    className="font-bold text-[#10221C] underline decoration-[#D6FF3F] decoration-2 underline-offset-4 hover:text-black transition"
                                >
                                    Log in
                                </Link>
                            </p>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Full Name */}
                            <div>
                                <InputLabel
                                    htmlFor="name"
                                    value="Full Name / Owner Name"
                                    className="block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80 mb-1.5"
                                />
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#101F1A]/40">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        placeholder="Juan Dela Cruz"
                                        className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-3.5 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

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
                                        placeholder="owner@facility.com"
                                        className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-3.5 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            {/* Password */}
                            <div>
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
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
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#101F1A]/40 hover:text-[#101F1A] transition"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
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
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        placeholder="Repeat your password"
                                        className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-10 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#101F1A]/40 hover:text-[#101F1A] transition"
                                        aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password_confirmation} className="mt-1.5" />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-all hover:bg-[#c4ec32] hover:shadow-md hover:shadow-[#D6FF3F]/20 active:scale-[0.99] disabled:opacity-50"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <ButtonSpinner /> Creating account...
                                    </span>
                                ) : (
                                    <>
                                        <span>Create Facility Account</span>
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#10221C]/10"></div>
                                </div>
                                <span className="relative bg-[#F5F2EA] px-3 text-xs font-bold uppercase tracking-wider text-[#10221C]/40">
                                    or register with
                                </span>
                            </div>

                            {/* Google OAuth */}
                            <a
                                href={route('google.redirect', { tenant: 'owner' })}
                                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#10221C]/15 bg-white px-5 text-xs font-bold text-[#10221C] shadow-xs transition-all hover:bg-white hover:border-[#10221C]/30 hover:shadow-sm active:scale-[0.99]"
                            >
                                <GoogleIcon />
                                <span>Sign up with Google</span>
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
