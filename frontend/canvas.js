import { drawWorld } from './draw.js';
import { uiState } from './state.js';
import { Player } from './Player.js';
import { registerInteractions } from './interaction.js';
import { connect } from './client.js';
import { clientBus } from './clientBus.js';
import './network.js';



let world = uiState.world;
let clientWorld = uiState.clientWorld;


// Canvas setup
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

// Viewport/camera setup


// Client
connect();

// Register controls (player, camera, selection, etc.)
export const localPlayer = new Player({ targetID: 'player0' });
localPlayer.registerMouseControl(canvas);
registerInteractions(canvas, uiState, () => world); // Pass in live world getter

// Main loop
function mainLoop() {
    // Possibly update player control
    // updatePlayerControl(clientWorld);

    drawWorld(ctx, canvas)
    requestAnimationFrame(mainLoop);
}

mainLoop();


clientBus.on('paused', (payload) => {
    uiState.isPausedServer = true;
});
clientBus.on('STATE_UPDATE', (payload) => {
    // Float32Array conversion
    for (const body of payload.bodies) {
        const shape = body.shape;
        if (!(shape.r instanceof Float32Array)) shape.r = new Float32Array(shape.r);
        if (!(shape.angles instanceof Float32Array)) shape.angles = new Float32Array(shape.angles);
    }
    uiState.isPausedServer = false;
    world = payload;
    clientWorld = structuredClone(payload);
});
