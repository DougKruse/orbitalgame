import { World } from "./World.js";
import { Viewport } from './Viewport.js';

export const uiState = {
    isPausedLocally: false,
    isPausedServer: false,
    showSpokes: false,
    selectedIDs: new Set(),
    trails: {}, // { [bodyID]: Array<[x,y]> },
    world: new World(),
    clientWorld: new World(),
    viewport: new Viewport(),
};
