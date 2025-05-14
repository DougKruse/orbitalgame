export class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, fn) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(fn);
    }

    emit(event, payload) {
        const fns = this.listeners.get(event);
        if (fns) for (const fn of fns) fn(payload);
    }

    off(event, fn) {
        const fns = this.listeners.get(event);
        if (fns) this.listeners.set(event, fns.filter(f => f !== fn));
    }
}

export const clientBus = new EventEmitter();
