import * as gen from './shapes/generators.js';
import { Body } from './Body.js';
import { readFileSync } from 'fs';
import { World } from './World.js';
import { Gravity } from './Gravity.js'; 
import { totalmem } from 'os';


const orbitSeeds = [];
let totalMass = 0;

export function loadWorldConfig(json) {
    json = loadFile(json);

    const world = new World();


    // generic bodies
    for (const b of json.bodies) {
        const body = createBody(b);
        world.addBody(body);
        body.flag = b.flag;
        const flag = b.flag || {};
        if (flag.orbitSeed) {
            orbitSeeds.push({ body, opts: b.orbitSeed });
        }
    }

    const sun = world.bodies.find(b => b.type === 'star');
    if (!sun) throw new Error("No star found in system for seeding orbits.");
    // Sun should be at least 90% of total system mass, irl is 99.8%
    // console.log(sun.mass / totalMass);


    // Seed velocities for flagged bodies
    for (const { body } of orbitSeeds) {
        let opts = body.flag.orbitSeed;
        
        // Find target to orbit (by id), fallback to sun
        let center = sun;
        if (opts && opts.around) {
            center = world.bodies.find(b => b.ID === opts.around) || sun;
        }
        // Direction: +1 = default (ccw), -1 = reversed (cw)
        // Use nullish coalescing so 0 or -1 is valid
        const polarity = (opts && opts.direction != null) ? opts.direction : 1;
        const [vx, vy] = Gravity.idealOrbitVelocityVector(body, center, Gravity.GRAVITY_CONSTANT, polarity);
        body.vx = vx;
        body.vy = vy;
    }


    // playerObjects
    // json.playerObjects.forEach((b, i) => {
    //     const body = createBody({ ...b, type: b.type || "player" });
    //     body.ID = `player${i}`;
    //     world.addBody(body);
    // });

    return world;
}

export function loadFile(filePath) {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    return raw;
}

const DEFAULT_DENSITY = {
    "planet": 1e0,         // reference, e.g. Earth-like
    "asteroid": 0.3,     // less dense
    "debris": 0.1,       // very light
    "star": 1e4,          // superdense for play, since stars are visually small here
    "blackhole": 10000,    // arbitrarily massive for domination
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

    // console.log(b.type);
    const type = b.type ?? "body";
    const density = b.density ?? DEFAULT_DENSITY[type] ?? DEFAULT_DENSITY["body"];
    const mass = b.mass ?? (shape.areaApprox && density ? shape.areaApprox * density : 0);
    const [x, y] = b.position;
    const [vx = 0, vy = 0] = b.velocity || [];
    const { angle = 0, omega = 0 } = b.rotation || {};
    const flags = b.flags ?? {};

    totalMass += mass;

    return new Body({
        shape,
        position: [x, y],
        velocity: [vx, vy],
        rotation: { angle, omega },
        mass,
        type,
        density
    });
}


function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

