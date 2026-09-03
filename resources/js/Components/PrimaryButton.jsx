export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-[#101F1A] px-4 py-2 text-xs font-bold text-[#D6FF3F] shadow-subtle transition-all duration-150 ease-in-out hover:bg-[#162923] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                    disabled && 'opacity-40 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
