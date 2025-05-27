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

let showSpokes = false;              // Controls spoke visibility
let selectedBodyID = null;           // Stores ID of selected body
const trails = {};                   // Keyed by body.ID: Array of [x, y]


connect();

registerMouseControl(canvas);
playerState.targetID = 'player0';
function findPlayer( world ){
    return world.bodies.find(b => b.ID === playerState.targetID);
}

document.getElementById('toggleSpokesBtn').addEventListener('click', () => {
    showSpokes = !showSpokes;
});

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

canvas.addEventListener('click', function (evt) {
    const rect = canvas.getBoundingClientRect();
    // Mouse in world coords (centered at cx, cy)
    const mx = evt.clientX - rect.left - cx;
    const my = evt.clientY - rect.top - cy;

    let found = null;
    // Check bodies from last to first so topmost is found if overlapping
    const bodies = (clientWorld || world).bodies;
    for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        // Use max radius for hit area
        const visualRadius = b.r || (b.shape && Math.max(...b.shape.r));
        if (Math.hypot(mx - b.x, my - b.y) < visualRadius) {
            found = b;
            break; // Take topmost
        }
    }
    console.log("Clicked body:", found ? found.ID : "none");
    if (found) {
        if (selectedBodyID === found.ID) {
            selectedBodyID = null; // Deselect
        } else {
            selectedBodyID = found.ID;
            if (!trails[selectedBodyID]) trails[selectedBodyID] = [];
        }
    }
});



let sanitylimit = 0;


function drawBody(ctx, body, isSelected) {
    if ( sanitylimit < 15 ){
        // console.log(body);
        sanitylimit++;
    }

    const { angles, r } = body.shape;
    const spokeCount = angles.length;

    // === Draw spokes in light green ===
    if (showSpokes) {
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
    }

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
    ctx.lineWidth = 1;

    // === Draw body type label centered ===
    ctx.save();
    ctx.font = isSelected ? "bold 16px sans-serif" : "14px sans-serif";
    ctx.fillStyle = isSelected ? "orange" : "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Use body.type if available, else fallback to ID
    ctx.fillText(body.type || body.ID, body.x, body.y);
    ctx.restore();
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


    // Update trails for selected
    if (selectedBodyID) {
        const body = activeWorld.bodies.find(b => b.ID === selectedBodyID);
        if (body) {
            // Push new position, only if changed
            let trail = trails[selectedBodyID];
            const last = trail[trail.length - 1];
            if (!last || last[0] !== body.x || last[1] !== body.y) {
                trail.push([body.x, body.y]);
                // Keep trail short enough for performance
                // if (trail.length > 500) trail.shift();
            }
        }
    }

    // Draw filled bodies (for click area)
    for (const b of activeWorld.bodies) {
        ctx.beginPath();
        ctx.arc(cx + b.x, cy + b.y, b.r, 0, 2 * Math.PI);
        ctx.fillStyle = '#ddd'; // or some other
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // Draw trails (behind the shapes)
    if (selectedBodyID && trails[selectedBodyID]) {
        ctx.save();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let t = trails[selectedBodyID];
        if (t.length) {
            ctx.moveTo(cx + t[0][0], cy + t[0][1]);
            for (let i = 1; i < t.length; i++) {
                ctx.lineTo(cx + t[i][0], cy + t[i][1]);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw bodies (with outlines, spokes, text)
    for (const b of activeWorld.bodies) {
        ctx.save();
        ctx.translate(cx, cy); // center camera
        drawBody(ctx, b, selectedBodyID === b.ID);
        ctx.restore();
    }

    // for (const b of activeWorld.bodies) {
    //     ctx.beginPath();
    //     ctx.arc(cx + b.x, cy + b.y, b.r, 0, 2 * Math.PI);
    //     ctx.fill();
    // }
    // for (const b of activeWorld.bodies) {
    //     ctx.save();
    //     ctx.translate(cx, cy); // center camera
    //     drawBody(ctx, b);
    //     ctx.restore();
    // }
}

draw();

function updateFireStateUI() {
    document.getElementById('fireState').textContent =
        `Locked: ${playerState.locked}, Aim: ${Math.round(findPlayer(clientWorld).angle * 180 / Math.PI)}°`;
}

