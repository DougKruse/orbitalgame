import { drawWorld } from './draw.js';
import { uiState } from './state.js';
import { registerInteractions } from './interaction.js';
import { connect } from './client.js';
import { clientBus } from './clientBus.js';
import './network.js';




// Canvas setup
const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
uiState.canvas = canvas;

// Viewport/camera setup


// Client
connect();

// Register controls (player, camera, selection, etc.)

uiState.localPlayer.registerMouseControl(canvas);
registerInteractions(canvas); // Pass in live world getter


let frameCount = 0;
const TRAIL_INTERVAL = 30; // Record trail every 30 frames


// Main loop
function mainLoop() {
    frameCount++;
    maybeRecordTrails(frameCount);

    drawWorld(ctx, canvas)
    requestAnimationFrame(mainLoop);
}

mainLoop();


// Move to debug file later
// Or use idea as needed for visuals
// Other visuals will be in visuals file
function maybeRecordTrails(frame) {
    if (frame % TRAIL_INTERVAL !== 0) return;
    for (const body of uiState.clientWorld.bodies) {
        if (!uiState.trails[body.ID]) uiState.trails[body.ID] = [];
        const trail = uiState.trails[body.ID];
        const last = trail[trail.length - 1];
        if (!last || last[0] !== body.x || last[1] !== body.y) {
            trail.push([body.x, body.y]);
            // Optional cap on length
            if (trail.length > 360) trail.shift();
        }
    }
}
