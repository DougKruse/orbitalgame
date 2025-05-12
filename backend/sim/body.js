export function makeBody(shape, x = 0, y = 0, vx = 0, vy = 0, angle = 0, omega = 0, mass = null) {
    return {
        shape,
        x, y,
        vx, vy,
        angle,
        omega,
        mass: mass ?? shape.areaApprox  // default mass if not specified
    };
}
class Body {
    constructor({ shape, position, velocity, rotation, mass }) {
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
        this.mass = mass ?? shape.areaApprox;
    }

    // Optional: derived helpers
    get position() { return [this.x, this.y]; }
    get velocity() { return [this.vx, this.vy]; }
    get rot() { return { angle: this.angle, omega: this.omega }; }

    // Later:
    // applyForce, boundingBox, etc.
}
