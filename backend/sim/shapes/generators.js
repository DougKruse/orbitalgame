import { analyzeShape } from './analyze.js';

export function makeCircle(n, radius) {
    const r = new Float32Array(n).fill(radius);
    return analyzeShape({ spokes: n, r });
}

export function makeBox(n, width, height) {
    const r = new Float32Array(n);
    const halfW = width / 2, halfH = height / 2;

    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
        const dx = Math.cos(θ);
        const dy = Math.sin(θ);
        const tx = halfW / Math.abs(dx || 1e-9);
        const ty = halfH / Math.abs(dy || 1e-9);
        r[i] = Math.min(tx, ty);
    }

    return analyzeShape({ spokes: n, r });
}

export function makeOffsetBox(n, width, height) {
    const r = new Float32Array(n);
    const halfW = width / 2;

    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
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

    return analyzeShape({ spokes: n, r });
}

export function makeHilly(n, base, amp, waves) {
    const r = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const θ = (i / n) * 2 * Math.PI;
        r[i] = base + amp * Math.sin(waves * θ);
    }
    return analyzeShape({ spokes: n, r });
}


