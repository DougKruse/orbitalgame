import * as at from "../shared/angleTools.js";
import { uiState } from './state.js';

export class Player {
    constructor({ playerID, controlledIDs = [] }) {
        this.playerID = playerID;              // unique player identifier
        this.controlledIDs = new Set(controlledIDs); // set of controlled object ids (can add/remove later)
        this.mouse = { x: 0, y: 0 };
        this.locked = false;
        this.aimAngle = 0;
        this.aimImpulse = 10;
    }

    addControlled(id) {
        this.controlledIDs.add(id);
    }

    removeControlled(id) {
        this.controlledIDs.delete(id);
    }

    registerMouseControl(canvas) {
        canvas.addEventListener('mousemove', e => {
            if (this.locked) return;
            const rect = canvas.getBoundingClientRect();
            // Mouse position relative to the canvas
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            // Use viewport to convert to world coordinates
            const [wx, wy] = uiState.viewport.screenToWorld([sx, sy], canvas);
            this.mouse.x = wx;
            this.mouse.y = wy;
        });

        canvas.addEventListener('click', e => {
            // Only handle click if locally paused (from uiState)
            if (!uiState.isPausedLocally) return;
            this.locked = !this.locked;
        });
    }


    // On tick, will default to controlling first controlled object if multiple
    // updateControl(world) {
    //     const firstID = [...this.controlledIDs][0];
    //     if (!firstID || !world) return;
    //     const body = world.findById(firstID);
    //     if (!body) return;

    //     const dx = this.mouse.x - body.x;
    //     const dy = this.mouse.y - body.y;
    //     const targetAngle = at.normalizeAngle(Math.atan2(dy, dx));
    //     this.aimAngle = targetAngle;

    //     if (this.locked) {
    //         body.omega = 0;
    //         return;
    //     }
    //     const delta = at.shortestPositiveDelta(body.angle, targetAngle) - Math.PI / 2;
    //     const rotateSpeed = 0.3;
    //     body.omega = delta * rotateSpeed;
    // }


    // You can add a helper in Player for the main controlled id:
    primaryControlledID() {
        return [...this.controlledIDs][0]; // or however you want to prioritize
    }

}
