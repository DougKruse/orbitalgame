import * as at from "../shared/angleTools.js";
import { isPausedLocally } from "./canvas.js";
import { clientBus } from './clientBus.js';
import { playerState } from './playerController.js';
import { findPlayer } from './playerController.js';
import { uiState } from './state.js';

export const playerState = {
    targetID: null,  // e.g. id or index of body
    mouse: { x: 0, y: 0 },
    locked: false,
    aimAngle: 0,
    aimImpulse: 10
};

export function registerMouseControl(canvas) {
    canvas.addEventListener('mousemove', e => {
        if (playerState.locked){
            return;
        }
        const rect = canvas.getBoundingClientRect();
        playerState.mouse.x = e.clientX - rect.left - canvas.width / 2;
        playerState.mouse.y = e.clientY - rect.top - canvas.height / 2;

    });
    canvas.addEventListener('click', e => {
        if (!isPausedLocally) return;
        const rect = canvas.getBoundingClientRect();
        playerState.locked = !playerState.locked;
    });
}

//called on tick
export function updatePlayerControl(world) {
    if (!playerState.targetID || !world) return;
    const body = world.bodies.find(b => b.ID === playerState.targetID);
    const dx = playerState.mouse.x - body.x;
    const dy = playerState.mouse.y - body.y;

    const targetAngle = at.normalizeAngle(Math.atan2(dy, dx)); // angle from body to mouse
    playerState.aimAngle = targetAngle;

    if (playerState.locked) {
        body.omega = 0;
        return;
    }

    const currentAngle = body.angle;

    //todo: investigate why need to adjust by quarter rotation, difference in how angle is interpreted between canvas and server?
    const delta = at.shortestPositiveDelta(body.angle, targetAngle) - Math.PI/2;


    const rotateSpeed = 0.3; // higher is snappier
    body.omega = delta * rotateSpeed; // apply angular velocity
}

function onPauseToggle() {
    uiState.isPausedLocally = !uiState.isPausedLocally;

    if (playerState.locked && !uiState.isPausedLocally) {
        const playerB = findPlayer(clientWorld || world, playerState.targetID);

        // ...send fire and aim to server...

        playerState.locked = false;
        updateFireStateUI();
    }

    clientBus.emit('send', { type: 'toggleTick', payload: {} });
}
