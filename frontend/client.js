

export function connect(onMessage) {
    const ws = new WebSocket(`ws://${location.host}`);

    ws.onmessage = (e) => {
        // console.log(e);
        // bus.emit('state', data); 
        const data = JSON.parse(e.data);
        // console.log(raw);
        const payload = data.payload
        const type = data.type;
        if (type === "STATE_UPDATE"){
            for (const body of payload.bodies) {
                const shape = body.shape;
                const n = shape.spokes;
                const repaired = new Float32Array(n);
                for (let i = 0; i < n; i++) {
                    repaired[i] = shape.r[i]; // i is a string in `r`, works fine
                }
                shape.r = repaired;
            }
        }

        onMessage(payload);
    };
}
