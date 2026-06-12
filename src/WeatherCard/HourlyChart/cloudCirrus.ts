import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

export function drawCirrus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  const { mean: meanCov } = sampleCoverageStats(coverageAt, width);
  if (meanCov < 0.005) return;
  const invCdf = makeCoverageInvCdf(coverageAt, width);

  // Width-scaled count — matches the old 3 + cov * 60 at the story's 360px
  const strandCount = Math.max(2, Math.round((width / 360) * (3 + meanCov * 60)));

  for (let i = 0; i < strandCount; i++) {
    const cx = invCdf(rng()); // density follows the coverage envelope
    const cy = rng() * height;
    const rxBase = 90 + rng() * 180; // absolute px == width * (0.25..0.75) at 360
    const ry = 3 + rng() * 7;
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    // Clamp strand length to the local coverage support so a strand never
    // spans a zero-coverage gap (a sunny break must stay clear)
    let extent = 0;
    while (extent < rxBase && coverageAt(cx - extent) >= 0.02 && coverageAt(cx + extent) >= 0.02) {
      extent += 12;
    }
    const rx = Math.max(20, Math.min(rxBase, extent + 20));

    // Fade strands out as local coverage approaches zero (×1 at cov ≥ 0.25)
    const alpha = (0.22 + rng() * 0.32) * Math.min(1, localCov * 4);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(2)})`);
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${(alpha * 0.5).toFixed(2)})`);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }
}
