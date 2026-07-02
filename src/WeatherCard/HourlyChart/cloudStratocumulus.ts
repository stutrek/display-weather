/**
 * Stratocumulus: wind-raked rolls — a rhythmic row of diagonal cloud streaks
 * all leaning the same way at ~45°, with slits of sky between them. Each
 * streak is a run of merged lobes along its axis, tapered at both ends and
 * wobbled off the ruler line, shaded with a single top-to-bottom gradient —
 * never per lobe, which reads as bubble wrap. Coverage controls how many
 * streaks fire and how fat they get; at full coverage the slits nearly close.
 */

import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

// Shadow tone for the streak undersides — deepened sky blue, heavier than cumulus.
const SHADE = '70, 150, 195';

// One consistent lean for every streak: rising to the right.
const ANGLE = (Math.PI / 180) * 20;
const COS_A = Math.cos(ANGLE);
const SIN_A = Math.sin(ANGLE);

// Solid white lobe with a slightly soft rim; lobes merge into one silhouette.
// The soft per-lobe under-shading gives the interior crevice texture — kept
// well below the strength that reads as bubble wrap.
function drawLobe(t: CanvasRenderingContext2D, px: number, py: number, r: number): void {
  const puff = t.createRadialGradient(px, py, 0, px, py, r);
  puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
  puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
  puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
  t.beginPath();
  t.arc(px, py, r, 0, Math.PI * 2);
  t.fillStyle = puff;
  t.fill();

  const lobeShade = t.createLinearGradient(px, py - r, px, py + r);
  lobeShade.addColorStop(0, `rgba(${SHADE}, 0)`);
  lobeShade.addColorStop(0.55, `rgba(${SHADE}, 0)`);
  lobeShade.addColorStop(1, `rgba(${SHADE}, 0.15)`);
  t.save();
  t.beginPath();
  t.arc(px, py, r, 0, Math.PI * 2);
  t.clip();
  t.fillStyle = lobeShade;
  t.fillRect(px - r, py - r, r * 2, r * 2);
  t.restore();
}

/** Draw one diagonal streak whose lower-left end sits at (cx - span/2, baseY). */
function drawOneStreak(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  len: number,
  thick: number,
  rng: () => number,
): void {
  const maxR = thick / 2;
  const pad = Math.ceil(maxR) + 2;
  const spanX = len * COS_A;
  const spanY = len * SIN_A;
  const tempW = Math.ceil(spanX + pad * 2);
  const tempH = Math.ceil(spanY + pad * 2);

  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  // Lobes along the diagonal, fattest at the foot and narrowing only toward
  // the off-screen top — a tapered foot turns a row of bands into saw teeth.
  // Looser spacing and stronger size jitter scallop the outline so the band
  // reads as a chain of puffs, not a ribbed stripe; the perpendicular wobble
  // keeps the axis from reading as a ruled line.
  const steps = Math.max(3, Math.ceil(len / (maxR * 0.65)));
  for (let i = 0; i <= steps; i++) {
    const ft = i / steps;
    const env = 1 - 0.3 * ft;
    const r = maxR * env * (0.75 + rng() * 0.5);
    const w = (rng() - 0.5) * maxR * 0.6;
    const px = pad + ft * spanX + w * SIN_A;
    const py = tempH - pad - ft * spanY + w * COS_A;
    drawLobe(t, px, py, r);
  }
  // A full-width rounded lobe caps the foot so the base ends blunt
  drawLobe(t, pad, tempH - pad, maxR * (1 + rng() * 0.15));

  // One shading gradient across the streak's thickness: the upper-left
  // flank stays white, shade ramps in over the lower-right flank and cuts
  // off crisply at the silhouette. Where bands overlap, one band's white
  // ridge sits against its neighbour's dark valley — that alternation is
  // what gives the deck its relief.
  t.globalCompositeOperation = 'source-atop';
  const ccx = tempW / 2;
  const ccy = tempH / 2;
  const reachN = maxR * 1.15;
  const shade = t.createLinearGradient(
    ccx - SIN_A * reachN,
    ccy - COS_A * reachN,
    ccx + SIN_A * reachN,
    ccy + COS_A * reachN,
  );
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.5, `rgba(${SHADE}, 0.03)`);
  shade.addColorStop(0.72, `rgba(${SHADE}, 0.14)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.3)`);
  t.fillStyle = shade;
  t.fillRect(0, 0, tempW, tempH);

  // Gentle extra weight toward the foot so the deck reads heavier low down
  const depth = t.createLinearGradient(0, 0, 0, tempH);
  depth.addColorStop(0, `rgba(${SHADE}, 0)`);
  depth.addColorStop(1, `rgba(${SHADE}, 0.1)`);
  t.fillStyle = depth;
  t.fillRect(0, 0, tempW, tempH);
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(temp, Math.round(cx - spanX / 2 - pad), Math.round(baseY - spanY - pad));
}

export function drawStratocumulus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
): void {
  const { mean: meanCov } = sampleCoverageStats(coverageAt, width);
  if (meanCov < 0.005) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  // Streaks come in small groups: 2–4 parallel bands packed a streak apart,
  // with wide sky gaps between groups. Group count climbs with coverage until
  // the groups merge into continuous banding.
  const spacing = height * 0.6;
  const invCdf = makeCoverageInvCdf(coverageAt, width);
  const groupSpan = spacing * 3.2;
  const groupCount = Math.max(1, Math.round((width / groupSpan) * (0.4 + meanCov * 1.8)));

  const buildStreakAt = (cx: number): { cx: number; baseY: number; len: number; thick: number } => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));
    // Fatter streaks at higher coverage — the slit between neighbours narrows
    // toward (but never quite reaches) zero
    const thick = spacing * (0.35 + 0.5 * localCov) * (0.9 + rng() * 0.2);
    const baseRoll = rng();
    let baseY = height * (0.8 + baseRoll * 0.14);
    if (floorAt) {
      const floor = floorAt(Math.max(0, Math.min(width - 1, cx)));
      baseY = floor * (0.76 + baseRoll * 0.18);
    }
    // Streaks run from their base clear off the top of the viewport — the
    // upper taper happens off-screen, so on-screen they read as full bands
    const len = (baseY + thick * (0.5 + rng())) / SIN_A;
    return { cx, baseY, len, thick };
  };

  // Collect one group: 2–4 streaks marching up-right at the shared rhythm.
  // Denser coverage grows the group.
  const streaks: Array<{ cx: number; baseY: number; len: number; thick: number }> = [];
  const addGroupAt = (groupCx: number): void => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, groupCx)));
    const streakCount = 2 + Math.round(rng() * (1 + localCov * 1.5));
    const start = groupCx - ((streakCount - 1) / 2) * spacing;
    for (let j = 0; j < streakCount; j++) {
      const cx = start + j * spacing * (0.85 + rng() * 0.3);
      streaks.push(buildStreakAt(cx));
    }
  };

  for (let i = 0; i < groupCount; i++) {
    // Stratified slots through the coverage inverse-CDF, so groups land
    // where the coverage is
    const cx = invCdf((i + 0.5 + (rng() - 0.5) * 0.8) / groupCount);
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));

    // Thin out groups in low-coverage regions — wider gaps between groups
    if (rng() > localCov + 0.5) continue;

    addGroupAt(cx);
  }

  // Never render an empty layer: guarantee one group at the coverage centroid
  if (streaks.length === 0) {
    addGroupAt(invCdf(0.5));
  }

  // Draw right-to-left: each streak's dark lower-right flank must land on
  // top of the neighbour it overlaps. Left-to-right order paints white
  // bodies over the dark flanks and the deck washes out flat white.
  streaks.sort((a, b) => b.cx - a.cx);
  for (const s of streaks) {
    drawOneStreak(off, s.cx, s.baseY, s.len, s.thick, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
