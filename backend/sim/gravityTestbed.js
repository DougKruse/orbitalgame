// gravityTestbed.js

import { Gravity } from './Gravity.js';

// ----------- Minimal Test Objects -----------

// Simple 2-body world: planet and star
const star = {
    ID: 'star1',
    type: 'star',
    mass: 10000,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    parent: null,  // galactic center? (null for now)
};

const planet = {
    ID: 'planet1',
    type: 'planet',
    mass: 10,
    x: 200,
    y: 0,
    vx: 0,
    vy: 7,  // initial velocity (should roughly orbit)
    parent: star,
};

const world = {
    bodies: [planet, star],
    planets: [planet],
    stars: [star],
    blackHoles: []
};

// Helper for numeric distance
function distance(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

// Attach helper globally for your class if needed:
// globalThis.distance = distance;
// globalThis.getHillRadius = Gravity.getHillRadius;
// globalThis.gravityForce = Gravity.gravityForce;

// ---- Step Function ----
function stepWorld(world, dt) {
    Gravity.updateGravity(world, dt);

    // Integrate positions (normally PhysicsCore.integrate, but simplified here)
    for (const b of world.bodies) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
    }
}

// ---- Main Test Loop ----
console.log("Initial planet:", { x: planet.x, y: planet.y, vx: planet.vx, vy: planet.vy });

for (let frame = 0; frame < 5000; frame++) {
    stepWorld(world, 0.01); // dt = 0.2

    // Log every 5 frames
    if (frame % 500 === 0) {
        console.log(`After ${frame + 1} steps:`);
        console.log(`Planet pos=(${planet.x.toFixed(2)}, ${planet.y.toFixed(2)}) vel=(${planet.vx.toFixed(2)}, ${planet.vy.toFixed(2)})`);
        if (planet.attractors) {
            console.log('  Attractors:', planet.attractors.map(a => a.ID));
        }
    }
}

// Test results:
console.log("Final planet:", { x: planet.x, y: planet.y, vx: planet.vx, vy: planet.vy });
