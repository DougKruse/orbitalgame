import { clientBus } from './clientBus.js';

export function connect(onMessage) {
    const ws = new WebSocket(`ws://${location.host}`);

    ws.onmessage = (e) => {
        const { type, payload } = JSON.parse(e.data);
        // rebroadcast from network to local bus
        clientBus.emit(type, payload);  
        
        return ws;
    };

    clientBus.on('send', ({ type, payload }) => {
        ws.send(JSON.stringify({ type, payload }));
        console.log('Sending: ' + type);
    });
}
