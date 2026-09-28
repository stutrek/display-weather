import type { Meta, StoryObj } from '@storybook/preact-vite';
import { Fragment } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { drawCirrus } from '../WeatherCard/HourlyChart/cloudCirrus';
import { drawCumulonimbus } from '../WeatherCard/HourlyChart/cloudCumulonimbus';
import { drawCumulus } from '../WeatherCard/HourlyChart/cloudCumulus';
import { drawDeck } from '../WeatherCard/HourlyChart/cloudDeck';
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
    name: 'Deck',
    note: 'Low/mid sheet: flattened cumulus banks placed by measured coverage, perspective-sized, with a backing sheet near overcast.',
    render: (coverage: number, idx: number) => (
      <CloudCanvas
        draw={drawDeck}
        coverageAt={() => coverage}
        seed={`dk-${idx}-${coverage}`}
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
  { name: 'Deck', draw: drawDeck },
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
// Coverage audit — measured pixel coverage of the sky band vs requested cov.
// Panels match the card's proportions: a short canvas whose sky is only the
// band above a temperature-line floor. Terrain is painted over the floor so
// the panel shows exactly what the card would.
// ============================================================================

const AW = 720;
const AUDIT_SIZES = [
  { name: 'card', h: 100 },
  { name: 'tall', h: 200 },
];
const AUDIT_COVERAGES = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0];

// Midday-hot ridge: sky is deepest at the edges, shallowest mid-strip.
const auditFloor =
  (h: number) =>
  (x: number): number =>
    h * (0.62 - 0.2 * Math.sin((Math.PI * x) / AW));

interface CoverageReading {
  total: number;
  thirds: [number, number, number];
}

// Fraction of sky-band pixels with alpha > 0.5, overall and per vertical third
// of the band (top / middle / bottom, measured per column against its floor).
function measureSkyCoverage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  floorAt: (x: number) => number,
): CoverageReading {
  const data = ctx.getImageData(0, 0, width, height).data;
  let sky = 0;
  let covered = 0;
  const thirdSky = [0, 0, 0];
  const thirdCov = [0, 0, 0];
  for (let x = 0; x < width; x++) {
    const floor = Math.min(height, Math.max(1, floorAt(x)));
    for (let y = 0; y < floor; y++) {
      const third = Math.min(2, Math.floor((y / floor) * 3));
      const hit = data[(y * width + x) * 4 + 3] > 127 ? 1 : 0;
      sky++;
      covered += hit;
      thirdSky[third]++;
      thirdCov[third] += hit;
    }
  }
  return {
    total: covered / sky,
    thirds: [0, 1, 2].map((i) => thirdCov[i] / thirdSky[i]) as [number, number, number],
  };
}

function AuditCanvas({
  draw,
  coverage,
  height,
  seed,
}: {
  draw: FloorDrawFn;
  coverage: number;
  height: number;
  seed: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const floorAt = auditFloor(height);
    ctx.clearRect(0, 0, AW, height);
    const t0 = performance.now();
    draw(ctx, AW, height, () => coverage, createRng(seed), floorAt);
    const ms = performance.now() - t0;
    const r = measureSkyCoverage(ctx, AW, height, floorAt);
    if (labelRef.current) {
      const pct = (v: number) => `${Math.round(v * 100)}%`;
      labelRef.current.textContent = `asked ${pct(coverage)} → drew ${pct(r.total)}   (top ${pct(r.thirds[0])} · mid ${pct(r.thirds[1])} · low ${pct(r.thirds[2])})  ${ms.toFixed(0)}ms`;
      labelRef.current.dataset.total = r.total.toFixed(3);
    }
    // Terrain over the floor, after measuring
    ctx.fillStyle = '#4fa657';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= AW; x += 4) ctx.lineTo(x, floorAt(x));
    ctx.lineTo(AW, height);
    ctx.closePath();
    ctx.fill();
  }, [draw, coverage, height, seed]);

  return (
    <div>
      <div
        ref={labelRef}
        class="audit-label"
        style={{
          fontFamily: 'ui-monospace, monospace',
          color: '#e5e7eb',
          fontSize: '0.75rem',
          marginBottom: '0.25rem',
        }}
      />
      <div style={{ background: SKY_BLUE, borderRadius: '8px', overflow: 'hidden' }}>
        <canvas ref={ref} width={AW} height={height} style={{ display: 'block' }} />
      </div>
    </div>
  );
}

type FloorDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  coverageAt: (x: number) => number,
  rng: () => number,
  floorAt?: (x: number) => number,
) => void;

const deckVariant =
  (lump: number, wet: number): FloorDrawFn =>
  (ctx, w, h, cov, rng, floorAt) =>
    drawDeck(ctx, w, h, cov, rng, floorAt, { lumpAt: () => lump, wetAt: () => wet });

const AUDIT_ALGORITHMS: Array<{ name: string; draw: FloorDrawFn }> = [
  { name: 'Cumulus', draw: drawCumulus },
  { name: 'Deck', draw: deckVariant(0.5, 0) },
  { name: 'DeckFlat', draw: deckVariant(0, 0) },
  { name: 'DeckLumpy', draw: deckVariant(1, 0) },
  { name: 'DeckRain', draw: deckVariant(0.2, 1) },
  { name: 'Stratus', draw: drawStratus },
  { name: 'Stratocumulus', draw: drawStratocumulus },
  { name: 'Cumulonimbus', draw: drawCumulonimbus },
  { name: 'Cirrus', draw: drawCirrus },
];

function CoverageAuditGrid() {
  return (
    <div
      style={{
        padding: '2rem',
        background: '#111827',
        minHeight: '100vh',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h2 style={{ color: '#e5e7eb', marginTop: 0 }}>Coverage Audit</h2>
      {AUDIT_SIZES.map((size) => (
        <Fragment key={size.name}>
          <h3 style={{ color: '#9ca3af' }}>
            {AW}×{size.h} ({size.name})
          </h3>
          {AUDIT_ALGORITHMS.map((alg) => (
            <div key={alg.name} data-alg={alg.name} data-size={size.name}>
              <h4 style={{ color: '#e5e7eb', margin: '1rem 0 0.5rem' }}>{alg.name}</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(2, ${AW}px)`,
                  gap: '0.75rem',
                }}
              >
                {AUDIT_COVERAGES.map((c) => (
                  <AuditCanvas
                    key={c}
                    draw={alg.draw}
                    coverage={c}
                    height={size.h}
                    seed={`audit-${alg.name}-${c}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </Fragment>
      ))}
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

export const CoverageAudit: Story = {
  name: 'Coverage Audit',
  render: () => <CoverageAuditGrid />,
};
