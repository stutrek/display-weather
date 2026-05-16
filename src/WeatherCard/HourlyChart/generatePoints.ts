// ============================================================================
// Jittered Grid Sampling
// Generates evenly-distributed points with natural randomness
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Generate evenly-distributed points using jittered grid sampling.
 * Divides the area into cells and places one random point per cell.
 * This ensures even coverage while maintaining natural randomness.
 *
 * @param count - Target number of points (approximate - actual count depends on grid)
 * @param bounds - Bounding box for point generation
 * @param _minDistance - Ignored (kept for API compatibility)
 * @param _maxAttempts - Ignored (kept for API compatibility)
 * @param rng - Optional seeded random number generator (default: Math.random)
 */
export function generatePoints(
  count: number,
  bounds: Bounds,
  _minDistance?: number,
  _maxAttempts = 30,
  rng: () => number = Math.random,
): Point[] {
  if (count <= 0) return [];

  const area = bounds.width * bounds.height;
  const cellSize = Math.sqrt(area / count);
  const cols = Math.ceil(bounds.width / cellSize);
  const rows = Math.ceil(bounds.height / cellSize);

  const points: Point[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = bounds.x + (col + rng()) * cellSize;
      const y = bounds.y + (row + rng()) * cellSize;

      // Only include points within bounds
      if (x < bounds.x + bounds.width && y < bounds.y + bounds.height) {
        points.push({ x, y });
      }
    }
  }

  return points;
}
