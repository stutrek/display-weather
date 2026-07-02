/**
 * Stratocumulus: wind-raked rolls — a rhythmic row of diagonal cloud streaks
 * all leaning the same way, with slits of sky between them. Each streak is a
 * run of merged lobes along its axis, tapered at both ends, swelling and
 * pinching on a slow cycle and bowing off the ruler line — neighbours run the
 * cycle a half-turn out of phase so the deck staggers like a checkerboard
 * instead of ruled rails. Shading is a single cross-axis gradient — never per
 * lobe, which reads as bubble wrap. Coverage controls how many streaks fire
 * and how fat they get; at full coverage the slits nearly close.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

const SHADE = CLOUD_SHADE_RGB;

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
  tapered: boolean,
  phase: number,
  cellLen: number,
  rng: () => number,
): void {
  const maxR = thick / 2;
  // Pad covers the bow + swell excursions, not just the base radius
  const pad = Math.ceil(maxR * 2) + 2;
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
  // Short streaks narrow harder toward their visible tip; full bands keep a
  // gentle narrowing since their upper end is off-screen anyway
  //
  // Checkerboard stagger: each streak swells and pinches on a slow cycle
  // along its axis and bows gently off the ruler line. cellLen and phase are
  // supplied by the caller on a deck-wide grid, so the cycle stays rhythmic
  // across streaks and neighbours land a clean half-turn apart. Lobe jitter
  // stays small enough that the cycle, not the noise, dominates.
  const bowAmp = maxR * 0.45;
  const swellAt = (dist: number): number =>
    0.84 + 0.26 * Math.sin((dist / cellLen) * Math.PI * 2 + phase);
  const bowAt = (dist: number): number =>
    Math.sin((dist / (cellLen * 2)) * Math.PI * 2 + phase) * bowAmp;

  const steps = Math.max(3, Math.ceil(len / (maxR * 0.65)));
  for (let i = 0; i <= steps; i++) {
    const ft = i / steps;
    const env = 1 - (tapered ? 0.45 : 0.3) * ft;
    const r = maxR * env * swellAt(ft * len) * (0.85 + rng() * 0.3);
    const w = (rng() - 0.5) * maxR * 0.45 + bowAt(ft * len);
    const px = pad + ft * spanX + w * SIN_A;
    const py = tempH - pad - ft * spanY + w * COS_A;
    drawLobe(t, px, py, r);
  }
  // A full-width rounded lobe caps the foot so the base ends blunt; it rides
  // the same bow/swell as the first axis lobes so the foot stays attached
  const footW = bowAt(0);
  drawLobe(
    t,
    pad + footW * SIN_A,
    tempH - pad + footW * COS_A,
    maxR * Math.max(0.7, swellAt(0)) * (1 + rng() * 0.15),
  );

  // One shading gradient across the streak's thickness: the upper-left
  // flank stays white, shade ramps in over the lower-right flank and cuts
  // off crisply at the silhouette. Where bands overlap, one band's white
  // ridge sits against its neighbour's dark valley — that alternation is
  // what gives the deck its relief.
  t.globalCompositeOperation = 'source-atop';
  const ccx = tempW / 2;
  const ccy = tempH / 2;
  // Reach covers the bow excursion so bowed sections still land inside the ramp
  const reachN = maxR * 1.15 + bowAmp;
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

  // Size everything from the sky depth — the band above the temperature line
  // — not the full canvas height. The card's terrain eats half the canvas;
  // full-height sizing made each streak fatter than the entire visible band,
  // closing the slits into one merged mass. (No floor → depth = height, so
  // the tuning story is unchanged.)
  let skyH = height;
  if (floorAt) {
    let sum = 0;
    const n = Math.max(8, Math.round(width / 24));
    for (let i = 0; i < n; i++) sum += floorAt(((i + 0.5) / n) * width);
    skyH = sum / n;
  }

  // Streaks come in small groups: 2–4 parallel bands packed a streak apart,
  // with wide sky gaps between groups. Group count climbs with coverage until
  // the groups merge into continuous banding.
  const spacing = skyH * 0.6;
  // One swell/waist wavelength for the whole deck — per-streak cell sizes
  // read as noise, a shared one reads as a pattern
  const cellLen = spacing * 0.95;
  const invCdf = makeCoverageInvCdf(coverageAt, width);
  const groupSpan = spacing * 3.2;
  const groupCount = Math.max(1, Math.round((width / groupSpan) * (0.4 + meanCov * 1.8)));

  interface Streak {
    cx: number;
    baseY: number;
    len: number;
    thick: number;
    tapered: boolean;
    phase: number;
  }

  // Anchor each streak's swell cycle to a deck-wide axial grid. drawOneStreak
  // measures distance from the streak's own foot, and feet land at random
  // heights — without this correction the half-turn stagger between
  // neighbours is randomised away and the deck reads as noise.
  const phaseFor = (cx: number, baseY: number, len: number, stagger: number): number => {
    const footAxial = (cx - (len * COS_A) / 2) * COS_A - baseY * SIN_A;
    return (footAxial / cellLen) * Math.PI * 2 + stagger;
  };

  const buildStreakAt = (cx: number, full: boolean, stagger: number): Streak => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, cx)));
    // Fatter streaks at higher coverage — the slit between neighbours narrows
    // toward (but never quite reaches) zero
    const thick = spacing * (0.35 + 0.5 * localCov) * (0.9 + rng() * 0.2);
    const baseRoll = rng();
    const floor = floorAt ? floorAt(Math.max(0, Math.min(width - 1, cx))) : height;

    if (full) {
      // The group's anchor band runs from its base clear off the top of the
      // viewport — the upper taper happens off-screen
      const baseY = floor * (0.78 + baseRoll * 0.16);
      const len = (baseY + thick * (0.5 + rng())) / SIN_A;
      return { cx, baseY, len, thick, tapered: false, phase: phaseFor(cx, baseY, len, stagger) };
    }

    // The rest sit shorter at both ends: foot lifted off the deck line, tip
    // ending on-screen — so the group reads as one long band with ragged
    // companions instead of a mechanical row of identical stripes
    const baseY = floor * (0.62 + baseRoll * 0.2);
    const topY = skyH * (0.1 + rng() * 0.25);
    const len = Math.max(thick * 1.4, (baseY - topY) / SIN_A);
    return { cx, baseY, len, thick, tapered: true, phase: phaseFor(cx, baseY, len, stagger) };
  };

  // Collect one group: 2–4 streaks marching up-right at the shared rhythm,
  // exactly one of them the full-height anchor. Denser coverage grows the group.
  const streaks: Streak[] = [];
  const addGroupAt = (groupCx: number): void => {
    const localCov = coverageAt(Math.max(0, Math.min(width - 1, groupCx)));
    const streakCount = 2 + Math.round(rng() * (1 + localCov * 1.5));
    const fullIdx = Math.floor(rng() * streakCount);
    const start = groupCx - ((streakCount - 1) / 2) * spacing;
    for (let j = 0; j < streakCount; j++) {
      const cx = start + j * spacing * (0.85 + rng() * 0.3);
      // Half-turn phase step between neighbours staggers swells against
      // waists across the group — the checkerboard. Jitter kept small so
      // the alternation stays legible.
      const stagger = j * Math.PI + (rng() - 0.5) * 0.5;
      streaks.push(buildStreakAt(cx, j === fullIdx, stagger));
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
    drawOneStreak(off, s.cx, s.baseY, s.len, s.thick, s.tapered, s.phase, cellLen, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
