import * as gen from './shapes/generators.js';
import { makeBody } from './body.js';
import { readFileSync } from 'fs';

export function loadWorldConfig(json) {
    const world = { time: 0, bodies: [] };

    for (const b of json.bodies) {
        // 1) build the shape via the named factory
        const { generator, args } = b.shape;
        if (typeof gen[`make${capitalize(generator)}`] !== 'function') {
            throw new Error(`Unknown shape generator: ${generator}`);
        }
        const shape = gen[`make${capitalize(generator)}`](...args);

        // 2) destructure the rest
        const [x, y] = b.position;
        const [vx = 0, vy = 0] = b.velocity || [];
        const { angle = 0, omega = 0 } = b.rotation || {};

        // 3) create the body with optional mass override
        const body = makeBody(shape, x, y, vx, vy, angle, omega, b.mass);

        world.bodies.push(body);
    }

    return world;
}


export function loadConfig(filePath) {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    return loadWorldConfig(raw);
}


function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}
