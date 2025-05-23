// physics/GravitySystem.js
export class Gravity {

    static updateGravity(world, dt) { 
        const bodies = world.bodies;
        for (const body of bodies) {

            this.updateAttractors(body, world)


            // Apply Gravity forces of attractors
            let fx = 0, fy = 0;
            for (const attractor of body.attractors) {
                const [gx, gy] = this.blendedGravity(body, attractor);
                fx += gx; fy += gy;
            }

            ///Snap to elastic orbit if only one attractor dominates
            if (body.attractors) {
                // this.applyElasticOrbit(body, body.attractors[0], dt);
            }


            // Update velocity/position
            const mass = body.gravityMass || 1; // Always nonzero for math
            body.vx += fx / mass * dt;
            body.vy += fy / mass * dt;
            // console.log(fy);
            // body.x += body.vx * dt;
            // body.y += body.vy * dt;



            // Inherit parent velocity for rendering/world movement
            if (body.parent) {
                const [pvx, pvy] = getWorldVelocity(body);
                body.vx += pvx; body.vy += pvy;
            }
        }
     }

    static updateAttractors(body, world) {
        const candidates = this.findNearbyAttractors(body, world);
        body.attractors = candidates;
    }

    static findNearbyAttractors(body, world) {
        // ---- Settings ----
        const MAX_ATTRACTORS = 3;          // max returned, for performance
        const MAX_ATTRACTOR_DIST = 2e5;    // only consider within this range (arbitrary, tune as needed)
        const MIN_ATTRACTOR_MASS = 1;      // ignore tiny masses
        const ALWAYS_INCLUDE_TYPES = ['none']; // always include these, even if far

        // Gather all potential attractors from world lists (or fallback to filtering world.bodies)
        let candidates = [];
        if (world.planets) candidates = candidates.concat(world.planets);
        if (world.stars) candidates = candidates.concat(world.stars);
        if (world.blackHoles) candidates = candidates.concat(world.blackHoles);
        // ... add more as you support them
        // If no explicit lists, fallback:
        if (candidates.length === 0) {
            candidates = world.bodies.filter(b =>
                ['planet', 'star', 'blackhole'].includes(b.type)
            );
            // console.log(world.bodies)
        }

        // Remove self and any bodies too small or unphysical
        candidates = candidates.filter(a =>
            a !== body && (a.mass || 0) >= MIN_ATTRACTOR_MASS
        );

        // Compute distances and filter
        let scored = candidates.map(a => {
            const dx = a.x - body.x;
            const dy = a.y - body.y;
            const dist = Math.hypot(dx, dy);
            let isAlways = ALWAYS_INCLUDE_TYPES.includes(a.type);
            return {
                attractor: a,
                dist,
                isAlways,
                hill: (a.parent) ? getHillRadius(a, a.parent) : Infinity, // or 0 if no parent
            };
        });

        // Only keep attractors within their Hill radius or a max global distance,
        // OR those marked as always include (e.g. blackhole)
        scored = scored.filter(s =>
            s.isAlways ||
            s.dist < Math.min(s.hill * 1.5, MAX_ATTRACTOR_DIST)
        );

        // Sort by distance (closest first)
        scored.sort((a, b) => a.dist - b.dist);

        // Limit to top N
        scored = scored.slice(0, MAX_ATTRACTORS);
        

        // Return attractor objects (not scores)
        return scored.map(s => s.attractor);
    }

    static getHillRadius(attractor, parent) {
        // Classic Hill sphere formula (in simple form):
        // r_Hill = a * (m1 / (3 * m2))^(1/3)
        //   - a = distance between attractor and parent
        //   - m1 = mass of attractor
        //   - m2 = mass of parent (must be > 0)

        if (!attractor || !parent) return Infinity; // No parent = infinite (global) influence

        const m1 = attractor.mass ?? attractor.gravityMass ?? 1;
        const m2 = parent.mass ?? parent.gravityMass ?? 1;

        if (m2 <= 0) return Infinity;

        // Compute center-to-center distance
        const dx = attractor.x - parent.x;
        const dy = attractor.y - parent.y;
        const a = Math.hypot(dx, dy);

        // If zero distance (shouldn't happen), default to some value
        if (!isFinite(a) || a === 0) return 0;

        // Hill radius formula
        const rHill = a * Math.pow(m1 / (3 * m2), 1 / 3);

        // Optionally: clamp to nonnegative
        return Math.max(rHill, 0);
    }


    static gravityForce(body, attractor){
        // Universal gravitation: F = G * m1 * m2 / r^2
        // This returns the force vector [fx, fy] to be applied to body

        const G = 1; // Magic constant

        if (!body || !attractor || body === attractor) return [0, 0];

        // Use gravityMass for calculation if available, otherwise fall back to mass
        const m1 = body.mass ?? 1;
        const m2 = attractor.mass ?? 1;

        // Compute direction vector from body to attractor
        const dx = attractor.x - body.x;
        const dy = attractor.y - body.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);

        // Avoid division by zero or extremely strong forces at close range
        const minDist = 1e-3; // Set this higher for "softer" close encounters
        if (r < minDist) return [0, 0];

        // Magnitude of force
        const F = G * m1 * m2 / r2;

        // Normalize direction
        const fx = F * (dx / r);
        const fy = F * (dy / r);

        return [fx, fy];

    }

    static blendedGravity(body,attractor) {
        if (!body.parent) return [0, 0];
        const d = distance(body, attractor);
        const rHill = getHillRadius(attractor, attractor.parent);

        if (d < 0.8 * rHill) {
            // Fully parent gravity
            return gravityForce(body, attractor);
        } else if (d < 1.2 * rHill && attractor.parent) {
            // Blend forces
            let blend = (d - 0.8 * rHill) / (0.4 * rHill);
            blend = Math.max(0, Math.min(1, blend));
            const f1 = gravityForce(body, attractor);
            const f2 = gravityForce(body, attractor.parent);
            return [
                f1[0] * (1 - blend) + f2[0] * blend,
                f1[1] * (1 - blend) + f2[1] * blend
            ];
        } else if (body.parent.parent) {
            // Dominated by higher attractor
            return gravityForce(body, attractor.parent);
        }
        return gravityForce(body, body.parent);
    }
    static applyElasticOrbit(body, dt) {
        if (!body.parent) return;
        const dx = body.x - body.parent.x;
        const dy = body.y - body.parent.y;
        const r = Math.hypot(dx, dy);
        const r0 = body.targetOrbitRadius;
        const v0 = body.targetOrbitSpeed;
        const k = body.elasticity || DEFAULT_ORBIT_ELASTICITY;

        // Snap to ideal radius
        const ux = dx / r, uy = dy / r;
        body.vx -= ux * (r - r0) * k * dt;
        body.vy -= uy * (r - r0) * k * dt;

        // Snap to ideal tangential velocity
        const idealVx = v0 * -uy, idealVy = v0 * ux;
        const blend = ORBIT_TANGENT_BLEND;
        body.vx = body.vx * (1 - blend) + idealVx * blend;
        body.vy = body.vy * (1 - blend) + idealVy * blend;
    }

    static getWorldVelocity(body) {
        if (!body.parent) return [body.vx, body.vy];
        const [pvx, pvy] = getWorldVelocity(body.parent);
        return [body.vx + pvx, body.vy + pvy];
    }


}
