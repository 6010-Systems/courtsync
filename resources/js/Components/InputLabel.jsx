import React from 'react';

export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-xs font-bold uppercase tracking-wider text-[#101F1A]/80 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
