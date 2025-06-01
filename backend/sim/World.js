import { Projectile } from "./BodyVariants.js";
import { Physics } from "./physics.js";
import { Body } from "./Body.js";
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
        CollisionHandler.handleCollisions(this);
        this.removeDestroyed();
        
        for (const body of this.bodies) {
            if (body instanceof Body) {
                body.update(dt);
            }
            //else if (body instanceof FreeBody) {
            //     // Find all attractors (filter by type, etc)
            //     let fx = 0, fy = 0;
            //     for (const attractor of world.bodies) {
            //         if (attractor === body || !attractor.mass) continue;
            //         const [gx, gy] = Gravity.gravityForce(body, attractor);
            //         fx += gx; fy += gy;
            //     }
            //     body.update(dt, fx, fy);
            //}
        }
        
        Physics.integrate(this.bodies, dt);
    }
}
