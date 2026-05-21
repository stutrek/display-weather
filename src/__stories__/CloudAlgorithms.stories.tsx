import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Fragment } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { createRng } from '../WeatherCard/HourlyChart/random';

// ============================================================================
// Algorithm 2: Cumulus — Blurred circle clusters
// Groups of overlapping circles drawn to an offscreen canvas, then blurred
// onto the main canvas. The blur merges circles into organic puff shapes.
// More coverage = more clusters packed closer together.
// ============================================================================

function drawCumulusClusters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverage: number,
  rng: () => number,
): void {
  type Circle = { cx: number; cy: number; r: number };
  const circles: Circle[] = [];

  // Multiple vertical passes so clouds spread across the full height at high coverage
  // rather than piling into a single horizontal band.
  // 25% → 1 pass, 50% → 1-2, 75% → 2, 100% → 3
  const passCount = Math.max(1, Math.round(coverage * 2.5));
  const totalClusters = Math.max(2, Math.round(2 + coverage * 8 + coverage * coverage * 10));
  const clustersPerPass = Math.ceil(totalClusters / passCount);

  for (let pass = 0; pass < passCount; pass++) {
    // Spread pass centres evenly from top to bottom of the canvas with overlap
    const yBase = passCount === 1 ? 0.1 : (pass / (passCount - 1)) * 0.55;
    for (let c = 0; c < clustersPerPass; c++) {
      const ax = rng() * width;
      const ay = height * (yBase + 0.05 + rng() * 0.35);
      const baseR = 10 + rng() * 13;
      const circleCount = 4 + Math.round(rng() * 5);
      for (let j = 0; j < circleCount; j++) {
        circles.push({
          cx: ax + (rng() - 0.5) * baseR * 3,
          cy: ay + (rng() - 0.5) * baseR * 0.8,
          r: baseR * (0.5 + rng() * 0.8),
        });
      }
    }
  }

  // Render to offscreen canvas so we can apply the noise mask in one pixel pass
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const off = offscreen.getContext('2d');
  if (!off) return;

  // Shadow: same circles, offset down-right, slightly larger, soft blue-gray radial gradient
  for (const { cx, cy, r } of circles) {
    const sr = r * 1.2;
    const scx = cx + 2;
    const scy = cy + 8;
    const grad = off.createRadialGradient(scx, scy, 0, scx, scy, sr);
    grad.addColorStop(0, 'rgba(80, 105, 145, 0.38)');
    grad.addColorStop(1, 'rgba(80, 105, 145, 0)');
    off.beginPath();
    off.arc(scx, scy, sr, 0, Math.PI * 2);
    off.fillStyle = grad;
    off.fill();
  }

  // Cloud: soft radial gradient circles, white centre fading to transparent
  for (const { cx, cy, r } of circles) {
    const grad = off.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.94)');
    grad.addColorStop(0.55, 'rgba(250, 252, 255, 0.78)');
    grad.addColorStop(1, 'rgba(248, 250, 255, 0)');
    off.beginPath();
    off.arc(cx, cy, r, 0, Math.PI * 2);
    off.fillStyle = grad;
    off.fill();
  }

  ctx.drawImage(offscreen, 0, 0);
}

// ============================================================================
// Algorithm 3: Value noise / fBm
// 2D value noise grid with smoothstep interpolation, layered with 4 octaves
// of fractal Brownian motion. Coverage thresholds the noise field to show
// more or less cloud. The same pattern is always visible at all coverage
// levels — only the threshold changes.
// ============================================================================

function buildValueGrid(cols: number, rows: number, rng: () => number): number[][] {
  return Array.from({ length: rows + 1 }, () => Array.from({ length: cols + 1 }, () => rng()));
}

function sampleValueGrid(
  x: number,
  y: number,
  grid: number[][],
  cols: number,
  rows: number,
): number {
  const ix = ((Math.floor(x) % cols) + cols) % cols;
  const iy = ((Math.floor(y) % rows) + rows) % rows;
  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const v00 = grid[iy][ix];
  const v10 = grid[iy][(ix + 1) % (cols + 1)];
  const v01 = grid[(iy + 1) % (rows + 1)][ix];
  const v11 = grid[(iy + 1) % (rows + 1)][(ix + 1) % (cols + 1)];
  return v00 + (v10 - v00) * ux + (v01 - v00) * uy + (v00 - v10 - v01 + v11) * ux * uy;
}

function drawValueNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverage: number,
  rng: () => number,
): void {
  const cols = 16;
  const rows = 10;

  // One independent grid per fBm octave — reusing the same grid at doubled
  // frequency causes coherent wrap-around seams that repeat visibly across the canvas.
  const shapeGrids = [
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
  ];
  const texGrids = [
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
    buildValueGrid(cols, rows, rng),
  ];

  const sampleShape = (px: number, py: number): number => {
    // High x-freq for small cells; strong y-compression creates the flat row-like bands
    // 2 octaves keeps cell size consistent rather than fractal-varied
    const bx = (px / width) * cols * 1.1;
    const by = (py / height) * rows * 1.9;
    let v = 0;
    let amp = 0.5;
    let totalAmp = 0;
    for (let o = 0; o < 2; o++) {
      v +=
        sampleValueGrid((bx * (1 << o)) % cols, (by * (1 << o)) % rows, shapeGrids[o], cols, rows) *
        amp;
      totalAmp += amp;
      amp *= 0.5;
    }
    return v / totalAmp;
  };

  const sampleTex = (px: number, py: number): number => {
    const bx = (px / width) * cols * 3.0;
    const by = (py / height) * rows * 3.5;
    let v = 0;
    let amp = 0.5;
    let totalAmp = 0;
    for (let o = 0; o < 3; o++) {
      v +=
        sampleValueGrid((bx * (1 << o)) % cols, (by * (1 << o)) % rows, texGrids[o], cols, rows) *
        amp;
      totalAmp += amp;
      amp *= 0.5;
    }
    return v / totalAmp;
  };

  const imageData = ctx.createImageData(width, height);
  const d = imageData.data;
  const threshold = 0.9 - coverage * 0.75;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const n = sampleShape(px, py);
      if (n > threshold) {
        const t = (n - threshold) / (1 - threshold);
        const smooth = t * t * t * (t * (6 * t - 15) + 10);
        const texN = sampleTex(px, py);
        const texShadow = Math.max(0, 0.52 - texN) * 2.1;
        const shadow = Math.round(Math.min(texShadow, 1) * 70);
        const idx = (py * width + px) * 4;
        d[idx] = 255 - shadow;
        d[idx + 1] = 255 - shadow;
        d[idx + 2] = Math.min(255, 255 - Math.round(shadow * 0.6) + 5);
        d[idx + 3] = Math.round(smooth * 238);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ============================================================================
// Shared canvas component
// ============================================================================

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverage: number,
  rng: () => number,
) => void;

interface CloudCanvasProps {
  draw: DrawFn;
  coverage: number;
  seed: string;
  width: number;
  height: number;
}

function CloudCanvas({ draw, coverage, seed, width, height }: CloudCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, coverage, createRng(`${seed}-${coverage}`));
  }, [draw, coverage, seed, width, height]);

  return <canvas ref={ref} width={width} height={height} style={{ display: 'block' }} />;
}

// ============================================================================
// SVG feTurbulence clouds (Algorithms 4 & 5)
// The browser's built-in Perlin noise, rendered GPU-side.
// feColorMatrix thresholds the noise: alpha = scale*n + bias.
// Visible when n > -bias/scale, so bias = -scale * threshold.
// freqX / freqY ratio controls anisotropy: cirrus needs very anisotropic
// (high freqX, low freqY) to produce horizontal streaks.
// ============================================================================

interface SvgCloudProps {
  coverage: number;
  width: number;
  height: number;
  freqX: number;
  freqY: number;
  type?: 'fractalNoise' | 'turbulence';
  numOctaves?: number;
  uid: string;
}

function SvgTurbulenceCloud({
  coverage,
  width,
  height,
  freqX,
  freqY,
  type = 'fractalNoise',
  numOctaves = 4,
  uid,
}: SvgCloudProps) {
  const threshold = 0.9 - coverage * 0.75;
  const scale = 14;
  const bias = -(scale * threshold);
  const filterId = `ct-${uid}`;
  const texFilterId = `ctx-${uid}`;
  const maskId = `cm-${uid}`;

  return (
    <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
      <defs>
        {/*
          Shape filter: threshold cloud silhouette, then multiply in opacity variation
          noise at the same aspect ratio so thin/thick patches follow the cloud direction.
        */}
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type={type}
            baseFrequency={`${freqX} ${freqY}`}
            numOctaves={numOctaves}
            seed={42}
            result="cloudNoise"
          />
          <feColorMatrix
            in="cloudNoise"
            type="matrix"
            values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${scale} ${bias}`}
            result="cloudShape"
          />
          {/* Opacity variation: same direction as cloud, slightly higher frequency */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${(freqX * 1.8).toFixed(4)} ${(freqY * 1.8).toFixed(4)}`}
            numOctaves={2}
            seed={17}
            result="opacNoise"
          />
          {/* Map noise alpha to [0.72, 1.0] — light transparency patches */}
          <feColorMatrix
            in="opacNoise"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.55 1.27"
            result="opacVar"
          />
          {/* Multiply opacity mask into cloud shape: preserves white, varies alpha */}
          <feComposite
            in="cloudShape"
            in2="opacVar"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
          />
        </filter>
        {/* Texture shading: proportionally stretched to match cloud direction */}
        <filter id={texFilterId} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={`${(freqX * 2.8).toFixed(4)} ${(freqY * 2.8).toFixed(4)}`}
            numOctaves={3}
            seed={7}
          />
          <feColorMatrix
            type="matrix"
            values="0.21 0 0 0 0.76  0.21 0 0 0 0.76  0.21 0 0 0 0.76  0 0 0 0 1"
          />
        </filter>
        <mask id={maskId}>
          <rect width={width} height={height} filter={`url(#${filterId})`} />
        </mask>
      </defs>
      {/* Cloud base — solid near-white, masked to cloud shape */}
      <rect width={width} height={height} fill="rgb(242, 246, 252)" mask={`url(#${maskId})`} />
      {/* Texture multiply overlay — noisy shadow patches across cloud surface */}
      <rect
        width={width}
        height={height}
        filter={`url(#${texFilterId})`}
        mask={`url(#${maskId})`}
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  );
}

// ============================================================================
// Grid layout
// ============================================================================

const W = 360;
const H = 80;
const COVERAGES = [0.25, 0.5, 0.75, 1.0];
const SKY_BLUE = '#44DAFF';

const ALGORITHMS = [
  {
    name: 'Cumulus — Blurred Circle Clusters',
    note: 'Circles on offscreen canvas + ctx.filter blur. Puffy fair-weather look.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas
        draw={drawCumulusClusters}
        coverage={coverage}
        seed={`cc-${idx}`}
        width={W}
        height={H}
      />
    ),
  },
  {
    name: 'Stratocumulus — Value Noise fBm',
    note: 'Anisotropic fBm: wider-than-tall cells, smootherstep edges. Same grid, coverage shifts threshold.',
    render: (coverage: number, _idx: number) => (
      <CloudCanvas draw={drawValueNoise} coverage={coverage} seed="vn" width={W} height={H} />
    ),
  },
  {
    name: 'SVG feTurbulence — Stratus',
    note: 'Browser native Perlin, GPU-rendered. fractalNoise 0.045×0.07, 3 octaves.',
    render: (coverage: number, idx: number) => (
      <SvgTurbulenceCloud
        coverage={coverage}
        width={W}
        height={H}
        freqX={0.045}
        freqY={0.07}
        numOctaves={3}
        uid={`st-${idx}-${Math.round(coverage * 100)}`}
      />
    ),
  },
  {
    name: 'SVG feTurbulence — Cirrus',
    note: 'Anisotropic noise 0.008×0.04, 6 octaves. Low x-freq stretches features horizontally.',
    render: (coverage: number, idx: number) => (
      <SvgTurbulenceCloud
        coverage={coverage}
        width={W}
        height={H}
        freqX={0.008}
        freqY={0.04}
        numOctaves={6}
        uid={`ci-${idx}-${Math.round(coverage * 100)}`}
      />
    ),
  },
];

function AlgorithmGrid() {
  const labelCol = '220px';
  const gridCols = `${labelCol} repeat(${COVERAGES.length}, ${W}px)`;

  return (
    <div
      style={{
        padding: '2rem',
        background: '#111827',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h2
        style={{
          fontFamily: 'system-ui, sans-serif',
          color: '#e5e7eb',
          marginTop: 0,
          marginBottom: '0.35rem',
        }}
      >
        Cloud Rendering Algorithms
      </h2>
      <p
        style={{
          fontFamily: 'system-ui, sans-serif',
          color: '#6b7280',
          marginTop: 0,
          marginBottom: '2rem',
          fontSize: '0.85rem',
        }}
      >
        {W}×{H}px panels on sky-blue background. Coverage increases left to right.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {/* Header row */}
        <div />
        {COVERAGES.map((c) => (
          <div
            key={c}
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.82rem',
            }}
          >
            {Math.round(c * 100)}% coverage
          </div>
        ))}

        {/* Algorithm rows */}
        {ALGORITHMS.map((alg, algIdx) => (
          <Fragment key={algIdx}>
            <div style={{ paddingRight: '1rem' }}>
              <div
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  color: '#e5e7eb',
                  fontSize: '0.82rem',
                  marginBottom: '0.2rem',
                }}
              >
                {alg.name}
              </div>
              <div
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  color: '#6b7280',
                  fontSize: '0.72rem',
                  lineHeight: 1.4,
                }}
              >
                {alg.note}
              </div>
            </div>
            {COVERAGES.map((coverage) => (
              <div
                key={coverage}
                style={{ background: SKY_BLUE, borderRadius: '8px', overflow: 'hidden' }}
              >
                {alg.render(coverage, algIdx)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Meta & Stories
// ============================================================================

const meta: Meta = {
  title: 'Weather/CloudAlgorithms',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const AlgorithmComparison: Story = {
  name: 'Algorithm Comparison',
  render: () => <AlgorithmGrid />,
};
