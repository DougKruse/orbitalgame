import { analyzeShape } from './analyze.js';

export function makeCircle(n, radius) {
    const r = new Float32Array(n).fill(radius);
    const angles = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        angles[i] = (i / n) * 2 * Math.PI;
    }
    return analyzeShape({ angles, r });
}

// export function makeBox(n, width, height) {
//     const r = new Float32Array(n);
//     const angles = new Float32Array(n);
//     const halfW = width / 2, halfH = height / 2;

//     for (let i = 0; i < n; i++) {
//         const θ = (i / n) * 2 * Math.PI;
//         angles[i] = θ;
//         const dx = Math.cos(θ);
//         const dy = Math.sin(θ);
//         const tx = halfW / Math.abs(dx || 1e-9);
//         const ty = halfH / Math.abs(dy || 1e-9);
//         r[i] = Math.min(tx, ty);
//     }

//     return analyzeShape({ angles, r });
// }


///TURNS OUT BOXES ARE HARD IN RADIANWORLD
//
// IF WE NEED BETTER BOXES, 
// WILL HAVE TO START FLAGGING AND TREATING SEPERATELY
// but dont wanna do that because deforming will be nice here
// Okay ideally we dont use this shit, does not work well
export function makeBox(n, width, height) {
    const criticalAngles = [];

    // Four corners
    const halfW = width / 2, halfH = height / 2;
    criticalAngles.push(Math.atan2(halfH, halfW));    // Top-right
    criticalAngles.push(Math.atan2(halfH, -halfW));   // Top-left
    criticalAngles.push(Math.atan2(-halfH, -halfW));  // Bottom-left
    criticalAngles.push(Math.atan2(-halfH, halfW));   // Bottom-right

    // Four face centers
    criticalAngles.push(0);              // Right face center
    criticalAngles.push(Math.PI / 2);    // Top face center
    criticalAngles.push(Math.PI);        // Left face center
    criticalAngles.push(3 * Math.PI / 2); // Bottom face center

    // Normalize all angles to [0, 2PI)
    for (let i = 0; i < criticalAngles.length; i++) {
        let a = criticalAngles[i];
        if (a < 0) a += 2 * Math.PI;
        criticalAngles[i] = a;
    }

    // Remove duplicates and sort
    let uniqueCriticalAngles = Array.from(new Set(criticalAngles)).sort((a, b) => a - b);

    // Fill the rest of the n
    let angles = [];
    const m = uniqueCriticalAngles.length;

    if (n <= m) {
        // If n is less than or equal to number of critical points, just select a subset (prioritizing corners then faces)
        angles = uniqueCriticalAngles.slice(0, n);
    } else {
        // Start with all critical points
        angles = uniqueCriticalAngles.slice();
        // Fill in remaining spokes as evenly as possible between criticals
        let remainder = n - m;
        for (let i = 0; i < m; i++) {
            // Angle gap to next critical (with wrap-around)
            const a0 = uniqueCriticalAngles[i];
            const a1 = uniqueCriticalAngles[(i + 1) % m] + (i + 1 === m ? 2 * Math.PI : 0);
            const gap = a1 - a0;
            // How many extra points in this segment?
            const add = Math.floor(remainder / m) + (i < (remainder % m) ? 1 : 0);
            for (let j = 1; j <= add; j++) {
                angles.push(a0 + (gap * j) / (add + 1));
            }
        }
        // Sort again
        angles.sort((a, b) => a - b);
        // Normalize to [0, 2PI)
        angles = angles.map(a => (a + 2 * Math.PI) % (2 * Math.PI));
    }

    // Now build r
    const r = new Float32Array(n);
    const anglesArr = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const θ = angles[i];
        anglesArr[i] = θ;
        const dx = Math.cos(θ);
        const dy = Math.sin(θ);
        const tx = halfW / Math.abs(dx || 1e-9);
        const ty = halfH / Math.abs(dy || 1e-9);
        r[i] = Math.min(tx, ty);
    }

    return analyzeShape({ angles: anglesArr, r });
}

export function makeBoxAdv(n, width, height) {
    const halfW = width / 2, halfH = height / 2;
    const P = 2 * (width + height);

    const r = new Float32Array(n);
    const angles = new Float32Array(n);

    for (let i = 0; i < n; i++) {
        // s is distance along perimeter
        let s = i * P / n;
        let x, y;

        if (s < width) { // Top edge: left to right
            x = -halfW + s;
            y = -halfH;
        } else if (s < width + height) { // Right edge: top to bottom
            x = halfW;
            y = -halfH + (s - width);
        } else if (s < 2 * width + height) { // Bottom edge: right to left
            x = halfW - (s - (width + height));
            y = halfH;
        } else { // Left edge: bottom to top
            x = -halfW;
            y = halfH - (s - (2 * width + height));
        }

        // Now convert (x, y) to polar
        const theta = Math.atan2(y, x);
        angles[i] = (theta + 2 * Math.PI) % (2 * Math.PI); // Normalize
        r[i] = Math.sqrt(x * x + y * y);
    }

    return analyzeShape({ angles, r });
}


export function makeOffsetBox(n, width, height) {
    const r = new Float32Array(n);
    const angles = new Float32Array(n);
    const halfW = width / 2;

    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
        angles[i] = θ;
        const dx = Math.cos(θ);
        const dy = Math.sin(θ);

        // x bounds are -halfW to +halfW, y bounds are 0 to height
        const tx = halfW / Math.abs(dx || 1e-9);
        const ty = (dy > 0)
            ? height / dy
            : (dy < 0)
                ? 0 // can't go below origin
                : 1e9; // horizontal ray

        r[i] = Math.min(tx, ty);
    }

    return analyzeShape({ angles, r });
}

export function makeHilly(n, base, amp, waves) {
    const r = new Float32Array(n);
    const angles = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
        angles[i] = θ;
        r[i] = base + amp * Math.sin(waves * θ);
    }
    return analyzeShape({ angles, r });
}

export function makeEllipse(n, width, height) {
    // Ellipse centered at (0,0), radii a, b
    const a = width / 2;
    const b = height / 2;
    const r = new Float32Array(n);
    const angles = new Float32Array(n);

    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
        angles[i] = θ;
        // Distance from center to ellipse boundary at angle θ:
        // See: https://math.stackexchange.com/questions/22064/calculating-a-point-that-lies-on-an-ellipse-given-an-angle
        // r = ab / sqrt((b cosθ)^2 + (a sinθ)^2)
        const denom = Math.sqrt((b * Math.cos(θ)) ** 2 + (a * Math.sin(θ)) ** 2);
        r[i] = (a * b) / denom;
    }

    return analyzeShape({ angles, r });
}
