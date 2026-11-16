import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import { ButtonSpinner } from '@/Components/LoadingContext';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password — CourtSync" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#10221C] sm:text-3xl">
                        Confirm password
                    </h2>
                    <p className="mt-1 text-xs font-medium text-[#10221C]/65">
                        Please confirm your password to access this secure section.
                    </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101F1A]/5 text-[#101F1A]">
                    <ShieldCheck className="h-5 w-5" />
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel
                        htmlFor="password"
                        value="Your Password"
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
                            placeholder="••••••••"
                            className="h-11 w-full rounded-xl border-[#101F1A]/15 bg-white/80 pl-10 pr-10 text-sm font-medium text-[#101F1A] placeholder-[#101F1A]/35 shadow-xs transition-all focus:border-[#101F1A] focus:bg-white focus:ring-2 focus:ring-[#101F1A]/10"
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
                </div>

                <motion.button
                    type="submit"
                    disabled={processing}
                    whileHover={processing ? {} : { scale: 1.01 }}
                    whileTap={processing ? {} : { scale: 0.985 }}
                    className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D6FF3F] px-6 font-display text-sm font-bold tracking-wider uppercase text-[#101F1A] shadow-sm transition-colors hover:bg-[#c4ec32] hover:shadow-md disabled:opacity-50 cursor-pointer"
                >
                    {processing ? (
                        <span className="flex items-center gap-2">
                            <ButtonSpinner /> Confirming...
                        </span>
                    ) : (
                        <>
                            <span>Confirm Password & Continue</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                    )}
                </motion.button>
            </form>
        </GuestLayout>
    );
}
