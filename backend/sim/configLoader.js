import * as gen from './shapes/generators.js';
import { Body } from './Body.js';
import { readFileSync } from 'fs';
import { World } from './world.js';

export function loadWorldConfig(json) {
    // const world = { time: 0, bodies: [] };
    const world = new World();

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
        const mass = b.mass || shape.areaApprox;

        // 3) create the body with optional mass override
        // console.log(shape);
        const body = new Body({shape, position: [x, y] ,
            velocity: [vx, vy], rotation: {angle, omega}, mass}
        );

        world.addBody(body);
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
