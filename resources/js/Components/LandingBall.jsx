import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { getLandingBallMotion } from './landingBallMotion';
import { useId } from 'react';

export default function LandingBall() {
    const id = useId().replace(/:/g, '');
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 30, mass: 0.6 });
    const frame = useTransform(progress, getLandingBallMotion);
    const x = useTransform(frame, (value) => `calc(${value.x * 100}vw - var(--ball-size) / 2)`);
    const y = useTransform(frame, (value) => `calc(var(--ball-top-inset) + (100dvh - 144px - var(--ball-top-inset)) * ${value.y})`);
    const rotation = useTransform(frame, (value) => value.rotation);
    const paddleOpacity = useTransform(frame, (value) => value.paddleOpacity);
    const paddleRotation = useTransform(frame, (value) => value.paddleRotation);
    const paddleX = useTransform(frame, (value) => `calc(${value.paddleX * 100}vw - var(--paddle-center))`);
    const paddleY = useTransform(frame, (value) => `calc((100dvh - 144px) * ${value.paddleY} + var(--ball-size) - var(--paddle-contact) + ${value.paddleLift}px)`);
    const scaleX = useTransform(frame, (value) => value.scaleX);
    const scaleY = useTransform(frame, (value) => value.scaleY);
    const shadowScale = useTransform(frame, (value) => value.shadowScale);
    const shadowOpacity = useTransform(frame, (value) => value.shadowOpacity);

    if (reduceMotion) {
        return null;
    }

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none [--ball-top-inset:160px] [--ball-size:32px] [--paddle-center:31px] [--paddle-contact:3.5px] [--paddle-pivot:16.5px] sm:[--ball-top-inset:0px] sm:[--ball-size:72px] sm:[--paddle-center:62px] sm:[--paddle-contact:7px] sm:[--paddle-pivot:33px]">
            <motion.div
                className="absolute left-0 top-0 hidden h-[100px] w-36 sm:block"
                style={{ x: paddleX, y: paddleY, opacity: paddleOpacity, rotate: paddleRotation, transformOrigin: 'var(--paddle-center) var(--paddle-pivot)' }}
            >
                <svg viewBox="0 0 144 100" fill="none" className="h-full w-full drop-shadow-lg">
                    <defs>
                        <linearGradient id={`${id}-edge`} x1="20" y1="28" x2="90" y2="65" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#718878" /><stop offset="0.45" stopColor="#17251E" /><stop offset="1" stopColor="#070F0B" />
                        </linearGradient>
                        <linearGradient id={`${id}-face`} x1="30" y1="8" x2="85" y2="55" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#587461" /><stop offset="0.4" stopColor="#243E31" /><stop offset="1" stopColor="#0C1C14" />
                        </linearGradient>
                        <linearGradient id={`${id}-grip`} x1="88" y1="62" x2="107" y2="89" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#111B16" /><stop offset="0.45" stopColor="#59675C" /><stop offset="0.7" stopColor="#26382C" /><stop offset="1" stopColor="#0D1711" />
                        </linearGradient>
                        <pattern id={`${id}-weave`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
                            <path d="M0 0H5M0 0V5" stroke="#C8D9C7" strokeOpacity="0.13" strokeWidth="0.65" />
                        </pattern>
                    </defs>
                    <path d="M77 48L91 57L123 86Q126 90 121 95L115 99L107 98L78 65L69 58Z" fill="#0B130F" />
                    <path d="M77 44L92 55L119 84Q123 88 119 92L112 96Q109 98 105 93L78 62L69 54Z" fill={`url(#${id}-grip)`} stroke="#0D1711" strokeWidth="2" />
                    <path d="M91 63L103 61M96 69L108 67M101 75L113 73M106 81L118 79M110 87L120 85" stroke="#A6B3A5" strokeOpacity="0.45" strokeWidth="2.5" />
                    <path d="M107 93L116 88L122 91L115 98Z" fill="#D6FF3F" />
                    <ellipse cx="62" cy="40" rx="51" ry="26" fill={`url(#${id}-edge)`} />
                    <ellipse cx="62" cy="33" rx="51" ry="26" fill={`url(#${id}-face)`} stroke="#A5BC72" strokeWidth="2" />
                    <ellipse cx="62" cy="33" rx="46" ry="22" fill={`url(#${id}-weave)`} stroke="#C5D8BC" strokeOpacity="0.25" />
                    <path d="M19 27C28 9 75 6 98 21" stroke="#F0FFD9" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M26 52C44 64 83 64 104 46" stroke="#070E0A" strokeWidth="3" strokeLinecap="round" />
                    <path d="M40 40L76 23" stroke="#D6FF3F" strokeOpacity="0.5" strokeWidth="3" />
                </svg>
            </motion.div>

            <motion.div
                className="absolute left-0 top-0 h-1.5 w-8 rounded-[50%] bg-black blur-[3px] sm:h-3 sm:w-[72px] sm:blur-[6px]"
                style={{ x, y: 'calc((100dvh - 144px) * 0.94 + var(--ball-size) - 7px)', scale: shadowScale, opacity: shadowOpacity }}
            />

            <motion.div className="absolute left-0 top-0 h-8 w-8 sm:h-[72px] sm:w-[72px]" style={{ x, y, scaleX, scaleY, transformOrigin: '50% 100%' }}>
                <motion.img
                    src="/assets/ball.png"
                    alt=""
                    draggable={false}
                    width="128"
                    height="128"
                    className="h-full w-full rounded-full object-contain"
                    style={{ rotate: rotation }}
                />
                <span
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 28% 22%, #ffffff38, transparent 42%), radial-gradient(circle at 75% 82%, #07130b77, transparent 68%)',
                        boxShadow: 'inset -4px -6px 10px #07130b30',
                    }}
                />
            </motion.div>
        </div>
    );
}