import * as at from "../shared/angleTools.js";
import { isPausedLocally } from "./canvas.js";

export const playerState = {
    target: null,  // e.g. id or index of body
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
    if (!playerState.target || !world) return;
    const body = world.bodies[playerState.target];
    const dx = playerState.mouse.x - body.x;
    const dy = playerState.mouse.y - body.y;

    const targetAngle = at.normalizeAngle(Math.atan2(dy, dx)); // angle from body to mouse
    playerState.aimAngle = targetAngle;

    if (playerState.locked) {
        body.omega = 0;
        return;
    }

    const currentAngle = body.angle;

    // let delta = targetAngle - currentAngle;
    const delta = at.shortestPositiveDelta(body.angle, targetAngle) - Math.PI/2;

    // Normalize angle difference to [-π, π]
    // delta = ((delta + Math.PI) % (2 * Math.PI)) + Math.PI/2;

    const rotateSpeed = 0.3; // higher is snappier
    body.omega = delta * rotateSpeed; // apply angular velocity
}
