/**
 * Cumulonimbus: storm towers built with the same construction as the cumulus
 * renderer — flat-based puff rows on a per-cloud canvas, crisp edges, one
 * shading pass — but stacked into tapering tiers with a heavy dark base and
 * a bright sunlit crown.
 */

// Shadow tone for storm mass — same sky-blue family as cumulus, deepened
const SHADE = '35, 70, 105';

function drawOneStorm(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  cloudW: number,
  rng: () => number,
): void {
  const maxR = cloudW * 0.17;
  const pad = Math.ceil(maxR);
  const towerH = Math.min(cloudW * 0.85, baseY * 0.92);
  const tempW = Math.ceil(cloudW + pad * 2);
  const tempH = Math.ceil(towerH + pad);
  const baseLine = tempH - 1; // flat base sits at the bottom of the temp canvas

  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  // Pass 1 — silhouette only: tiers of solid white puffs from base to crown.
  // The union gives a lumpy outline with a flat interior; all form comes from
  // the shading passes below, so the construction circles stay invisible.
  const lobes: Array<{ px: number; py: number; r: number }> = [];
  const tiers = 3 + Math.round(rng());
  for (let tier = 0; tier < tiers; tier++) {
    const tt = tier / (tiers - 1);
    const tierW = cloudW * (1 - tt * 0.45) * (0.9 + rng() * 0.2);
    const tierY = baseLine - tt * (towerH - maxR * 1.4);
    // Each tier leans off-center so the tower doesn't stack symmetrically
    const lean = tt * (rng() - 0.5) * maxR * 1.2;
    const puffCount = Math.max(3, Math.round((tierW / cloudW) * (8 + rng() * 3)));

    for (let i = 0; i < puffCount; i++) {
      const ft = i / (puffCount - 1);
      const env = 0.6 + 0.4 * Math.sin(Math.PI * (0.1 + 0.8 * ft));
      const r = maxR * env * (0.85 + rng() * 0.3);
      const px = pad + (cloudW - tierW) / 2 + lean + ft * tierW + (rng() - 0.5) * maxR * 0.4;
      // Scallop the bottom tier like cumulus; upper tiers jitter vertically
      // so adjacent tiers interlock instead of reading as stacked rows
      const lift = tier === 0 && rng() < 0.3 ? r * 0.3 : 0;
      const py = tierY - r * (0.35 + rng() * 0.3) - lift - (tier > 0 ? rng() * maxR * 0.5 : 0);

      const puff = t.createRadialGradient(px, py, 0, px, py, r);
      puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
      puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
      puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
      t.beginPath();
      t.arc(px, py, r, 0, Math.PI * 2);
      t.fillStyle = puff;
      t.fill();
      lobes.push({ px, py, r });
    }
  }

  // Pass 2 — whole-cloud shade: bright crown fading into a heavy storm base
  t.globalCompositeOperation = 'source-atop';
  const shade = t.createLinearGradient(0, 0, 0, baseLine);
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.35, `rgba(${SHADE}, 0.14)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.62)`);
  t.fillStyle = shade;
  t.fillRect(0, 0, tempW, tempH);

  // Pass 3 — lobe shadows, sharp on one side only: soft fade from each
  // lobe's lit top, full strength at its bottom arc where the circle clip
  // cuts it sharp — the crevice line against the lobe in front. Drawn on a
  // scratch canvas, then composited into the mass at one alpha.
  const scratch = document.createElement('canvas');
  scratch.width = tempW;
  scratch.height = tempH;
  const s = scratch.getContext('2d');
  if (s) {
    for (const lobe of lobes) {
      if (rng() > 0.5) continue;
      // Shadow grows with distance from the lit top of the lobe: soft fade
      // upward into the light, full strength at the lobe's bottom arc where
      // the circle clip cuts it sharp — the crevice line against the lobe
      // in front
      const ex = lobe.px + (rng() - 0.5) * lobe.r * 0.3;
      const ey = lobe.py - lobe.r * (0.4 + rng() * 0.2);
      const outerR = lobe.r * 1.7;

      s.save();
      s.beginPath();
      s.arc(lobe.px, lobe.py, lobe.r, 0, Math.PI * 2);
      s.clip();
      const grad = s.createRadialGradient(ex, ey, 0, ex, ey, outerR);
      grad.addColorStop(0, `rgba(${SHADE}, 0)`);
      grad.addColorStop(0.45, `rgba(${SHADE}, 0)`);
      grad.addColorStop(1, `rgb(${SHADE})`);
      s.fillStyle = grad;
      s.fillRect(lobe.px - lobe.r, lobe.py - lobe.r, lobe.r * 2, lobe.r * 2);
      s.restore();
    }
    t.globalAlpha = 0.15;
    t.drawImage(scratch, 0, 0); // still source-atop: stays inside the cloud
    t.globalAlpha = 1;
  }
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(temp, Math.round(cx - cloudW / 2 - pad), Math.round(baseY - baseLine));
}

export function drawCumulonimbus(
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

  // A handful of large storm masses rather than many small clouds
  const count = Math.max(1, Math.round((width / 150) * (0.4 + midCov * 1.6)));

  const storms: Array<{ cx: number; baseY: number; cloudW: number }> = [];
  for (let i = 0; i < count; i++) {
    const cx = ((i + 0.5 + (rng() - 0.5) * 0.9) / count) * width;
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    if (rng() > localCov + 0.5) continue;

    const cloudW = Math.min((80 + rng() * 60) * (0.55 + localCov * 0.6), width * 0.5);
    const baseY = height * (0.72 + rng() * 0.18);
    storms.push({ cx, baseY, cloudW });
  }

  // Draw back-to-front: higher (further) storms first
  storms.sort((a, b) => a.baseY - b.baseY);
  for (const s of storms) {
    drawOneStorm(off, s.cx, s.baseY, s.cloudW, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
