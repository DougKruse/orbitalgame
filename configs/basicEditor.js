// ==========================
// State & Core Data
// ==========================

const RINGS = [];

// ==========================
// DOM Helpers
// ==========================

function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

function qsa(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function el(tag, props = {}, ...children) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => e.setAttribute(k, v));
    children.forEach(c => e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return e;
}

// ==========================
// Ring Structure
// ==========================

function createRing() {
    return {
        radius: 1000,
        count: 4,
        type: "planet",
        polarity: 1,
        size: 200,
        spokes: 64,
        equidistant: true,
        flags: {},
        overrides: {}
    };
}

// ==========================
// UI Rendering
// ==========================

function renderRingUI() {
    const ringContainer = qs("#rings");
    ringContainer.innerHTML = '';

    RINGS.forEach((ring, i) => {
        const row = el("div", { class: "ringRow" });

        row.appendChild(el("label", {}, `Ring ${i + 1}`));

        const radius = el("input", { type: "number", min: 0, "data-i": i, "data-k": "radius" });
        const count = el("input", { type: "number", min: 1, "data-i": i, "data-k": "count" });
        const size = el("input", { type: "number", min: 1, "data-i": i, "data-k": "size" });
        const spokes = el("input", { type: "number", min: 3, "data-i": i, "data-k": "spokes" });

        const typeSelect = el("select", { "data-i": i, "data-k": "type" },
            ...["planet", "asteroid", "debris"].map(t => el("option", { value: t }, t))
        );

        const polaritySelect = el("select", { "data-i": i, "data-k": "polarity" },
            el("option", { value: 1 }, "1 (Clockwise)"),
            el("option", { value: -1 }, "-1 (Counter-Clockwise)")
        );

        // Force value sync (fixes desync bug)
        radius.value = ring.radius;
        count.value = ring.count;
        size.value = ring.size;
        spokes.value = ring.spokes;
        typeSelect.value = ring.type;
        polaritySelect.value = ring.polarity;

        row.appendChild(el("label", {}, "Radius")); row.appendChild(radius);
        row.appendChild(el("label", {}, "Object Count")); row.appendChild(count);
        row.appendChild(el("label", {}, "Object Size")); row.appendChild(size);
        row.appendChild(el("label", {}, "Spokes")); row.appendChild(spokes);
        row.appendChild(el("label", {}, "Type")); row.appendChild(typeSelect);
        row.appendChild(el("label", {}, "Polarity")); row.appendChild(polaritySelect);

        ringContainer.appendChild(row);
    });

    qsa("input, select", ringContainer).forEach(input => {
        input.onchange = (e) => {
            const i = +e.target.dataset.i;
            const k = e.target.dataset.k;
            RINGS[i][k] = ["count", "radius", "size", "spokes", "polarity"].includes(k)
                ? +e.target.value
                : e.target.value;
            renderCanvas();
        };
    });
}


// ==========================
// Canvas Rendering
// ==========================

function renderCanvas() {
    const canvas = qs("#worldCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    for (const ring of RINGS) {
        for (let i = 0; i < ring.count; i++) {
            const angle = ring.equidistant
                ? (2 * Math.PI * i) / ring.count
                : Math.random() * 2 * Math.PI;

            const x = ring.radius * Math.cos(angle);
            const y = ring.radius * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, ring.size / 20, 0, 2 * Math.PI);
            ctx.fillStyle = ring.type === "planet" ? "blue" : ring.type === "asteroid" ? "gray" : "white";
            ctx.fill();
        }
    }

    ctx.restore();
}

// ==========================
// JSON Export
// ==========================

function generateWorldJSON() {
    const star = {
        type: "star",
        shape: { generator: "circle", args: [64, 40] },
        position: [0, 0],
        velocity: [0, 0],
        rotation: { angle: 0, omega: 0 }
    };

    const bodies = [star];

    for (const ring of RINGS) {
        const count = ring.count;
        const r = ring.radius;
        const polarity = ring.polarity;

        for (let i = 0; i < count; i++) {
            const theta = (2 * Math.PI * i) / count;
            const angle = polarity === -1 ? theta : -theta; // invert for clockwise
            const x = Math.round(r * Math.cos(angle));
            const y = Math.round(r * Math.sin(angle));

            const override = ring.overrides[i] || {};
            const shapeSize = override.size || ring.size;
            const shapeSpokes = override.spokes || ring.spokes;

            bodies.push({
                type: override.type || ring.type,
                shape: { generator: "circle", args: [shapeSpokes, shapeSize] },
                position: [x, y],
                velocity: [0, 0],
                rotation: { angle: 0, omega: 0 },
                flag: { orbitSeed: { direction: polarity } }
            });
        }
    }

    return { bodies };
}


// ==========================
// Bootstrap & Wiring
// ==========================

function initEditor() {
    qs("#addRing").onclick = () => {
        RINGS.push(createRing());
        renderRingUI();
        renderCanvas();
    };

    qs("#exportJSON").onclick = () => {
        const jsonOut = qs("#jsonOut");
        jsonOut.textContent = JSON.stringify(generateWorldJSON(), null, 2);
    };

    qs("#copyJSON").onclick = () => {
        const json = qs("#jsonOut").textContent;
        navigator.clipboard.writeText(json).then(() => {
            console.log("JSON copied to clipboard.");
        }).catch(err => {
            console.error("Failed to copy JSON", err);
        });
    };

}

// Run
initEditor();
