import { Projectile } from "./BodyVariants.js";
import { Physics } from "./physics.js";
import { Gravity } from "./Gravity.js";
import { CollisionHandler } from "./CollisionHandler.js";
export class World {
    constructor() {
        this.time = 0;
        this.bodies = [];
    }

    addBody(body) {
        this.bodies.push(body);
    }

    advance(dt) {
        this.time += dt;
        //Physics
    }

    spawnProjectileAt( [x, y], velocity, rotation ){
        const projectile = new Projectile({
            position : [x, y],
            velocity: velocity,
            rotation: rotation
         });
        projectile.impulse(velocity);
        this.addBody(projectile);
    }

    removeDestroyed(){
        this.bodies = this.bodies.filter(body => !body.destroyed);
    }
    
    step(dt, frame) {
        Physics.integrate(this.bodies, dt);
        CollisionHandler.handleCollisions(this);
        this.removeDestroyed();
    }
}
