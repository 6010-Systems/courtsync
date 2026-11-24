import React from 'react';

/**
 * Authentic vector logos for Philippine e-wallets (GCash & Maya)
 * Zero external image dependencies to prevent broken images or CORS blocks.
 */

export function GCashLogo({ className = 'h-5', size = 20 }) {
    return (
        <span className={`inline-flex items-center gap-1.5 font-bold tracking-tight text-[#005CEE] ${className}`}>
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                fill="none" 
                className="shrink-0"
                aria-label="GCash Icon"
            >
                <circle cx="16" cy="16" r="15" fill="#005CEE" />
                {/* Stylized white G with wireless payment arc */}
                <path 
                    d="M 21.5 16 C 21.5 12.96 19.04 10.5 16 10.5 C 12.96 10.5 10.5 12.96 10.5 16 C 10.5 19.04 12.96 21.5 16 21.5 C 18.2 21.5 20.08 20.2 21 18.3 L 18.5 18.3 C 17.85 19.1 17 19.5 16 19.5 C 14.07 19.5 12.5 17.93 12.5 16 C 12.5 14.07 14.07 12.5 16 12.5 C 17.5 12.5 18.77 13.44 19.25 14.77 L 16 14.77 L 16 16.7 L 21.4 16.7 C 21.47 16.47 21.5 16.24 21.5 16 Z" 
                    fill="#FFFFFF" 
                />
            </svg>
            <span className="font-black text-sm tracking-tight text-[#005CEE]">GCash</span>
        </span>
    );
}

export function MayaLogo({ className = 'h-5', size = 20 }) {
    return (
        <span className={`inline-flex items-center gap-1.5 font-bold tracking-tight text-[#050505] ${className}`}>
            <svg 
                viewBox="0 0 32 32" 
                width={size} 
                height={size} 
                fill="none" 
                className="shrink-0"
                aria-label="Maya Icon"
            >
                <circle cx="16" cy="16" r="15" fill="#00D668" />
                {/* Stylized M mark */}
                <path 
                    d="M 9 20.5 L 9 12 L 12.5 17.2 L 16 12 L 19.5 17.2 L 23 12 L 23 20.5 L 20.5 20.5 L 20.5 15.5 L 17.5 20 L 14.5 20 L 11.5 15.5 L 11.5 20.5 Z" 
                    fill="#101F1A" 
                />
            </svg>
            <span className="font-black text-sm tracking-tight text-[#101F1A]">maya</span>
        </span>
    );
}
