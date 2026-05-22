export function drawCumulonimbus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  type Circle = { cx: number; cy: number; r: number };
  const circles: Circle[] = [];

  const midCov = coverageAt(width / 2);
  // Fewer clusters than cumulus, spans full height
  const passCount = Math.max(2, Math.round(midCov * 5));
  const totalClusters = Math.max(2, Math.round(2 + midCov * 10 + midCov * midCov * 25));
  const clustersPerPass = Math.ceil(totalClusters / passCount);

  for (let pass = 0; pass < passCount; pass++) {
    // Spread passes across the FULL canvas height (not just top 55%)
    const yBase = (pass / (passCount - 1)) * 0.72;
    for (let c = 0; c < clustersPerPass; c++) {
      const ax = rng() * width;
      const ay = height * (yBase + rng() * 0.2);
      // Larger radius than cumulus — more overlap = less bubbly
      const baseR = (13 + rng() * 16) * 0.67;
      const circleCount = 5 + Math.round(rng() * 6);
      for (let j = 0; j < circleCount; j++) {
        circles.push({
          cx: ax + (rng() - 0.5) * baseR * 2.8,
          cy: ay + (rng() - 0.5) * baseR * 1.4,
          r: baseR * (0.7 + rng() * 0.9),
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

    // Slightly greyer than cumulus
    const puff = off.createRadialGradient(cx, cy, 0, cx, cy, r);
    puff.addColorStop(0, 'rgba(225, 228, 242, 0.94)');
    puff.addColorStop(0.5, 'rgba(195, 200, 225, 0.78)');
    puff.addColorStop(1, 'rgba(175, 180, 215, 0)');
    off.beginPath();
    off.arc(cx, cy, r, 0, Math.PI * 2);
    off.fillStyle = puff;
    off.fill();

    // Per-blob base shading
    const shade = off.createLinearGradient(cx, cy - r, cx, cy + r);
    shade.addColorStop(0, 'rgba(30, 35, 70, 0)');
    shade.addColorStop(0.5, 'rgba(30, 35, 70, 0)');
    shade.addColorStop(1, 'rgba(20, 24, 58, 0.38)');
    off.save();
    off.beginPath();
    off.arc(cx, cy, r, 0, Math.PI * 2);
    off.clip();
    off.fillStyle = shade;
    off.fillRect(cx - r, cy - r, r * 2, r * 2);
    off.restore();

    off.restore();
  }

  // Global dark base over the whole cloud mass — heavier than cumulus but not oppressive
  off.save();
  off.globalCompositeOperation = 'source-atop';
  const darkBase = off.createLinearGradient(0, height * 0.35, 0, height);
  darkBase.addColorStop(0, 'rgba(20, 24, 60, 0)');
  darkBase.addColorStop(1, 'rgba(14, 17, 48, 0.52)');
  off.fillStyle = darkBase;
  off.fillRect(0, 0, width, height);
  off.restore();

  ctx.drawImage(offscreen, 0, 0);
}
