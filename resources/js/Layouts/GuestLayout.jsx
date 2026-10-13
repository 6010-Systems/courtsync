import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';

export default function GuestLayout({ children }) {
    const shouldReduce = useReducedMotion();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F2EA] px-6 py-12 text-[#10221C] overflow-x-hidden">
            <motion.div
                initial={shouldReduce ? false : { opacity: 0, scale: 0.98, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md rounded-2xl border border-[#10221C]/10 bg-white/80 p-8 shadow-card backdrop-blur-sm sm:p-10"
            >
                <div className="mb-6 flex items-center justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-[#10221C] hover:opacity-80 transition-opacity"
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101F1A] text-[#D6FF3F] font-black text-sm">
                            C
                        </span>
                        <span>Court<span className="text-[#FF5A36]">Sync</span></span>
                    </Link>
                </div>

                {children}
            </motion.div>
        </div>
    );
}

