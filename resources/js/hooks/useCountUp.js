import { useEffect, useRef, useState } from 'react';

/**
 * Animates a numeric value from 0 to `target` over `durationMs` milliseconds.
 * Respects `prefers-reduced-motion` — jumps straight to the final value if set.
 *
 * @param {number} target     The final value to count up to.
 * @param {number} durationMs Animation duration in milliseconds (default 1400).
 * @returns {number}          The current animated value.
 */
export function useCountUp(target, durationMs = 1400) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        if (prefersReduced) {
            setValue(target);
            return;
        }

        const start = performance.now();

        const tick = (now) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) {
                ref.current = requestAnimationFrame(tick);
            }
        };

        ref.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(ref.current);
    }, [target, durationMs]);

    return value;
}
