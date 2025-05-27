export class World {
    constructor(payload = {}) {
        this.updateFromPayload(payload);
    }

    updateFromPayload(payload = {}) {
        const bodies = Array.isArray(payload.bodies) ? payload.bodies : [];
        // Ensure all shapes are Float32Array, deep copy if needed
        this.bodies = bodies.map(body => ({
            ...body,
            shape: {
                ...body.shape,
                r: body.shape && body.shape.r instanceof Float32Array
                    ? body.shape.r
                    : new Float32Array(body.shape?.r || []),
                angles: body.shape && body.shape.angles instanceof Float32Array
                    ? body.shape.angles
                    : new Float32Array(body.shape?.angles || [])
            }
        }));
        // More as needed (scores, events, etc.)
    }

    findPlayer(id) {
        return this.bodies.find(b => b.ID === id);
    }

    getById(id) {
        return this.bodies.find(b => b.ID === id);
    }

    getPlayers() {
        return this.bodies.filter(b => b.type === "player");
    }
}