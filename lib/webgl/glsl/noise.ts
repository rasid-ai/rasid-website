import { HASH_GLSL } from './hash';

/**
 * Noise + Voronoi primitives.
 *
 * The Voronoi here is deliberately constrained so that a 3×3 neighbourhood
 * search is *provably exact*: sites live in the central 60% of their cell
 * (offset 0.2, jitter 0.6), so the furthest a query point can be from its own
 * cell's site is sqrt(2)·0.8 ≈ 1.131, while any site two cells away is at
 * least 2 − 0.8 = 1.2 away. 1.2 > 1.131, therefore no site outside the 3×3
 * block can ever win.
 *
 * That exactness matters: it makes the cells true convex Voronoi regions,
 * which means the CPU can reconstruct the identical polygon by half-plane
 * clipping (see lib/geo/parcels.ts) and draw field-delineation boundaries
 * that sit precisely on the shader's parcel edges.
 */
export const NOISE_GLSL = /* glsl */ `
${HASH_GLSL}

#define SITE_OFF 0.2
#define SITE_JIT 0.6

/** Value noise, quintic interpolation (C2 continuous — no gradient banding). */
float vnoise(vec2 p, uint s){
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  ivec2 c = ivec2(i);
  float a = cr(c,               s);
  float b = cr(c + ivec2(1, 0), s);
  float d = cr(c + ivec2(0, 1), s);
  float e = cr(c + ivec2(1, 1), s);
  return mix(mix(a, b, u.x), mix(d, e, u.x), u.y);
}

float fbm(vec2 p, int oct, uint s){
  float sum = 0.0, amp = 0.5, norm = 0.0;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86); // decorrelate octaves
  for (int i = 0; i < 8; i++){
    if (i >= oct) break;
    sum += amp * vnoise(p, s + uint(i) * 37u);
    norm += amp;
    p = rot * p * 2.02;
    amp *= 0.5;
  }
  return sum / max(norm, 1e-5);
}

/** Ridged multifractal — reads as mountain ranges rather than dunes. */
float ridged(vec2 p, int oct, uint s){
  float sum = 0.0, amp = 0.5, norm = 0.0, prev = 1.0;
  mat2 rot = mat2(0.86, 0.51, -0.51, 0.86);
  for (int i = 0; i < 8; i++){
    if (i >= oct) break;
    float n = 1.0 - abs(vnoise(p, s + uint(i) * 53u) * 2.0 - 1.0);
    n *= n;
    sum += amp * n * prev;
    prev = n;
    norm += amp;
    p = rot * p * 2.04;
    amp *= 0.5;
  }
  return sum / max(norm, 1e-5);
}

/** Domain-warped fbm — organic, non-griddy large forms (coastlines, rivers). */
float warpFbm(vec2 p, int oct, uint s){
  vec2 q = vec2(fbm(p + 11.3, 3, s + 7u), fbm(p - 4.7, 3, s + 91u));
  return fbm(p + 2.2 * (q - 0.5), oct, s);
}

struct Vor {
  float f1;    // distance to nearest site
  float f2;    // distance to 2nd nearest
  ivec2 id;    // lattice id of nearest site
  vec2  site;  // nearest site position (lattice units)
};

Vor voronoi(vec2 p, uint s){
  ivec2 b = ivec2(floor(p));
  vec2 fr = p - vec2(b);
  Vor v;
  v.f1 = 1e9; v.f2 = 1e9; v.id = b; v.site = vec2(b);
  for (int y = -1; y <= 1; y++){
    for (int x = -1; x <= 1; x++){
      ivec2 c = b + ivec2(x, y);
      vec2 j = SITE_OFF + SITE_JIT * cr2(c, s);
      vec2 o = vec2(x, y) + j - fr;
      float d = dot(o, o);
      if (d < v.f1){
        v.f2 = v.f1; v.f1 = d;
        v.id = c; v.site = vec2(c) + j;
      } else if (d < v.f2){
        v.f2 = d;
      }
    }
  }
  v.f1 = sqrt(v.f1);
  v.f2 = sqrt(v.f2);
  return v;
}

/** Approximate distance to the nearest Voronoi edge, in lattice units. */
float vorEdge(Vor v){ return (v.f2 - v.f1) * 0.5; }

/** Signed distance to an axis-aligned box of half-extent b, centred at 0. */
float sdBox(vec2 p, vec2 b){
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

vec2 rot2(vec2 p, float a){
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

/** Anti-aliased step whose width follows screen-space derivatives. */
float aastep(float threshold, float value){
  float w = max(fwidth(value), 1e-6);
  return smoothstep(threshold - w, threshold + w, value);
}
`;
