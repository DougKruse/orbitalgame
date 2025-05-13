import { WebSocketServer } from 'ws';
import { bus } from './eventBus.js';

export function setupSocket(server) {
    const wss = new WebSocketServer({ server });
    const clients = new Set();

    wss.on('connection', ws => {
        clients.add(ws);

        ws.on('message', raw => {
            let { event, data } = JSON.parse(raw);
            // bus.emit(event, data, ws);
        });

        ws.on('close', () => clients.delete(ws));

    });


    // single subscription to all state changes:
    bus.on('state', state => {
        const message = {
            type: 'STATE_UPDATE',
            payload: state,
        };
        const msgString = JSON.stringify(message);
        for (const ws of clients) {
            if (ws.readyState === 1) ws.send(msgString);
        }
    });

    bus.on('makeBullet', ({ x, y, client }) => {
        // convert screen‐coords→world‐coords if needed
        // spawn a projectile, select an object, whatever your game needs:
        world.spawnProjectileAt([x, y]);
        // if you need to reply only to that one client:
        client.send(JSON.stringify({ event: 'ack', x, y }));
    });

    return;
}
