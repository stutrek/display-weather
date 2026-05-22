export function drawCumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  type Circle = { cx: number; cy: number; r: number };
  const circles: Circle[] = [];

  // Multiple vertical passes so clouds spread across the full height at high coverage
  // rather than piling into a single horizontal band.
  // 25% → 1 pass, 50% → 1-2, 75% → 2, 100% → 3
  const midCov = coverageAt(width / 2);
  const passCount = Math.max(1, Math.round(midCov * 4.5));
  const totalClusters = Math.max(2, Math.round(2 + midCov * 15 + midCov * midCov * 45));
  const clustersPerPass = Math.ceil(totalClusters / passCount);

  for (let pass = 0; pass < passCount; pass++) {
    const yBase = passCount === 1 ? 0.1 : (pass / (passCount - 1)) * 0.55;
    for (let c = 0; c < clustersPerPass; c++) {
      const ax = rng() * width;
      const ay = height * (yBase + 0.05 + rng() * 0.35);
      const baseR = (10 + rng() * 13) * 0.67;
      const circleCount = 4 + Math.round(rng() * 5);
      for (let j = 0; j < circleCount; j++) {
        circles.push({
          cx: ax + (rng() - 0.5) * baseR * 3,
          cy: ay + (rng() - 0.5) * baseR * 0.8,
          r: baseR * (0.5 + rng() * 0.8),
        });
      }
    }
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  for (const { cx, cy, r } of circles) {
    const localCov = coverageAt(cx);
    off.save();
    off.globalAlpha = Math.max(0.15, localCov);

    // White puff
    const puff = off.createRadialGradient(cx, cy, 0, cx, cy, r);
    puff.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
    puff.addColorStop(0.55, 'rgba(250, 252, 255, 0.78)');
    puff.addColorStop(1, 'rgba(248, 250, 255, 0)');
    off.beginPath();
    off.arc(cx, cy, r, 0, Math.PI * 2);
    off.fillStyle = puff;
    off.fill();

    // Per-blob shading: linear gradient clipped to the same circle
    const shade = off.createLinearGradient(cx, cy - r, cx, cy + r);
    shade.addColorStop(0, 'rgba(80, 105, 145, 0)');
    shade.addColorStop(0.6, 'rgba(80, 105, 145, 0)');
    shade.addColorStop(1, 'rgba(80, 105, 145, 0.28)');
    off.save();
    off.beginPath();
    off.arc(cx, cy, r, 0, Math.PI * 2);
    off.clip();
    off.fillStyle = shade;
    off.fillRect(cx - r, cy - r, r * 2, r * 2);
    off.restore();

    off.restore();
  }

  ctx.drawImage(offscreen, 0, 0);
}
