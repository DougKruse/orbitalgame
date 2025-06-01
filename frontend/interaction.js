import { uiState } from './state.js';
import { handlePauseToggle } from './network.js';

export function registerInteractions(canvas) {

    document.getElementById('toggleSpokesBtn').addEventListener('click', () => {
        uiState.showSpokes = !uiState.showSpokes;
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        uiState.isPausedLocally = !uiState.isPausedLocally;
        handlePauseToggle();

    });
    
    canvas.addEventListener('click', evt => {
        selectBody(evt, canvas);
    });

    registerPanZoom(canvas);
}

// Simple drag-to-pan
export function registerPanZoom(canvas) {
    let dragging = false;
    let last = [0, 0];

    canvas.addEventListener('mousedown', (evt) => {
        dragging = true;
        last = [evt.clientX, evt.clientY];
    });

    window.addEventListener('mousemove', (evt) => {
        if (!dragging) return;
        const dx = (evt.clientX - last[0]) / uiState.viewport.zoom;
        const dy = (evt.clientY - last[1]) / uiState.viewport.zoom;
        uiState.viewport.x -= dx;
        uiState.viewport.y -= dy;
        last = [evt.clientX, evt.clientY];
    });

    window.addEventListener('mouseup', () => dragging = false);

    // Wheel to zoom (centered at mouse)
    canvas.addEventListener('wheel', (evt) => {
        evt.preventDefault();
        const scale = Math.exp(-evt.deltaY * 0.001); // Or tweak as needed
        const mouse = [evt.clientX - canvas.getBoundingClientRect().left,
        evt.clientY - canvas.getBoundingClientRect().top];
        uiState.viewport.setZoom(uiState.viewport.zoom * scale, mouse, canvas);
    }, { passive: false });
}



function selectBody(evt, canvas){
    const rect = canvas.getBoundingClientRect();
    const sx = evt.clientX - rect.left;
    const sy = evt.clientY - rect.top;
    const [wx, wy] = uiState.viewport.screenToWorld([sx, sy], canvas);

    const world = uiState.clientWorld;
    const selectedIDs = uiState.selectedIDs;

    const found = pickBodyAt(world, wx, wy);

    if (found) {
        if (selectedIDs.has(found.ID)) {
            selectedIDs.delete(found.ID); // Deselect: no trail drawn
        } else {
            selectedIDs.add(found.ID);    // Select: trail will show
        }
    }
}

function pickBodyAt(world, wx, wy) {
    // Hit-test from topmost to backmost
    for (let i = world.bodies.length - 1; i >= 0; i--) {
        const b = world.bodies[i];
        const visualRadius = b.r || (b.shape && Math.max(...b.shape.r));
        if (Math.hypot(wx - b.x, wy - b.y) < visualRadius) {
            return b;
        }
    }
    return null;
}