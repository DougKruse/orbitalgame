import { connect } from './client.js';
import { clientBus } from './clientBus.js';

const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

let world = null;
connect();

clientBus.on('STATE_UPDATE', (payload) => {
    for (const body of payload.bodies) {
        const shape = body.shape;
        const n = shape.spokes;
        const repaired = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            repaired[i] = shape.r[i];
        }
        shape.r = repaired;
    }
    world = payload;
});

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const typeAndPayload = {
        type: 'makeBullet',
        payload: { 
            x: e.clientX - rect.width/2,
            y: e.clientY - rect.height/2
        }
    };
    // console.log(rect);
    clientBus.emit('send', typeAndPayload);
});



function drawBody(ctx, body) {
    const { r, spokes } = body.shape;
    // console.log(r);
    const angle = body.angle;
    const step = (2 * Math.PI) / spokes;

    ctx.beginPath();
    for (let i = 0; i <= spokes; i++) {
        const θ = i * step + angle;
        const dist = r[i % spokes];
        const px = body.x + Math.cos(θ) * dist;
        const py = body.y + Math.sin(θ) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

function draw() {
    requestAnimationFrame(draw);
    // console.log("drawing..."); 
    if (!world) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of world.bodies) {
        ctx.beginPath();
        ctx.arc(400 + b.x, 300 + b.y, b.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    for (const b of world.bodies) {
        ctx.save();
        ctx.translate(400, 300); // center camera
        drawBody(ctx, b);
        ctx.restore();
    }

}

draw();


