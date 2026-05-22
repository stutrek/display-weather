/**
 * Cirrus: thin wispy horizontal streaks drawn as radial-gradient ellipses.
 * Each strand is very wide and very thin, low opacity, offset randomly in y.
 * Multiple overlapping strands create the layered ice-crystal look.
 */
export function drawCirrus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  const strandCount = Math.round(4 + coverageAt(width / 2) * 14);

  for (let i = 0; i < strandCount; i++) {
    const cx = (rng() - 0.1) * width;
    const cy = rng() * height;
    const rx = width * (0.25 + rng() * 0.5);
    const ry = 3 + rng() * 7;
    const alpha = (0.12 + rng() * 0.28) * Math.max(0.2, coverageAt(cx));

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
