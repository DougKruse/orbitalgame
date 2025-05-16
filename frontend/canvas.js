import { connect } from './client.js';
import { clientBus } from './clientBus.js';
import { registerMouseControl, updatePlayerControl, playerState } from './playerController.js';
import * as at from '../shared/angleTools.js';

const canvas = document.getElementById('main');
const ctx = canvas.getContext('2d');
const cx = canvas.width / 2;
const cy = canvas.height / 2;


let world = null;
let clientWorld = null;
export let isPausedLocally = false;
let isPausedServer = false;

connect();

registerMouseControl(canvas);
playerState.target = 3;


document.getElementById('pauseBtn').addEventListener('click', () => {
    isPausedLocally = !isPausedLocally;

    if (playerState.locked && !isPausedLocally) {
        // Fire signal to server
        const body = (clientWorld || world).bodies[playerState.target];

        const barrelLength = body.shape.rMax;
        const tipX = body.x + Math.cos(playerState.aimAngle) * barrelLength;
        const tipY = body.y + Math.sin(playerState.aimAngle) * barrelLength;

        clientBus.emit('send', {
            type: 'fireBullet',
            payload: {
                x: tipX,
                y: tipY,
                angle: playerState.aimAngle,
            },
        });
        playerState.locked = false;
        updateFireStateUI();
    }


    clientBus.emit('send', {
        type: 'toggleTick',
        payload: {} // nothing needed
    });
});

clientBus.on('paused', (payload) => {
    isPausedServer = true;
});

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
    isPausedServer = false;
    world = payload;
    clientWorld = structuredClone(payload);
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

    if (playerState.target != null && isPausedLocally) {
        updatePlayerControl(clientWorld);
        updateFireStateUI();
        const b = clientWorld.bodies[playerState.target];
        console.log(clientWorld.bodies);
        b.angle = at.normalizeAngle(b.angle + b.omega);
        // if (b.angle < 0) b.angle += 2 * Math.PI;
    }
    // console.log(playerState.aimAngle);
    // updateFireStateUI();

    const activeWorld = clientWorld || world;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of activeWorld.bodies) {
        ctx.beginPath();
        ctx.arc(cx + b.x, cy + b.y, b.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    for (const b of activeWorld.bodies) {
        ctx.save();
        ctx.translate(cx, cy); // center camera
        drawBody(ctx, b);
        ctx.restore();
    }
}

draw();

function updateFireStateUI() {
    document.getElementById('fireState').textContent =
        `Locked: ${playerState.locked}, Aim: ${Math.round(clientWorld.bodies[playerState.target].angle * 180 / Math.PI)}°`;
}




