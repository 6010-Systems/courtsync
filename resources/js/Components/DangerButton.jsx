import React from 'react';

export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-[#FF5A36] px-4 py-2 text-xs font-bold text-white shadow-subtle transition-all duration-150 ease-in-out hover:bg-[#e04826] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36] focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    disabled && 'opacity-40 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
