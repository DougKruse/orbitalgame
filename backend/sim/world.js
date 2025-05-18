import { Projectile } from "./BodyVariants.js";
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

}
