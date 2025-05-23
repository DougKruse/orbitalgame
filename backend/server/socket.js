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
            payload: convertStateForJSON(state),
        };
        // console.log(message);
        const msgString = JSON.stringify(message);
        for (const ws of clients) {
            if (ws.readyState === 1) ws.send(msgString);
        }
    });


    bus.on('sendAllClients', ({ type, payload }) => {
        for (const ws of clients) {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        }
        console.log('Sending: ' + type);
    });

    return;
}

function convertShapeForJSON(shape) {
    return {
        ...shape,
        angles: Array.from(shape.angles),
        r: Array.from(shape.r),
        // keep rAvg, rMax, areaApprox as-is
    };
}

function convertBodyForJSON(body) {
    // Make a shallow copy without .attractors or any other problematic fields
    const { attractors, parent, ...serializable } = body;

    // If you need to send parent, use just an ID (not the object)
    // if (body.parent) serializable.parentID = body.parent.ID;
    // serializable.attractorIDs = body.attractors?.map(a => a.ID);

    serializable.shape = convertShapeForJSON(body.shape);
    return serializable;
}


function convertStateForJSON(state) {
    return {
        time: state.time,
        bodies: state.bodies.map(convertBodyForJSON)
    };
}
