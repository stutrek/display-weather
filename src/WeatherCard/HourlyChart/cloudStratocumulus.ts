function buildValueGrid(cols: number, rows: number, rng: () => number): number[][] {
  return Array.from({ length: rows + 1 }, () => Array.from({ length: cols + 1 }, () => rng()));
}

function sampleValueGrid(
  x: number,
  y: number,
  grid: number[][],
  cols: number,
  rows: number,
): number {
  const ix = ((Math.floor(x) % cols) + cols) % cols;
  const iy = ((Math.floor(y) % rows) + rows) % rows;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const v00 = grid[iy][ix];
  const v10 = grid[iy][(ix + 1) % (cols + 1)];
  const v01 = grid[(iy + 1) % (rows + 1)][ix];
  const v11 = grid[(iy + 1) % (rows + 1)][(ix + 1) % (cols + 1)];
  return v00 + (v10 - v00) * ux + (v01 - v00) * uy + (v00 - v10 - v01 + v11) * ux * uy;
}

export function drawStratocumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  const cols = 16;
  const rows = 10;

  // One independent grid per fBm octave — reusing the same grid at doubled
  // frequency causes coherent wrap-around seams that repeat visibly across the canvas.
  const shapeGrids = [
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
  ];
  const texGrids = [
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
  ];

  const sampleShape = (px: number, py: number): number => {
    // High x-freq for small cells; strong y-compression creates flat row-like bands.
    // 2 octaves keeps cell size consistent rather than fractal-varied.
    const bx = (px / width) * cols * 1.65;
    const by = (py / height) * rows * 1.9;
    let v = 0;
    let amp = 0.5;
    let totalAmp = 0;
    for (let o = 0; o < 2; o++) {
      v +=
        sampleValueGrid((bx * (1 << o)) % cols, (by * (1 << o)) % rows, shapeGrids[o], cols, rows) *
        amp;
      totalAmp += amp;
      amp *= 0.5;
    }
    return v / totalAmp;
  };

  const sampleTex = (px: number, py: number): number => {
    const bx = (px / width) * cols * 4.5;
    const by = (py / height) * rows * 3.5;
    let v = 0;
    let amp = 0.5;
    let totalAmp = 0;
    for (let o = 0; o < 3; o++) {
      v +=
        sampleValueGrid((bx * (1 << o)) % cols, (by * (1 << o)) % rows, texGrids[o], cols, rows) *
        amp;
      totalAmp += amp;
      amp *= 0.5;
    }
    return v / totalAmp;
  };

  const imageData = ctx.createImageData(width, height);
  const d = imageData.data;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const threshold = 0.85 - coverageAt(px) * 0.75;
      const n = sampleShape(px, py);
      if (n > threshold) {
        const t = (n - threshold) / (1 - threshold);
        const smooth = t * t * t * (t * (6 * t - 15) + 10);
        const texN = sampleTex(px, py);
        const texShadow = Math.max(0, 0.52 - texN) * 2.1;
        const shadow = Math.round(Math.min(texShadow, 1) * 35);
        const idx = (py * width + px) * 4;
        d[idx] = 255 - shadow;
        d[idx + 1] = 255 - shadow;
        d[idx + 2] = Math.min(255, 255 - Math.round(shadow * 0.6) + 5);
        d[idx + 3] = Math.round(smooth * 238);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
