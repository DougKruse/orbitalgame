let bodyID = 0;
export class Body {
    constructor({ shape, position, velocity, rotation, mass , type, ID, density }) {
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
        this.ID  = ID ? ID : type + bodyID++;
        this.type = type ?? 'body';
        this.destroyed = false;

    }

    get position() { return [this.x, this.y]; }
    get velocity() { return [this.vx, this.vy]; }
    get rot() { return { angle: this.angle, omega: this.omega }; }

    destroy(){
        this.destroyed = true;
    }

    update(dt) {
        if (this.movement) this.movement.update(this, dt);
    }

}


//
// MOVEMENTS
//
const movementTypes = {
    Free: (params = {}) => new FreeMovement(params),
    RailOrbit: (params = {}) => new RailOrbitMovement(params)
};
Body.MovementTypes = movementTypes;


class FreeMovement {
    update(body, dt, fx = 0, fy = 0) {
        // Reads/writes the *body*'s position and velocity
        body.vx += fx / body.mass * dt;
        body.vy += fy / body.mass * dt;
        body.x += body.vx * dt;
        body.y += body.vy * dt;
    }
}
class RailOrbitMovement {
    constructor({ center, radius, angularSpeed, phase = 0 }) {
        this.center = center;
        this.radius = radius;
        this.angularSpeed = angularSpeed;
        this.phase = phase;
    }
    update(body, dt) {
        this.phase += this.angularSpeed * dt;
        if (this.phase > Math.PI * 2) this.phase -= Math.PI * 2;
        const cx = this.center.x, cy = this.center.y;
        body.x = cx + this.radius * Math.cos(this.phase);
        body.y = cy + this.radius * Math.sin(this.phase);
        const speed = this.angularSpeed * this.radius;
        body.vx = -speed * Math.sin(this.phase) + (this.center.vx || 0);
        body.vy = speed * Math.cos(this.phase) + (this.center.vy || 0);
    }
}
