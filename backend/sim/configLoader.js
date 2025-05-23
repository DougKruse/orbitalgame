import * as gen from './shapes/generators.js';
import { Body } from './Body.js';
import { readFileSync } from 'fs';
import { World } from './world.js';

export function loadWorldConfig(json) {
    json = loadFile(json);

    const world = new World();

    // generic bodies
    for (const b of json.bodies) {
        const body = createBody(b);
        world.addBody(body);

    }

    // playerObjects
    json.playerObjects.forEach((b, i) => {
        const body = createBody({ ...b, type: b.type || "player" });
        body.ID = `player${i}`;
        world.addBody(body);
    });

    return world;
}

export function loadFile(filePath) {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    return raw;
}

const DEFAULT_DENSITY = {
    "planet": 1,         // reference, e.g. Earth-like
    "asteroid": 0.3,     // less dense
    "debris": 0.1,       // very light
    "star": 20,          // superdense for play, since stars are visually small here
    "blackhole": 500,    // arbitrarily massive for domination
    "player": 0.5,       // lighter than planet but heavier than debris
    "body": 1            // fallback
};


function createBody(b) {
    const { generator, args } = b.shape;
    const factory = gen[`make${capitalize(generator)}`];
    if (typeof factory !== 'function') {
        throw new Error(`Unknown shape generator: ${generator}`);
    }
    const shape = factory(...args);

    console.log(b.type);
    const type = b.type ?? "body";
    const density = b.density ?? DEFAULT_DENSITY[type] ?? DEFAULT_DENSITY["body"];
    const mass = b.mass ?? (shape.areaApprox && density ? shape.areaApprox * density : 0);
    const [x, y] = b.position;
    const [vx = 0, vy = 0] = b.velocity || [];
    const { angle = 0, omega = 0 } = b.rotation || {};
    const tags = b.tags ?? [];

    return new Body({
        shape,
        position: [x, y],
        velocity: [vx, vy],
        rotation: { angle, omega },
        mass,
        type,
        density,
        tags
    });
}


function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

