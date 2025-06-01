import { uiState } from './state.js';


const DEBUG_OUTLINE = '#9e9e9e'

// Main draw orchestrator
export function drawWorld(ctx, canvas) {
    const world = uiState.clientWorld;
    const viewport = uiState.viewport;
    const trails = uiState.trails;
    const selectedIDs = uiState.selectedIDs;
    const selectedBodies = [...uiState.selectedIDs].map(id => world.getById(id)).filter(Boolean);
    const showSpokes = uiState.showSpokes;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trails for all selected
    for (const id of selectedIDs) {
        if (trails[id] && trails[id].length > 1) {
            drawTrail(ctx, trails[id], {
                viewport,
                canvas,
                color: "orange",
                width: 2
            });
        }
    }

    // Draw all bodies
    for (const body of world.bodies) {
        drawBody(ctx, body, {
            isSelected: selectedIDs.has(body.ID),
            showSpokes,
            viewport,
            canvas
        });
        drawBuildings(ctx, body, {
            showSpokes,
            viewport,
            canvas
        })
    }

    // Infoboxes
    drawInfoBoxes(selectedBodies);
}

// Draw only a trail, no state mutation
function drawTrail(ctx, trail, { viewport, canvas, color = "orange", width = 2 }) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    const [startX, startY] = viewport.worldToScreen(trail[0], canvas);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < trail.length; i++) {
        const [x, y] = viewport.worldToScreen(trail[i], canvas);
        ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}
// Draw a single body
function drawBody(ctx, body, { isSelected, showSpokes, viewport, canvas }) {
    const { shape, x, y, r: radius = 20, angle = 0 } = body;
    const center = viewport.worldToScreen([x, y], canvas);

    // Fill body
    // ctx.save();
    // ctx.globalAlpha = 0.6;
    // ctx.beginPath();
    // ctx.arc(center[0], center[1], radius * viewport.zoom, 0, 2 * Math.PI);
    // ctx.fillStyle = '#ddd';
    // ctx.fill();
    // ctx.globalAlpha = 1.0;
    // ctx.restore();

    // Spokes
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

    // Outline
    ctx.save();
    ctx.strokeStyle = isSelected ? "orange" : DEBUG_OUTLINE;
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
        ctx.arc(center[0], center[1], radius * viewport.zoom, 0, 2 * Math.PI);
    }
    ctx.stroke();
    ctx.restore();

    // Label
    ctx.save();
    ctx.font = isSelected ? "bold 16px sans-serif" : "14px sans-serif";
    ctx.fillStyle = isSelected ? "orange" : DEBUG_OUTLINE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(body.ID || body.type, center[0], center[1]);
    ctx.restore();
}

// Modular: draw buildings on a body's surface as small icons/markers
export function drawBuildings(ctx, body, { viewport, canvas, showSpokes }) {
    if (!Array.isArray(body.buildings) || !body.buildings.length) return;
    const { x, y, angle = 0, shape } = body;
    const center = viewport.worldToScreen([x, y], canvas);

    // Calculate positions for each building
    for (const building of body.buildings) {
        // For now, assume each building is placed along a spoke (angle)
        // and at distance matching the shape's radius for that spoke
        let θ = 0, dist = 0;
        const idx = building.spoke ?? 0;
        θ = (shape.angles[idx % shape.angles.length] || 0) + angle;
        dist = (shape.r[idx % shape.r.length] || 0);


        // Offset outward from center
        const pos = [
            x + Math.cos(θ) * dist,
            y + Math.sin(θ) * dist,
        ];
        const [screenX, screenY] = viewport.worldToScreen(pos, canvas);

        // Draw marker for building (simple house/box for now)
        ctx.save();
        ctx.translate(screenX, screenY);

        // Color and shape by type
        let fill = "#49f";
        if (building.type === "test") fill = "#4f9";
        // ... extend as desired

        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, 2 * Math.PI);
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        // Optionally add an icon or label
        ctx.globalAlpha = 1;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#222";
        ctx.fillText(building.type[0]?.toUpperCase() || "?", 0, 0);

        ctx.restore();

        let playerAim = uiState.viewport.worldToScreen([uiState.localPlayer.mouse.x, uiState.localPlayer.mouse.y]);

        if(building.type === 'test' && uiState.isPausedLocally){
            buildingAim(ctx, [screenX, screenY], playerAim);
        }
    }
}

function buildingAim(ctx, pos, aim){
    ctx.save();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.setLineDash([7,6]);
    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
    ctx.lineTo(aim[0], aim[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}



// Utility to format floats and arrays for text display
function fmt(val) {
    if (typeof val === "number")
        return val.toFixed(1);
    if (Array.isArray(val))
        return `[${val.map(fmt).join(", ")}]`;
    return String(val);
}

function drawInfoBoxes(selectedBodies = []) {
    // Remove previous infoboxes
    let boxDiv = document.getElementById("infobox-container");
    if (!boxDiv) {
        boxDiv = document.createElement("div");
        boxDiv.id = "infobox-container";
        boxDiv.style.position = "absolute";
        boxDiv.style.pointerEvents = "none"; // only children receive pointer
        boxDiv.style.right = "0";
        boxDiv.style.bottom = "0";
        boxDiv.style.zIndex = "20";
        document.body.appendChild(boxDiv);
    }
    boxDiv.innerHTML = ""; // clear

    const boxWidth = 270, boxHeight = 150, gap = 12;
    let totalHeight = 0;
    for (const body of selectedBodies) {
        const dbg = body.gravityDebug || {};
        const div = document.createElement("div");
        div.className = "infobox";
        div.style.pointerEvents = "auto";
        div.style.width = boxWidth + "px";
        div.style.minHeight = boxHeight + "px";
        div.style.background = "rgba(34,34,44,0.92)";
        div.style.color = "#ffd070";
        div.style.font = "13px monospace";
        div.style.borderRadius = "14px";
        div.style.border = "2px solid #ffbf30";
        div.style.marginBottom = gap + "px";
        div.style.marginRight = "10px";
        div.style.padding = "12px 18px";
        div.style.userSelect = "text";
        div.style.position = "relative";
        div.style.boxShadow = "0 2px 16px 0 #0008";
        div.style.transition = "box-shadow 0.15s";
        div.style.maxWidth = boxWidth + "px";
        div.style.overflowX = "auto";

        // Title
        div.innerHTML = `<div style="font-weight:bold;font-size:15px;margin-bottom:5px;">${body.ID || body.ID}</div>`;

        // Specific debug display (prettified for your structure)
        // Attractors
        if (dbg.attractorIDs) {
            div.innerHTML += `<div>attractors: <span style="color:#fff">${fmt(dbg.attractorIDs)}</span></div>`;
        }
        // Parent
        if (dbg.parentID) {
            div.innerHTML += `<div>parentID: <span style="color:#fff">${dbg.parentID}</span></div>`;
        }
        // Parent hill
        if (typeof dbg.isParentHillPrimary === "boolean") {
            div.innerHTML += `<div>isParentHillPrimary: <span style="color:#fff">${dbg.isParentHillPrimary}</span></div>`;
        }
        // Hill radii
        if (dbg.hillRadii) {
            div.innerHTML += `<div>hillRadii: <span style="color:#fff">${fmt(dbg.hillRadii)}</span></div>`;
        }
        // Within hill
        if (dbg.withinHill) {
            div.innerHTML += `<div>withinHill: <span style="color:#fff">${fmt(dbg.withinHill)}</span></div>`;
        }
        // Distances
        if (dbg.distances) {
            div.innerHTML += `<div>distances: <span style="color:#fff">${fmt(dbg.distances)}</span></div>`;
        }
        // Forces
        if (dbg.forces) {
            div.innerHTML += `<div>forces:</div>`;
            dbg.forces.forEach((arr, i) => {
                div.innerHTML += `<div style="margin-left:1.5em;color:#fff">
                [${arr.map(fmt).join(", ")}]
                </div>`;
            });
        }
        
        // Ideal Orbit Velo
        if (dbg.idealCircularOrbitVelocities) {
            div.innerHTML += `<div>idealOrbitV: <span style="color:#fff">${fmt(dbg.idealCircularOrbitVelocities)}</span></div>`;
        }


        // Pad/space and stack boxes upward if overflow
        boxDiv.prepend(div);
        totalHeight += div.offsetHeight + gap;
        // If we're going to run out of screen space, stop showing more
        if (totalHeight > window.innerHeight - 30) break;
    }
}
