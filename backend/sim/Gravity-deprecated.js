// physics/GravitySystem.js
export class Gravity {
    
    static GRAVITY_CONSTANT = 5;
    static TYPE_RANK = {
        'projectile': 0,
        'debris': 0,
        'planet': 1,
        'star': 2,
        'blackhole': 3,
        // Add more as needed
    };


    static updateGravity(world, dt, frame) { 
        const bodies = world.bodies;

        for (const body of bodies) {
 
            this.updateAttractors(body, world)

            // Apply Gravity forces of attractors
            let fx = 0, fy = 0;
            for (const attractor of body.attractors) {
                let gravValue = this.blendedGravity(body, attractor, frame);

                const [gx, gy] = gravValue;
                // const [gx, gy] = this.blendedGravity(body, attractor);
                fx += gx; fy += gy;
            }

            ///Snap to elastic orbit if only one attractor dominates
            // TODO: Find if dominant
            const mainAttractor = body.attractors?.[0];
            if (mainAttractor) {
                Gravity.applyElasticOrbit(body, mainAttractor, dt);
            }


            // Update velocity/position
            const mass = body.mass || 1; // Always nonzero for math
            body.vx += fx / mass * dt;
            body.vy += fy / mass * dt;


            // Gravity Debug info
            body.gravityDebug = {
                attractorIDs: body.attractors?.map(a => a.ID),          // All current attractors by ID
                parentID: body.parent?.ID,                              // Parent's ID
                distances: body.attractors?.map(a => Gravity.distance(body, a)), // Distance to each attractor
                hillRadii: body.attractors?.map(a =>
                    a.parent ? Gravity.getHillRadius(a, a.parent) : null), // Hill radius for each attractor
                withinHill: body.attractors?.map((a, i) => {
                    const d = Gravity.distance(body, a);
                    const rHill = a.parent ? Gravity.getHillRadius(a, a.parent) : Infinity;
                    return d < rHill;
                }),
                isParentHillPrimary: (() => {
                    // Whether body is within its parent's Hill sphere
                    if (!body.parent) return false;
                    const d = Gravity.distance(body, body.parent);
                    const rHill = body.parent.parent ? Gravity.getHillRadius(body.parent, body.parent.parent) : Infinity;
                    return d < rHill;
                })(),
                idealCircularOrbitVelocities: body.attractors?.map(a => {
                    const G = Gravity.GRAVITY_CONSTANT || 1;
                    const r = Gravity.distance(body, a);
                    return (r > 0 && isFinite(r)) ? Math.sqrt(G * (a.mass || 0) / r) : 0;
                }),
                //forces: body.attractors?.map(a => Gravity.gravityForce(body, a)), // force vector from each attractor
            };


            // Only do this when spawning things
            // if (body.parent) {
            //     const [pvx, pvy] = this.getWorldVelocity(body.parent);
            //     body.vx += pvx; body.vy += pvy;
            // }
        }
    }

    static updateAttractors(body, world) {
        const candidates = this.findNearbyAttractors(body, world);
        body.attractors = candidates;
        body.parent = candidates[0];
    }

    static findNearbyAttractors(body, world) {
        // ---- Settings ----
        const MAX_ATTRACTORS = 3;          // max returned, for performance
        const MAX_ATTRACTOR_DIST = 2e5;    // only consider within this range (arbitrary, tune as needed)
        const MIN_ATTRACTOR_MASS = 1;      // ignore tiny masses
        const ALWAYS_INCLUDE_TYPES = ['none']; // always include these, even if far


        const selfRank = this.TYPE_RANK[body.type] ?? 0;

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
        }

        // Remove self and any bodies too small or unphysical
        candidates = candidates.filter(a =>
            a !== body && 
            (a.mass || 0) >= MIN_ATTRACTOR_MASS && 
            (this.TYPE_RANK[a.type] ?? 0) >= selfRank
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
                hill: (a.parent) ? this.getHillRadius(a, a.parent) : Infinity, // or 0 if no parent
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

        const G = this.GRAVITY_CONSTANT; // Magic constant


        if (!body || !attractor || body === attractor){
            return [0, 0];
        } 

        // Use gravityMass for calculation if available, otherwise fall back to mass
        const m1 = body.mass ?? 1;
        const m2 = attractor.mass ?? 1;

        // Compute direction vector from body to attractor
        const dx = attractor.x - body.x;
        const dy = attractor.y - body.y;
        const r2 = dx * dx + dy * dy;
        const r = Math.sqrt(r2);

        // Avoid division by zero or extremely strong forces at close range
        const minDist = 1; // Set this higher for "softer" close encounters
        if (r < minDist){
            return [0, 0];
        } 

        // Magnitude of force
        const F = G * m1 * m2 / r2;

        // Normalize direction
        const fx = F * (dx / r);
        const fy = F * (dy / r);
        

        return [fx, fy];

    }

    static blendedGravity(body,attractor, frame) {
        if (!body.parent) return [0, 0];
        const d = this.distance(body, attractor);
        const rHill = this.getHillRadius(attractor, attractor.parent);

        if (d < 0.8 * rHill) {
            // Fully parent gravity
            return this.gravityForce(body, attractor);
        } else if (d < 1.2 * rHill && attractor.parent) {
            // Blend forces
            let blend = (d - 0.8 * rHill) / (0.4 * rHill);
            blend = Math.max(0, Math.min(1, blend));
            const f1 = this.gravityForce(body, attractor);
            const f2 = this.gravityForce(body, attractor.parent);
            return [
                f1[0] * (1 - blend) + f2[0] * blend,
                f1[1] * (1 - blend) + f2[1] * blend
            ];
        } else if (attractor.parent) {
            // Dominated by higher attractor
            return this.gravityForce(body, attractor.parent);
        }
        return this.gravityForce(body, attractor);
    }

    // static applyElasticOrbit(body, attractor, dt) {
    //     // Only apply if attractor exists and has mass
    //     if (!attractor || !(attractor.mass > 0)) return;

    //     const G = this.GRAVITY_CONSTANT;
    //     const SMALL_BLEND = 0;        // 0.2
    //     const SMALL_ELASTICITY = 0;   // 0.5

    //     // Vector from attractor to body
    //     const dx = body.x - attractor.x;
    //     const dy = body.y - attractor.y;
    //     const r = Math.hypot(dx, dy);
    //     if (r === 0 || !isFinite(r)) return;

    //     // Relative velocity
    //     const vx = body.vx - (attractor.vx || 0);
    //     const vy = body.vy - (attractor.vy || 0);

    //     // Radial/tangential vectors
    //     const ux = dx / r, uy = dy / r;
    //     const vRadial = vx * ux + vy * uy;
    //     const vTangential = vx * -uy + vy * ux;

    //     // Ideal velocity
    //     const vIdeal = Math.sqrt(G * attractor.mass / r);

    //     // Test: only apply if |vRadial| < 0.5 * vIdeal and |vTangential| ≈ vIdeal
    //     if (Math.abs(vRadial) < 0.5 * vIdeal && Math.abs(vTangential - vIdeal) < 0.2 * vIdeal) {
    //         // Gently damp radial velocity
    //         body.vx -= ux * vRadial * SMALL_ELASTICITY * dt;
    //         body.vy -= uy * vRadial * SMALL_ELASTICITY * dt;

    //         // Gently nudge tangential velocity toward ideal
    //         const tangentialCorrection = SMALL_BLEND * (vIdeal - vTangential);
    //         body.vx += -uy * tangentialCorrection;
    //         body.vy += ux * tangentialCorrection;
    //     }
    // }

    static applyElasticOrbit(body, attractor, dt) {
        if (!attractor || !(attractor.mass > 0)) return;

        const G = this.GRAVITY_CONSTANT || 1;
        const RADIAL_DAMP = 0.2;  // how hard to kill off radial motion

        const dx = body.x - attractor.x;
        const dy = body.y - attractor.y;
        const r = Math.hypot(dx, dy);
        if (r === 0 || !isFinite(r)) return;

        // Direction from attractor to body
        const ux = dx / r, uy = dy / r;

        // Relative velocity
        const vx = body.vx - (attractor.vx || 0);
        const vy = body.vy - (attractor.vy || 0);

        // Decompose
        const vRadial = vx * ux + vy * uy;

        // Only damp *radial* motion: kill off ellipse, keep energy in tangential
        body.vx -= ux * vRadial * RADIAL_DAMP * dt;
        body.vy -= uy * vRadial * RADIAL_DAMP * dt;
    }

    static idealOrbitVelocityVector(body, center, G = this.GRAVITY_CONSTANT, polarity = 1) {
        const dx = body.x - center.x;
        const dy = body.y - center.y;
        const r = Math.hypot(dx, dy);
        const vMag = Math.sqrt(G * center.mass / r);
        // Tangent: (−dy, dx)/r
        return [polarity * (-dy / r) * vMag, polarity * (dx / r) * vMag];
    }





    static getWorldVelocity(body, visited = new Set()) {
        // Set to prevent infinite recursion if two bodies are each other's parents
        if (!body || visited.has(body)) return [body.vx, body.vy];
        visited.add(body);
        if (!body.parent) return [body.vx, body.vy];
        const [pvx, pvy] = this.getWorldVelocity(body.parent, visited);
        return [body.vx + pvx, body.vy + pvy];
    }


    static distance(a, b) {
        if (!a || !b) return 0;
        const dx = (a.x ?? a[0]) - (b.x ?? b[0]);
        const dy = (a.y ?? a[1]) - (b.y ?? b[1]);
        return Math.hypot(dx, dy);
    }



}
