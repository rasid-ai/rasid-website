/**
 * Deterministic PRNG for content that needs reproducible randomness on the CPU.
 *
 * The hero Starfield and DataPoints seed their layouts from a fixed seed via
 * `makeRng`, so every render lays points out identically. `uhash` is Chris
 * Wellons' lowbias32 integer avalanche; `Math.imul` gives a mod-2^32 multiply.
 */

/** Integer avalanche (Chris Wellons' lowbias32). */
function uhash(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Seeded scalar PRNG returning uniform floats in [0,1). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (uhash(s) + 0x9e3779b9) >>> 0;
    return (s & 0xffffff) / 16777216;
  };
}
