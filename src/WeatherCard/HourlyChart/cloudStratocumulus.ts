/**
 * Stratocumulus: wind-raked rolls — a rhythmic row of diagonal cloud streaks
 * all leaning the same way, with slits of sky between them. Each streak is a
 * run of merged lobe clusters along its axis, tapered at both ends, swelling
 * and pinching on a slow cycle and bowing off the ruler line — neighbours run
 * the cycle a half-turn out of phase so the deck staggers like a checkerboard
 * instead of ruled rails. Coverage controls how many streaks fire and how fat
 * they get; at full coverage the slits nearly close.
 *
 * Three things keep a streak reading as a cloud mass rather than a rope:
 *   - Lumps are few and large, built the way cumulus builds a cloud: each one
 *     about as big as the roll is thick, hung below the base line so the cut
 *     takes its bottom arc off. A run of top domes reads as one body; whole
 *     circles read as beads on a string. Tufts then fray the flanks —
 *     half-attached, half adrift — so the outline is never unambiguous.
 *   - The underside is cut flat, along a shallow curve parallel to the axis.
 *     That is the flat base of a roll seen from below, and it gives the deck
 *     an altitude to sit at.
 *   - Light comes from one fixed direction for the whole deck: a body-wide
 *     ramp across the thickness that lands its darkest value on the flat base,
 *     plus per-lobe relief along the same direction so the shading follows the
 *     form instead of ramping uniformly down an endless cylinder.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { makeCoverageInvCdf, sampleCoverageStats } from './coverageEnvelope';

const SHADE = CLOUD_SHADE_RGB;

// One consistent lean for every streak: rising to the right.
const ANGLE = (Math.PI / 180) * 20;
const COS_A = Math.cos(ANGLE);
const SIN_A = Math.sin(ANGLE);

// Lobe size and spacing, in units of the roll's local half-width. Straight
// from cumulus: few, large lobes — each one about as big as the roll is thick
// — sitting on the base a little under a radius apart. Their bottom arcs are
// cut away by the flat base, so all you ever see is a run of top domes, which
// is what stops a row of circles from reading as a row of circles.
const LOBE_R = 1.05;
const LOBE_STEP = 0.8;

// Where the flat base cuts, as a perpendicular distance from the centreline in
// units of the roll's max half-width.
const CUT_AT = 0.72;

// Spacing of the tufts that fray the roll's flanks, along the axis and in
// units of the roll's max half-width.
const TUFT_STEP = 1.6;

interface Lobe {
  px: number;
  py: number;
  r: number;
}

// A shadow blob: same geometry as a lobe, plus how dark it lands. Tufts carry
// a little more than the body's lumps do — a tuft caught in full light with no
// underside of its own reads as a bubble stuck to the roll.
interface Relief extends Lobe {
  a: number;
}

// Solid white lobe with a slightly soft rim; lobes merge into one silhouette.
function fillLobe(t: CanvasRenderingContext2D, lobe: Lobe): void {
  const puff = t.createRadialGradient(lobe.px, lobe.py, 0, lobe.px, lobe.py, lobe.r);
  puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
  puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
  puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
  t.beginPath();
  t.arc(lobe.px, lobe.py, lobe.r, 0, Math.PI * 2);
  t.fillStyle = puff;
  t.fill();
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
  const spanX = len * COS_A;
  const spanY = len * SIN_A;

  // Checkerboard stagger: each streak swells and pinches on a slow cycle
  // along its axis and bows gently off the ruler line. cellLen and phase are
  // supplied by the caller on a deck-wide grid, so the cycle stays rhythmic
  // across streaks and neighbours land a clean half-turn apart.
  const bowAmp = maxR * 0.45;
  const swellAt = (dist: number): number =>
    0.84 + 0.26 * Math.sin((dist / cellLen) * Math.PI * 2 + phase);
  const bowAt = (dist: number): number =>
    Math.sin((dist / (cellLen * 2)) * Math.PI * 2 + phase) * bowAmp;

  // Everything is laid out in a frame whose origin is the streak's foot, with
  // `dist` running up the axis and `w` across it. The temp canvas is sized
  // from the finished lobes' own bounding box further down, so a tuft thrown
  // wide can never be clipped into a straight edge — a rip in the sky.
  const atX = (dist: number, w: number): number => dist * COS_A + w * SIN_A;
  const atY = (dist: number, w: number): number => -dist * SIN_A + w * COS_A;

  // Clusters along the diagonal, fattest at the foot and narrowing toward the
  // tip — full-height bands narrow only gently since their upper end runs off
  // screen anyway, while short streaks taper harder toward their visible tip.
  // Every offset scales with the local half-width so the taper carries through
  // the whole cluster, not just its middle lobe.
  const lobes: Lobe[] = [];
  const relief: Relief[] = [];

  // The base line the lumps sit on, in cross-axis units: the flat cut, bowing
  // with the roll. Lobe centres hang below it by a fraction of their own
  // radius exactly as cumulus hangs its puffs below its base line, so the cut
  // takes the bottom third or so off every one of them.
  const baseAt = (dist: number): number => CUT_AT * maxR + bowAt(dist) * 0.5;

  const addLump = (dist: number, halfWidth: number): Lobe => {
    const r = halfWidth * LOBE_R * (0.75 + rng() * 0.5);
    // A third of the lumps ride higher, so their rounded undersides hang clear
    // above the cut and scallop the base instead of every lump meeting it flat
    const lift = rng() < 0.35 ? r * 0.3 : 0;
    const w = baseAt(dist) - r * (0.4 + rng() * 0.3) - lift;
    const along = dist + (rng() - 0.5) * maxR * 0.4;
    const lump = { px: atX(along, w), py: atY(along, w), r };
    lobes.push(lump);
    relief.push({ ...lump, a: 0.11 });
    return lump;
  };

  // Tufts: small clumps hanging off a lump's shoulder, most of them overlapping
  // it by no more than a narrow neck, one in six thrown just clear. Real rolls
  // fray at their edges, and a tuft adrift in the slit between two staggered
  // streaks belongs unambiguously to neither — that ambiguity is the point.
  // Anchoring to the lump rather than to the roll's nominal flank is what keeps
  // them touching it: measured off the flank they drift into open sky and read
  // as bubbles. Biased upward, where the base cut will not simply erase them.
  const addTuft = (lump: Lobe): void => {
    const scale = lump.r * (0.35 + rng() * 0.3);
    const detached = rng() < 0.16;
    const d = lump.r * (detached ? 1.55 + rng() * 0.25 : 0.85 + rng() * 0.4);
    const ang = -Math.PI / 2 + (rng() - 0.5) * 1.7;
    const tuftX = lump.px + Math.cos(ang) * d;
    const tuftY = lump.py + Math.sin(ang) * d;
    const count = 2 + (rng() < 0.5 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      lobes.push({
        px: tuftX + (rng() - 0.5) * scale * 1.1,
        py: tuftY + (rng() - 0.5) * scale * 0.8,
        r: scale * (0.55 + rng() * 0.35),
      });
    }
    relief.push({ px: tuftX, py: tuftY, r: scale * 1.15, a: 0.18 });
  };

  const steps = Math.max(3, Math.ceil(len / (maxR * LOBE_STEP)));
  const tuftEvery = Math.max(1, Math.round((TUFT_STEP * maxR * steps) / len));
  for (let i = 0; i <= steps; i++) {
    const ft = i / steps;
    const env = 1 - (tapered ? 0.45 : 0.3) * ft;
    const halfWidth = maxR * env * swellAt(ft * len);
    const lump = addLump(ft * len, halfWidth);
    if (i % tuftEvery === 0 && rng() < 0.6) addTuft(lump);
  }
  // A full-width rounded lobe caps the foot so the base ends blunt; it rides
  // the same bow/swell as the first cluster so the foot stays attached
  const footR = maxR * Math.max(0.7, swellAt(0)) * 1.1;
  const footW = baseAt(0) - footR * 0.5;
  lobes.push({ px: atX(0, footW), py: atY(0, footW), r: footR });

  // Size the canvas to what actually got built, then shift the foot to sit at
  // (originX, originY) inside it.
  const margin = 2;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const lobe of lobes) {
    minX = Math.min(minX, lobe.px - lobe.r);
    minY = Math.min(minY, lobe.py - lobe.r);
    maxX = Math.max(maxX, lobe.px + lobe.r);
    maxY = Math.max(maxY, lobe.py + lobe.r);
  }
  const originX = margin - minX;
  const originY = margin - minY;
  const tempW = Math.ceil(maxX - minX) + margin * 2;
  const tempH = Math.ceil(maxY - minY) + margin * 2;
  for (const lobe of lobes) {
    lobe.px += originX;
    lobe.py += originY;
  }
  for (const blob of relief) {
    blob.px += originX;
    blob.py += originY;
  }

  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  for (const lobe of lobes) fillLobe(t, lobe);

  // The flat base. Cut in the axis-aligned frame, along a shallow curve that
  // tracks half the centreline's bow: the bite varies down the length — deep
  // where the roll bows low, barely grazing where it rides high — but never
  // deep enough to slice a pinched stretch clean in two.
  const reach = tempW + tempH;
  t.save();
  t.globalCompositeOperation = 'destination-out';
  t.translate(originX, originY);
  t.rotate(-ANGLE);
  t.beginPath();
  t.moveTo(-reach, CUT_AT * maxR);
  // Nibbled at a much shorter wavelength than the bow, so the base reads as
  // flat at the scale of the deck while never being an actual ruler line.
  const cutSteps = Math.max(24, Math.ceil(len / (maxR * 0.25)));
  for (let i = 0; i <= cutSteps; i++) {
    const d = (i / cutSteps) * len;
    const nibble = Math.sin((d / (maxR * 0.8)) * Math.PI * 2 + phase * 1.7) * maxR * 0.1;
    t.lineTo(d, baseAt(d) + nibble);
  }
  t.lineTo(len + reach, CUT_AT * maxR);
  t.lineTo(len + reach, reach);
  t.lineTo(-reach, reach);
  t.closePath();
  t.fillStyle = '#000';
  t.fill();
  t.restore();

  t.globalCompositeOperation = 'source-atop';

  // Per-lump relief along the deck's light direction. A second pass over the
  // finished silhouette: shading painted inline gets covered by the next lobe,
  // flattening the interior to plain white. This works here for the same
  // reason it works in cumulus — the lumps are few and large, so their shadows
  // read as the body's own form. Shading many small lobes instead draws a dark
  // crescent under every circle and the mass falls apart into dots.
  for (const blob of relief) {
    const grad = t.createLinearGradient(
      blob.px - SIN_A * blob.r,
      blob.py - COS_A * blob.r,
      blob.px + SIN_A * blob.r,
      blob.py + COS_A * blob.r,
    );
    grad.addColorStop(0, `rgba(${SHADE}, 0)`);
    grad.addColorStop(0.55, `rgba(${SHADE}, 0)`);
    grad.addColorStop(1, `rgba(${SHADE}, ${blob.a})`);
    t.save();
    t.beginPath();
    t.arc(blob.px, blob.py, blob.r, 0, Math.PI * 2);
    t.clip();
    t.fillStyle = grad;
    t.fillRect(blob.px - blob.r, blob.py - blob.r, blob.r * 2, blob.r * 2);
    t.restore();
  }

  // One shading ramp across the roll's thickness, in the same axis-aligned
  // frame as the cut: the upper-left flank stays white, shade ramps in over
  // the lower-right flank and lands its darkest value right on the flat base.
  // Where bands overlap, one band's white crown sits against its neighbour's
  // shadowed base — that alternation is what gives the deck its relief.
  // The ramp ends at the *highest* the cut ever rides rather than at its
  // nominal line, so the shade is already at full strength everywhere along
  // the base instead of reaching it only on a razor edge that the bow moves.
  t.save();
  t.translate(originX, originY);
  t.rotate(-ANGLE);
  const shade = t.createLinearGradient(0, -maxR * 1.15, 0, CUT_AT * maxR - bowAmp * 0.5);
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.42, `rgba(${SHADE}, 0.02)`);
  shade.addColorStop(0.72, `rgba(${SHADE}, 0.14)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.3)`);
  t.fillStyle = shade;
  t.fillRect(-reach, -reach, reach * 2, reach * 2);
  t.restore();

  // Gentle extra weight toward the foot so the deck reads heavier low down
  const depth = t.createLinearGradient(0, 0, 0, tempH);
  depth.addColorStop(0, `rgba(${SHADE}, 0)`);
  depth.addColorStop(1, `rgba(${SHADE}, 0.1)`);
  t.fillStyle = depth;
  t.fillRect(0, 0, tempW, tempH);
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(temp, Math.round(cx - spanX / 2 - originX), Math.round(baseY - originY));
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

  // Draw right-to-left: each streak's shadowed base must land on top of the
  // neighbour it overlaps. Left-to-right order paints white bodies over the
  // shadowed bases and the deck washes out flat white.
  streaks.sort((a, b) => b.cx - a.cx);
  for (const s of streaks) {
    drawOneStreak(off, s.cx, s.baseY, s.len, s.thick, s.tapered, s.phase, cellLen, rng);
  }

  ctx.drawImage(offscreen, 0, 0);
}
