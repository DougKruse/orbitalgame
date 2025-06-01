import { uiState } from "./state.js";

export class Viewport {
    constructor({
        x = 0,        // world-space center X
        y = 0,        // world-space center Y
        zoom = 1.0,   // scale: screen px per world unit
        minZoom = 0.1,
        maxZoom = 10.0
    } = {}) {
        this.x = x;
        this.y = y;
        this.zoom = zoom;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
    }

    // Convert world coordinates to screen coordinates
    worldToScreen([wx, wy], canvas = uiState.canvas) {
        return [
            canvas.width / 2 + (wx - this.x) * this.zoom,
            canvas.height / 2 + (wy - this.y) * this.zoom
        ];
    }

    // Convert screen coordinates to world coordinates
    screenToWorld([sx, sy], canvas = uiState.canvas) {
        return [
            this.x + (sx - canvas.width / 2) / this.zoom,
            this.y + (sy - canvas.height / 2) / this.zoom
        ];
    }

    pan(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    setZoom(newZoom, anchor = null, canvas = null) {
        // Optionally zoom relative to an anchor point in screen coords
        if (canvas && anchor) {
            const [wx, wy] = this.screenToWorld(anchor, canvas);
            const oldZoom = this.zoom;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
            const [wxNew, wyNew] = this.screenToWorld(anchor, canvas);
            this.x += wx - wxNew;
            this.y += wy - wyNew;
        } else {
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        }
    }

    centerOn([wx, wy]) {
        this.x = wx;
        this.y = wy;
    }
}
