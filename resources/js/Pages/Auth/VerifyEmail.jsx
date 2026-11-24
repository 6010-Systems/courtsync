import { ButtonSpinner } from '@/Components/LoadingContext';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, CheckCircle2, LogOut, RefreshCw } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verify Email — CourtSync" />

            <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6FF3F]/20 text-[#101F1A]">
                    <MailCheck className="h-7 w-7 text-[#101F1A]" />
                </div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#10221C] sm:text-3xl">
                    Verify your email
                </h2>
                <p className="mt-2 text-xs font-medium leading-relaxed text-[#10221C]/70">
                    Thanks for joining CourtSync! We have sent a verification link to your registered email address. Please click the link to activate your facility account.
                </p>
            </div>

            <AnimatePresence>
                {status === 'verification-link-sent' && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800"
                    >
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>A fresh verification link has been sent to your email.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-4">
                <motion.button
                    type="submit"
                    disabled={processing}
                    whileHover={processing ? {} : { scale: 1.01 }}
                    whileTap={processing ? {} : { scale: 0.985 }}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-colors hover:bg-[#c4ec32] hover:shadow-md disabled:opacity-50 cursor-pointer"
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <ButtonSpinner /> Resending link...
                        </span>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-45" />
                            <span>Resend Verification Email</span>
                        </>
                    )}
                </motion.button>
            </form>

            <div className="mt-6 border-t border-[#10221C]/10 pt-5 text-center">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10221C]/70 hover:text-[#10221C] transition hover:underline"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out of CourtSync
                </Link>
            </div>
        </GuestLayout>
    );
}
