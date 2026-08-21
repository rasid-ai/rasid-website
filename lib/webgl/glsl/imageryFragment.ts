import { SURFACE_GLSL } from './surface';

/**
 * Fragment shader for every flat imagery panel.
 *
 * Beyond compositing the procedural surface, this stage models the *sensor* —
 * because "satellite imagery" is as much about the instrument as the ground:
 *
 *  uReveal   push-broom acquisition wipe (imagery "loading" line by line)
 *  uSharpen  0 → coarse/hazy, 1 → resolved; drives LOD + atmospheric removal
 *  uBands    RGB → false-colour NIR blend (vegetation goes red, as in CIR)
 *  uGrid     graticule + tile boundaries
 *  uScan     analysis sweep used while a model is running
 *  uHeat     NDVI-style analytical colour ramp
 *  uVignette optical falloff
 */
export const IMAGERY_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;

uniform vec2  uCenter;     // world position (km)
uniform float uWidthKm;    // visible width (km)
uniform float uReveal;     // 0..1 acquisition wipe
// uSharpen is declared by SURFACE_GLSL below, which owns it — re-declaring here
// is a redefinition error and kills the whole panel.
uniform float uBands;      // 0=RGB 1=NIR false colour
uniform float uGrid;       // 0..1 graticule opacity
uniform float uScan;       // 0..1 analysis sweep opacity
uniform float uScanPos;    // 0..1 sweep position
uniform float uHeat;       // 0..1 NDVI ramp
uniform float uVignette;   // 0..1
uniform float uFade;       // global opacity
uniform float uRotate;     // scene rotation (radians)

${SURFACE_GLSL}

/** NDVI proxy from the visible composite — good enough to drive a ramp. */
float ndviOf(vec3 c){
  float g = c.g, r = c.r;
  return clamp((g - r * 0.72) / max(g + r * 0.72, 1e-4) * 2.0 + 0.15, 0.0, 1.0);
}

vec3 heatRamp(float t){
  // Perceptually ordered analytic ramp: deep blue → teal → signal → warm.
  vec3 a = vec3(0.03, 0.09, 0.18);
  vec3 b = vec3(0.05, 0.35, 0.42);
  vec3 c = vec3(0.21, 0.88, 0.77);
  vec3 d = vec3(0.92, 0.95, 0.72);
  float x = clamp(t, 0.0, 1.0);
  return x < 0.5 ? mix(mix(a, b, x * 2.0), b, 0.0) : mix(b, mix(c, d, (x - 0.5) * 2.0), 1.0);
}

void main(){
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uint S = uint(uSeedF);

  /* world position for this fragment */
  float heightKm = uWidthKm / aspect;
  vec2 rel = vec2((uv.x - 0.5) * uWidthKm, (uv.y - 0.5) * heightKm);
  rel = rot2(rel, uRotate);
  vec2 P = uCenter + rel;

  /* LOD: km per pixel, plus a story-driven softening when unsharpened */
  float px = uWidthKm / max(uResolution.x, 1.0);
  float lodPx = px * mix(2.6, 1.0, uSharpen);

  vec4 surf = surfaceSample(P, lodPx, S);
  vec3 col = surf.rgb;

  /* --- false-colour NIR ------------------------------------------ */
  if (uBands > 0.001){
    float ndvi = ndviOf(col);
    // CIR: NIR→R, R→G, G→B. Vegetation reads crimson, built-up cyan-grey.
    vec3 cir = vec3(
      mix(col.r, 0.20 + ndvi * 0.95, 0.85),
      col.r * 0.85 + 0.05,
      col.g * 0.70 + 0.04
    );
    col = mix(col, cir, uBands);
  }

  /* --- analytical ramp ------------------------------------------- */
  if (uHeat > 0.001){
    col = mix(col, heatRamp(ndviOf(col)), uHeat * 0.88);
  }

  /* --- graticule + tile grid ------------------------------------- */
  if (uGrid > 0.001){
    // Choose a graticule step that stays ~1 line per 120px at any zoom.
    float target = uWidthKm / 6.0;
    float mag = pow(10.0, floor(log2(max(target, 1e-4)) / log2(10.0)));
    float step_ = mag * (target / mag > 5.0 ? 5.0 : (target / mag > 2.0 ? 2.0 : 1.0));
    vec2 gp = P / step_;
    vec2 gf = abs(fract(gp) - 0.5);
    vec2 gw = fwidth(gp) * 1.2;
    float line = 1.0 - min(smoothstep(0.0, gw.x, gf.x), smoothstep(0.0, gw.y, gf.y));
    // Every 5th line is emphasised.
    vec2 gp5 = P / (step_ * 5.0);
    vec2 gf5 = abs(fract(gp5) - 0.5);
    vec2 gw5 = fwidth(gp5) * 1.2;
    float line5 = 1.0 - min(smoothstep(0.0, gw5.x, gf5.x), smoothstep(0.0, gw5.y, gf5.y));
    vec3 gcol = vec3(0.21, 0.88, 0.77);
    col = mix(col, mix(col, gcol, 0.55), line * 0.16 * uGrid);
    col = mix(col, mix(col, gcol, 0.75), line5 * 0.30 * uGrid);
  }

  /* --- push-broom acquisition wipe -------------------------------- */
  // Imagery arrives as the sensor sweeps: below the line it is fully
  // acquired, at the line it is hot, above it there is only sensor noise.
  float acq = 1.0;
  if (uReveal < 0.999){
    float edge = mix(-0.06, 1.06, uReveal);
    float d = uv.y - (1.0 - edge);            // scan travels top→bottom
    acq = smoothstep(-0.012, 0.03, -d);
    float hot = exp(-abs(d) * 130.0);
    // Un-acquired region: dark sensor floor with faint line noise.
    float noise = cr(ivec2(int(uv.x * 900.0), int(uv.y * 900.0)), S + 601u);
    vec3 floorCol = vec3(0.012, 0.020, 0.028) + noise * 0.035;
    col = mix(floorCol, col, acq);
    col += vec3(0.16, 0.62, 0.55) * hot * 0.9 * step(0.001, uReveal) * (1.0 - step(0.999, uReveal));
  }

  /* --- model analysis sweep --------------------------------------- */
  if (uScan > 0.001){
    float d = abs(uv.y - (1.0 - uScanPos));
    float band = exp(-d * 26.0);
    float lead = exp(-abs(uv.y - (1.0 - uScanPos) + 0.004) * 300.0);
    col += vec3(0.13, 0.60, 0.54) * band * 0.30 * uScan;
    col += vec3(0.55, 1.0, 0.94) * lead * 0.55 * uScan;
    // Faint horizontal interlace inside the analysed band.
    float il = step(0.5, fract(uv.y * uResolution.y * 0.5));
    col *= 1.0 - band * il * 0.05 * uScan;
  }

  /* --- optics ----------------------------------------------------- */
  vec2 vd = (uv - 0.5) * vec2(aspect, 1.0);
  float vig = 1.0 - uVignette * 0.55 * dot(vd, vd);
  col *= vig;

  /* Tone: filmic shoulder so bright roofs/panels never clip harshly.
     The shoulder was at 0.72, which put the whole surface — whose radiance sits
     mostly in 0.05–0.30 — on the steepest, darkest part of the curve, so every
     plate read as near-black even before any scrim. Pulling it to 0.42 lifts
     shadows and midtones by ~25% while leaving the highlights within a few
     percent, i.e. it brightens the imagery without flattening it. */
  col = col / (col + 0.42) * 1.30;
  col = pow(max(col, 0.0), vec3(0.92));

  // Sensor noise — scales down as the imagery "resolves".
  float g = cr(ivec2(int(uv.x * uResolution.x), int(uv.y * uResolution.y)), S + 701u);
  col += (g - 0.5) * mix(0.055, 0.018, uSharpen);

  fragColor = vec4(max(col, 0.0), 1.0) * uFade;
}
`;
