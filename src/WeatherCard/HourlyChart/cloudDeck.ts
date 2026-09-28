/**
 * Deck: the low/mid cloud sheet — stratus, stratocumulus, altostratus and the
 * nimbostratus rain layer — drawn in cumulus's shape language so it keeps the
 * texture cumulus has, but closing up the way a real deck does.
 *
 * The sheet is built from banks: wide, flattened cumulus bodies (a run of
 * puffs cut flat along a base line, one shading gradient per bank). Banks are
 * placed by measured coverage (see coverageFill), so a 100% sky really is
 * covered, and with perspective — broad banks overhead, narrow ones stacked
 * toward the horizon. Higher banks are drawn first, so each lower bank's lit
 * crown lands against the shaded base of the bank behind it: that alternation
 * is the deck's relief.
 *
 * Near overcast, a backing sheet fills in behind the banks. It only ever shows
 * through the slivers between them, where it reads as the shadowed underside
 * of the layer above, never as open sky.
 *
 * Lumpiness (stratocumulus share of the deck) sets the bank form: lumpy decks
 * get short banks with tall, uneven domes; flat ones long, low, even veils.
 * Wetness greys the whole deck and weighs down its base for rain.
 */

import { CLOUD_SHADE_RGB } from './colors';
import { sampleCoverageStats, targetPixelCoverage } from './coverageEnvelope';
import { createMask, fillToCoverage } from './coverageFill';

const SHADE = CLOUD_SHADE_RGB;
// Rain-deck grey: the slate the body darkens toward as wetness rises.
const SLATE = '92, 106, 124';

// Banks alone fill up to this share; the backing sheet closes the rest.
const BANK_FILL_CAP = 0.9;

export interface DeckOptions {
  /** 0 = flat stratus veil, 1 = lumpy stratocumulus cells */
  lumpAt?: (x: number) => number;
  /** 0 = dry, 1 = raining */
  wetAt?: (x: number) => number;
  /** Shared coverage mask holding the layers already drawn behind this one */
  mask?: CanvasRenderingContext2D;
}

interface Bank {
  cx: number;
  baseY: number;
  bankW: number;
  puffs: Array<{ px: number; py: number; r: number }>;
  pad: number;
  tempW: number;
  tempH: number;
  baseLine: number;
  lump: number;
  wet: number;
}

function buildBank(
  cx: number,
  baseY: number,
  bankW: number,
  lump: number,
  wet: number,
  rng: () => number,
): Bank {
  // Dome height relative to width: flat veils are long and low, cells taller.
  const domeR = bankW * (0.09 + 0.08 * lump);
  const pad = Math.ceil(domeR * 1.2);
  const tempW = Math.ceil(bankW + pad * 2);
  const tempH = Math.ceil(domeR * 2.2 + pad);
  const baseLine = tempH - 1;

  // Puffs overlap enough to merge into one body; lumpy banks space them a
  // little wider so notches open between crowns.
  const step = domeR * (0.95 + 0.35 * lump);
  const n = Math.max(3, Math.round(bankW / step) + 1);
  const jitter = 0.15 + 0.45 * lump;
  const puffs: Bank['puffs'] = [];
  for (let i = 0; i < n; i++) {
    const ft = i / (n - 1);
    // Plateau envelope: a bank is a long flat-topped body with rounded ends,
    // not the single dome of a cumulus.
    const env = 0.5 + 0.5 * Math.sin(Math.PI * (0.06 + 0.88 * ft)) ** 0.5;
    const r = domeR * env * (1 - jitter / 2 + rng() * jitter);
    const px = pad + ft * bankW + (rng() - 0.5) * domeR * 0.5;
    const lift = rng() < 0.3 * lump ? r * 0.3 : 0;
    const py = baseLine - r * (0.45 + rng() * 0.25) - lift;
    puffs.push({ px, py, r });
  }
  return { cx, baseY, bankW, puffs, pad, tempW, tempH, baseLine, lump, wet };
}

function drawBank(ctx: CanvasRenderingContext2D, bank: Bank): void {
  const { puffs, tempW, tempH, baseLine, lump, wet } = bank;
  const temp = document.createElement('canvas');
  temp.width = tempW;
  temp.height = tempH;
  const t = temp.getContext('2d');
  if (!t) return;

  for (const { px, py, r } of puffs) {
    const puff = t.createRadialGradient(px, py, 0, px, py, r);
    puff.addColorStop(0, 'rgba(255, 255, 255, 1)');
    puff.addColorStop(0.95, 'rgba(255, 255, 255, 0.98)');
    puff.addColorStop(1, 'rgba(255, 255, 255, 0)');
    t.beginPath();
    t.arc(px, py, r, 0, Math.PI * 2);
    t.fillStyle = puff;
    t.fill();
  }

  t.globalCompositeOperation = 'source-atop';

  // Light per-puff under-shade: interior grain, stronger on lumpy cells.
  const grain = 0.06 + 0.08 * lump;
  for (const pf of puffs) {
    const g = t.createLinearGradient(pf.px, pf.py - pf.r, pf.px, pf.py + pf.r);
    g.addColorStop(0, `rgba(${SHADE}, 0)`);
    g.addColorStop(0.55, `rgba(${SHADE}, 0)`);
    g.addColorStop(1, `rgba(${SHADE}, ${grain})`);
    t.save();
    t.beginPath();
    t.arc(pf.px, pf.py, pf.r, 0, Math.PI * 2);
    t.clip();
    t.fillStyle = g;
    t.fillRect(pf.px - pf.r, pf.py - pf.r, pf.r * 2, pf.r * 2);
    t.restore();
  }

  // One body gradient: lit crown, shaded flat base. Kept ≤ 0.3 dry — heavier
  // reads as storm — and only the rain deck is let past it.
  const shade = t.createLinearGradient(0, 0, 0, baseLine);
  shade.addColorStop(0, `rgba(${SHADE}, 0)`);
  shade.addColorStop(0.5, `rgba(${SHADE}, 0.06)`);
  shade.addColorStop(1, `rgba(${SHADE}, 0.3)`);
  t.fillStyle = shade;
  t.fillRect(0, 0, tempW, tempH);

  if (wet > 0.01) {
    // Rain greys the whole body and sinks its base toward slate.
    t.fillStyle = `rgba(${SLATE}, ${(0.28 * wet).toFixed(3)})`;
    t.fillRect(0, 0, tempW, tempH);
    const low = t.createLinearGradient(0, 0, 0, baseLine);
    low.addColorStop(0, `rgba(${SLATE}, 0)`);
    low.addColorStop(0.5, `rgba(${SLATE}, ${(0.1 * wet).toFixed(3)})`);
    low.addColorStop(1, `rgba(${SLATE}, ${(0.35 * wet).toFixed(3)})`);
    t.fillStyle = low;
    t.fillRect(0, 0, tempW, tempH);
  }
  t.globalCompositeOperation = 'source-over';

  ctx.drawImage(
    temp,
    Math.round(bank.cx - bank.bankW / 2 - bank.pad),
    Math.round(bank.baseY - baseLine),
  );
}

const smoothstep = (x: number, e0: number, e1: number): number => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * The sheet behind the banks, faded in per column as coverage nears overcast.
 * Colour is the deck's shadowed underside — a pale grey-blue, lighter toward
 * the horizon, slate when wet.
 */
function drawBacking(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  floor: (x: number) => number,
  wet: number,
): void {
  const temp = document.createElement('canvas');
  temp.width = Math.ceil(width);
  temp.height = Math.ceil(height);
  const t = temp.getContext('2d');
  if (!t) return;

  const mix = (dry: number[], rain: number[]): string =>
    dry.map((d, i) => Math.round(d + (rain[i] - d) * wet)).join(', ');
  const top = mix([196, 212, 226], [138, 150, 164]);
  const low = mix([226, 234, 242], [172, 182, 194]);
  let meanFloor = 0;
  const n = Math.max(8, Math.round(width / 24));
  for (let i = 0; i < n; i++) meanFloor += floor(((i + 0.5) / n) * width) / n;
  const vert = t.createLinearGradient(0, 0, 0, meanFloor);
  vert.addColorStop(0, `rgb(${top})`);
  vert.addColorStop(1, `rgb(${low})`);
  t.fillStyle = vert;
  t.fillRect(0, 0, width, height);

  // Per-column strength as a horizontal alpha ramp.
  const horiz = t.createLinearGradient(0, 0, width, 0);
  const steps = Math.max(2, Math.round(width / 12));
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const a = smoothstep(coverageAt(Math.max(0, Math.min(width - 1, x))), 0.75, 0.95);
    horiz.addColorStop(i / steps, `rgba(0, 0, 0, ${a.toFixed(3)})`);
  }
  t.globalCompositeOperation = 'destination-in';
  t.fillStyle = horiz;
  t.fillRect(0, 0, width, height);

  ctx.drawImage(temp, 0, 0);
}

export function drawDeck(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
  opts: DeckOptions = {},
): void {
  const { max: maxCov } = sampleCoverageStats(coverageAt, width);
  if (maxCov < 0.005) return;
  const clampX = (x: number): number => Math.max(0, Math.min(width - 1, x));
  const floor = (x: number): number => (floorAt ? floorAt(clampX(x)) : height);
  const lumpAt = (x: number): number => opts.lumpAt?.(clampX(x)) ?? 0.5;
  // Grey tone: rain greys the deck fully; a thick dry overcast a little, since
  // a closed sheet is lit through rather than across and never looks sunlit.
  const wetAt = (x: number): number =>
    Math.max(opts.wetAt?.(clampX(x)) ?? 0, 0.35 * smoothstep(coverageAt(clampX(x)), 0.8, 1));

  const deckCanvas = document.createElement('canvas');
  deckCanvas.width = Math.ceil(width);
  deckCanvas.height = Math.ceil(height);
  const deck = deckCanvas.getContext('2d');
  // Banks are measured on their own so the backing never stands in for them —
  // otherwise an overcast sky would place no banks and lose its texture.
  const bankMask = createMask(width, height);
  if (!deck || !bankMask) return;
  if (opts.mask) bankMask.drawImage(opts.mask.canvas, 0, 0);

  const banks = fillToCoverage<Bank>({
    width,
    height,
    floorAt: floor,
    targetAt: (x) => Math.min(BANK_FILL_CAP, targetPixelCoverage(coverageAt(x))),
    rng,
    mask: bankMask,
    build: ({ x, y, floor: skyH }) => {
      const lump = lumpAt(x);
      const alt = 1 - Math.max(0, Math.min(1, y / skyH));
      // Broad banks overhead, narrow ones toward the horizon; flat veils run
      // longer than lumpy cells.
      // Sparse decks break into smaller pieces, or one bank alone overshoots.
      const sparse = 0.45 + 0.55 * smoothstep(coverageAt(clampX(x)), 0.1, 0.6);
      const bankW =
        skyH * (1.4 + 1.6 * (1 - lump)) * (0.8 + rng() * 0.4) * (0.45 + 0.75 * alt) * sparse;
      const visibleH = bankW * (0.09 + 0.08 * lump) * 1.2;
      const baseY = Math.min(skyH, y + visibleH / 2);
      return buildBank(x, baseY, bankW, lump, wetAt(x), rng);
    },
    stamp: (m, b) => {
      drawBank(m, b);
      return { x0: b.cx - b.bankW / 2 - b.pad, x1: b.cx + b.bankW / 2 + b.pad };
    },
    maxBodies: Math.max(6, Math.round(width / 8)),
  });

  banks.sort((a, b) => a.baseY - b.baseY);
  for (const b of banks) drawBank(deck, b);

  // Backing sheet behind the banks, only where coverage nears overcast.
  if (maxCov > 0.75) {
    const { mean: meanWet } = sampleCoverageStats(wetAt, width);
    deck.save();
    deck.globalCompositeOperation = 'destination-over';
    drawBacking(deck, width, height, coverageAt, floor, meanWet);
    deck.restore();
  }

  ctx.drawImage(deckCanvas, 0, 0);
  opts.mask?.drawImage(deckCanvas, 0, 0);
}
