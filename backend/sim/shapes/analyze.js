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

    // Compute surface points on A and B at contact
    const pointA = [
        bodyA.x + Math.cos(angleToB) * rA,
        bodyA.y + Math.sin(angleToB) * rA,
    ];
    const pointB = [
        bodyB.x + Math.cos(angleToB + Math.PI) * rB,
        bodyB.y + Math.sin(angleToB + Math.PI) * rB,
    ];
    // Midpoint: a reasonable guess for contact point
    const contactPoint = [
        (pointA[0] + pointB[0]) / 2,
        (pointA[1] + pointB[1]) / 2,
    ];

    // Return full collision info for further processing
    return {
        overlap: true,
        penetration: (rA + rB) - dist,
        angleToB,
        contactPoint,
        pointA,
        pointB,
        dist,
        rA,
        rB,
    };
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
