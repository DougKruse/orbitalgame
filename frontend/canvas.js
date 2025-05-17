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
playerState.targetID = 'player0';
function findPlayer( world ){
    return world.bodies.find(b => b.ID === playerState.targetID);
}


document.getElementById('pauseBtn').addEventListener('click', () => {
    isPausedLocally = !isPausedLocally;

    if (playerState.locked && !isPausedLocally) {
        // Fire signal to server
        const playerB = findPlayer(clientWorld || world);

        const barrelLength = playerB.shape.rMax;
        const tipX = playerB.x + Math.cos(playerState.aimAngle) * barrelLength;
        const tipY = playerB.y + Math.sin(playerState.aimAngle) * barrelLength;

        clientBus.emit('send', {
            type: 'fireBullet',
            payload: {
                pos: [tipX, tipY],
                unitVelocity: 100,
                angle: playerState.aimAngle,
            },
        });
        clientBus.emit('send', {
            type: 'setAim',
            payload: {
                bodyID: playerState.targetID,
                angle: playerState.aimAngle - Math.PI/2, //unsure why need to fix
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
        // Ensure r and angles are Float32Array, not regular arrays
        if (!(shape.r instanceof Float32Array)) {
            shape.r = new Float32Array(shape.r);
        }
        if (!(shape.angles instanceof Float32Array)) {
            shape.angles = new Float32Array(shape.angles);
        }
    }
    isPausedServer = false;
    world = payload;
    clientWorld = structuredClone(payload);
});



let sanitylimit = 0;


function drawBody(ctx, body) {
    if ( sanitylimit < 6 ){
        console.log(body);
        sanitylimit++;
    }

    const { angles, r } = body.shape;
    const spokeCount = angles.length;

    // === Draw spokes in light green ===
    ctx.beginPath();
    ctx.strokeStyle = 'lightgreen';
    for (let i = 0; i < spokeCount; i++) {
        const θ = angles[i] + body.angle;
        const dist = r[i];
        const px = body.x + Math.cos(θ) * dist;
        const py = body.y + Math.sin(θ) * dist;
        ctx.moveTo(body.x, body.y);
        ctx.lineTo(px, py);
    }
    ctx.stroke();

    // === Draw body outline in black ===
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    for (let i = 0; i <= spokeCount; i++) {
        const θ = angles[i % spokeCount] + body.angle;
        const dist = r[i % spokeCount];
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

    if (playerState.targetID != null && isPausedLocally) {
        updatePlayerControl(clientWorld);
        updateFireStateUI();
        const playerB = findPlayer(clientWorld)
        playerB.angle = at.normalizeAngle(playerB.angle + playerB.omega);

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
        `Locked: ${playerState.locked}, Aim: ${Math.round(findPlayer(clientWorld).angle * 180 / Math.PI)}°`;
}

