import { checkSpokeCollision } from "./shapes/analyze.js";

export class Physics {
    static step(world, dt) {
        this.integrate(world, dt);
        this.handleCollisions(world);
        // Future: gravity(world, dt), etc.
    }

    static integrate(world, dt) {
        for (const b of world.bodies) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (b.omega) {
                b.angle = (b.angle + b.omega * dt) % (2 * Math.PI);
            }
        }
    }

    static handleCollisions(world) {
        const bodies = world.bodies;
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                if (a.ID.startsWith('player') || b.ID.startsWith('player')) continue;
                if (checkSpokeCollision(a, b)) {
                    Physics.resolveElasticCollision( a, b, 
                        {options: {
                            normalA: a.shape.normals,
                            normalB: b.shape.normals
                        }}
                    );
                    console.log(`[COLLISION] ${a.ID} ↔ ${b.ID}`);
                    // Optional: emit bus event, apply damage, etc.
                }
            }
        }
    }

    static resolveElasticCollision(a, b, options = {}) {
        // options: {
        //   contactPoint: [x, y],           // world-space contact point (optional, fallback to mid-point between a/b)
        //   normalA: [nxA, nyA],            // interpolated normal at contact for body a (required)
        //   normalB: [nxB, nyB],            // interpolated normal at contact for body b (optional, can be ignored)
        //   restitution: 0.6,               // bounciness, default
        // }
        const restitution = options.restitution ?? 0.6;

        // 1. Find collision normal.
        // If provided, use normalA (in world coords, interpolated).
        // Assuming normalA and normalB are both [nx, ny] 
        // This matters for non-spherical collisions
        let nx, ny;
        if (options.normalA && options.normalB) {
            nx = options.normalA[0] + options.normalB[0];
            ny = options.normalA[1] + options.normalB[1];
            const len = Math.hypot(nx, ny) || 1e-12;
            nx /= len;
            ny /= len;
        } else if (options.normalA) {
            // If provided, use normalA (in world coords, interpolated).
            [nx, ny] = options.normalA;
        } else {
            // fallback: center-to-center normal (less accurate)
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1e-12;
            nx = dx / dist;
            ny = dy / dist;
        }

        // 2. Compute relative velocity along normal.
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const relVel = rvx * nx + rvy * ny;

        // 3. If separating, don't apply impulse (but DO position correction elsewhere)
        // if (relVel > 0) retursn;

        // TODO: Handle position correction (optional, separate from this method usually)

        // 5. Impulse magnitude: two cases
        const aMass = a.mass;
        const bMass = b.mass;

        // --- Case: only one moves (projectile/wall or similar)
        if (aMass === 0 || bMass === 0) {
            // Projectiles (mass 0) bounce off and do not affect the target
            const proj = aMass === 0 ? a : b;
            const wall = aMass === 0 ? b : a;
            // The normal is relative to the projectile's surface at contact (should be supplied/interpolated)
            // We'll assume nx, ny is oriented so proj bounces away from wall
            // Relative velocity along normal:
            const projVelAlongNormal = (proj.vx - wall.vx) * nx + (proj.vy - wall.vy) * ny;
            // Only bounce if moving toward wall
            if (projVelAlongNormal >= 0) return;

            // Standard impulse calculation (no mass term, wall never moves)
            const impulseMag = -(1 + restitution) * projVelAlongNormal;

            proj.vx += impulseMag * nx;
            proj.vy += impulseMag * ny;
            // Optionally: apply some spin depending on offset from center, etc.
            // proj.omega += ...; (customize as needed)

            return;
        }

        // --- Case: both move (classic elastic collision)
        // Calculate inverse mass (avoiding 1/0 for safety)
        const invMassA = aMass > 0 ? 1 / aMass : 0;
        const invMassB = bMass > 0 ? 1 / bMass : 0;

        const impulseMag = -(1 + restitution) * relVel / (invMassA + invMassB);

        const impulseX = impulseMag * nx;
        const impulseY = impulseMag * ny;

        a.vx -= impulseX * invMassA;
        a.vy -= impulseY * invMassA;
        // a.omega -= ...; // add torque if you have offset/contact point

        b.vx += impulseX * invMassB;
        b.vy += impulseY * invMassB;
        // b.omega += ...; // add torque if you have offset/contact point

        // Optionally: handle friction, spin, or angular velocity with better surface model
    }

}
