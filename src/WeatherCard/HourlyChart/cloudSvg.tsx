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

/**
 * SVG feTurbulence cloud renderer.
 *
 * freqX / freqY ratio controls anisotropy:
 *   Stratus:  freqX=0.045  freqY=0.07   numOctaves=3  — small uniform patches
 *   Cirrus:   freqX=0.008  freqY=0.04   numOctaves=6  — elongated wispy streaks
 *
 * Texture and opacity-variation frequencies scale proportionally so shading
 * patches always match the cloud direction.
 */
export function SvgCloud({
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
          <feColorMatrix
            in="opacNoise"
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -0.55 1.27"
            result="opacVar"
          />
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
      <rect width={width} height={height} fill="rgb(242, 246, 252)" mask={`url(#${maskId})`} />
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
