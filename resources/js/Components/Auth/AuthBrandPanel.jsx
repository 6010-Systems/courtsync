import { Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Shared left-panel branding component — all animations via Framer Motion.
 *
 * Props:
 * @param {string}      badge         Small pill text shown above the headline
 * @param {React.Node}  titleNode     Full JSX headline
 * @param {string}      subtitle      Paragraph body text below the headline
 * @param {string}      logoHref      Where the logo/wordmark links to (default "/")
 * @param {React.Node}  logoNode      Full JSX for the logo wordmark (overrides default)
 * @param {string}      logoInitial   Single character shown in the logo icon square
 * @param {string|Node} bottomLeft    Text shown in the bottom-left of the panel
 * @param {React.Node}  children      Optional extra content (metric cards, feature lists, etc.)
 * @param {string}      bgImage       Optional background image URL (facility-branded panels)
 */

// Stagger container — children animate in smooth, tight sequence
const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.05, delayChildren: 0.06 },
    },
};

// Subtle micro-motion along the same direction as the panel
const itemVariants = {
    hidden:  { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// Badge pill shimmer — repeating left-to-right sweep
const shimmerVariants = {
    animate: {
        backgroundPosition: ['200% center', '-200% center'],
        transition: { duration: 3, ease: 'linear', repeat: Infinity },
    },
};

export default function AuthBrandPanel({
    badge,
    titleNode,
    subtitle,
    logoHref = '/',
    logoNode,
    logoInitial = 'C',
    bottomLeft,
    children,
    bgImage,
}) {
    const shouldReduce = useReducedMotion();

    return (
        <motion.div
            className="relative hidden flex-col justify-between overflow-hidden bg-[#101F1A] p-10 text-[#F5F2EA] lg:flex xl:p-14 bg-cover bg-center transform-gpu will-change-transform"
            style={{
                clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)',
                ...(bgImage ? { backgroundImage: `url(${bgImage})` } : {}),
            }}
            initial={shouldReduce ? false : { opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Dark gradient overlay — only when bgImage is set */}
            {bgImage && (
                <div className="absolute inset-0 bg-gradient-to-t from-[#101F1A] via-[#101F1A]/90 to-[#101F1A]/60 z-0" />
            )}

            {/* Ambient glow — top-left */}
            <div
                className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#D6FF3F]/10 blur-3xl z-0 transform-gpu"
            />
            {/* Ambient glow — bottom-right */}
            <div
                className="pointer-events-none absolute -bottom-24 right-12 h-96 w-96 rounded-full bg-[#D6FF3F]/5 blur-3xl z-0 transform-gpu"
            />

            {/* Dot-grid texture */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #D6FF3F 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Top Bar: Logo */}
            <motion.div
                className="relative z-10"
                initial={shouldReduce ? false : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
                <Link
                    href={logoHref}
                    className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-80"
                >
                    <motion.span
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D6FF3F] text-[#101F1A] font-black text-lg shadow-sm"
                        whileHover={{ scale: 1.12, rotate: -4 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                        {logoInitial}
                    </motion.span>
                    {logoNode ?? (
                        <span className="text-white">
                            Court<span className="text-[#D6FF3F]">Sync</span>
                        </span>
                    )}
                </Link>
            </motion.div>

            {/* Middle: Badge + Headline + Subtitle + children — staggered */}
            <motion.div
                className="relative z-10 my-auto max-w-lg py-10"
                variants={containerVariants}
                initial={shouldReduce ? false : 'hidden'}
                animate="visible"
            >
                {/* Badge pill with shimmer overlay */}
                {badge && (
                    <motion.div
                        variants={itemVariants}
                        className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#D6FF3F] backdrop-blur-md overflow-hidden"
                    >
                        {/* Shimmer sweep */}
                        <motion.span
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(214,255,63,0.3) 40%, rgba(255,255,255,0.2) 50%, rgba(214,255,63,0.3) 60%, transparent 100%)',
                                backgroundSize: '200% 100%',
                            }}
                            variants={shimmerVariants}
                            animate={shouldReduce ? {} : 'animate'}
                            aria-hidden="true"
                        />
                        <Sparkles className="h-3.5 w-3.5 relative z-10" />
                        <span className="relative z-10">{badge}</span>
                    </motion.div>
                )}

                {/* Headline */}
                {titleNode && (
                    <motion.div
                        variants={itemVariants}
                        className="mt-6 font-display text-5xl font-black leading-[1.02] tracking-tight text-white xl:text-6xl"
                    >
                        {titleNode}
                    </motion.div>
                )}

                {/* Subtitle */}
                {subtitle && (
                    <motion.p
                        variants={itemVariants}
                        className="mt-6 text-base leading-relaxed text-[#F5F2EA]/75 font-normal"
                    >
                        {subtitle}
                    </motion.p>
                )}

                {/* Children (metric cards, feature lists, etc.) */}
                {children && (
                    <motion.div variants={itemVariants} className="mt-8">
                        {children}
                    </motion.div>
                )}
            </motion.div>

            {/* Bottom bar */}
            <motion.div
                className="relative z-10 border-t border-white/10 pt-6 text-xs text-[#F5F2EA]/60"
                initial={shouldReduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
                <span>{bottomLeft ?? 'Powered by CourtSync'}</span>
            </motion.div>
        </motion.div>
    );
}
