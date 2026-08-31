import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
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
            <Head title="Register" />

            <div className="courtsync grid min-h-screen bg-[#F5F2EA] text-[#10221C] lg:grid-cols-[1.1fr,1fr]">
                {/* Left — dark diagonal-cut branding panel, mirrors the hero. Full-bleed background, content rail centers against the shared 1280 line. */}
                <div
                    className="relative hidden flex-col justify-between bg-[#101F1A] py-10 text-[#F5F2EA] lg:flex"
                    style={{
                        clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)',
                    }}
                >
                    <div className="ml-auto w-full max-w-[704px] px-10">
                        <Link
                            href="/"
                            className="font-display text-2xl tracking-tight"
                        >
                            Court<span className="text-[#D6FF3F]">Sync</span>
                        </Link>
                    </div>

                    <div className="ml-auto w-full max-w-[704px] px-10">
                        <div className="max-w-sm">
                            <h1 className="font-display text-5xl leading-[0.95] tracking-tight">
                                NEVER MISS
                                <br />
                                YOUR
                                <br />
                                <span className="text-[#D6FF3F]">
                                    SLOT AGAIN.
                                </span>
                            </h1>
                            <p className="mt-6 leading-relaxed text-[#F5F2EA]/70">
                                Create an account to book courts across the
                                Philippines, save your favorite facilities,
                                and check in without the line.
                            </p>
                        </div>
                    </div>

                    <div className="ml-auto w-full max-w-[704px] px-10">
                        <div className="w-56 rotate-2 rounded-lg bg-[#F5F2EA] p-4 text-[#10221C] shadow-xl">
                            <p className="font-display text-base">
                                Court A · Badminton
                            </p>
                            <p className="mt-1 text-sm text-[#10221C]/60">
                                8:00 – 9:00 PM · ₱320
                            </p>
                            <span className="mt-2 inline-block rounded-full bg-[#FF5A36]/20 px-2.5 py-1 text-xs font-semibold text-[#B8391D]">
                                2 left
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right — form. Full-bleed background, content rail centers against the shared 1280 line. */}
                <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-10">
                    <div className="mr-auto w-full max-w-[576px] px-0 lg:pr-10">
                    <div className="mx-auto w-full max-w-sm">
                        <Link
                            href="/"
                            className="font-display text-2xl tracking-tight text-[#10221C] lg:hidden"
                        >
                            Court
                            <span className="text-[#FF5A36]">Sync</span>
                        </Link>

                        <h2 className="mt-8 font-display text-3xl tracking-tight text-[#10221C] lg:mt-0">
                            Create your account
                        </h2>
                        <p className="mt-2 text-[#10221C]/60">
                            Already have one?{' '}
                            <Link
                                href={route('login')}
                                className="font-medium text-[#10221C] underline decoration-[#D6FF3F] decoration-2 underline-offset-2"
                            >
                                Log in
                            </Link>
                        </p>

                        <form onSubmit={submit} className="mt-8">
                            <div>
                                <InputLabel
                                    htmlFor="name"
                                    value="Name"
                                    className="font-medium text-[#10221C]"
                                />

                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-5">
                                <InputLabel
                                    htmlFor="email"
                                    value="Email"
                                    className="font-medium text-[#10221C]"
                                />

                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="username"
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.email}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-5">
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                    className="font-medium text-[#10221C]"
                                />

                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.password}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-5">
                                <InputLabel
                                    htmlFor="password_confirmation"
                                    value="Confirm password"
                                    className="font-medium text-[#10221C]"
                                />

                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1.5 block w-full rounded-md border-[#10221C]/15 bg-white focus:border-[#101F1A] focus:ring-[#101F1A]"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    required
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-2"
                                />
                            </div>

                            <PrimaryButton
                                className="mt-7 flex w-full items-center justify-center !rounded-md !bg-[#D6FF3F] !px-7 !py-3.5 font-display text-lg tracking-wide !text-[#101F1A] transition hover:!bg-[#c2ea2e] focus:!ring-[#101F1A]"
                                disabled={processing}
                            >
                                Create account
                            </PrimaryButton>
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
