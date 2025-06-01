import { World } from "./World.js";
import { Viewport } from './Viewport.js';
import { Player } from "./Player.js";

export const uiState = {
    isPausedLocally: false,
    isPausedServer: false,
    showSpokes: false,
    selectedIDs: new Set(),
    trails: {}, // { [bodyID]: Array<[x,y]> },
    world: new World(),
    clientWorld: new World(),
    viewport: new Viewport(),
    localPlayer: new Player({ targetID: 'player0' }),
    canvas: null,
};
