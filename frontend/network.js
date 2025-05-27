// Handles bus.on( .. )
import { uiState } from './state.js';
import { clientBus } from './clientBus.js';

clientBus.on('paused', (payload) => {
    uiState.isPausedServer = true;
});

clientBus.on('STATE_UPDATE', (payload) => {
    uiState.world.updateFromPayload(payload);           // canonical, never mutated elsewhere
    uiState.clientWorld.updateFromPayload(payload);     // mutable, used for local prediction/visualization
    uiState.isPausedServer = false;
});


export function handlePauseToggle() {
    clientBus.emit('send', {
        type: 'toggleTick',
        payload: {},
    });
}