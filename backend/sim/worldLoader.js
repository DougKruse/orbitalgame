import * as gen from './shapes/generators.js';
import { Body } from './Body.js';
import { RailOrbitBody, FreeBody } from './BodyVariants.js';
import { readFileSync } from 'fs';
import { World } from './World.js';

export function loadWorld(json) {
    json = loadFile(json);
    const world = new World();
    const protoBodies = json.bodies.map((b, i) => ({ ...b, _index: i }));

    // Placeholder for instantiation
    const instances = new Array(protoBodies.length);

    // 1. Instantiate all fixed bodies first (those without orbit)
    for (let i = 0; i < protoBodies.length; ++i) {
        const b = protoBodies[i];
        const shape = gen[`make${capitalize(b.shape.generator)}`](...b.shape.args);

        if (!b.orbit) {
            // Ordinary (fixed) body
            instances[i] = new Body({
                ...b,
                shape,
                position: b.center ?? [0, 0],
            });
            world.addBody(instances[i]);
        }
    }

    // 2. Instantiate orbit bodies, now that all are constructed
    for (let i = 0; i < protoBodies.length; ++i) {
        const b = protoBodies[i];
        const shape = gen[`make${capitalize(b.shape.generator)}`](...b.shape.args);

        if (b.orbit) {
            const orbit = b.orbit;
            const center = instances[orbit.centerID ?? 0];
            if (!center) throw new Error(`Orbit centerID ${orbit.centerID} does not exist`);

            // Calculate angular speed if period given
            let angularSpeed = orbit.angularSpeed;
            if (!angularSpeed && orbit.period) {
                angularSpeed = 2 * Math.PI / orbit.period;
            }

            instances[i] = new RailOrbitBody({
                ...b,
                shape,
                center,
                radius: orbit.radius,
                angularSpeed,
                phase: orbit.phase ?? 0
            });
            world.addBody(instances[i]);
        }
    }
    // console.log(world.bodies);
    return world;
}

function loadFile(filePath) {
    const raw = JSON.parse(readFileSync(filePath, 'utf8'));
    return raw;
}
function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}
