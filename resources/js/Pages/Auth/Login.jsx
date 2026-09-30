import { useState } from 'react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import GoogleIcon from '@/Components/Auth/GoogleIcon';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
    Eye, 
    EyeOff, 
    Mail, 
    Lock, 
    ArrowRight,
    Calendar,
    ShieldCheck, 
    TrendingUp, 
    CheckCircle2,
    XCircle
} from 'lucide-react';

const formContainerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.05,
        },
    },
};

const formItemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function Login({ status, canResetPassword, lastLoginMethod }) {
    const [showPassword, setShowPassword] = useState(false);
    const shouldReduce = useReducedMotion();

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log In — CourtSync" />

            <div className="grid min-h-screen bg-[#F5F2EA] text-[#10221C] lg:grid-cols-[1.08fr,1fr] overflow-x-hidden">
                <AuthBrandPanel
                    badge="Facility Owner & Staff Portal"
                    titleNode={
                        <>
                            ELEVATE YOUR <br />
                            <span className="text-[#D6FF3F]">COURT MANAGEMENT.</span>
                        </>
                    }
                    subtitle="Log in to monitor live reservations, manage multi-court schedules, assign staff permissions, and scale your sports venue seamlessly."
                    bottomLeft={
                        <span className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-[#D6FF3F]" />
                            Bank-grade SSL & Role Security
                        </span>
                    }
                >
                    {/* Floating Live Metric Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition hover:bg-white/[0.07]">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6FF3F]">
                                <span className="flex h-2 w-2 rounded-full bg-[#D6FF3F] animate-pulse" />
                                LIVE ACTIVITY
                            </div>
                            <p className="mt-2 font-display text-2xl font-bold text-white">98.4%</p>
                            <p className="text-xs text-[#F5F2EA]/60">Weekend Peak Occupancy</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md transition hover:bg-white/[0.07]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                <TrendingUp className="h-3.5 w-3.5" />
                                INSTANT PAYOUTS
                            </div>
                            <p className="mt-2 font-display text-2xl font-bold text-white">₱0 Fee</p>
                            <p className="text-xs text-[#F5F2EA]/60">Direct GCash / Maya Sync</p>
                        </div>
                    </div>
                </AuthBrandPanel>

                {/* Right — Form Container with Staggered Entrance */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-12 md:px-16 lg:px-12 xl:px-20">
                    <motion.div
                        className="mx-auto w-full max-w-[440px]"
                        variants={formContainerVariants}
                        initial={shouldReduce ? false : 'hidden'}
                        animate="visible"
                    >
                        {/* Mobile Brand Logo */}
                        <motion.div variants={formItemVariants} className="mb-8 flex items-center justify-between lg:hidden">
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
                                Portal
                            </span>
                        </motion.div>

                        {/* Title & Subtext */}
                        <motion.div variants={formItemVariants} className="mb-8">
                            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#10221C] sm:text-4xl">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-sm text-[#10221C]/65 font-medium">
                                Sign in to your facility dashboard. Don't have an account yet?{' '}
                                <Link
                                    href={route('register')}
                                    className="font-bold text-[#10221C] underline decoration-[#D6FF3F] decoration-2 underline-offset-4 hover:text-black transition"
                                >
                                    Register now
                                </Link>
                            </p>
                        </motion.div>

                        {/* Player Portal Callout */}
                        <motion.div variants={formItemVariants} className="mb-6 flex items-center justify-between rounded-xl border border-[#10221C]/10 bg-white/70 p-3.5 shadow-xs backdrop-blur-sm">
                            <div className="flex items-center gap-2.5 text-xs text-[#10221C]/75">
                                <Calendar className="h-4 w-4 text-[#10221C]/50 shrink-0" />
                                <span>Looking to book courts as a <strong>player</strong>?</span>
                            </div>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[#10221C] hover:underline"
                            >
                                Find court <ArrowRight className="h-3 w-3" />
                            </Link>
                        </motion.div>

                        {/* Flash Status Message */}
                        <AnimatePresence>
                            {status && (
                                <motion.div
                                    initial={shouldReduce ? false : { opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.25 }}
                                    className={`mb-6 flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold ${
                                        status.toLowerCase().includes('banned') 
                                            ? 'border-red-200 bg-red-50 text-red-700' 
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    }`}
                                >
                                    {status.toLowerCase().includes('banned') ? (
                                        <XCircle className="h-4 w-4 shrink-0" />
                                    ) : (
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    )}
                                    <span>{status}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Login Form */}
                        <form onSubmit={submit} className="space-y-4">
                            {/* Email */}
                            <motion.div variants={formItemVariants}>
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
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                                <InputError message={errors.email} className="mt-1.5" />
                            </motion.div>

                            {/* Password */}
                            <motion.div variants={formItemVariants}>
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
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#101F1A]/40 hover:text-[#101F1A] transition focus:outline-none"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <motion.span
                                            key={showPassword ? 'hide' : 'show'}
                                            initial={shouldReduce ? false : { opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </motion.span>
                                    </button>
                                </div>
                                <InputError message={errors.password} className="mt-1.5" />
                            </motion.div>

                            {/* Remember Me */}
                            <motion.div variants={formItemVariants} className="pt-1 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-[#10221C]/20 text-[#101F1A] focus:ring-[#101F1A]"
                                    />
                                    <span className="text-xs font-semibold text-[#10221C]/80">
                                        Keep me signed in
                                    </span>
                                </label>
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div variants={formItemVariants}>
                                <motion.button
                                    type="submit"
                                    disabled={processing}
                                    whileHover={processing ? {} : { scale: 1.01 }}
                                    whileTap={processing ? {} : { scale: 0.985 }}
                                    className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-colors hover:bg-[#c4ec32] hover:shadow-md hover:shadow-[#D6FF3F]/20 disabled:opacity-50 cursor-pointer"
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <ButtonSpinner /> Signing in...
                                        </span>
                                    ) : (
                                        <>
                                            <span>Sign In to Dashboard</span>
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                    {lastLoginMethod === 'email' && (
                                        <span className="absolute right-3 rounded-full bg-[#10221C] px-2 py-0.5 text-[9px] font-bold text-[#D6FF3F] tracking-tight">
                                            LAST USED
                                        </span>
                                    )}
                                </motion.button>
                            </motion.div>

                            {/* Divider */}
                            <motion.div variants={formItemVariants} className="relative my-6 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-[#10221C]/10"></div>
                                </div>
                                <span className="relative bg-[#F5F2EA] px-3 text-xs font-bold uppercase tracking-wider text-[#10221C]/40">
                                    or continue with
                                </span>
                            </motion.div>

                            {/* Google OAuth */}
                            <motion.div variants={formItemVariants}>
                                <motion.a
                                    href={route('google.redirect', { tenant: 'owner' })}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.985 }}
                                    className="relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#10221C]/15 bg-white px-5 text-xs font-bold text-[#10221C] shadow-xs transition-colors hover:bg-white hover:border-[#10221C]/30 hover:shadow-sm"
                                >
                                    {lastLoginMethod === 'google' && (
                                        <span className="absolute -top-2.5 right-4 rounded-full bg-[#10221C] px-2 py-0.5 text-[9px] font-bold text-[#D6FF3F] shadow-sm">
                                            LAST USED
                                        </span>
                                    )}
                                    <GoogleIcon />
                                    <span>Sign in with Google</span>
                                </motion.a>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </>
    );
}

