/**
 * Deterministic hashing shared between CPU and GPU.
 *
 * The satellite imagery is synthesised in a fragment shader, but the detection
 * overlays (field boundaries, tree canopies) are SVG generated in TypeScript.
 * For the overlays to land *on* what the shader drew, both sides must agree
 * bit-for-bit. These functions are the contract: they are mirrored exactly by
 * `HASH_GLSL` in lib/webgl/glsl/hash.ts.
 *
 * `Math.imul` gives us GLSL's uint multiply (mod 2^32); `>>>` gives us its
 * logical shift. Every operation below is therefore reproducible on the GPU.
 */

/** Integer avalanche (Chris Wellons' lowbias32). */
export function uhash(x: number): number {
  let h = x >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Cell key for integer lattice coordinates + a salt (mirrors GLSL `ckey`). */
export function ckey(x: number, y: number, salt: number): number {
  return (Math.imul(x >>> 0, 1973) ^ Math.imul(y >>> 0, 9277) ^ Math.imul(salt >>> 0, 26699)) >>> 0;
}

/** Uniform float in [0,1) for a lattice cell. */
export function cellRand(x: number, y: number, salt: number): number {
  return (uhash(ckey(x, y, salt)) & 0xffffff) / 16777216;
}

/** Seeded scalar PRNG for content that needs no GPU counterpart. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (uhash(s) + 0x9e3779b9) >>> 0;
    return (s & 0xffffff) / 16777216;
  };
}
