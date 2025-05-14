import { WebSocketServer } from 'ws';
import { bus } from './eventBus.js';

export function setupSocket(server) {
    const wss = new WebSocketServer({ server });
    const clients = new Set();

    wss.on('connection', ws => {
        clients.add(ws);

        ws.on('message', raw => {
            let { type, payload } = JSON.parse(raw);
            // include sender reference if needed
            console.log(type);
            bus.emit(type, { ...payload, client: ws });
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

    

    return;
}
