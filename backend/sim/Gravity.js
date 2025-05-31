export class Gravity {
    static GRAVITY_CONSTANT = 5;

    static gravityForce(body, attractor) {
        if (!body || !attractor || body === attractor) return [0, 0];
        const G = this.GRAVITY_CONSTANT;
        const dx = attractor.x - body.x;
        const dy = attractor.y - body.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);
        if (r < 1) return [0, 0];
        const F = G * (body.mass ?? 1) * (attractor.mass ?? 1) / r2;
        return [F * (dx / r), F * (dy / r)];
    }

    static idealOrbitParams(body, center) {
        const dx = body.x - center.x;
        const dy = body.y - center.y;
        const r = Math.hypot(dx, dy);
        const G = this.GRAVITY_CONSTANT;
        const vMag = Math.sqrt(G * (center.mass || 1) / r);
        const phase = Math.atan2(dy, dx);
        const angularSpeed = vMag / r;
        return { radius: r, angularSpeed, phase };
    }
}
