import { NOISE_GLSL } from './noise';

/**
 * SURFACE — procedural satellite imagery.
 *
 * This is the single source of truth for every pixel of "imagery" on the site:
 * the final metres of the hero dive, the DataSection plate, the GoPilot map, the
 * model showcase and all three use cases sample this same function. Because
 * they share it, the narrative holds together — the region you dive into is
 * literally the region GoPilot then analyses.
 *
 * Design notes
 * ------------
 * • Coordinates are kilometres in a planar frame local to the scene centre.
 * • `px` (km per pixel) drives LOD: features fade in as they exceed ~1.5px so
 *   the plate never aliases when zoomed out, and detail keeps arriving as you
 *   zoom in — which is exactly what "the imagery becomes sharper" should mean.
 * • Sun azimuth/elevation are global; every layer casts consistent shadows.
 *   Consistent lighting is most of what separates "satellite photo" from "noise".
 * • Layer geometry (parcels, solar arrays, roads) is derived from the exact
 *   integer hashes mirrored in TypeScript, so vector overlays align to pixels.
 *
 * Replacing with real RASID imagery
 * ---------------------------------
 * `surfaceSample()` is the seam. Swap its body for a tile fetch (or sample a
 * uTiles sampler2D) and every consumer keeps working unchanged; the overlays
 * then come from real model output instead of lib/geo/*.
 */
export const SURFACE_GLSL = /* glsl */ `
${NOISE_GLSL}

/* ---- tunables (kilometres) ------------------------------------------ */
#define PARCEL_KM   0.30   // agricultural lattice pitch
#define BLOCK_KM    1.70   // road-network / district lattice pitch
#define TREE_KM     0.022  // canopy lattice pitch
#define BLDG_KM     0.055  // building lattice pitch

/* Palette — sampled from Sentinel-2 true-colour composites, desaturated a
   touch so the accent colour is never competing with the imagery itself. */
const vec3 C_WATER_DEEP = vec3(0.016, 0.047, 0.070);
const vec3 C_WATER_SHAL = vec3(0.043, 0.118, 0.133);
const vec3 C_SOIL_DRY   = vec3(0.352, 0.298, 0.212);
const vec3 C_SOIL_RICH  = vec3(0.223, 0.180, 0.128);
const vec3 C_ROCK       = vec3(0.316, 0.306, 0.283);
const vec3 C_CROP_A     = vec3(0.196, 0.263, 0.126);
const vec3 C_CROP_B     = vec3(0.310, 0.345, 0.150);
const vec3 C_CROP_C     = vec3(0.121, 0.204, 0.113);
const vec3 C_FALLOW     = vec3(0.404, 0.365, 0.255);
const vec3 C_TREE       = vec3(0.075, 0.130, 0.070);
const vec3 C_ASPHALT    = vec3(0.128, 0.132, 0.140);
const vec3 C_CONCRETE   = vec3(0.418, 0.416, 0.404);
const vec3 C_ROOF_A     = vec3(0.330, 0.300, 0.281);
const vec3 C_ROOF_B     = vec3(0.239, 0.243, 0.252);
const vec3 C_PANEL      = vec3(0.055, 0.070, 0.115);

uniform float uSunAz;      // radians, 0 = +X
uniform float uSunEl;      // radians above horizon
uniform float uSeedF;      // scene seed
uniform float uDetail;     // 0..1 global detail budget (mobile turns this down)
uniform float uSharpen;    // 0..1 "imagery resolves" — story-driven, not optical

/* ---------------------------------------------------------------- *
 * Regional structure
 * ---------------------------------------------------------------- */

/** Terrain elevation in normalised units. Also the shading height field. */
float elevation(vec2 P, uint s){
  float base = warpFbm(P * 0.055, 5, s + 3u);
  float ridge = ridged(P * 0.13, 4, s + 17u);
  return base * 0.72 + ridge * 0.34 * smoothstep(0.35, 0.8, base);
}

/** Cheap elevation, for the shading gradient only.
 *
 * This is the single hottest function on the page. Full elevation() costs ~15
 * noise octaves (warpFbm is itself three fbm calls), and the terrain normal used
 * to sample it four more times for a central difference — ~75 octaves per pixel
 * before a single colour was chosen, at every pixel of every imagery panel.
 *
 * A normal does not need the high frequencies: octaves finer than the 0.06 km
 * sample step are aliased by the difference anyway and only add shimmer, so
 * dropping the ridge term and two octaves changes the shading imperceptibly
 * while cutting it to ~9. Paired with a forward difference (2 samples, reusing
 * the centre value the caller already has) the gradient goes 60 → 18 octaves. */
float elevationLo(vec2 P, uint s){
  return warpFbm(P * 0.055, 3, s + 3u) * 0.72;
}

/** 0 = open sea, 1 = inland. Coastline is the 0.5 isoline. */
float landMask(vec2 P, uint s){
  float m = warpFbm(P * 0.028 + vec2(3.1, -1.7), 4, s + 41u);
  return smoothstep(0.34, 0.52, m);
}

/** Inland water: rivers (ridge-following) and lakes (basins).
 *
 * The land mask is passed in rather than recomputed: this function used it three
 * times and the caller needed it too, so the same 4-octave warpFbm (≈12 noise
 * evaluations) was being run four times per pixel for one value. */
float waterMask(vec2 P, float px, uint s, float land, out float wDepth){
  float sea = 1.0 - land;
  // River: the thin locus where a warped field crosses zero.
  float r = warpFbm(P * 0.075 + vec2(-8.3, 5.9), 4, s + 67u) - 0.5;
  float w = 0.010 + 0.020 * fbm(P * 0.04, 2, s + 71u);
  float river = 1.0 - smoothstep(w * 0.55, w * 1.45, abs(r));
  river *= smoothstep(0.15, 0.45, land);
  // Lake: closed low basins.
  float basin = fbm(P * 0.09 + vec2(21.0, 13.0), 3, s + 83u);
  float lake = smoothstep(0.30, 0.20, basin) * smoothstep(0.2, 0.5, land);
  float m = clamp(max(sea, max(river, lake * 0.9)), 0.0, 1.0);
  wDepth = clamp(sea * 1.3 + lake * 0.6 + river * 0.25, 0.0, 1.0);
  return m;
}

/** Probability that a district is built-up rather than farmed. */
float urbanity(vec2 P, uint s){
  float u = warpFbm(P * 0.048 + vec2(-14.2, 9.4), 4, s + 97u);
  return smoothstep(0.46, 0.72, u);
}

/* ---------------------------------------------------------------- *
 * Road network — Voronoi edges read as a real settlement road graph
 * ---------------------------------------------------------------- */
/* Urbanity is passed in, not recomputed — see the note on waterMask. */
float roadNet(vec2 P, float px, uint s, float urb, out float major){
  Vor v = voronoi(P / BLOCK_KM, s + 131u);
  float e = vorEdge(v) * BLOCK_KM;                 // km to nearest edge
  float wMaj = 0.013;
  float wMin = 0.006;
  major = 1.0 - smoothstep(wMaj, wMaj + max(px, 0.0015), e);
  /* Secondary street lattice. Skipped entirely outside settlements: it is a
     whole extra Voronoi evaluation, and the result is scaled by urbanity, so
     over open country it was computing a network that then got multiplied down
     to nothing. */
  float minor = 0.0;
  if (urb > 0.002){
    Vor v2 = voronoi(P / (BLOCK_KM * 0.34) + 7.7, s + 149u);
    float e2 = vorEdge(v2) * BLOCK_KM * 0.34;
    minor = 1.0 - smoothstep(wMin, wMin + max(px, 0.0012), e2);
    minor *= 0.55 + 0.45 * urb;
  }
  return clamp(max(major, minor * 0.85), 0.0, 1.0);
}

/* ---------------------------------------------------------------- *
 * Agriculture — Voronoi parcels with per-parcel crop, rotation, furrows
 * ---------------------------------------------------------------- */
struct Parcel { vec3 col; float edge; float ndvi; };

Parcel parcels(vec2 P, float px, uint s){
  Vor v = voronoi(P / PARCEL_KM, s + 211u);
  float rot = cr(v.id, s + 223u) * 3.14159;
  float type = cr(v.id, s + 227u);
  float vigour = cr(v.id, s + 229u);

  vec3 col;
  float ndvi;
  if (type < 0.20){        col = C_FALLOW;  ndvi = 0.12; }
  else if (type < 0.44){   col = C_CROP_B;  ndvi = 0.55; }
  else if (type < 0.72){   col = C_CROP_A;  ndvi = 0.72; }
  else if (type < 0.90){   col = C_CROP_C;  ndvi = 0.83; }
  else {                   col = C_SOIL_RICH; ndvi = 0.20; }

  // Per-parcel exposure spread — the thing that makes farmland read as farmland.
  col *= 0.78 + 0.44 * vigour;

  // Furrows: aligned to the parcel, only once wide enough to resolve.
  float fp = mix(0.0075, 0.019, cr(v.id, s + 233u));
  vec2 lp = rot2(P - v.site * PARCEL_KM, -rot);
  float fur = sin(lp.y / fp * 6.28318) * 0.5 + 0.5;
  float furVis = smoothstep(1.7 * px, 3.4 * px, fp) * uDetail;
  col *= 1.0 + (fur - 0.5) * 0.16 * furVis;

  // Irrigation mottling inside the parcel.
  col *= 0.94 + 0.12 * fbm(P * 26.0, 2, s + 239u);

  float e = vorEdge(v) * PARCEL_KM;
  // Field boundary: a dirt track / hedgerow, not a drawn line.
  float track = 1.0 - smoothstep(0.0022, 0.0022 + max(px, 0.0008), e);
  col = mix(col, C_SOIL_DRY * 0.86, track * 0.55 * smoothstep(0.5 * px, 2.0 * px, 0.0022));

  Parcel o;
  o.col = col;
  o.edge = e;
  o.ndvi = ndvi;
  return o;
}

/* ---------------------------------------------------------------- *
 * Canopy — clumped trees with sun-side highlight and cast shadow
 * ---------------------------------------------------------------- */
float canopy(vec2 P, float px, uint s, out float shade){
  shade = 0.0;
  float forest = smoothstep(0.52, 0.78, warpFbm(P * 0.09 + vec2(5.5, -3.3), 4, s + 251u));
  if (forest <= 0.002) return 0.0;
  // Below ~1.3px per crown, individual trees would alias — fold into texture.
  float vis = smoothstep(1.3 * px, 3.0 * px, TREE_KM) * uDetail;
  if (vis <= 0.002) return forest * 0.55;

  vec2 g = P / TREE_KM;
  ivec2 b = ivec2(floor(g));
  vec2 f = g - vec2(b);
  float m = 0.0, sh = 0.0;
  vec2 sunOff = vec2(cos(uSunAz), sin(uSunAz)) * (0.55 / max(tan(uSunEl), 0.35));
  for (int y = -1; y <= 1; y++){
    for (int x = -1; x <= 1; x++){
      ivec2 c = b + ivec2(x, y);
      if (cr(c, s + 257u) > forest * 0.92) continue;
      vec2 o = vec2(x, y) + 0.18 + 0.64 * cr2(c, s + 263u) - f;
      float r = 0.26 + 0.20 * cr(c, s + 269u);
      m = max(m, 1.0 - smoothstep(r * 0.62, r, length(o)));
      sh = max(sh, 1.0 - smoothstep(r * 0.7, r * 1.15, length(o + sunOff)));
    }
  }
  shade = clamp(sh - m, 0.0, 1.0) * vis;
  return mix(forest * 0.55, clamp(m, 0.0, 1.0) * forest, vis);
}

/* ---------------------------------------------------------------- *
 * Built environment — districts of rotated blocks with cast shadows
 * ---------------------------------------------------------------- */
vec3 built(vec2 P, float px, uint s, float urb, out float mask, out float shade){
  mask = 0.0; shade = 0.0;
  if (urb <= 0.004) return vec3(0.0);
  Vor d = voronoi(P / BLOCK_KM, s + 131u);
  float rot = cr(d.id, s + 271u) * 1.5708;              // district street grid
  vec2 lp = rot2(P - d.site * BLOCK_KM, -rot);

  float vis = smoothstep(1.1 * px, 2.6 * px, BLDG_KM) * uDetail;
  vec2 g = lp / BLDG_KM;
  ivec2 b = ivec2(floor(g));
  vec2 f = g - vec2(b);

  vec3 col = C_CONCRETE * (0.62 + 0.30 * fbm(P * 40.0, 2, s + 277u));
  if (vis <= 0.004){
    // Zoomed out: an averaged urban tone, no per-building geometry.
    mask = urb * 0.9;
    return mix(C_ASPHALT * 1.5, C_ROOF_A, 0.5) * (0.85 + 0.3 * fbm(P * 9.0, 2, s + 281u));
  }

  vec2 sunOff = vec2(cos(uSunAz), sin(uSunAz)) * (0.62 / max(tan(uSunEl), 0.30));
  float best = 0.0, sh = 0.0;
  vec3 roof = C_ROOF_A;
  for (int y = -1; y <= 1; y++){
    for (int x = -1; x <= 1; x++){
      ivec2 c = b + ivec2(x, y);
      float occ = cr(c, s + 283u);
      if (occ > urb * 0.86 + 0.06) continue;
      vec2 ctr = vec2(x, y) + 0.5 + (cr2(c, s + 287u) - 0.5) * 0.30 - f;
      vec2 he = 0.20 + 0.22 * cr2(c, s + 293u);        // half-extents
      float dBox = sdBox(ctr, he);
      float m = 1.0 - smoothstep(0.0, max(px / BLDG_KM, 0.02), dBox);
      if (m > best){
        best = m;
        float rt = cr(c, s + 307u);
        roof = mix(C_ROOF_A, C_ROOF_B, step(0.5, rt)) * (0.74 + 0.5 * cr(c, s + 311u));
      }
      float dS = sdBox(ctr + sunOff * he.x * 1.6, he);
      sh = max(sh, 1.0 - smoothstep(0.0, max(px / BLDG_KM, 0.03), dS));
    }
  }
  mask = clamp(best, 0.0, 1.0) * urb;
  shade = clamp(sh - best, 0.0, 1.0) * urb * vis;
  return mix(col, roof, clamp(best, 0.0, 1.0));
}

/* ---------------------------------------------------------------- *
 * Solar installations
 * ---------------------------------------------------------------- *
 * Deliberately legible: rows of dark, blue-shifted panels on a bright pad,
 * with a specular sheen along the sun azimuth. These are the features the
 * detection overlay boxes, so they must be unambiguous at a glance.
 * Site selection is mirrored exactly in lib/geo/solar.ts.
 */
float solarSite(ivec2 c, uint s){ return cr(c, s + 331u); }

vec3 solar(vec2 P, float px, uint s, out float mask){
  mask = 0.0;
  vec3 out_ = vec3(0.0);
  float SK = 0.42;                                     // site lattice pitch
  vec2 g = P / SK;
  ivec2 b = ivec2(floor(g));
  for (int y = -1; y <= 1; y++){
    for (int x = -1; x <= 1; x++){
      ivec2 c = b + ivec2(x, y);
      if (solarSite(c, s) > 0.16) continue;            // ~16% of cells host an array
      vec2 ctr = (vec2(c) + 0.2 + 0.6 * cr2(c, s + 337u)) * SK;
      float rot = (cr(c, s + 347u) - 0.5) * 0.7;
      vec2 he = vec2(0.030 + 0.045 * cr(c, s + 349u), 0.022 + 0.034 * cr(c, s + 353u));
      vec2 lp = rot2(P - ctr, -rot);
      float d = sdBox(lp, he);
      float pad = 1.0 - smoothstep(0.0, max(px, 0.0006), d - 0.006);
      if (pad <= 0.001) continue;
      float m = 1.0 - smoothstep(0.0, max(px, 0.0006), d);
      // Panel rows across the short axis.
      float pitch = 0.0085;
      float rows = step(0.42, fract(lp.y / pitch));
      float rowVis = smoothstep(1.4 * px, 3.0 * px, pitch) * uDetail;
      vec3 panel = mix(C_PANEL * 1.9, C_PANEL, rowVis * rows);
      // Anisotropic sheen — panels are the only specular land surface here.
      float sheen = pow(max(dot(normalize(vec2(cos(uSunAz), sin(uSunAz))),
                                normalize(rot2(vec2(1.0, 0.0), rot))), 0.0), 8.0);
      panel += vec3(0.10, 0.14, 0.20) * sheen * (0.35 + 0.65 * rowVis);
      vec3 padCol = C_CONCRETE * 0.72;
      out_ = mix(mix(padCol, panel, m), out_, step(0.999, mask));
      mask = max(mask, max(m, pad * 0.85));
    }
  }
  return out_;
}

/* ---------------------------------------------------------------- *
 * Composite
 * ---------------------------------------------------------------- */

/**
 * @param P  position in kilometres
 * @param px kilometres per pixel (LOD)
 * @return   rgb linear-ish radiance, .a = elevation (for downstream shading)
 */
vec4 surfaceSample(vec2 P, float px, uint s){
  /* The three regional fields every layer below needs, evaluated ONCE. Each is a
     4–5 octave domain-warped fbm; they used to be recomputed inside waterMask,
     roadNet, built and here, which is most of a frame's cost for three numbers. */
  float land_ = landMask(P, s);
  float urb   = urbanity(P, s);
  float elev  = elevation(P, s);

  float wDepth;
  float water = waterMask(P, px, s, land_, wDepth);

  /* Open sea: none of the land layers can contribute, and each one carries a
     Voronoi or a 3×3 neighbourhood loop. Water is a large fraction of the wide
     shots (the whole Mediterranean in the hero dive), so this is a real saving,
     not a micro-optimisation. The threshold leaves the coastal blend intact. */
  bool onLand = water < 0.985;

  /* --- land base: parcels where farmable, rock/soil where steep --- */
  float rocky = smoothstep(0.55, 0.85, elev);
  vec3 rockCol = mix(C_ROCK, C_SOIL_DRY, fbm(P * 3.0, 2, s + 359u));
  vec3 land = rockCol;
  if (onLand){
    /* Parcels are a full Voronoi. Skip it where the result is invisible: bare
       rock above the treeline, and dense city where buildings cover it anyway. */
    float farmable = (1.0 - rocky) * (1.0 - urb * 0.75);
    if (farmable > 0.02){
      Parcel pc = parcels(P, px, s);
      land = mix(rockCol, pc.col, farmable);
    }
    land = mix(land, mix(C_SOIL_DRY, C_SOIL_RICH, 0.5), urb * 0.25);
  }

  /* --- canopy --- */
  float tree = 0.0, tShade = 0.0;
  if (onLand && urb < 0.98 && rocky < 0.98){
    tree = canopy(P, px, s, tShade) * (1.0 - urb * 0.65) * (1.0 - rocky * 0.5);
    land = mix(land, C_TREE * (0.8 + 0.5 * fbm(P * 60.0, 2, s + 367u)), tree * 0.9);
    land *= 1.0 - tShade * 0.45;
  }

  /* --- built --- */
  float bMask = 0.0, bShade = 0.0;
  if (onLand && urb > 0.004){
    vec3 bCol = built(P, px, s, urb, bMask, bShade);
    land = mix(land, bCol, bMask * 0.94);
    land *= 1.0 - bShade * 0.5;
  }

  /* --- roads --- */
  float major = 0.0;
  if (onLand){
    float road = roadNet(P, px, s, urb, major) * (1.0 - water * 0.9);
    land = mix(land, C_ASPHALT * (1.0 + 0.5 * major), road * 0.9);
  }

  /* --- solar --- */
  if (onLand){
    float sMask;
    vec3 sCol = solar(P, px, s, sMask);
    sMask *= (1.0 - water) * (1.0 - tree * 0.8) * (1.0 - bMask * 0.7);
    land = mix(land, sCol, sMask);
  }

  /* --- terrain shading from the elevation field ---
     Forward difference against the low-frequency field, not a central difference
     against the full one: 2 cheap samples instead of 4 expensive ones. The
     doubled step keeps the same gradient scale as the old ±h central difference. */
  float h = 0.12;
  float e0 = elevationLo(P, s);
  vec2 dxy = vec2(
    elevationLo(P + vec2(h, 0.0), s) - e0,
    elevationLo(P + vec2(0.0, h), s) - e0
  );
  vec3 n = normalize(vec3(-dxy * 7.0, 1.0));
  vec3 L = normalize(vec3(cos(uSunAz) * cos(uSunEl), sin(uSunAz) * cos(uSunEl), sin(uSunEl)));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  land *= mix(1.0, 0.55 + 0.85 * diff, 0.55 * (1.0 - urb * 0.4));

  /* --- water --- */
  vec3 wCol = mix(C_WATER_SHAL, C_WATER_DEEP, smoothstep(0.15, 0.85, wDepth));
  float glint = pow(clamp(dot(reflect(-L, vec3(0.0, 0.0, 1.0)), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 24.0);
  wCol += vec3(0.05, 0.07, 0.08) * glint * 0.6;
  wCol *= 0.92 + 0.16 * fbm(P * 14.0, 2, s + 373u);
  vec3 col = mix(land, wCol, water);

  /* --- sensor character ---------------------------------------- */
  // Atmospheric path radiance: lifts blacks and cools shadows. Reduced as the
  // story "sharpens" the imagery, which reads as a better sensor / clearer air.
  float haze = mix(0.10, 0.026, uSharpen);
  col = mix(col, col + vec3(0.030, 0.044, 0.062), haze * 4.0);
  // Very light thin cirrus, so the plate never looks like a flat texture.
  float cloud = smoothstep(0.62, 0.95, fbm(P * 0.035 + vec2(17.0, 4.0), 4, s + 379u));
  col = mix(col, col * 0.9 + vec3(0.40, 0.44, 0.48), cloud * 0.16 * (1.0 - uSharpen * 0.6));

  return vec4(col, elev);
}
`;
