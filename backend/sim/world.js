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

    spawnProjectileAt( x, y ){
        const projectile = new Projectile(x, y);
    }

}
