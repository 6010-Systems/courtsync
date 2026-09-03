import InputError from '@/Components/InputError';
import { ButtonSpinner } from '@/Components/LoadingContext';
import Modal from '@/Components/Modal';
import { useToast } from '@/Components/ToastContext';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Lock, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const { addToast } = useToast();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                addToast({
                    type: 'info',
                    title: 'Account Deleted',
                    message: 'Your account and data have been removed.',
                });
            },
            onError: () => {
                passwordInput.current?.focus();
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        clearErrors();
        reset();
    };

    return (
        <section className={className}>
            <header className="border-b border-[#FF5A36]/15 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF5A36]">
                    <AlertTriangle size={14} />
                    <span>Danger Zone</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-[#101F1A]">
                    Delete Account
                </h2>
                <p className="mt-0.5 text-xs text-[#101F1A]/60">
                    Permanently delete your account and all associated venue management access.
                </p>
            </header>

            <div className="mt-5 rounded-xl border border-[#FF5A36]/20 bg-[#FF5A36]/5 p-4 text-xs text-[#101F1A]/70">
                <p className="font-medium">
                    Once your account is deleted, all resources, bookings history, and personal credentials will be permanently erased.
                </p>
            </div>

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={confirmUserDeletion}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#FF5A36] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#FF5A36]/90 hover:shadow-md active:scale-95"
                >
                    <Trash2 size={14} />
                    <span>Delete Account</span>
                </button>
            </div>

            {/* Confirmation Modal */}
            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <div className="flex items-center justify-between border-b border-[#101F1A]/10 pb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#FF5A36]">
                            <AlertTriangle size={18} />
                            <span>Confirm Account Deletion</span>
                        </div>
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-lg p-1 text-[#101F1A]/40 transition-colors hover:bg-[#101F1A]/[0.06] hover:text-[#101F1A]"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-[#101F1A]/70">
                        Are you sure you want to permanently delete your account? Please enter your current password to verify your identity and confirm deletion.
                    </p>

                    <div className="mt-4">
                        <label htmlFor="confirm_password" className="block text-xs font-bold text-[#101F1A]">
                            Password
                        </label>
                        <div className="relative mt-1.5 flex items-center">
                            <span className="pointer-events-none absolute left-3 text-[#101F1A]/40">
                                <Lock size={15} />
                            </span>
                            <input
                                id="confirm_password"
                                type="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="h-10 w-full rounded-xl border border-[#101F1A]/15 bg-white pl-9 pr-3 text-xs font-medium text-[#101F1A] placeholder-[#101F1A]/40 shadow-xs transition-all focus:border-[#FF5A36] focus:outline-none focus:ring-1 focus:ring-[#FF5A36]"
                                isFocused
                                placeholder="Enter password to confirm"
                            />
                        </div>
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#101F1A]/10 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-[#101F1A]/15 bg-white px-4 text-xs font-bold text-[#101F1A] transition-all hover:bg-[#F5F2EA] active:scale-95"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#FF5A36] px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#FF5A36]/90 hover:shadow-md active:scale-95 disabled:opacity-50"
                        >
                            {processing && <ButtonSpinner />}
                            <span>Delete Permanently</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
