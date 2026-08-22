import { NOISE_GLSL } from './noise';
import { SURFACE_GLSL } from './surface';

/**
 * EARTH — planet surface shader.
 *
 * The globe carries the whole first act, so it must survive being viewed from
 * 40,000 km *and* from 2 km. It does that by cross-fading three regimes driven
 * by one `uAltitude` uniform:
 *
 *   PLANET   (alt > 0.35)  biome colour from the land texture, bathymetry,
 *                          specular ocean, night-side city lights, clouds
 *   REGION   (0.35 → 0.06) procedural terrain detail fades in over the biome
 *   SURFACE  (alt < 0.06)  the same surfaceSample() used by the flat imagery
 *                          panels, so the dive lands on *continuous* imagery
 *
 * That last point is the trick that makes the Earth→satellite transition read
 * as one camera move rather than a dissolve: at the end of the dive the sphere
 * is already rendering the exact imagery the next section shows.
 *
 * ---------------------------------------------------------------------------
 * CONVENTION: these are RAW shaders, for `rawShaderMaterial glslVersion={GLSL3}`.
 *
 * They declare their own attributes, matrices and `precision`, because Three
 * injects none of that for a RawShaderMaterial. They must NOT declare
 * `#version` — Three prepends `#version 300 es` itself (WebGLProgram builds
 * `versionString + prefix + source`), and a second directive inside the source
 * is a compile error, which shows up as a silently black canvas.
 *
 * Attaching these to a plain `shaderMaterial` also fails: that path prepends a
 * version *and* re-declares position/normal/uv/modelViewMatrix/…, so every
 * declaration below becomes a redefinition.
 * ---------------------------------------------------------------------------
 */
export const EARTH_VERTEX = /* glsl */ `
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

out vec2 vUv;
out vec3 vNormal;
out vec3 vWorldNormal;
out vec3 vViewPos;

void main(){
  vUv = uv;
  vWorldNormal = normalize(normal);
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const EARTH_FRAGMENT = /* glsl */ `
precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldNormal;
in vec3 vViewPos;
out vec4 fragColor;

uniform sampler2D uLand;      // R land, G inland, B coast
uniform vec3  uSunDir;        // view-space
uniform float uTime;
uniform vec2  uResolution;

uniform float uAltitude;      // 1 = far orbit, 0 = ground
uniform vec2  uTargetLL;      // dive target (lon, lat) in degrees
uniform float uTargetGlow;    // 0..1 target highlight
uniform float uGridOpacity;   // graticule
uniform float uDataOpacity;   // analysis layer (Act VIII)
uniform float uScanSweep;     // 0..1 sweeping analysis band, <0 = off
uniform float uSurfaceMix;    // 0..1 force surface imagery regime
uniform float uNightLights;   // 0..1

${SURFACE_GLSL}

#define PI 3.14159265359
#define DEG 0.01745329252

/* Land texture sampling ------------------------------------------------- */
vec3 landAt(vec2 uv){ return texture(uLand, uv).rgb; }

/** Biome colour from latitude + inland-ness + noise. Köppen-ish, simplified. */
vec3 biome(vec2 uv, vec3 L, float lat, uint s){
  float inland = L.g;
  vec2 p = uv * vec2(220.0, 110.0);

  // Aridity: subtropical desert belts near ±25°, wet equator and mid-lats.
  float absLat = abs(lat);
  float desertBelt = exp(-pow((absLat - 24.0) / 11.0, 2.0));
  float arid = clamp(desertBelt * 1.15 * (0.45 + 0.75 * inland)
                     + fbm(p * 0.09, 4, s + 11u) * 0.55 - 0.30, 0.0, 1.0);
  // Boreal / tundra / ice.
  float cold = smoothstep(52.0, 74.0, absLat);
  float ice  = smoothstep(70.0, 82.0, absLat);

  vec3 forest  = vec3(0.055, 0.098, 0.055);
  vec3 savanna = vec3(0.243, 0.220, 0.131);
  vec3 desert  = vec3(0.408, 0.337, 0.224);
  vec3 steppe  = vec3(0.243, 0.235, 0.155);
  vec3 boreal  = vec3(0.062, 0.086, 0.070);
  vec3 tundra  = vec3(0.200, 0.196, 0.180);
  vec3 snow    = vec3(0.760, 0.790, 0.810);

  vec3 c = mix(forest, savanna, smoothstep(0.20, 0.55, arid));
  c = mix(c, desert, smoothstep(0.52, 0.86, arid));
  c = mix(c, steppe, smoothstep(0.36, 0.60, arid) * (1.0 - desertBelt) * 0.6);
  c = mix(c, boreal, cold * 0.85);
  c = mix(c, tundra, smoothstep(0.62, 0.80, absLat / 90.0 * 1.4) * 0.7);
  c = mix(c, snow, ice);

  // Regional variance so continents aren't flat colour fields.
  c *= 0.80 + 0.42 * fbm(p * 0.35, 4, s + 23u);
  // Mountain ranges: brighter rock in the interior at high relief.
  float relief = ridged(p * 0.55, 4, s + 29u);
  c = mix(c, vec3(0.30, 0.29, 0.27), smoothstep(0.55, 0.85, relief) * inland * 0.55);
  // Permanent snow on high relief away from the tropics.
  c = mix(c, snow * 0.9, smoothstep(0.72, 0.94, relief) * smoothstep(0.25, 0.6, absLat / 90.0));
  return c;
}

/** Ocean colour: shelf → abyssal, with subtle current-like variance. */
vec3 ocean(vec2 uv, vec3 L, uint s){
  float shelf = smoothstep(0.0, 0.45, L.g) + L.b * 0.5;
  vec3 deep = vec3(0.008, 0.030, 0.062);
  vec3 shal = vec3(0.020, 0.098, 0.128);
  vec3 c = mix(deep, shal, clamp(shelf * 1.25, 0.0, 1.0));
  c *= 0.92 + 0.14 * fbm(uv * vec2(180.0, 90.0) * 0.22, 3, s + 31u);
  return c;
}

/* LATITUDE CONVENTION.
   Three's SphereGeometry puts uv.y = 1 at the north pole (phi runs from the
   +Y pole), and CanvasTexture defaults to flipY = true, so uv.y = 1 also
   samples canvas row 0 — which the rasteriser in lib/geo/landTexture writes as
   lat +90. Both agree: lat = uv.y * 180 - 90. Subtracting the other way round
   mirrors the planet north/south, which is invisible in the biome bands (they
   are symmetric about the equator) but silently sends the dive reticle and the
   surface-imagery frame to the wrong hemisphere. */
#define UV_LAT(uvy) ((uvy) * 180.0 - 90.0)

/** Approximate great-circle distance (radians) from a fragment to the target. */
float targetDist(vec2 uv){
  float lon = uv.x * 360.0 - 180.0;
  float lat = UV_LAT(uv.y);
  float dLat = (lat - uTargetLL.y) * DEG;
  float dLon = (lon - uTargetLL.x) * DEG;
  float a = sin(dLat * 0.5); a *= a;
  float b = sin(dLon * 0.5); b *= b;
  float h = a + cos(lat * DEG) * cos(uTargetLL.y * DEG) * b;
  return 2.0 * asin(sqrt(clamp(h, 0.0, 1.0)));
}

void main(){
  uint S = uint(uSeedF);
  vec2 uv = vUv;
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  vec3 Ld = normalize(uSunDir);

  float lat = UV_LAT(uv.y);
  float lon = uv.x * 360.0 - 180.0;
  vec3 L = landAt(uv);
  float land = smoothstep(0.42, 0.58, L.r);

  /* ---------------- PLANET regime ---------------- */
  vec3 landCol = biome(uv, L, lat, S);
  vec3 seaCol  = ocean(uv, L, S);

  // Terrain relief shading, from the same field the biome uses.
  vec2 tp = uv * vec2(220.0, 110.0);
  float h = 0.35;
  float e0 = ridged(tp * 0.55, 3, S + 29u);
  float ex = ridged((tp + vec2(h, 0.0)) * 0.55, 3, S + 29u);
  float ey = ridged((tp + vec2(0.0, h)) * 0.55, 3, S + 29u);
  vec3 bump = normalize(vec3((e0 - ex) * 2.2, (e0 - ey) * 2.2, 1.0));
  float reliefShade = mix(1.0, 0.65 + 0.7 * bump.z, land * 0.55 * smoothstep(0.9, 0.2, uAltitude));

  vec3 planet = mix(seaCol, landCol * reliefShade, land);

  /* ---------------- REGION / SURFACE regimes ---------------- */
  // Blend factor toward true imagery. Driven by altitude and the story.
  float regionMix = smoothstep(0.34, 0.10, uAltitude);
  float surfMix   = max(smoothstep(0.10, 0.012, uAltitude), uSurfaceMix);

  if (regionMix > 0.002){
    // Kilometres per unit of uv, near the target: 1 uv.x = 40075 km at equator.
    // Local planar frame in km, centred on the target.
    float kmPerDegLon = 111.32 * cos(uTargetLL.y * DEG);
    vec2 Pkm = vec2((lon - uTargetLL.x) * kmPerDegLon, (lat - uTargetLL.y) * 110.57);
    // px: derive from screen-space derivative of Pkm so LOD is correct.
    float px = max(length(fwidth(Pkm)), 1e-5);
    vec4 surf = surfaceSample(Pkm, px, S);
    // Region: keep planetary colour, add procedural structure.
    planet = mix(planet, mix(planet, surf.rgb, 0.72), regionMix * (1.0 - surfMix));
    planet = mix(planet, surf.rgb, surfMix);
  }

  /* ---------------- lighting ---------------- */
  float ndl = dot(N, Ld);
  // Wrapped diffuse — softens the terminator, as atmosphere does.
  float diff = clamp((ndl + 0.22) / 1.22, 0.0, 1.0);
  float dayNight = smoothstep(-0.12, 0.22, ndl);

  /* Day/night terminator shading applies to the ORBITAL globe, but not once we
     dive to the satellite-surface regime: a satellite scene is lit like the flat
     imagery panel (its own sun is baked into surfaceSample), not darkened by
     which hemisphere faces the real sun. Without this, if the dive target ends up
     on the night side the surface renders at 6% = black (the hero→"Earth is data"
     hand-off went black). Lift the exposure to full as surfMix→1 so the dive ends
     on a bright Beirut that matches the data plate. */
  vec3 col = planet * mix(0.06 + 1.28 * diff, 1.12, surfMix);

  // Ocean specular: a real sun glint, tight and bright.
  vec3 Hv = normalize(Ld + V);
  float spec = pow(max(dot(N, Hv), 0.0), 220.0) * (1.0 - land) * dayNight;
  col += vec3(0.55, 0.66, 0.72) * spec * 1.35;
  // Broad sheen over water.
  col += vec3(0.05, 0.10, 0.14) * pow(max(dot(N, Hv), 0.0), 14.0) * (1.0 - land) * dayNight * 0.5;

  /* ---------------- clouds ---------------- */
  /* Weather systems, not a white shell. Three things keep them honest:
     - Latitude banding uses real circulation cells (wet ITCZ near 0°, dry
       subtropical highs near ±25°, wet storm tracks near ±55°) rather than a
       raw cosine, which produced regular stripes.
     - Coverage tops out around 45%: Earth is ~67% cloudy, but a *legible* Earth
       is not — the continents are the subject, and clouds that hide them are
       just fog.
     - the warp domain is squashed in x so systems stretch zonally, the way
       advected weather actually looks from orbit. */
  float t = uTime * 0.004;
  vec2 cp = vec2(uv.x * 3.4 + t, uv.y * 5.2);
  float aLat = abs(lat);
  float itcz  = exp(-pow(aLat / 9.0, 2.0));               // equatorial convergence
  float storm = exp(-pow((aLat - 54.0) / 15.0, 2.0));     // mid-latitude fronts
  float dry   = exp(-pow((aLat - 26.0) / 12.0, 2.0));     // subtropical highs
  float band = 0.34 + 0.62 * max(itcz, storm) - 0.26 * dry;
  float cl = warpFbm(cp * 1.15, 5, S + 43u);
  // Narrow the threshold band: fewer, better-defined systems with clear gaps.
  cl = smoothstep(0.55, 0.74, cl * (0.30 + 0.95 * band));
  cl *= smoothstep(0.02, 0.16, uAltitude);        // no clouds once we're beneath
  vec3 cloudCol = vec3(0.88, 0.92, 0.95);
  // Peak opacity 0.62, and thinner at the edges of each system, so land reads
  // through the margins instead of terminating at a hard white coastline.
  col = mix(col, cloudCol * (0.10 + 1.05 * diff), cl * 0.62);

  /* ---------------- night side ---------------- */
  float night = 1.0 - dayNight;
  if (uNightLights > 0.001 && night > 0.001){
    // Cities cluster on coasts and continental interiors, thinning toward poles.
    float pop = L.r * (0.35 + 0.65 * L.b) * (1.0 - smoothstep(45.0, 72.0, abs(lat)));
    vec2 gp = uv * vec2(900.0, 450.0);
    float cells = 0.0;
    Vor v = voronoi(gp * 0.5, S + 47u);
    cells = 1.0 - smoothstep(0.0, 0.35, v.f1);
    float lights = cells * smoothstep(0.35, 0.85, pop) * step(0.55, cr(v.id, S + 53u));
    lights *= 0.6 + 0.4 * sin(uTime * 0.6 + cr(v.id, S + 59u) * 30.0);
    col += vec3(1.0, 0.80, 0.52) * lights * night * uNightLights * 0.9 * (1.0 - cl * 0.8);
    // Faint ambient glow so the dark limb isn't pure black.
    col += vec3(0.04, 0.05, 0.07) * night * L.r * 0.5;
  }

  /* ---------------- graticule ---------------- */
  if (uGridOpacity > 0.001){
    float stepDeg = 15.0;
    vec2 g = vec2(lon / stepDeg, lat / stepDeg);
    vec2 gf = abs(fract(g) - 0.5);
    vec2 gw = fwidth(g) * 1.1;
    float line = 1.0 - min(smoothstep(0.0, gw.x, gf.x), smoothstep(0.0, gw.y, gf.y));
    // Emphasise equator and prime meridian.
    float major = (1.0 - smoothstep(0.0, fwidth(lat) * 1.5, abs(lat)))
                + (1.0 - smoothstep(0.0, fwidth(lon) * 1.5, abs(lon)));
    vec3 gcol = vec3(0.21, 0.88, 0.77);
    float rim = 0.35 + 0.65 * pow(1.0 - abs(dot(N, V)), 1.6);  // brighter at limb
    col += gcol * line * 0.075 * uGridOpacity * rim;
    col += gcol * clamp(major, 0.0, 1.0) * 0.16 * uGridOpacity * rim;
  }

  /* ---------------- analysis layer (final Earth) ---------------- */
  if (uDataOpacity > 0.001){
    // Coverage cells over land: the "analysed regions" motif.
    vec2 ap = uv * vec2(120.0, 60.0);
    Vor av = voronoi(ap, S + 61u);
    float pick = cr(av.id, S + 67u);
    float cell = step(pick, 0.30) * L.r;
    float edge = 1.0 - smoothstep(0.0, 0.045, vorEdge(av));
    float pulse = 0.55 + 0.45 * sin(uTime * 1.1 + pick * 40.0);
    vec3 dcol = vec3(0.21, 0.88, 0.77);
    col += dcol * cell * edge * 0.55 * uDataOpacity * pulse;
    col += dcol * cell * 0.06 * uDataOpacity;

    // Detected object points.
    vec2 pp = uv * vec2(420.0, 210.0);
    Vor pv = voronoi(pp, S + 71u);
    float pk = cr(pv.id, S + 73u);
    float dot_ = (1.0 - smoothstep(0.0, 0.16, pv.f1)) * step(pk, 0.12) * L.r;
    col += dcol * dot_ * 0.9 * uDataOpacity;
  }

  /* ---------------- sweeping analysis band ---------------- */
  if (uScanSweep >= 0.0){
    float sweepLon = mix(-180.0, 180.0, fract(uScanSweep));
    float d = abs(lon - sweepLon);
    d = min(d, 360.0 - d);
    float band = exp(-d * 0.09);
    col += vec3(0.16, 0.70, 0.62) * band * 0.28 * max(dayNight, 0.35);
  }

  /* ---------------- dive target ---------------- */
  if (uTargetGlow > 0.001){
    float gd = targetDist(uv);
    // Concentric rings that tighten as we descend.
    float scale = mix(0.055, 0.9, uAltitude);
    float ring1 = exp(-pow((gd - 0.014 * scale * 40.0) / (0.006 * scale * 40.0), 2.0));
    float halo  = exp(-gd / (0.05 * scale * 4.0));
    float core  = exp(-pow(gd / (0.004 * scale * 20.0), 2.0));
    vec3 tcol = vec3(0.35, 1.0, 0.90);
    float vis = uTargetGlow;
    col += tcol * (core * 0.9 + ring1 * 0.35 + halo * 0.16) * vis;
  }

  /* ---------------- atmosphere ---------------- */
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.6);
  // Rayleigh-ish tint: cyan-blue on the day limb, deep blue toward night.
  vec3 atmDay = vec3(0.26, 0.55, 0.95);
  vec3 atmNight = vec3(0.05, 0.10, 0.26);
  vec3 atm = mix(atmNight, atmDay, dayNight);
  col += atm * fres * (0.55 + 0.85 * dayNight) * mix(0.35, 1.0, smoothstep(0.0, 0.4, uAltitude));

  // Forward-scattering rim exactly on the terminator — the "sunrise line".
  float term = exp(-pow(ndl / 0.16, 2.0));
  col += vec3(1.0, 0.52, 0.26) * term * fres * 0.55;

  /* ---------------- grade ---------------- */
  col = col / (col + 0.80) * 1.72;             // filmic shoulder
  col = pow(max(col, 0.0), vec3(0.90));

  fragColor = vec4(col, 1.0);
}
`;

/** Atmospheric shell — additive backside-rendered glow around the planet. */
export const ATMO_VERTEX = /* glsl */ `
precision highp float;
in vec3 position;
in vec3 normal;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
out vec3 vNormal;
out vec3 vViewPos;
void main(){
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

export const ATMO_FRAGMENT = /* glsl */ `
precision highp float;
in vec3 vNormal;
in vec3 vViewPos;
out vec4 fragColor;
uniform vec3  uSunDir;
uniform float uIntensity;

void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  vec3 L = normalize(uSunDir);
  // Shell is rendered with front faces culled, so N points away from us:
  // the limb is where N·V is small.
  float rim = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), 3.4);
  float lit = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
  vec3 c = mix(vec3(0.05, 0.12, 0.34), vec3(0.30, 0.62, 1.0), lit);
  // Warm scatter where the sun grazes the limb.
  c += vec3(0.9, 0.45, 0.2) * pow(lit, 6.0) * 0.35;
  float a = rim * uIntensity * (0.30 + 0.85 * lit);
  fragColor = vec4(c * a, a);
}
`;
