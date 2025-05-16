export function normalizeAngle(angle) {
    return (angle + 2 * Math.PI) % (2 * Math.PI);
}

export function shortestPositiveDelta(current, target) {
    const a = normalizeAngle(current);
    const b = normalizeAngle(target);
    let delta = b - a;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return delta;
}
