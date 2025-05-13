import { Body } from './Body.js';
import * as gen from './shapes/generators.js';

export class Projectile extends Body {
    constructor({ position, velocity, rotation }) {
        const shape = Projectile.defaultShape();
        const mass = 0;
        const fakeMass = 0.5;
        super({ shape, position, velocity, rotation, mass });
    }

    static defaultShape() {
        return gen.makeCircle(16, 5);
    }
    impulse(intensity = 1, angleOverride = this.angle) {
        const dvx = Math.cos(angleOverride) * intensity;
        const dvy = Math.sin(angleOverride) * intensity;
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
