import * as gen from './shapes/generators.js';
import { Body } from './Body.js';
import { readFileSync } from 'fs';
import { World } from './world.js';

export function loadWorldConfig(json) {
    // const world = { time: 0, bodies: [] };
    const world = new World();

    // generic bodies
    for (const b of json.bodies) {
        const body = createBody(b);
        world.addBody(body);
    }

    // playerObjects
    json.playerObjects.forEach((b, i) => {
        const body = createBody(b);
        body.ID = `player${i}`;

        world.addBody(body);
    });

    return world;
}


export function loadConfig(filePath) {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    return loadWorldConfig(raw);
}

function createBody(b) {
    const { generator, args } = b.shape;
    const factory = gen[`make${capitalize(generator)}`];
    if (typeof factory !== 'function') {
        throw new Error(`Unknown shape generator: ${generator}`);
    }
    const shape = factory(...args);

    const [x, y] = b.position;
    const [vx = 0, vy = 0] = b.velocity || [];
    const { angle = 0, omega = 0 } = b.rotation || {};
    const mass = b.mass || shape.areaApprox;

    return new Body({ shape, position: [x, y], velocity: [vx, vy], rotation: { angle, omega }, mass });
}

function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

