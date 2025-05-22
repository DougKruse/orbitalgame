export function analyzeShape(shape) {
    const { r } = shape;
    const n = r.length;

    let sum = 0;
    let max = 0;

    for (let i = 0; i < n; i++) {
        sum += r[i];
        if (r[i] > max) max = r[i];
    }

    shape.rAvg = sum / n;
    shape.rMax = max;
    // Approximate area: average radius treated as a circle
    shape.areaApprox = Math.PI * shape.rAvg * shape.rAvg;

    shape.normals = computeSpokeNormals(shape);

    return shape;
}

function computeSpokeNormals(shape) {
    const { angles, r } = shape;
    const n = angles.length;
    const normals = Array(n);

    // Compute boundary points
    const points = Array(n);
    for (let i = 0; i < n; i++) {
        const θ = angles[i];
        points[i] = [r[i] * Math.cos(θ), r[i] * Math.sin(θ)];
    }

    // Compute normals
    for (let i = 0; i < n; i++) {
        const prev = points[(i - 1 + n) % n];
        const next = points[(i + 1) % n];
        // Tangent from prev to next
        const tx = next[0] - prev[0];
        const ty = next[1] - prev[1];
        // Perpendicular normal (outward): (-ty, tx)
        let nx = -ty;
        let ny = tx;
        // Normalize
        const len = Math.hypot(nx, ny) || 1e-12;
        nx /= len;
        ny /= len;
        normals[i] = [nx, ny];
    }
    return normals;
}


//todo: figure out whether to incorperate in collision
function interpolateNormalAtAngle(shape, normals, contactAngle) {
    const { angles } = shape;
    const n = angles.length;

    // Normalize angle to [0, 2π)
    let θ = ((contactAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Find neighboring spokes
    let i0 = 0;
    for (let i = 0; i < n; i++) {
        let a0 = angles[i];
        let a1 = angles[(i + 1) % n];
        if (a0 > a1) a1 += 2 * Math.PI;
        if ((a0 <= θ && θ < a1) || (i === n - 1 && (θ >= a1 % (2 * Math.PI) || θ < angles[0]))) {
            i0 = i;
            break;
        }
    }
    let i1 = (i0 + 1) % n;
    let a0 = angles[i0];
    let a1 = angles[i1];
    if (a1 < a0) a1 += 2 * Math.PI;
    let t = (θ - a0) / (a1 - a0);
    if (t < 0) t += 1;

    // Interpolate normals
    const n0 = normals[i0], n1 = normals[i1];
    let nx = n0[0] * (1 - t) + n1[0] * t;
    let ny = n0[1] * (1 - t) + n1[1] * t;
    const len = Math.hypot(nx, ny) || 1e-12;
    nx /= len;
    ny /= len;
    return [nx, ny];
}


// Basic check, will false posive for convex shapes and step
// Note will fail for peaks (use new objects for extrusions)
export function checkSpokeCollision(bodyA, bodyB) {
    const dx = bodyB.x - bodyA.x;
    const dy = bodyB.y - bodyA.y;
    const dist = Math.hypot(dx, dy);
    const angleToB = Math.atan2(dy, dx);

    // Get A's spoke value toward B
    const rA = radiusAtAngle(bodyA, angleToB);

    // Get B's spoke value toward A (opposite direction)
    const rB = radiusAtAngle(bodyB, angleToB + Math.PI);

    const overlap = dist < (rA + rB);
    if (!overlap) return false;

    // do a more extensive neighbor check
    return checkSpokeCollisionExpanded(bodyA, bodyB, 3);
}

// More refined neighbor segment check
function checkSpokeCollisionExpanded(bodyA, bodyB, n = 1) {
    // center-to-center vector
    const dx = bodyB.x - bodyA.x;
    const dy = bodyB.y - bodyA.y;
    const angleToB = Math.atan2(dy, dx);

    const spokeCountA = bodyA.shape.angles.length;
    const idxA = getClosestSpokeIndex(bodyA.shape.angles, angleToB - bodyA.angle);
    const indicesA = getNeighborIndices(idxA, spokeCountA, n);
    const pointsA = getPointsAtIndices(bodyA, indicesA);

    const spokeCountB = bodyB.shape.angles.length;
    const idxB = getClosestSpokeIndex(bodyB.shape.angles, angleToB + Math.PI - bodyB.angle);
    const indicesB = getNeighborIndices(idxB, spokeCountB, n);
    const pointsB = getPointsAtIndices(bodyB, indicesB);

    // Find segement intersection
    for (let i = 0; i < pointsA.length - 1; i++) {
        for (let j = 0; j < pointsB.length - 1; j++) {
            const inter = segmentsIntersect(
                pointsA[i], pointsA[i + 1],
                pointsB[j], pointsB[j + 1]
            );
            if (inter) {
                // Found a collision at inter
                return {
                    overlap: true,
                    contactPoint: inter
                    // if needed...
                };
            }
        }
    }

    return false;
}

// Helper: Generate array of neighbor indices centered on idx
function getNeighborIndices(idx, spokeCount, n = 1) {
    const indices = [];
    for (let offset = -n; offset <= n; offset++) {
        indices.push((idx + offset + spokeCount) % spokeCount);
    }
    return indices;
}

// Helper: Convert indices to world-space points for a body
function getPointsAtIndices(body, indices) {
    const points = [];
    const angles = body.shape.angles;
    const rArr = body.shape.r;
    const rot = body.angle;
    const cx = body.x, cy = body.y;
    for (const i of indices) {
        const theta = angles[i] + rot;
        const r = rArr[i];
        points.push([
            cx + Math.cos(theta) * r,
            cy + Math.sin(theta) * r
        ]);
    }
    return points;
}

function segmentsIntersect(p1, p2, q1, q2) {
    // Returns intersection point or null
    // Uses vector cross products
    const s1_x = p2[0] - p1[0], s1_y = p2[1] - p1[1];
    const s2_x = q2[0] - q1[0], s2_y = q2[1] - q1[1];

    const denom = (-s2_x * s1_y + s1_x * s2_y);
    if (denom === 0) return null; // parallel

    const s = (-s1_y * (p1[0] - q1[0]) + s1_x * (p1[1] - q1[1])) / denom;
    const t = (s2_x * (p1[1] - q1[1]) - s2_y * (p1[0] - q1[0])) / denom;

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Intersection point
        return [
            p1[0] + (t * s1_x),
            p1[1] + (t * s1_y)
        ];
    }
    return null; // No intersection
}


export function radiusAtAngle(body, globalAngle) {
    const shape = body.shape;
    const { angles, r } = shape;
    const n = angles.length;

    // Convert to local angle (in body space, 0 = body's facing direction)
    let localAngle = (globalAngle - body.angle) % (2 * Math.PI);
    if (localAngle < 0) localAngle += 2 * Math.PI;

    // Find the two spokes that localAngle lies between
    let i0 = 0;
    for (let i = 0; i < n; i++) {
        let a0 = angles[i];
        let a1 = angles[(i + 1) % n];
        // Handle angle wrap-around
        if (a0 > a1) a1 += 2 * Math.PI;
        // If localAngle is between a0 and a1 (including wraparound)
        if ((a0 <= localAngle && localAngle < a1) ||
            (i === n - 1 && (localAngle >= a1 % (2 * Math.PI) || localAngle < angles[0]))) {
            i0 = i;
            break;
        }
    }

    // Interpolate
    let i1 = (i0 + 1) % n;
    let a0 = angles[i0];
    let a1 = angles[i1];
    let r0 = r[i0];
    let r1 = r[i1];

    // Ensure continuity for wraparound
    if (a1 < a0) a1 += 2 * Math.PI;
    let t = (localAngle - a0) / (a1 - a0);
    if (t < 0) t += 1; // If localAngle wrapped around

    return r0 + t * (r1 - r0);
}

function getClosestSpokeIndex(angles, theta) {
    // Normalize theta to [0, 2π)
    const TWO_PI = Math.PI * 2;
    let normTheta = theta % TWO_PI;
    if (normTheta < 0) normTheta += TWO_PI;

    // Find index with minimal angular distance to normTheta
    let minDelta = Infinity;
    let minIdx = 0;
    for (let i = 0; i < angles.length; i++) {
        // Assuming angles[i] are already [0, 2π)
        let delta = Math.abs(angles[i] - normTheta);
        if (delta > Math.PI) delta = TWO_PI - delta; // wraparound
        if (delta < minDelta) {
            minDelta = delta;
            minIdx = i;
        }
    }
    return minIdx;
}


export function worldToLocal(body, point) {
    const dx = point[0] - body.x;
    const dy = point[1] - body.y;
    const c = Math.cos(-body.angle);
    const s = Math.sin(-body.angle);
    return [
        dx * c - dy * s,
        dx * s + dy * c
    ];
}


export function applyCircularBite({ shape, biteCenter, biteRadius, shapeCenter =[0, 0] }) {
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