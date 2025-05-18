import { Body } from './Body.js';
import * as gen from './shapes/generators.js';

export class Projectile extends Body {
    constructor({ position, velocity, rotation }) {
        const shape = Projectile.defaultShape();
        const mass = 0;
        const fakeVelocity = [0, 0];
        super({ shape, position, fakeVelocity, rotation, mass });
        this.fakeMass = 0.5;
        this.type = 'proj'
    }

    static defaultShape() {
        return gen.makeCircle(16, 5);
    }
    impulse(intensity = 0, angleOverride) {
        const angle = angleOverride ?? this.angle;
        const dvx = Math.cos(angle) * intensity;
        const dvy = Math.sin(angle) * intensity;

        this.vx += dvx;
        this.vy += dvy;
    }
    force(force, dt) {
        if (this.fakeMass === 0) return; // avoid division by 0
        const accel = force / this.fakeMass;
        const dv = accel * dt;
        this.impulse(dv);
    }
}
