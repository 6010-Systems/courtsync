import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'h-10 rounded-xl border-[#101F1A]/15 bg-white px-3.5 py-2 text-xs text-[#101F1A] placeholder:text-[#101F1A]/40 shadow-2xs focus:border-[#D6FF3F] focus:ring-1 focus:ring-[#D6FF3F] transition-all ' +
                className
            }
            ref={localRef}
        />
    );
});
