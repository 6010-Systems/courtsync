import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, ArrowLeft, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password — CourtSync" />

            <div className="flex min-h-screen items-center justify-center bg-[#F5F2EA] px-6 py-12 text-[#10221C]">
                <div className="w-full max-w-md rounded-2xl border border-[#10221C]/10 bg-white/80 p-8 shadow-card backdrop-blur-sm sm:p-10">
                    <div className="mb-6 flex items-center justify-between">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-[#10221C]"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] font-black text-sm">
                                C
                            </span>
                            <span>Court<span className="text-[#FF5A36]">Sync</span></span>
                        </Link>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#101F1A]/5 text-[#101F1A]">
                            <KeyRound className="h-5 w-5" />
                        </div>
                    </div>

                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#10221C] sm:text-3xl">
                        Forgot password?
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-[#10221C]/65 font-medium">
                        No worries. Enter your registered email and we&apos;ll send you instructions to reset your password.
                    </p>

                    {status && (
                        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>{status}</span>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-6 space-y-4">
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
                                    placeholder="your@email.com"
                                    className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-3.5 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-all hover:bg-[#c4ec32] hover:shadow-md active:scale-[0.99] disabled:opacity-50"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <ButtonSpinner /> Sending link...
                                </span>
                            ) : (
                                <>
                                    <span>Send Reset Link</span>
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-[#10221C]/10 pt-5 text-center">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10221C] hover:underline"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to login
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
