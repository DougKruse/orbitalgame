import { bus } from '../server/eventBus.js';

const DT = 1 / 60;

export class SimLoop {
    constructor(world, dt = DT) {
        this.world = world;
        this.dt = dt;
        this.timerId = null;
    }

    start() {
        if (this.timerId != null) return;
        this.timerId = setInterval(() => this._step(), this.dt * 1000);
    }

    stop() {
        if (this.timerId == null) return;
        clearInterval(this.timerId);
        this.timerId = null;
    }

    getWorld() {
        return this.world;
    }

    setWorld(newWorld) {
        this.world = newWorld;
    }

    _step() {
        this.world.time += this.dt;
        for (const b of this.world.bodies) {
            b.x += b.vx * this.dt;
            b.y += b.vy * this.dt;

            if (b.omega) {
                // Prevent angle from growing infinitely
                b.angle = (b.angle + b.omega * this.dt) % (2 * Math.PI);
            }
        }
        
        bus.emit('state', this.world);
    }
};
