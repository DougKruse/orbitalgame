import { checkSpokeCollision, radiusAtAngle, worldToLocal } from "./shapes/analyze.js";

export class Physics {
    static step(world, dt) {
        this.integrate(world, dt);
        this.handleCollisions(world);
        world.removeDestroyed();
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
                if (a === b) continue;
                if (a.ID.startsWith('player') || b.ID.startsWith('player')) continue;
                let collide = checkSpokeCollision(a, b);
                if (collide) {

                    //to make sure collding projs both trigger
                    let aP = a.type === 'proj';
                    let bP = b.type === 'proj';

                    // if a is a proj
                    if ( aP ){
                        console.log(`[COLLISION] ${a.ID} -> ${b.ID}`);
                        const localBiteCenter = worldToLocal(b, collide.contactPoint);

                        this.applyCircularBite({
                            shape: b.shape,
                            biteCenter: localBiteCenter,
                            biteRadius: 30  
                        });
                        a.destroy();
                    }

                    // if b is a proj
                    if ( bP) {
                        console.log(`[COLLISION] ${a.ID} <- ${b.ID}`);
                        const localBiteCenter = worldToLocal(a, collide.contactPoint);

                        this.applyCircularBite({
                            shape: a.shape,
                            biteCenter: localBiteCenter,
                            biteRadius: 30
                        });
                        b.destroy();
                    }
                    // if neither are
                    if ( !aP && !bP){
                        console.log(`[COLLISION] ${a.ID} ↔ ${b.ID}`);

                        this.resolveElasticCollision(a, b,
                            {
                                options: {
                                    normalA: a.shape.normals,
                                    normalB: b.shape.normals
                                }
                            }
                        );
                        
                    }

                    // Optional: emit bus event, apply damage, etc.
                }
            }
        }
    }

    static applyCircularBite({shape, biteCenter, biteRadius, shapeCenter = [0, 0]}) {
        // console.log(shape.angles);
        const { angles, r } = shape;
        const n = angles.length;
        // console.log('BITE RESULT Before', shape.r.slice());
        // console.log('Bite center in shape frame', biteCenter);
        // console.log('Distance from center', Math.hypot(biteCenter[0], biteCenter[1]));

        for (let i = 0; i < n; i++) {
            // Ray: origin shapeCenter, dir (cos θ, sin θ)
            const θ = angles[i];
            const dx = Math.cos(θ);
            const dy = Math.sin(θ);

            // Vector from ray origin to bite center
            const ox = shapeCenter[0];
            const oy = shapeCenter[1];
            const cx = biteCenter[0];
            const cy = biteCenter[1];
            const fx = ox - cx;
            const fy = oy - cy;

            // Ray-circle intersection: solve (fx + t*dx)^2 + (fy + t*dy)^2 = biteRadius^2
            const a = dx * dx + dy * dy; // always 1, but kept for clarity
            const b = 2 * (fx * dx + fy * dy);
            const c = fx * fx + fy * fy - biteRadius * biteRadius;
            const discriminant = b * b - 4 * a * c;

            if (discriminant < 0) continue; // no intersection

            // Compute both solutions for t
            const sqrtDisc = Math.sqrt(discriminant);
            const t1 = (-b - sqrtDisc) / (2 * a);
            const t2 = (-b + sqrtDisc) / (2 * a);

            // We want the smallest positive t in [0, r[i]]
            let t = Infinity;
            if (t1 >= 0 && t1 <= r[i]) t = t1;
            else if (t2 >= 0 && t2 <= r[i]) t = t2;
            if (t !== Infinity) {
                r[i] = t;
            }
        }
        // console.log('BITE RESULT after', shape.r.slice());
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
        // if (relVel > 0) retursn; //buggy with ovals or rects, works for spheres, may return to/

        // Handle position correction

        // compute center-to-center vector and distance
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        // compute collision angles for each shape (world-space)
        const angleToB = Math.atan2(dy, dx); // from a to b

        // radius along collision normal for each body
        // You need to supply your radiusAtAngle(shape, angle) function.
        const rA = radiusAtAngle(a, angleToB - a.angle); // Convert to a's local space if needed
        const rB = radiusAtAngle(b, angleToB + Math.PI - b.angle); // B's local space

        // 4. Penetration (amount overlapped)
        const penetration = (rA + rB) - dist;

        // --- POSITION CORRECTION ---
        if (penetration > 0) {
            Physics.positionCorrection(a, b, nx, ny, penetration);
        }

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

    // Position Correction Step (run for every collision, even if relVel > 0)
    static positionCorrection(a, b, nx, ny, penetration) {
        // How much to move each object:
        const aMass = a.mass || 1; // Avoid division by zero
        const bMass = b.mass || 1;
        const totalMass = aMass + bMass;
        const percent = 0.8; // usually 80% or so to avoid jitter
        const slop = 0.01; // allow small overlap

        const correction = Math.max(penetration - slop, 0) / totalMass * percent;
        if (a.mass > 0) {
            a.x -= nx * correction * bMass;
            a.y -= ny * correction * bMass;
        }
        if (b.mass > 0) {
            b.x += nx * correction * aMass;
            b.y += ny * correction * aMass;
        }
    }


}
