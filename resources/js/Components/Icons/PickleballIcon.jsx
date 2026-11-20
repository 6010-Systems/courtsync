import React, { useId } from 'react';

export default function PickleballIcon({
    className = '',
    size = 24,
    stroke = '#10221C',
    strokeWidth = 18,
    withHoleBorders = true,
    ...props
}) {
    const id = useId();
    const clipId = `pb-clip-${id.replace(/:/g, '')}`;
    const maskId = `pb-mask-${id.replace(/:/g, '')}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="44 32 282 282"
            width={size}
            height={size}
            role="img"
            aria-label="Pickleball"
            className={className}
            {...props}
        >
            <defs>
                <clipPath id={clipId}>
                    <circle cx="185" cy="173" r="123" />
                </clipPath>

                {/* White = visible, black = cut out (transparent) */}
                <mask id={maskId} maskUnits="userSpaceOnUse" x="44" y="32" width="282" height="282">
                    <rect x="44" y="32" width="282" height="282" fill="#FFFFFF" />
                    <g fill="#000000">
                        <circle cx="183" cy="123" r="21" />
                        <circle cx="135" cy="172" r="21" />
                        <circle cx="236" cy="175" r="21" />
                        <circle cx="186" cy="224" r="21" />

                        <ellipse cx="138" cy="84" rx="18" ry="12" transform="rotate(-30 138 84)" />
                        <ellipse cx="226" cy="87" rx="18" ry="12" transform="rotate(30 226 87)" />
                        <ellipse cx="271" cy="133" rx="19" ry="12" transform="rotate(60 271 133)" />
                        <ellipse cx="96" cy="127" rx="19" ry="12" transform="rotate(-60 96 127)" />
                        <ellipse cx="98" cy="214" rx="19" ry="12" transform="rotate(55 98 214)" />
                        <ellipse cx="274" cy="220" rx="19" ry="12" transform="rotate(-55 274 220)" />
                        <ellipse cx="144" cy="260" rx="18" ry="12" transform="rotate(25 144 260)" />
                        <ellipse cx="231" cy="263" rx="18" ry="12" transform="rotate(-25 231 263)" />
                    </g>
                </mask>
            </defs>

            <g mask={`url(#${maskId})`}>
                {/* Ball base (light highlight tone) */}
                <circle cx="185" cy="173" r="123" fill="#BCE232" />

                {/* Darker body, clipped to the ball, leaving a highlight in the upper right */}
                <g clipPath={`url(#${clipId})`}>
                    <circle cx="150" cy="215" r="150" fill="#AAD90A" />
                </g>
            </g>

            {/* Subtle dark borders on holes to prevent fading into white backdrops */}
            {withHoleBorders && stroke && (
                <g fill="none" stroke={stroke} strokeWidth="6" opacity="0.45">
                    <circle cx="183" cy="123" r="21" />
                    <circle cx="135" cy="172" r="21" />
                    <circle cx="236" cy="175" r="21" />
                    <circle cx="186" cy="224" r="21" />

                    <ellipse cx="138" cy="84" rx="18" ry="12" transform="rotate(-30 138 84)" />
                    <ellipse cx="226" cy="87" rx="18" ry="12" transform="rotate(30 226 87)" />
                    <ellipse cx="271" cy="133" rx="19" ry="12" transform="rotate(60 271 133)" />
                    <ellipse cx="96" cy="127" rx="19" ry="12" transform="rotate(-60 96 127)" />
                    <ellipse cx="98" cy="214" rx="19" ry="12" transform="rotate(55 98 214)" />
                    <ellipse cx="274" cy="220" rx="19" ry="12" transform="rotate(-55 274 220)" />
                    <ellipse cx="144" cy="260" rx="18" ry="12" transform="rotate(25 144 260)" />
                    <ellipse cx="231" cy="263" rx="18" ry="12" transform="rotate(-25 231 263)" />
                </g>
            )}

            {/* Crisp Dark Perimeter Border */}
            {stroke && strokeWidth > 0 && (
                <circle
                    cx="185"
                    cy="173"
                    r="123"
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                />
            )}
        </svg>
    );
}
