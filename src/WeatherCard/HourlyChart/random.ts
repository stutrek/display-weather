// ============================================================================
// Seeded Random Number Generator
// Provides deterministic randomness based on datetime for consistent rendering
// ============================================================================

/**
 * Simple string hash for seeding (djb2 variant)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Mulberry32 PRNG - fast, good quality, 32-bit
 * Returns a function that produces random numbers in [0, 1)
 */
function mulberry32(initialSeed: number): () => number {
  let state = initialSeed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a seeded RNG from a datetime string
 * Same datetime always produces the same sequence of random numbers
 *
 * @example
 * const rng = createRng("2026-01-26T14:00:00");
 * rng(); // 0.234... (always same for this datetime)
 * rng(); // 0.891... (deterministic sequence)
 */
export function createRng(datetime: string): () => number {
  return mulberry32(hashString(datetime));
}
