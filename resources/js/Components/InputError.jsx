import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export default function InputError({ message, className = '', ...props }) {
    const shouldReduce = useReducedMotion();

    return (
        <AnimatePresence mode="wait">
            {message ? (
                <motion.p
                    {...props}
                    initial={shouldReduce ? false : { opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={'text-xs font-semibold text-red-600 overflow-hidden ' + className}
                >
                    {message}
                </motion.p>
            ) : null}
        </AnimatePresence>
    );
}

