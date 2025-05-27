import { uiState } from './state.js';

export function drawWorld(ctx, canvas) {
    const world = uiState.clientWorld;
    const viewport = uiState.viewport;
    const trails = uiState.trails;
    const selectedBodyID = uiState.selectedBodyID;
    const showSpokes = uiState.showSpokes;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trails for all selected (could be toggled for more bodies if needed)
    if (selectedBodyID && trails[selectedBodyID]) {
        ctx.save();
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        const t = trails[selectedBodyID];
        if (t.length) {
            ctx.beginPath();
            const [startX, startY] = viewport.worldToScreen(t[0], canvas);
            ctx.moveTo(startX, startY);
            for (let i = 1; i < t.length; i++) {
                const [px, py] = viewport.worldToScreen(t[i], canvas);
                ctx.lineTo(px, py);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    // Draw bodies
    for (const body of world.bodies) {
        drawBody(ctx, body, {
            isSelected: selectedBodyID === body.ID,
            showSpokes,
            viewport,
            canvas,
        });
    }
}

function drawBody(ctx, body, { isSelected, showSpokes, viewport, canvas }) {
    const { shape, x, y, r: radius = 20, angle = 0 } = body;
    const center = viewport.worldToScreen([x, y], canvas);

    // Draw filled body (background for picking)
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius * viewport.zoom, 0, 2 * Math.PI);
    ctx.fillStyle = '#ddd';
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // Draw spokes if enabled and shape is defined
    if (showSpokes && shape && shape.angles && shape.r) {
        ctx.save();
        ctx.strokeStyle = 'lightgreen';
        ctx.beginPath();
        for (let i = 0; i < shape.angles.length; i++) {
            const θ = shape.angles[i] + angle;
            const dist = shape.r[i];
            const spokeEnd = viewport.worldToScreen(
                [x + Math.cos(θ) * dist, y + Math.sin(θ) * dist],
                canvas
            );
            ctx.moveTo(center[0], center[1]);
            ctx.lineTo(spokeEnd[0], spokeEnd[1]);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw outline
    ctx.save();
    ctx.strokeStyle = isSelected ? "orange" : "black";
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.beginPath();
    if (shape && shape.angles && shape.r) {
        for (let i = 0; i <= shape.angles.length; i++) {
            const θ = shape.angles[i % shape.angles.length] + angle;
            const dist = shape.r[i % shape.r.length];
            const pt = viewport.worldToScreen(
                [x + Math.cos(θ) * dist, y + Math.sin(θ) * dist],
                canvas
            );
            if (i === 0) ctx.moveTo(pt[0], pt[1]);
            else ctx.lineTo(pt[0], pt[1]);
        }
        ctx.closePath();
    } else {
        // Fallback to simple circle if shape missing
        ctx.arc(center[0], center[1], radius * viewport.zoom, 0, 2 * Math.PI);
    }
    ctx.stroke();
    ctx.restore();

    // Draw label
    ctx.save();
    ctx.font = isSelected ? "bold 16px sans-serif" : "14px sans-serif";
    ctx.fillStyle = isSelected ? "orange" : "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(body.type || body.ID, center[0], center[1]);
    ctx.restore();
}
