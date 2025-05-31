import { Body } from './Body.js';
import * as gen from './shapes/generators.js';


export class FreeBody extends Body {
    constructor(opts) {
        super(opts);
    }

    update(dt, fx = 0, fy = 0) {
        this.vx += fx / this.mass * dt;
        this.vy += fy / this.mass * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
}


export class RailOrbitBody extends Body {
    constructor({ center, radius, angularSpeed, phase = 0, ...opts }) {
        super(opts);  // pass shape, mass, type, etc.
        this.center = center; // another Body
        this.radius = radius;
        this.angularSpeed = angularSpeed;
        this.phase = phase;
    }

    update(dt) {
        this.phase += this.angularSpeed * dt;
        if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
        // console.log(this.center);
        const cx = this.center.x, cy = this.center.y;
        this.x = cx + this.radius * Math.cos(this.phase);
        this.y = cy + this.radius * Math.sin(this.phase);

        const speed = this.angularSpeed * this.radius;
        this.vx = -speed * Math.sin(this.phase) + (this.center.vx || 0);
        this.vy = speed * Math.cos(this.phase) + (this.center.vy || 0);
    }

    releaseToFreeBody() {
        return new FreeBody({
            ...this,   // pass all properties except orbital
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
        });
    }
}

export class Projectile extends FreeBody {
    constructor({ position, velocity, rotation }) {
        const shape = Projectile.defaultShape();
        const mass = 0;
        const fakeVelocity = [0, 0];
        super({ shape, position, fakeVelocity, rotation, mass });
        this.fakeMass = 0.5;
        this.type = 'proj'
    }

    static defaultShape() {
        return gen.makeCircle(8, 5);
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