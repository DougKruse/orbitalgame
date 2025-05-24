// physics/CollisionHandler.js
import { Physics } from "./physics.js";
import * as shapeTools from "./shapes/analyze.js";
// import { checkSpokeCollision, worldToLocal, applyCircularBite } from "./shapes/analyze.js";

export class CollisionHandler {

    static handleCollisions(world) {  
        const bodies = world.bodies;
        for (let i = 0; i < bodies.length; i++) {
            for (let j = i + 1; j < bodies.length; j++) {
                const a = bodies[i], b = bodies[j];
                if (a === b) continue;
                if (a.ID.startsWith('player') || b.ID.startsWith('player')) continue;
                let collide = shapeTools.checkSpokeCollision(a, b);
                if (collide) {

                    //to make sure collding projs both trigger
                    let aP = a.type === 'proj';
                    let bP = b.type === 'proj';

                    // if a is a proj
                    if ( aP ){
                        console.log(`[COLLISION] ${a.ID} -> ${b.ID}`);
                        const localBiteCenter = worldToLocal(b, collide.contactPoint);

                        shapeTools.applyCircularBite({
                            shape: b.shape,
                            biteCenter: localBiteCenter,
                            biteRadius: 30  
                        });
                        a.destroy();
                    }

                    // if b is a proj
                    if ( bP) {
                        console.log(`[COLLISION] ${a.ID} <- ${b.ID}`);
                        const localBiteCenter = shapeTools.worldToLocal(a, collide.contactPoint);

                        shapeTools.applyCircularBite({
                            shape: a.shape,
                            biteCenter: localBiteCenter,
                            biteRadius: 30
                        });
                        b.destroy();
                    }
                    // if neither are
                    if ( !aP && !bP){
                        console.log(`[COLLISION] ${a.ID} ↔ ${b.ID}`);

                        Physics.resolveElasticCollision(a, b,
                            {
                                options: {
                                    normalA: a.shape.normals,
                                    normalB: b.shape.normals
                                }
                            }
                        );
                        
                    }

                    // Optional: emit bus event, apply damage, etc.
                }
            }
        }
    }
}
