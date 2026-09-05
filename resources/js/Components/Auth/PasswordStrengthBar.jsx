/**
 * Live password strength indicator.
 *
 * Displays 4 color-coded segments that fill as the password gains complexity:
 *   1 segment  — Too short (< 8 chars)
 *   2 segments — Weak (length OK, 1 extra rule)
 *   3 segments — Fair (length OK, 2 extra rules)
 *   4 segments — Strong (length OK, all 3 extra rules)
 *
 * Extra rules checked: uppercase letter, number, special character.
 *
 * @param {string} password The current password value to evaluate.
 */
export default function PasswordStrengthBar({ password }) {
    if (!password) return null;

    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const passed = [checks.length, checks.upper, checks.number, checks.special].filter(Boolean).length;

    // Score: 0 = nothing typed, 1–4 progressively stronger
    // We only show strength after the user has started typing
    const score = !checks.length ? 1 : passed; // clamp to 1 if too short

    const levels = [
        { min: 1, color: 'bg-red-400',    label: 'Too short' },
        { min: 2, color: 'bg-orange-400', label: 'Weak' },
        { min: 3, color: 'bg-yellow-400', label: 'Fair' },
        { min: 4, color: 'bg-emerald-400', label: 'Strong' },
    ];

    const current = levels[score - 1];

    return (
        <div className="mt-2 space-y-1.5" aria-live="polite" aria-atomic="true">
            {/* 4-segment bar */}
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((seg) => (
                    <div
                        key={seg}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            seg <= score ? current.color : 'bg-[#10221C]/10'
                        }`}
                    />
                ))}
            </div>

            {/* Label */}
            <p className="text-[11px] font-semibold text-[#10221C]/55">
                {current.label}
                {score === 4 && (
                    <span className="ml-1 text-emerald-600">✓</span>
                )}
            </p>
        </div>
    );
}
