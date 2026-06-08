export function drawCumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
): void {
  const midCov = coverageAt(width / 2);

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  // Scale cluster count with both coverage and canvas width so that at medium
  // coverage the clusters overlap into visible swaths rather than isolated dots.
  const clusterCount = Math.max(3, Math.round(3 + midCov * (width / 4.5)));

  for (let c = 0; c < clusterCount; c++) {
    const cx = rng() * width * 1.15 - width * 0.075;
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    // Thin out clusters in low-coverage regions — controls density, not brightness
    if (rng() > localCov + 0.4) continue;

    const cy = height * (0.1 + rng() * 0.6);
    const baseR = 7 + rng() * 9; // 7–16 px — distinct small puffs
    const circleCount = 4 + Math.round(rng() * 5);

    for (let j = 0; j < circleCount; j++) {
      const bx = cx + (rng() - 0.5) * baseR * 1.6;
      const by = cy + (rng() - 0.5) * baseR * 0.5;
      const r = baseR * (0.55 + rng() * 0.8);

      off.save();
      // Fixed high opacity — a cloud is bright white regardless of how many there are
      off.globalAlpha = 0.78 + rng() * 0.18;

      const puff = off.createRadialGradient(bx, by, 0, bx, by, r);
      puff.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      puff.addColorStop(0.55, 'rgba(250, 252, 255, 0.80)');
      puff.addColorStop(1, 'rgba(248, 250, 255, 0)');
      off.beginPath();
      off.arc(bx, by, r, 0, Math.PI * 2);
      off.fillStyle = puff;
      off.fill();

      const shade = off.createLinearGradient(bx, by - r, bx, by + r);
      shade.addColorStop(0, 'rgba(80, 105, 145, 0)');
      shade.addColorStop(0.6, 'rgba(80, 105, 145, 0)');
      shade.addColorStop(1, 'rgba(80, 105, 145, 0.28)');
      off.save();
      off.beginPath();
      off.arc(bx, by, r, 0, Math.PI * 2);
      off.clip();
      off.fillStyle = shade;
      off.fillRect(bx - r, by - r, r * 2, r * 2);
      off.restore();

      off.restore();
    }
  }

  ctx.drawImage(offscreen, 0, 0);
}
