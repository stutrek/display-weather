export function drawCirrus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  const midCov = coverageAt(width / 2);
  const strandCount = Math.round(3 + midCov * 60);

  for (let i = 0; i < strandCount; i++) {
    const cx = (rng() - 0.1) * width;
    const cy = rng() * height;
    const rx = width * (0.25 + rng() * 0.5);
    const ry = 3 + rng() * 7;
    const alpha = 0.22 + rng() * 0.32;

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
