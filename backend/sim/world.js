import { Projectile } from "./BodyVariants.js";
import { Physics } from "./physics.js";
import { Gravity } from "./Gravity.js";
import { CollisionHandler } from "./CollisionHandler.js";
export class World {
    constructor() {
        this.time = 0;
        this.bodies = [];
        this.stars = [];
        this.blackholes = [];
        this.planets = [];
    }

    addBody(body) {
        this.bodies.push(body);
        this.maintainAttactors(body);
    }
    
    // Maintain attractor lists 
    maintainAttactors(body){
        switch (body.type){
            case 'planet':
                this.planets.push(body);
                break;
            case 'star':
                this.stars.push(body);
                break;
            case 'blackhole':
                this.blackholes = [];
                break   
            default:
        } 
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
        Gravity.updateGravity(this, dt);
        this.removeDestroyed();
    }
}
