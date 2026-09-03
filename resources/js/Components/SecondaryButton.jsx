export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-xl border border-[#101F1A]/10 bg-[#F5F2EA] px-4 py-2 text-xs font-bold text-[#101F1A]/80 shadow-2xs transition-all duration-150 ease-in-out hover:bg-[#E8E4D9] hover:text-[#101F1A] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                    disabled && 'opacity-40 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
