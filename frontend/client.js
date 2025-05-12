export function connect(onMessage) {
    const ws = new WebSocket(`ws://${location.host}`);
    ws.onmessage = (e) => {
        const raw = JSON.parse(e.data);
        // console.log(raw.bodies[0].shape);
        for (const body of raw.bodies) {
            const shape = body.shape;
            const n = shape.spokes;
            const repaired = new Float32Array(n);
            for (let i = 0; i < n; i++) {
                repaired[i] = shape.r[i]; // i is a string in `r`, works fine
            }
            shape.r = repaired;
        }

        onMessage(raw);
    };
}
