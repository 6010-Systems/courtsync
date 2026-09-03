import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function PlayerLogin({ status, canResetPassword, lastLoginMethod, facility }) {
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
            <Head title={`Log in to ${facility.name}`} />

            <div className="courtsync grid min-h-screen bg-[#F5F2EA] text-[#10221C] lg:grid-cols-[1.1fr,1fr]">
                {/* Left — branding panel */}
                <div
                    className="relative hidden flex-col justify-between bg-[#101F1A] py-10 text-[#F5F2EA] lg:flex bg-cover bg-center"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)',
                        backgroundImage: facility.verification?.facility_photos?.length > 0 
                            ? `url(${facility.verification.facility_photos[0]})` 
                            : 'none'
                    }}
                >
                    {/* Gradient Overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10221C] via-[#10221C]/80 to-[#10221C]/40 z-0"></div>

                    <div className="relative z-10 ml-auto w-full max-w-[704px] px-10">
                        <Link
                            href={`/${facility.slug}`}
                            className="font-display text-2xl tracking-tight flex items-center gap-2"
                        >
                            <span className="text-[#D6FF3F]">{facility.name}</span>
                        </Link>
                    </div>

                    <div className="relative z-10 ml-auto w-full max-w-[704px] px-10">
                        <div className="max-w-sm">
                            <h1 className="font-display text-5xl leading-[0.95] tracking-tight drop-shadow-md">
                                READY TO
                                <br />
                                <span className="text-[#D6FF3F]">
                                    PLAY?
                                </span>
                            </h1>
                            <p className="mt-6 leading-relaxed text-[#F5F2EA]/90 drop-shadow-sm font-medium">
                                Log in to book your court, manage your reservations, and see available schedules at {facility.name}.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 ml-auto w-full max-w-[704px] px-10 opacity-0">
                        {/* Empty space for balance */}
                    </div>
                </div>

                {/* Right — form */}
                <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-10">
                    <div className="mr-auto w-full max-w-[576px] px-0 lg:pr-10">
                    <div className="mx-auto w-full max-w-sm">
                        <Link
                            href={`/${facility.slug}`}
                            className="font-display text-2xl tracking-tight text-[#10221C] lg:hidden mb-8 block"
                        >
                            {facility.name}
                        </Link>

                        <h2 className="mt-8 font-display text-3xl tracking-tight text-[#10221C] lg:mt-0">
                            Log in to book
                        </h2>
                        <p className="mt-2 text-[#10221C]/60">
                            Don't have an account?{' '}
                            <Link
                                href={`/${facility.slug}/register`}
                                className="font-medium text-[#10221C] underline decoration-[#D6FF3F] decoration-2 underline-offset-2"
                            >
                                Sign up
                            </Link>
                        </p>

                        {status && (
                            <div className={`mb-4 text-sm font-medium ${status.toLowerCase().includes('banned') ? 'text-red-600' : 'text-green-600'}`}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="mt-8">
                            <div>
                                <InputLabel htmlFor="email" value="Email" className="font-medium text-[#10221C]" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="username"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div className="mt-5">
                                <div className="flex items-center justify-between">
                                    <InputLabel htmlFor="password" value="Password" className="font-medium text-[#10221C]" />
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-medium text-[#10221C] underline decoration-[#10221C]/30 decoration-2 underline-offset-2 hover:decoration-[#10221C]"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div className="mt-5 block">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-[#10221C]/15 text-[#101F1A] focus:ring-[#101F1A]"
                                    />
                                    <span className="ml-2 text-sm text-[#10221C]/80">Remember me</span>
                                </label>
                            </div>

                            <PrimaryButton
                                className="mt-7 flex w-full items-center justify-center gap-2 !rounded-md !bg-[#D6FF3F] !px-7 !py-3.5 font-display text-lg tracking-wide !text-[#101F1A] transition hover:!bg-[#c2ea2e] focus:!ring-[#101F1A]"
                                disabled={processing}
                            >
                                Log in {lastLoginMethod === 'email' && <span className="bg-[#10221C] text-[#D6FF3F] text-[10px] font-sans font-bold px-2 py-0.5 rounded-full tracking-normal">LAST USED</span>}
                            </PrimaryButton>

                            <div className="relative mt-8 flex items-center justify-center">
                                <div className="absolute inset-x-0 h-px bg-[#10221C]/10"></div>
                                <span className="relative bg-[#F5F2EA] px-4 text-sm text-[#10221C]/50">or log in with</span>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <a
                                    href={`/auth/google/player?facility=${facility.slug}`}
                                    className="relative flex w-full items-center justify-center gap-3 rounded-md border border-[#10221C]/15 bg-white px-7 py-3.5 font-medium text-[#10221C] transition hover:bg-gray-50 focus:ring-[#101F1A]"
                                >
                                    {lastLoginMethod === 'google' && (
                                        <span className="absolute -top-3 right-4 bg-[#10221C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm tracking-wide">LAST USED</span>
                                    )}
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </a>
                            </div>
                        </form>
                    </div>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap');
                .courtsync { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; }
                .font-display { font-family: 'Anton', ui-sans-serif, system-ui, sans-serif; }
            `}</style>
        </>
    );
}
