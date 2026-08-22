/**
 * Integer hashing — GLSL ES 3.0.
 *
 * IMPORTANT: every function here is mirrored bit-for-bit in lib/utils/rng.ts.
 * That contract is what allows the AI-detection overlays (SVG, built on the
 * CPU) to land exactly on the features the imagery shader drew on the GPU.
 * If you change a constant here, change it there.
 *
 * Integer hashing is used rather than the usual `fract(sin(x)*43758.5)` trick
 * precisely because it is exactly reproducible across CPU and GPU.
 */
export const HASH_GLSL = /* glsl */ `
uint uhash(uint x){
  x ^= x >> 16u;
  x *= 0x7feb352du;
  x ^= x >> 15u;
  x *= 0x846ca68bu;
  x ^= x >> 16u;
  return x;
}

uint ckey(ivec2 c, uint salt){
  return uint(c.x) * 1973u ^ uint(c.y) * 9277u ^ salt * 26699u;
}

/** Uniform [0,1) per lattice cell. */
float cr(ivec2 c, uint salt){
  return float(uhash(ckey(c, salt)) & 0xffffffu) / 16777216.0;
}

/** Two independent uniforms per lattice cell. */
vec2 cr2(ivec2 c, uint salt){
  return vec2(cr(c, salt), cr(c, salt + 101u));
}

vec3 cr3(ivec2 c, uint salt){
  return vec3(cr(c, salt), cr(c, salt + 101u), cr(c, salt + 211u));
}
`;
