import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import GoogleIcon from '@/Components/Auth/GoogleIcon';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Eye, 
    EyeOff, 
    Mail, 
    Lock, 
    ArrowRight, 
    CheckCircle2,
    XCircle,
    MapPin
} from 'lucide-react';

export default function PlayerLogin({ status, canResetPassword, lastLoginMethod, facility }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/${facility.slug}/login`, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title={`Log In — ${facility.name}`} />

            <div className="grid min-h-screen bg-[#F5F2EA] text-[#10221C] lg:grid-cols-[1.08fr,1fr]">
                <AuthBrandPanel
                    badge="Player Reservation Portal"
                    titleNode={
                        <>
                            READY TO <br />
                            <span className="text-[#D6FF3F]">PLAY TODAY?</span>
                        </>
                    }
                    subtitle="Log in to view available court times, reserve slots with instant payment, and manage your upcoming game bookings."
                    logoHref={`/${facility.slug}`}
                    logoNode={<span className="text-white">{facility.name}</span>}
                    logoInitial={facility.name ? facility.name.charAt(0) : 'C'}
                    bgImage={facility.verification?.facility_photos?.[0]}
                    bottomLeft="Powered by CourtSync"
                >
                    {facility.address && (
                        <div className="flex items-center gap-2 text-xs text-[#F5F2EA]/75">
                            <MapPin className="h-4 w-4 text-[#D6FF3F] shrink-0" />
                            <span>{facility.address}</span>
                        </div>
                    )}
                </AuthBrandPanel>

                {/* Right — Clean Form Container */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-12 xl:px-20">
                    <div className="mx-auto w-full max-w-[440px]">
                        {/* Mobile Header */}
                        <div className="mb-8 flex items-center justify-between lg:hidden">
                            <Link
                                href={`/${facility.slug}`}
                                className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-[#10221C]"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] font-black text-sm">
                                    {facility.name ? facility.name.charAt(0) : 'C'}
                                </span>
                                <span>{facility.name}</span>
                            </Link>
                            <span className="rounded-full bg-[#101F1A]/5 px-2.5 py-1 text-[11px] font-bold text-[#101F1A]/70 uppercase tracking-wider">
                                Player Log In
                            </span>
                        </div>

                        {/* Title & Subtext */}
                        <div className="mb-8">
                            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#10221C] sm:text-4xl">
                                Log in to book
                            </h2>
                            <p className="mt-2 text-sm text-[#10221C]/65 font-medium">
                                Don't have an account at {facility.name}?{' '}
                                <Link
                                    href={`/${facility.slug}/register`}
                                    className="font-bold text-[#10221C] underline decoration-[#D6FF3F] decoration-2 underline-offset-4 hover:text-black transition"
                                >
                                    Sign up now
                                </Link>
                            </p>
                        </div>

                        {/* Flash Status Message */}
                        {status && (
                            <div className={`mb-6 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                                status.toLowerCase().includes('banned') 
                                    ? 'border-red-200 bg-red-50 text-red-700' 
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            }`}>
                                {status.toLowerCase().includes('banned') ? (
                                    <XCircle className="h-4 w-4 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                )}
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Login Form */}
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
                                        placeholder="player@example.com"
                                        className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-3.5 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <InputLabel
                                        htmlFor="password"
                                        value="Password"
                                        className="block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80"
                                    />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs font-semibold text-[#101F1A]/70 hover:text-[#101F1A] hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#101F1A]/40">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <TextInput
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        placeholder="••••••••"
                                        className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-10 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                        autoComplete="current-password"
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
                            </div>

                            {/* Remember Me */}
                            <div className="pt-1 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-[#10221C]/20 text-[#101F1A] focus:ring-[#101F1A]"
                                    />
                                    <span className="text-xs font-semibold text-[#10221C]/80">
                                        Remember me
                                    </span>
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-all hover:bg-[#c4ec32] hover:shadow-md hover:shadow-[#D6FF3F]/20 active:scale-[0.99] disabled:opacity-50"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <ButtonSpinner /> Signing in...
                                    </span>
                                ) : (
                                    <>
                                        <span>Log In to Book</span>
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                                {lastLoginMethod === 'email' && (
                                    <span className="absolute right-3 rounded-full bg-[#10221C] px-2 py-0.5 text-[9px] font-bold text-[#D6FF3F] tracking-tight">
                                        LAST USED
                                    </span>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#10221C]/10"></div>
                                </div>
                                <span className="relative bg-[#F5F2EA] px-3 text-xs font-bold uppercase tracking-wider text-[#10221C]/40">
                                    or log in with
                                </span>
                            </div>

                            {/* Google OAuth for Player */}
                            <a
                                href={`/auth/google/player?facility=${facility.slug}`}
                                className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#10221C]/15 bg-white px-5 text-xs font-bold text-[#10221C] shadow-xs transition-all hover:bg-white hover:border-[#10221C]/30 hover:shadow-sm active:scale-[0.99]"
                            >
                                {lastLoginMethod === 'google' && (
                                    <span className="absolute -top-2.5 right-4 rounded-full bg-[#10221C] px-2 py-0.5 text-[9px] font-bold text-[#D6FF3F] shadow-sm">
                                        LAST USED
                                    </span>
                                )}
                                <GoogleIcon />
                                <span>Continue with Google</span>
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
