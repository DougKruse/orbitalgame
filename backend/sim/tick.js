import { bus } from '../server/eventBus.js';
import { Physics } from './physics.js';

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

    toggle() {
        if (this.timerId) this.stop();
        else this.start();
    }

    _step() {
        this.world.step(this.dt);
        bus.emit('state', this.world);
    }
};
