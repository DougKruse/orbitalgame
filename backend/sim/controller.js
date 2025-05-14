//Handles upstream from client through bus
import { bus } from '../server/eventBus.js';

export function setupController(sim) {
    bus.on('makeBullet', ({ x, y, client }) => {
        sim.getWorld().spawnProjectileAt( x, y );
        // Optional: respond only to sender
        // client.send(JSON.stringify({ type: 'ACK', payload: { x, y } }));
    });

    // Add more handlers as needed
}

