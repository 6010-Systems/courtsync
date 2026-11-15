const STAGES = [
    { end: 0.14, x: 0.87, y: 0.65, arc: 0 },
    { end: 0.56, x: 0.76, y: 0.7, arc: 0.6 },
    { end: 0.86, x: 0.9, y: 0.84, arc: 0.28 },
    { end: 1, x: 0.86, y: 0.94, arc: 0.1 },
];

const CONTACTS = [
    { at: 0.14, x: 0.87, y: 0.65 },
    { at: 0.56, x: 0.76, y: 0.7 },
    { at: 0.86, x: 0.9, y: 0.84 },
];

export function getLandingBallMotion(value) {
    const progress = Math.max(0, Math.min(1, value));
    const contact = CONTACTS.reduce((nearest, candidate) => (
        Math.abs(candidate.at - progress) < Math.abs(nearest.at - progress) ? candidate : nearest
    ));
    const offset = progress - contact.at;
    const visibility = Math.max(0, Math.min(1, (0.095 - Math.abs(offset)) / 0.035));
    const impact = Math.max(0, 1 - Math.abs(offset) / 0.012);
    const swing = Math.max(-1, Math.min(1, offset / 0.035));
    let start = { end: 0, x: 0.87, y: 0.08 };

    for (const stage of STAGES) {
        if (progress <= stage.end) {
            const t = (progress - start.end) / (stage.end - start.end);
            const eased = t * t * (3 - 2 * t);
            const lift = 4 * stage.arc * t * (1 - t);
            const y = start.y + (stage.y - start.y) * (stage.arc === 0 ? t * t : t) - lift;

            return {
                x: start.x + (stage.x - start.x) * eased,
                y,
                rotation: progress * 1080,
                shadowScale: 1 - Math.min(Math.max(0.94 - y, 0), 0.65),
                shadowOpacity: 0.32 - Math.min(Math.max(0.94 - y, 0) * 0.3, 0.24),
                paddleOpacity: visibility,
                paddleRotation: swing * -18,
                paddleLift: swing * -10,
                paddleX: contact.x,
                paddleY: contact.y,
                impact,
                scaleX: 1 + impact * 0.12,
                scaleY: 1 - impact * 0.12,
            };
        }

        start = stage;
    }
}