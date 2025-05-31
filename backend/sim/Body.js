let bodyID = 0;
export class Body {
    constructor({ shape, position, velocity, rotation, mass , type, density }) {
        this.shape = shape;
        const [x, y] = position || [0, 0];
        const [vx, vy] = velocity || [0, 0];
        const { angle = 0, omega = 0 } = rotation || {};

        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.angle = angle;
        this.omega = omega;
        this.mass = mass;
        this.ID  = type + bodyID++;
        this.type = type ?? 'body';
        this.destroyed = false;
    }

    get position() { return [this.x, this.y]; }
    get velocity() { return [this.vx, this.vy]; }
    get rot() { return { angle: this.angle, omega: this.omega }; }

    destroy(){
        this.destroyed = true;
    }
    // Later:
    // applyForce, boundingBox, etc.
}
