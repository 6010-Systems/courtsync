import { createContext, useCallback, useContext, useState } from 'react';

// ── Context ───────────────────────────────────────────────────────────────────
const LoadingContext = createContext(null);

// ── Spinner SVG ───────────────────────────────────────────────────────────────
function Spinner({ size = 40, color = '#D6FF3F' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Track ring */}
            <circle
                cx="20" cy="20" r="16"
                stroke={color}
                strokeOpacity="0.15"
                strokeWidth="3.5"
            />
            {/* Spinning arc */}
            <circle
                cx="20" cy="20" r="16"
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="62"
                strokeDashoffset="46"
                style={{ transformOrigin: '20px 20px', animation: 'cs-spin 0.8s linear infinite' }}
            />
            <style>{`
                @keyframes cs-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </svg>
    );
}

// ── Full-screen loading overlay ───────────────────────────────────────────────
function LoadingOverlay({ visible, message }) {
    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={message ?? 'Loading…'}
            className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#101F1A]/70 backdrop-blur-sm"
        >
            <Spinner size={48} color="#D6FF3F" />
            {message && (
                <p className="mt-4 text-sm font-medium text-[#F5F2EA]/80">
                    {message}
                </p>
            )}
        </div>
    );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function LoadingProvider({ children }) {
    const [state, setState] = useState({ visible: false, message: null });

    const showLoading = useCallback((message = null) => {
        setState({ visible: true, message });
    }, []);

    const hideLoading = useCallback(() => {
        setState({ visible: false, message: null });
    }, []);

    return (
        <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading: state.visible }}>
            {children}
            <LoadingOverlay visible={state.visible} message={state.message} />
        </LoadingContext.Provider>
    );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error('useLoading must be used within a <LoadingProvider>');
    return ctx;
}

// ── Inline button spinner (reusable, exported separately) ─────────────────────
export function ButtonSpinner({ size = 18, color = 'currentColor' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
        >
            <circle
                cx="12" cy="12" r="9"
                stroke={color}
                strokeOpacity="0.25"
                strokeWidth="2.5"
            />
            <circle
                cx="12" cy="12" r="9"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="37"
                strokeDashoffset="28"
                style={{ transformOrigin: '12px 12px', animation: 'cs-spin 0.75s linear infinite' }}
            />
        </svg>
    );
}
