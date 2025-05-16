//Handles upstream from client through bus
import { bus } from '../server/eventBus.js';

export function setupController(sim) {
    bus.on('fireBullet', ({ pos , unitVelocity, angle }) => {
        sim.getWorld().spawnProjectileAt( pos , unitVelocity, {angle: angle, omega: 0 });
        // Optional: respond only to sender
        // client.send(JSON.stringify({ type: 'ACK', payload: { x, y } }));
    });
    
    bus.on('toggleTick', () => {
        sim.toggle();
        bus.emit('sendAllClients', {
            type: 'paused',
            payload: {}
        });
    });

    bus.on('setAim', ({ bodyID, angle }) => {
        const body = sim.world.bodies.find(b => b.ID === bodyID);
        if (!body) return;
        body.angle = angle;
        body.omega = 0;
    });

    // Add more handlers as needed
}

