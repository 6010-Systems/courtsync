import React from 'react';

export default function BasketballIcon({
    className = '',
    size = 24,
    stroke = '#10221C',
    strokeWidth = 2,
    ...props
}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width={size}
            height={size}
            role="img"
            aria-label="Basketball"
            className={className}
            {...props}
        >
            {/* Ball body with rich athletic orange fill */}
            <circle 
                cx="16" 
                cy="16" 
                r="14" 
                fill="#FF7A00" 
                stroke={stroke} 
                strokeWidth={strokeWidth} 
            />
            {/* Horizontal & Vertical Seam Ribs */}
            <line x1="2" y1="16" x2="30" y2="16" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
            <line x1="16" y1="2" x2="16" y2="30" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
            {/* Curved Characteristic Basketball Seams */}
            <path d="M 6.1 6.1 C 12 11 12 21 6.1 25.9" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
            <path d="M 25.9 6.1 C 20 11 20 21 25.9 25.9" fill="none" stroke={stroke} strokeWidth={strokeWidth * 0.8} />
        </svg>
    );
}
