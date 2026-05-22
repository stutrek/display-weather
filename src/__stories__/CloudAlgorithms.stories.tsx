import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Fragment } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { drawCumulus } from '../WeatherCard/HourlyChart/cloudCumulus';
import { drawStratocumulus } from '../WeatherCard/HourlyChart/cloudStratocumulus';
import { SvgCloud } from '../WeatherCard/HourlyChart/cloudSvg';
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
    draw(ctx, width, height, () => coverage, createRng(`${seed}-${coverage}`));
  }, [draw, coverage, seed, width, height]);

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
    note: 'Radial gradient circles, multiple vertical passes at high coverage.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas draw={drawCumulus} coverage={coverage} seed={`cc-${idx}`} width={W} height={H} />
    ),
  },
  {
    name: 'Stratocumulus',
    note: 'Anisotropic fBm, per-octave grids to avoid tiling, smootherstep edges.',
    render: (coverage: number, _idx: number) => (
      <CloudCanvas draw={drawStratocumulus} coverage={coverage} seed="vn" width={W} height={H} />
    ),
  },
  {
    name: 'Stratus',
    note: 'SVG feTurbulence fractalNoise 0.045×0.07, 3 octaves.',
    render: (coverage: number, idx: number) => (
      <SvgCloud
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
    name: 'Cirrus',
    note: 'SVG feTurbulence anisotropic 0.008×0.04, 6 octaves.',
    render: (coverage: number, idx: number) => (
      <SvgCloud
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
