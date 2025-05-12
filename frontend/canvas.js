import { connect } from './client.js';

const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');

let world = null;

connect((state) => {
    // console.log("received update", state); 
    world = state;
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


