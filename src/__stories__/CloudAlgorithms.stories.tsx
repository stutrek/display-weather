import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Fragment } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { drawCirrus } from '../WeatherCard/HourlyChart/cloudCirrus';
import { drawCumulonimbus } from '../WeatherCard/HourlyChart/cloudCumulonimbus';
import { drawCumulus } from '../WeatherCard/HourlyChart/cloudCumulus';
import { drawStratocumulus } from '../WeatherCard/HourlyChart/cloudStratocumulus';
import { drawStratus } from '../WeatherCard/HourlyChart/cloudStratus';
import { createRng } from '../WeatherCard/HourlyChart/random';

// ============================================================================
// Shared canvas component
// ============================================================================

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
) => void;

interface CloudCanvasProps {
  draw: DrawFn;
  coverageAt: (x: number) => number;
  seed: string;
  width: number;
  height: number;
}

function CloudCanvas({ draw, coverageAt, seed, width, height }: CloudCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height, coverageAt, createRng(seed));
  }, [draw, coverageAt, seed, width, height]);

  return <canvas ref={ref} width={width} height={height} style={{ display: 'block' }} />;
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
    name: 'Cumulus',
    note: 'Distinct flat-based clouds: puff row with domed envelope, single per-cloud shading gradient.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas
        draw={drawCumulus}
        coverageAt={() => coverage}
        seed={`cc-${idx}-${coverage}`}
        width={W}
        height={H}
      />
    ),
  },
  {
    name: 'Cumulonimbus',
    note: 'Storm towers: tapering puff tiers with lean, heavy base shade, bright crowns.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas
        draw={drawCumulonimbus}
        coverageAt={() => coverage}
        seed={`cb-${idx}-${coverage}`}
        width={W}
        height={H}
      />
    ),
  },
  {
    name: 'Stratus',
    note: 'Low dappled field: many small cloudlets on a dithered grid; coverage fattens them from sparse drizzle-sky to thin-cracked sheet.',
    render: (coverage: number, _idx: number) => (
      <CloudCanvas
        draw={drawStratus}
        coverageAt={() => coverage}
        seed={`st-${coverage}`}
        width={W}
        height={H}
      />
    ),
  },
  {
    name: 'Stratocumulus',
    note: 'Larger organized cloud masses: fewer, blobber clusters with heavier undersides and wider gaps between groups.',
    render: (coverage: number, _idx: number) => (
      <CloudCanvas
        draw={drawStratocumulus}
        coverageAt={() => coverage}
        seed={`sc-${coverage}`}
        width={W}
        height={H}
      />
    ),
  },
  {
    name: 'Cirrus',
    note: 'Canvas radial-gradient ellipses, fixed opacity, strand count scales with coverage.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas
        draw={drawCirrus}
        coverageAt={() => coverage}
        seed={`ci-${idx}-${coverage}`}
        width={W}
        height={H}
      />
    ),
  },
];

function AlgorithmGrid() {
  const labelCol = '180px';
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
// Varying coverage grid — regression panel for changing-weather forecasts.
// Each renderer must read as one continuous field: thickening on the ramp,
// leaving the dip's middle empty, and appearing briefly at the spike.
// ============================================================================

const VW = 720;

const ENVELOPES = [
  {
    name: 'Ramp 0 → 1',
    note: 'Coverage climbs left to right; clouds should thicken continuously.',
    fn: (x: number) => x / VW,
  },
  {
    name: 'Dip',
    note: 'Full coverage at the edges, zero mid-strip; the gap must stay clear.',
    fn: (x: number) => Math.min(1, Math.abs(x - VW / 2) / (VW * 0.25)),
  },
  {
    name: 'Spike',
    note: 'Single-hour triangle peaking at 0.9; one brief, sparse appearance.',
    fn: (x: number) => Math.max(0, 0.9 * (1 - Math.abs(x - VW / 2) / (VW / 24))),
  },
];

const VARYING_ALGORITHMS = [
  { name: 'Cirrus', draw: drawCirrus },
  { name: 'Stratus', draw: drawStratus },
  { name: 'Stratocumulus', draw: drawStratocumulus },
  { name: 'Cumulus', draw: drawCumulus },
  { name: 'Cumulonimbus', draw: drawCumulonimbus },
];

function VaryingCoverageGrid() {
  const labelCol = '180px';

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
        Varying Coverage Envelopes
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
        {VW}×{H}px panels. Coverage varies across each panel — clouds must follow the envelope
        continuously instead of rendering in blocks.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelCol} ${VW}px`,
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        {VARYING_ALGORITHMS.flatMap((alg) =>
          ENVELOPES.map((env) => (
            <Fragment key={`${alg.name}-${env.name}`}>
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
                  {alg.name} — {env.name}
                </div>
                <div
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    color: '#6b7280',
                    fontSize: '0.72rem',
                    lineHeight: 1.4,
                  }}
                >
                  {env.note}
                </div>
              </div>
              <div style={{ background: SKY_BLUE, borderRadius: '8px', overflow: 'hidden' }}>
                <CloudCanvas
                  draw={alg.draw}
                  coverageAt={env.fn}
                  seed={`vary-${alg.name}-${env.name}`}
                  width={VW}
                  height={H}
                />
              </div>
            </Fragment>
          )),
        )}
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

export const VaryingCoverage: Story = {
  name: 'Varying Coverage',
  render: () => <VaryingCoverageGrid />,
};
