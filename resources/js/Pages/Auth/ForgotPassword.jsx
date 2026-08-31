import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

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
            <Head title="Forgot Password" />

            <div className="courtsync flex min-h-screen items-center justify-center bg-[#F5F2EA] px-6 py-16 text-[#10221C]">
                <div className="w-full max-w-sm">
                    <Link
                        href="/"
                        className="font-display text-2xl tracking-tight text-[#10221C]"
                    >
                        Court<span className="text-[#FF5A36]">Sync</span>
                    </Link>

                    <h2 className="mt-8 font-display text-3xl tracking-tight text-[#10221C]">
                        Forgot password?
                    </h2>
                    <p className="mt-2 leading-relaxed text-[#10221C]/60">
                        No problem. Enter your email and we&apos;ll send you
                        a link to choose a new one.
                    </p>

                    {status && (
                        <div className="mt-6 rounded-md border border-[#10221C]/10 bg-[#D6FF3F]/20 px-4 py-3 text-sm font-medium text-[#10221C]">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-8">
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                            isFocused={true}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                        />

                        <InputError message={errors.email} className="mt-2" />

                        <PrimaryButton
                            className="mt-7 flex w-full items-center justify-center !rounded-md !bg-[#D6FF3F] !px-7 !py-3.5 font-display text-lg tracking-wide !text-[#101F1A] transition hover:!bg-[#c2ea2e] focus:!ring-[#101F1A]"
                            disabled={processing}
                        >
                            Email reset link
                        </PrimaryButton>
                    </form>
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
