import { uiState } from './state.js';
import { handlePauseToggle } from './network.js';

export function registerInteractions(canvas, world) {

    document.getElementById('toggleSpokesBtn').addEventListener('click', () => {
        uiState.showSpokes = !uiState.showSpokes;
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        uiState.isPausedLocally = !uiState.isPausedLocally;
        handlePauseToggle();

    });
    
    canvas.addEventListener('click', evt => {
        const [wx, wy] = uiState.viewport.screenToWorld([evt.offsetX, evt.offsetY], canvas);
        // find nearest body, update uiState.selectedBodyID, etc.
    });
    // Add camera pan/zoom, trail toggles, etc.
}
