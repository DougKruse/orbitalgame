export function analyzeShape(shape) {
    const { r, spokes } = shape;

    let sum = 0;
    let max = 0;

    for (let i = 0; i < spokes; i++) {
        sum += r[i];
        if (r[i] > max) max = r[i];
    }

    shape.rAvg = sum / spokes;
    shape.rMax = max;
    shape.areaApprox = Math.PI * shape.rAvg * shape.rAvg;

    return shape;
}
