import { WebSocketServer } from 'ws';
import { bus } from './eventBus.js';

export function setupSocket(server) {
    const wss = new WebSocketServer({ server });
    const clients = new Set();

    wss.on('connection', ws => {
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
    });

    // single subscription to all state changes:
    bus.on('state', state => {
        const msg = JSON.stringify(state);
        for (const ws of clients) {
            if (ws.readyState === 1) ws.send(msg);
        }
    });

    return;
}
